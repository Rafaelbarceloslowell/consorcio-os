import type {
  CommercialActorType,
  CommercialEvent,
  CommercialEventType,
} from "@/types/domain"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

export type RecordCommercialEventInput = {
  workspaceId: string

  journeyId: string

  type: CommercialEventType

  actorType: CommercialActorType

  actorId: string | null

  payload?: Record<string, unknown>
}

export type BuildCommercialEventDependencies = {
  now?: Date

  generateId?: () => string
}

export type CommercialEventServiceCommonDependencies =
  BuildCommercialEventDependencies & {
    touchJourney?: boolean
  }

export type CommercialEventServiceLegacyDependencies =
  CommercialEventServiceCommonDependencies & {
    commercialRepository:
      CommercialRepository
  }

export type CommercialEventServiceAsyncDependencies =
  CommercialEventServiceCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type CommercialEventServiceDependencies =
  | CommercialEventServiceLegacyDependencies
  | CommercialEventServiceAsyncDependencies

function generateDefaultId(): string {
  return `commercial-event-${globalThis.crypto.randomUUID()}`
}

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "journeys" in
      commercialRepository
    ) ||
    !(
      "events" in
      commercialRepository
    )
  ) {
    return false
  }

  return (
    typeof commercialRepository
      .journeys
      .findById ===
      "function" &&
    typeof commercialRepository
      .events
      .create ===
      "function"
  )
}

export function buildCommercialEvent(
  input: RecordCommercialEventInput,
  {
    now = new Date(),
    generateId = generateDefaultId,
  }: BuildCommercialEventDependencies = {},
): CommercialEvent {
  const timestamp =
    now.toISOString()

  return {
    id:
      generateId(),

    workspaceId:
      input.workspaceId,

    journeyId:
      input.journeyId,

    type:
      input.type,

    actorType:
      input.actorType,

    actorId:
      input.actorId,

    payload:
      input.payload ?? {},

    occurredAt:
      timestamp,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  }
}

function recordLegacyCommercialEvent(
  input: RecordCommercialEventInput,
  {
    commercialRepository,
    now = new Date(),
    generateId = generateDefaultId,
    touchJourney = true,
  }: CommercialEventServiceLegacyDependencies,
): CommercialEvent {
  const journey =
    commercialRepository.getJourneyById(
      input.journeyId,
    )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${input.journeyId}".`,
    )
  }

  if (
    journey.workspaceId !==
    input.workspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" pertence a outro workspace.`,
    )
  }

  const event =
    buildCommercialEvent(
      input,
      {
        now,
        generateId,
      },
    )

  commercialRepository.createEvent(
    event,
  )

  if (!touchJourney) {
    return event
  }

  const timestamp =
    now.toISOString()

  commercialRepository.updateJourney({
    ...journey,

    lastInteractionAt:
      timestamp,

    updatedAt:
      timestamp,

    version:
      journey.version + 1,
  })

  return event
}

async function recordAsyncCommercialEvent(
  input: RecordCommercialEventInput,
  {
    commercialRepository,
    now = new Date(),
    generateId = generateDefaultId,
    touchJourney = true,
  }: CommercialEventServiceAsyncDependencies,
): Promise<CommercialEvent> {
  const journey =
    await commercialRepository
      .journeys
      .findById(
        input.journeyId,
      )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${input.journeyId}".`,
    )
  }

  if (
    journey.workspaceId !==
    input.workspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" pertence a outro workspace.`,
    )
  }

  const event =
    buildCommercialEvent(
      input,
      {
        now,
        generateId,
      },
    )

  await commercialRepository
    .events
    .create(
      event,
    )

  if (!touchJourney) {
    return event
  }

  const timestamp =
    now.toISOString()

  await commercialRepository
    .journeys
    .update({
      ...journey,

      lastInteractionAt:
        timestamp,

      updatedAt:
        timestamp,

      version:
        journey.version + 1,
    })

  return event
}

export function recordCommercialEvent(
  input: RecordCommercialEventInput,
  dependencies:
    CommercialEventServiceAsyncDependencies,
): Promise<CommercialEvent>

export function recordCommercialEvent(
  input: RecordCommercialEventInput,
  dependencies:
    CommercialEventServiceLegacyDependencies,
): CommercialEvent

export function recordCommercialEvent(
  input: RecordCommercialEventInput,
  dependencies:
    CommercialEventServiceDependencies,
):
  | CommercialEvent
  | Promise<CommercialEvent> {
  if (
    isAsyncCommercialRepositories(
      dependencies.commercialRepository,
    )
  ) {
    return recordAsyncCommercialEvent(
      input,
      {
        ...dependencies,

        commercialRepository:
          dependencies.commercialRepository,
      },
    )
  }

  return recordLegacyCommercialEvent(
    input,
    {
      ...dependencies,

      commercialRepository:
        dependencies.commercialRepository,
    },
  )
}