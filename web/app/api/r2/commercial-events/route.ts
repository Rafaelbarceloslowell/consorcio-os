import {
  PrismaCommercialEventRepository,
} from "@/infrastructure/prisma/repositories/commercial/prisma-commercial-event-repository"

import type {
  R2CommercialEventCursor,
} from "@/types/r2-persistent-commercial-events"

import {
  getApiCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"
const DEFAULT_BATCH_LIMIT = 25
const MAX_BATCH_LIMIT = 25

function json(
  body: unknown,
  status = 200,
): Response {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}

function parseLimit(
  value: string | null,
): number {
  if (!value) {
    return DEFAULT_BATCH_LIMIT
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("limit must be a positive integer.")
  }

  return Math.min(
    parsed,
    MAX_BATCH_LIMIT,
  )
}

function parseCursor(
  createdAt: string | null,
  eventId: string | null,
): R2CommercialEventCursor {
  if (!createdAt) {
    throw new Error("afterCreatedAt is required.")
  }

  const parsedTimestamp = new Date(createdAt).getTime()

  if (!Number.isFinite(parsedTimestamp)) {
    throw new Error("afterCreatedAt must be a valid date.")
  }

  return {
    createdAt: new Date(parsedTimestamp).toISOString(),
    eventId: eventId ?? "",
  }
}

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
): Promise<Response> {
  const authenticatedContext =
    await getApiCommercialContext()

  if (authenticatedContext instanceof Response) {
    return authenticatedContext
  }

  const url = new URL(request.url)
  const workspaceId =
    url.searchParams.get("workspaceId")?.trim() ?? ""

  if (!workspaceId) {
    return json(
      {
        error: "workspaceId is required.",
      },
      400,
    )
  }

  let cursor: R2CommercialEventCursor
  let limit: number

  try {
    cursor = parseCursor(
      url.searchParams.get("afterCreatedAt"),
      url.searchParams.get("afterEventId"),
    )
    limit = parseLimit(
      url.searchParams.get("limit"),
    )
  }
  catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid persistent event request.",
      },
      400,
    )
  }

  if (workspaceId !== authenticatedContext.workspaceId) {
    return json(
      {
        error: "O workspace informado não corresponde ao usuário autenticado.",
      },
      403,
    )
  }

  const repository =
    new PrismaCommercialEventRepository(
      authenticatedContext.workspaceId,
    )

  const events =
    await repository.findAfterCursor({
      cursor,
      limit,
    })

  const lastEvent =
    events.at(-1)

  const nextCursor: R2CommercialEventCursor =
    lastEvent
      ? {
          createdAt: lastEvent.createdAt,
          eventId: lastEvent.id,
        }
      : cursor

  return json({
    events,
    nextCursor,
    hasMore:
      events.length === limit,
  })
}
