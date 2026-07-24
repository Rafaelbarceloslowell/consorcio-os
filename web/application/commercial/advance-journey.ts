import type {
  CommercialActorType,
  CommercialEvent,
  CommercialJourney,
  JourneyPhase,
  JourneyState,
} from "@/types/domain"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import {
  buildCommercialEvent,
} from "./commercial-event-service"

export type AdvanceJourneyInput = {
  workspaceId:
    string

  journeyId:
    string

  targetStateId:
    string

  actorType:
    CommercialActorType

  actorId:
    string | null

  reason?:
    string

  metadata?:
    Record<string, unknown>
}

export type AdvanceJourneyCommonDependencies = {
  now?: Date

  generateEventId?: () => string
}

export type AdvanceJourneyLegacyDependencies =
  AdvanceJourneyCommonDependencies & {
    commercialRepository:
      CommercialRepository
  }

export type AdvanceJourneyAsyncDependencies =
  AdvanceJourneyCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type AdvanceJourneyDependencies =
  | AdvanceJourneyLegacyDependencies
  | AdvanceJourneyAsyncDependencies

export type AdvanceJourneyResult = {
  journey:
    CommercialJourney

  event:
    CommercialEvent

  previousState:
    JourneyState | null

  targetState:
    JourneyState
}

type ResolvedJourneyTransition = {
  journey:
    CommercialJourney

  targetState:
    JourneyState

  targetPhase:
    JourneyPhase

  previousState:
    JourneyState | null
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
      "states" in
      commercialRepository
    ) ||
    !(
      "phases" in
      commercialRepository
    ) ||
    !(
      "transactions" in
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
      .states
      .findById ===
      "function" &&
    typeof commercialRepository
      .phases
      .findById ===
      "function" &&
    typeof commercialRepository
      .transactions
      .commitJourneyTransition ===
      "function"
  )
}

function validateJourney({
  journey,
  input,
}: {
  journey:
    CommercialJourney | undefined

  input:
    AdvanceJourneyInput
}): CommercialJourney {
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

  return journey
}

function validateTargetState({
  targetState,
  input,
}: {
  targetState:
    JourneyState | undefined

  input:
    AdvanceJourneyInput
}): JourneyState {
  if (!targetState) {
    throw new Error(
      `Estado da jornada não encontrado para o ID "${input.targetStateId}".`,
    )
  }

  if (
    targetState.workspaceId !==
      input.workspaceId
  ) {
    throw new Error(
      `O estado "${targetState.id}" pertence a outro workspace.`,
    )
  }

  if (!targetState.isActive) {
    throw new Error(
      `O estado "${targetState.id}" está inativo e não pode receber jornadas.`,
    )
  }

  return targetState
}

function validateTargetPhase({
  targetPhase,
  input,
}: {
  targetPhase:
    JourneyPhase | undefined

  input:
    AdvanceJourneyInput
}): JourneyPhase {
  if (!targetPhase) {
    throw new Error(
      `Fase da jornada não encontrada para o ID do estado de destino.`,
    )
  }

  if (
    targetPhase.workspaceId !== null &&
    targetPhase.workspaceId !==
      input.workspaceId
  ) {
    throw new Error(
      `A fase "${targetPhase.id}" pertence a outro workspace.`,
    )
  }

  if (!targetPhase.isActive) {
    throw new Error(
      `A fase "${targetPhase.id}" está inativa e não pode receber jornadas.`,
    )
  }

  return targetPhase
}

function validateCurrentState({
  journey,
  previousState,
  input,
}: {
  journey:
    CommercialJourney

  previousState:
    JourneyState | undefined

  input:
    AdvanceJourneyInput
}): JourneyState | null {
  if (
    journey.currentStateId &&
    !previousState
  ) {
    throw new Error(
      `O estado atual "${journey.currentStateId}" da jornada "${journey.id}" não foi encontrado.`,
    )
  }

  if (
    previousState &&
    previousState.workspaceId !==
      input.workspaceId
  ) {
    throw new Error(
      `O estado atual "${previousState.id}" pertence a outro workspace.`,
    )
  }

  if (
    previousState?.isFinal &&
    !previousState.allowReopen
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" está encerrada no estado "${previousState.id}" e não permite reabertura.`,
    )
  }

  return previousState ?? null
}

function validateDifferentTargetState({
  journey,
  targetState,
}: {
  journey:
    CommercialJourney

  targetState:
    JourneyState
}): void {
  if (
    journey.currentStateId ===
      targetState.id
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" já está no estado "${targetState.id}".`,
    )
  }
}

function buildUpdatedJourney({
  journey,
  targetState,
  targetPhase,
  now,
}: {
  journey:
    CommercialJourney

  targetState:
    JourneyState

  targetPhase:
    JourneyPhase

  now:
    Date
}): CommercialJourney {
  const timestamp =
    now.toISOString()

  return {
    ...journey,

    currentStateId:
      targetState.id,

    currentPhaseId:
      targetPhase.id,

    stateEnteredAt:
      timestamp,

    lastInteractionAt:
      timestamp,

    closedAt:
      targetState.isFinal
        ? timestamp
        : null,

    updatedAt:
      timestamp,

    version:
      journey.version + 1,
  }
}

