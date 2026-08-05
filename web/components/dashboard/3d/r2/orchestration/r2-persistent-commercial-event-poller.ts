import type {
  CommercialEvent,
} from "@/types/domain"

import type {
  R2CommercialEventBatch,
  R2CommercialEventCursor,
} from "@/types/r2-persistent-commercial-events"

export const R2_PERSISTENT_EVENT_POLL_INTERVAL_MS = 5_000
export const R2_PERSISTENT_EVENT_BATCH_LIMIT = 25
export const R2_PERSISTENT_EVENT_INITIAL_LOOKBACK_MS = 15 * 60_000
export const R2_PERSISTENT_EVENT_MAX_PAGES_PER_POLL = 4

const R2_PERSISTENT_EVENT_CURSOR_VERSION = "v1"

function requiredText(
  value: string,
  field: string,
): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${field} is required for persistent R2 event polling.`)
  }

  return normalized
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isValidIsoDate(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(
      new Date(value).getTime(),
    )
  )
}

function isCommercialEvent(
  value: unknown,
): value is CommercialEvent {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    typeof value.journeyId === "string" &&
    typeof value.type === "string" &&
    typeof value.actorType === "string" &&
    (typeof value.actorId === "string" || value.actorId === null) &&
    isRecord(value.payload) &&
    isValidIsoDate(value.occurredAt) &&
    isValidIsoDate(value.createdAt) &&
    isValidIsoDate(value.updatedAt)
  )
}

function isCursor(
  value: unknown,
): value is R2CommercialEventCursor {
  if (!isRecord(value)) {
    return false
  }

  return (
    isValidIsoDate(value.createdAt) &&
    typeof value.eventId === "string"
  )
}

function parseBatch(
  value: unknown,
): R2CommercialEventBatch {
  if (!isRecord(value)) {
    throw new Error("The persistent R2 event response must be an object.")
  }

  if (
    !Array.isArray(value.events) ||
    !value.events.every(isCommercialEvent) ||
    !isCursor(value.nextCursor) ||
    typeof value.hasMore !== "boolean"
  ) {
    throw new Error("The persistent R2 event response is invalid.")
  }

  return {
    events: value.events,
    nextCursor: value.nextCursor,
    hasMore: value.hasMore,
  }
}

export function createR2PersistentEventCursorStorageKey(
  workspaceId: string,
  userId: string,
): string {
  return [
    "gorillaos",
    "r2",
    "commercial-events",
    R2_PERSISTENT_EVENT_CURSOR_VERSION,
    requiredText(workspaceId, "workspaceId"),
    requiredText(userId, "userId"),
  ].join(":")
}

export function createR2InitialCommercialEventCursor(
  now: Date = new Date(),
): R2CommercialEventCursor {
  const timestamp = now.getTime()

  if (!Number.isFinite(timestamp)) {
    throw new Error("A valid clock value is required for the R2 cursor.")
  }

  return {
    createdAt: new Date(
      timestamp - R2_PERSISTENT_EVENT_INITIAL_LOOKBACK_MS,
    ).toISOString(),
    eventId: "",
  }
}

export function loadR2CommercialEventCursor(
  storage: Pick<Storage, "getItem">,
  key: string,
): R2CommercialEventCursor | null {
  try {
    const serialized = storage.getItem(key)

    if (!serialized) {
      return null
    }

    const parsed: unknown = JSON.parse(serialized)

    return isCursor(parsed)
      ? parsed
      : null
  }
  catch {
    return null
  }
}

export function saveR2CommercialEventCursor(
  storage: Pick<Storage, "setItem">,
  key: string,
  cursor: R2CommercialEventCursor,
): void {
  try {
    storage.setItem(
      key,
      JSON.stringify(cursor),
    )
  }
  catch {
    // Storage can be blocked by browser policy. Polling remains active in memory.
  }
}

export async function fetchR2CommercialEventBatch({
  workspaceId,
  cursor,
  signal,
  fetchImpl = fetch,
  origin,
  limit = R2_PERSISTENT_EVENT_BATCH_LIMIT,
}: Readonly<{
  workspaceId: string
  cursor: R2CommercialEventCursor
  signal: AbortSignal
  fetchImpl?: typeof fetch
  origin: string
  limit?: number
}>): Promise<R2CommercialEventBatch> {
  const url = new URL(
    "/api/r2/commercial-events",
    origin,
  )

  url.searchParams.set(
    "workspaceId",
    requiredText(workspaceId, "workspaceId"),
  )
  url.searchParams.set(
    "afterCreatedAt",
    cursor.createdAt,
  )
  url.searchParams.set(
    "afterEventId",
    cursor.eventId,
  )
  url.searchParams.set(
    "limit",
    String(limit),
  )

  const response = await fetchImpl(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(
      `Persistent R2 event polling failed with status ${response.status}.`,
    )
  }

  return parseBatch(
    await response.json(),
  )
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  )
}

export function startR2PersistentCommercialEventPolling({
  workspaceId,
  userId,
  onEvent,
  onError,
  fetchImpl = fetch,
  storage = window.localStorage,
  documentRef = document,
  origin = window.location.origin,
  now = () => new Date(),
  intervalMs = R2_PERSISTENT_EVENT_POLL_INTERVAL_MS,
  batchLimit = R2_PERSISTENT_EVENT_BATCH_LIMIT,
  maxPagesPerPoll = R2_PERSISTENT_EVENT_MAX_PAGES_PER_POLL,
}: Readonly<{
  workspaceId: string
  userId: string
  onEvent: (event: CommercialEvent) => Promise<unknown>
  onError?: (error: unknown) => void
  fetchImpl?: typeof fetch
  storage?: Pick<Storage, "getItem" | "setItem">
  documentRef?: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">
  origin?: string
  now?: () => Date
  intervalMs?: number
  batchLimit?: number
  maxPagesPerPoll?: number
}>): () => void {
  const normalizedWorkspaceId = requiredText(
    workspaceId,
    "workspaceId",
  )
  const normalizedUserId = requiredText(
    userId,
    "userId",
  )
  const storageKey = createR2PersistentEventCursorStorageKey(
    normalizedWorkspaceId,
    normalizedUserId,
  )

  let cursor =
    loadR2CommercialEventCursor(
      storage,
      storageKey,
    ) ??
    createR2InitialCommercialEventCursor(
      now(),
    )

  let stopped = false
  let inFlight = false
  let controller: AbortController | null = null

  const poll = async (): Promise<void> => {
    if (
      stopped ||
      inFlight ||
      documentRef.visibilityState === "hidden"
    ) {
      return
    }

    inFlight = true
    controller = new AbortController()

    try {
      for (
        let page = 0;
        page < maxPagesPerPoll;
        page += 1
      ) {
        const batch = await fetchR2CommercialEventBatch({
          workspaceId: normalizedWorkspaceId,
          cursor,
          signal: controller.signal,
          fetchImpl,
          origin,
          limit: batchLimit,
        })

        if (stopped) {
          return
        }

        for (const event of batch.events) {
          if (event.workspaceId !== normalizedWorkspaceId) {
            throw new Error(
              "Persistent R2 polling received an event from another workspace.",
            )
          }

          await onEvent(event)

          cursor = {
            createdAt: event.createdAt,
            eventId: event.id,
          }

          saveR2CommercialEventCursor(
            storage,
            storageKey,
            cursor,
          )
        }

        if (
          !batch.hasMore ||
          batch.events.length === 0
        ) {
          break
        }

        cursor = batch.nextCursor
      }
    }
    catch (error) {
      if (!isAbortError(error)) {
        onError?.(error)
      }
    }
    finally {
      controller = null
      inFlight = false
    }
  }

  const intervalId = setInterval(
    () => {
      void poll()
    },
    Math.max(1_000, Math.floor(intervalMs)),
  )

  const handleVisibilityChange = () => {
    if (documentRef.visibilityState === "visible") {
      void poll()
    }
  }

  documentRef.addEventListener(
    "visibilitychange",
    handleVisibilityChange,
  )

  void poll()

  return () => {
    stopped = true
    controller?.abort()
    clearInterval(intervalId)
    documentRef.removeEventListener(
      "visibilitychange",
      handleVisibilityChange,
    )
  }
}