function buildStateChangedEvent({
  input,
  journey,
  targetState,
  targetPhase,
  previousState,
  now,
  generateEventId,
}: {
  input:
    AdvanceJourneyInput

  journey:
    CommercialJourney

  targetState:
    JourneyState

  targetPhase:
    JourneyPhase

  previousState:
    JourneyState | null

  now:
    Date

  generateEventId?: () => string
}): CommercialEvent {
  return buildCommercialEvent(
    {
      workspaceId:
        input.workspaceId,

      journeyId:
        input.journeyId,

      type:
        "STATE_CHANGED",

      actorType:
        input.actorType,

      actorId:
        input.actorId,

      payload: {
        previousStateId:
          previousState?.id ?? null,

        targetStateId:
          targetState.id,

        previousPhaseId:
          journey.currentPhaseId,

        targetPhaseId:
          targetPhase.id,

        reason:
          input.reason ?? null,

        metadata:
          input.metadata ?? {},
      },
    },
    {
      now,

      generateId:
        generateEventId,
    },
  )
}

function resolveLegacyJourneyTransition(
  input:
    AdvanceJourneyInput,
  commercialRepository:
    CommercialRepository,
): ResolvedJourneyTransition {
  const journey =
    validateJourney({
      journey:
        commercialRepository
          .getJourneyById(
            input.journeyId,
          ),

      input,
    })

  const targetState =
    validateTargetState({
      targetState:
        commercialRepository
          .getStateById(
            input.targetStateId,
          ),

      input,
    })

  validateDifferentTargetState({
    journey,
    targetState,
  })

  const targetPhase =
    validateTargetPhase({
      targetPhase:
        commercialRepository
          .getPhaseById(
            targetState.phaseId,
          ),

      input,
    })

  const previousState =
    validateCurrentState({
      journey,

      previousState:
        journey.currentStateId
          ? commercialRepository
              .getStateById(
                journey.currentStateId,
              )
          : undefined,

      input,
    })

  return {
    journey,
    targetState,
    targetPhase,
    previousState,
  }
}

async function resolveAsyncJourneyTransition(
  input:
    AdvanceJourneyInput,
  commercialRepository:
    AsyncCommercialRepositories,
): Promise<ResolvedJourneyTransition> {
  const journey =
    validateJourney({
      journey:
        await commercialRepository
          .journeys
          .findById(
            input.journeyId,
          ),

      input,
    })

  const targetState =
    validateTargetState({
      targetState:
        await commercialRepository
          .states
          .findById(
            input.targetStateId,
          ),

      input,
    })

  validateDifferentTargetState({
    journey,
    targetState,
  })

  const targetPhase =
    validateTargetPhase({
      targetPhase:
        await commercialRepository
          .phases
          .findById(
            targetState.phaseId,
          ),

      input,
    })

  const previousState =
    validateCurrentState({
      journey,

      previousState:
        journey.currentStateId
          ? await commercialRepository
              .states
              .findById(
                journey.currentStateId,
              )
          : undefined,

      input,
    })

  return {
    journey,
    targetState,
    targetPhase,
    previousState,
  }
}

function advanceLegacyJourney(
  input:
    AdvanceJourneyInput,
  {
    commercialRepository,
    now = new Date(),
    generateEventId,
  }: AdvanceJourneyLegacyDependencies,
): AdvanceJourneyResult {
  const {
    journey,
    targetState,
    targetPhase,
    previousState,
  } = resolveLegacyJourneyTransition(
    input,
    commercialRepository,
  )

  const updatedJourney =
    buildUpdatedJourney({
      journey,
      targetState,
      targetPhase,
      now,
    })

  const event =
    buildStateChangedEvent({
      input,
      journey,
      targetState,
      targetPhase,
      previousState,
      now,
      generateEventId,
    })

  const committedTransition =
    commercialRepository
      .commitJourneyTransition({
        journey:
          updatedJourney,

        event,
      })

  return {
    journey:
      committedTransition.journey,

    event:
      committedTransition.event,

    previousState,

    targetState,
  }
}

async function advanceAsyncJourney(
  input:
    AdvanceJourneyInput,
  {
    commercialRepository,
    now = new Date(),
    generateEventId,
  }: AdvanceJourneyAsyncDependencies,
): Promise<AdvanceJourneyResult> {
  const {
    journey,
    targetState,
    targetPhase,
    previousState,
  } = await resolveAsyncJourneyTransition(
    input,
    commercialRepository,
  )

  const updatedJourney =
    buildUpdatedJourney({
      journey,
      targetState,
      targetPhase,
      now,
    })

  const event =
    buildStateChangedEvent({
      input,
      journey,
      targetState,
      targetPhase,
      previousState,
      now,
      generateEventId,
    })

  const committedTransition =
    await commercialRepository
      .transactions
      .commitJourneyTransition({
        journey:
          updatedJourney,

        event,
      })

  return {
    journey:
      committedTransition.journey,

    event:
      committedTransition.event,

    previousState,

    targetState,
  }
}

export function advanceJourney(
  input:
    AdvanceJourneyInput,
  dependencies:
    AdvanceJourneyAsyncDependencies,
): Promise<AdvanceJourneyResult>

export function advanceJourney(
  input:
    AdvanceJourneyInput,
  dependencies:
    AdvanceJourneyLegacyDependencies,
): AdvanceJourneyResult

export function advanceJourney(
  input:
    AdvanceJourneyInput,
  dependencies:
    AdvanceJourneyDependencies,
):
  | AdvanceJourneyResult
  | Promise<AdvanceJourneyResult> {
  if (
    isAsyncCommercialRepositories(
      dependencies.commercialRepository,
    )
  ) {
    return advanceAsyncJourney(
      input,
      {
        ...dependencies,

        commercialRepository:
          dependencies.commercialRepository,
      },
    )
  }

  return advanceLegacyJourney(
    input,
    {
      ...dependencies,

      commercialRepository:
        dependencies.commercialRepository,
    },
  )
}