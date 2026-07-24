import type {
  CommercialAction,
  CommercialActionType,
  CommercialEvent,
  CommercialJourney,
} from "@/types/domain"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import {
  advanceJourney,
} from "./advance-journey"

export type ExecuteCommercialActionInput = {
  workspaceId:
    string

  actionId:
    string
}

export type CommercialActionHandlerResult =
  Record<string, unknown> | void

export type CommercialActionHandlerContext = {
  action:
    CommercialAction

  journey:
    CommercialJourney

  commercialRepository:
    CommercialRepository

  now:
    Date
}

export type AsyncCommercialActionHandlerContext = {
  action:
    CommercialAction

  journey:
    CommercialJourney

  commercialRepository:
    AsyncCommercialRepositories

  now:
    Date
}

export type CommercialActionHandler = (
  context:
    CommercialActionHandlerContext,
) => CommercialActionHandlerResult

export type AsyncCommercialActionHandler = (
  context:
    AsyncCommercialActionHandlerContext,
) =>
  | CommercialActionHandlerResult
  | Promise<CommercialActionHandlerResult>

export type CommercialActionHandlers =
  Partial<
    Record<
      CommercialActionType,
      CommercialActionHandler
    >
  >

export type AsyncCommercialActionHandlers =
  Partial<
    Record<
      CommercialActionType,
      AsyncCommercialActionHandler
    >
  >

export type CommercialActionExecutorCommonDependencies = {
  now?: Date

  generateEventId?: () => string
}

export type CommercialActionExecutorLegacyDependencies =
  CommercialActionExecutorCommonDependencies & {
    commercialRepository:
      CommercialRepository

    handlers?:
      CommercialActionHandlers
  }

export type CommercialActionExecutorAsyncDependencies =
  CommercialActionExecutorCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories

    handlers?:
      AsyncCommercialActionHandlers
  }

export type CommercialActionExecutorDependencies =
  | CommercialActionExecutorLegacyDependencies
  | CommercialActionExecutorAsyncDependencies

export type ExecuteCommercialActionResult = {
  action:
    CommercialAction

  journey:
    CommercialJourney

  event:
    CommercialEvent | null

  handlerResult:
    CommercialActionHandlerResult
}

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "actions" in
      commercialRepository
    ) ||
    !(
      "journeys" in
      commercialRepository
    )
  ) {
    return false
  }

  return (
    typeof commercialRepository
      .actions
      .findById ===
      "function" &&
    typeof commercialRepository
      .actions
      .update ===
      "function" &&
    typeof commercialRepository
      .journeys
      .findById ===
      "function"
  )
}

function getRequiredStringPayloadValue(
  action:
    CommercialAction,
  field:
    string,
): string {
  const value =
    action.payload[field]

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `A ação comercial "${action.id}" exige o campo textual "${field}" no payload.`,
    )
  }

  return value
}

function getOptionalStringPayloadValue(
  action:
    CommercialAction,
  field:
    string,
): string | undefined {
  const value =
    action.payload[field]

  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  if (typeof value !== "string") {
    throw new Error(
      `O campo "${field}" da ação comercial "${action.id}" deve ser textual.`,
    )
  }

  return value
}

function getOptionalMetadata(
  action:
    CommercialAction,
): Record<string, unknown> {
  const metadata =
    action.payload.metadata

  if (
    metadata === undefined ||
    metadata === null
  ) {
    return {}
  }

  if (
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new Error(
      `O campo "metadata" da ação comercial "${action.id}" deve ser um objeto.`,
    )
  }

  return metadata as Record<
    string,
    unknown
  >
}

function getFailureReason(
  error:
    unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Falha desconhecida durante a execução da ação comercial."
}

function validateExecutableStatus(
  action:
    CommercialAction,
): void {
  switch (action.status) {
    case "PENDING":
      return

    case "IN_PROGRESS":
      throw new Error(
        `A ação comercial "${action.id}" já está em execução.`,
      )

    case "COMPLETED":
      throw new Error(
        `A ação comercial "${action.id}" já foi concluída.`,
      )

    case "FAILED":
      throw new Error(
        `A ação comercial "${action.id}" falhou anteriormente e precisa ser preparada para uma nova tentativa.`,
      )

    case "CANCELLED":
      throw new Error(
        `A ação comercial "${action.id}" foi cancelada e não pode ser executada.`,
      )

    default: {
      const exhaustiveStatus:
        never =
        action.status

      throw new Error(
        `Status de ação comercial não suportado: "${exhaustiveStatus}".`,
      )
    }
  }
}

function validateAction({
  action,
  input,
}: {
  action:
    CommercialAction | undefined

  input:
    ExecuteCommercialActionInput
}): CommercialAction {
  if (!action) {
    throw new Error(
      `Ação comercial não encontrada para o ID "${input.actionId}".`,
    )
  }

  if (
    action.workspaceId !==
      input.workspaceId
  ) {
    throw new Error(
      `A ação comercial "${action.id}" pertence a outro workspace.`,
    )
  }

  validateExecutableStatus(
    action,
  )

  return action
}

function validateJourney({
  journey,
  action,
  input,
}: {
  journey:
    CommercialJourney | undefined

  action:
    CommercialAction

  input:
    ExecuteCommercialActionInput
}): CommercialJourney {
  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${action.journeyId}".`,
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

function requirePersistedAction(
  action:
    CommercialAction | undefined,
  actionId:
    string,
): CommercialAction {
  if (!action) {
    throw new Error(
      `A ação comercial "${actionId}" não pôde ser persistida.`,
    )
  }

  return action
}

function markActionInProgress(
  action:
    CommercialAction,
  timestamp:
    string,
): CommercialAction {
  return {
    ...action,

    status:
      "IN_PROGRESS",

    startedAt:
      timestamp,

    completedAt:
      null,

    failedAt:
      null,

    failureReason:
      null,

    updatedAt:
      timestamp,
  }
}

function markActionCompleted(
  action:
    CommercialAction,
  timestamp:
    string,
): CommercialAction {
  return {
    ...action,

    status:
      "COMPLETED",

    completedAt:
      timestamp,

    failedAt:
      null,

    failureReason:
      null,

    updatedAt:
      timestamp,
  }
}

function markActionFailed(
  action:
    CommercialAction,
  timestamp:
    string,
  failureReason:
    string,
): CommercialAction {
  return {
    ...action,

    status:
      "FAILED",

    completedAt:
      null,

    failedAt:
      timestamp,

    failureReason,

    updatedAt:
      timestamp,
  }
}

function executeLegacyCommercialAction(
  input:
    ExecuteCommercialActionInput,
  {
    commercialRepository,
    handlers = {},
    now = new Date(),
    generateEventId,
  }: CommercialActionExecutorLegacyDependencies,
): ExecuteCommercialActionResult {
  const action =
    validateAction({
      action:
        commercialRepository
          .getActionById(
            input.actionId,
          ),

      input,
    })

  const journey =
    validateJourney({
      journey:
        commercialRepository
          .getJourneyById(
            action.journeyId,
          ),

      action,

      input,
    })

  const timestamp =
    now.toISOString()

  const actionInProgress =
    requirePersistedAction(
      commercialRepository
        .updateAction(
          markActionInProgress(
            action,
            timestamp,
          ),
        ),
      action.id,
    )

  try {
    let resultingJourney =
      journey

    let event:
      CommercialEvent | null =
      null

    let handlerResult:
      CommercialActionHandlerResult

    if (
      actionInProgress.type ===
        "CHANGE_STATE"
    ) {
      const targetStateId =
        getRequiredStringPayloadValue(
          actionInProgress,
          "targetStateId",
        )

      const reason =
        getOptionalStringPayloadValue(
          actionInProgress,
          "reason",
        )

      const metadata =
        getOptionalMetadata(
          actionInProgress,
        )

      const transition =
        advanceJourney(
          {
            workspaceId:
              input.workspaceId,

            journeyId:
              actionInProgress
                .journeyId,

            targetStateId,

            actorType:
              actionInProgress
                .actorType,

            actorId:
              actionInProgress
                .actorId,

            reason,

            metadata: {
              ...metadata,

              commercialActionId:
                actionInProgress.id,

              commercialActionOrigin:
                actionInProgress.origin,
            },
          },
          {
            commercialRepository,

            now,

            generateEventId,
          },
        )

      resultingJourney =
        transition.journey

      event =
        transition.event

      handlerResult = {
        previousStateId:
          transition
            .previousState
            ?.id ?? null,

        targetStateId:
          transition
            .targetState
            .id,

        eventId:
          transition.event.id,
      }
    } else {
      const handler =
        handlers[
          actionInProgress.type
        ]

      if (!handler) {
        throw new Error(
          `Nenhum executor foi registrado para ações do tipo "${actionInProgress.type}".`,
        )
      }

      handlerResult =
        handler({
          action:
            actionInProgress,

          journey,

          commercialRepository,

          now,
        })
    }

    const completedAction =
      requirePersistedAction(
        commercialRepository
          .updateAction(
            markActionCompleted(
              actionInProgress,
              timestamp,
            ),
          ),
        actionInProgress.id,
      )

    return {
      action:
        completedAction,

      journey:
        resultingJourney,

      event,

      handlerResult,
    }
  } catch (error) {
    const failureReason =
      getFailureReason(
        error,
      )

    commercialRepository
      .updateAction(
        markActionFailed(
          actionInProgress,
          timestamp,
          failureReason,
        ),
      )

    throw error
  }
}

async function executeAsyncCommercialAction(
  input:
    ExecuteCommercialActionInput,
  {
    commercialRepository,
    handlers = {},
    now = new Date(),
    generateEventId,
  }: CommercialActionExecutorAsyncDependencies,
): Promise<ExecuteCommercialActionResult> {
  const action =
    validateAction({
      action:
        await commercialRepository
          .actions
          .findById(
            input.actionId,
          ),

      input,
    })

  const journey =
    validateJourney({
      journey:
        await commercialRepository
          .journeys
          .findById(
            action.journeyId,
          ),

      action,

      input,
    })

  const timestamp =
    now.toISOString()

  const actionInProgress =
    requirePersistedAction(
      await commercialRepository
        .actions
        .update(
          markActionInProgress(
            action,
            timestamp,
          ),
        ),
      action.id,
    )

  try {
    let resultingJourney =
      journey

    let event:
      CommercialEvent | null =
      null

    let handlerResult:
      CommercialActionHandlerResult

    if (
      actionInProgress.type ===
        "CHANGE_STATE"
    ) {
      const targetStateId =
        getRequiredStringPayloadValue(
          actionInProgress,
          "targetStateId",
        )

      const reason =
        getOptionalStringPayloadValue(
          actionInProgress,
          "reason",
        )

      const metadata =
        getOptionalMetadata(
          actionInProgress,
        )

      const transition =
        await advanceJourney(
          {
            workspaceId:
              input.workspaceId,

            journeyId:
              actionInProgress
                .journeyId,

            targetStateId,

            actorType:
              actionInProgress
                .actorType,

            actorId:
              actionInProgress
                .actorId,

            reason,

            metadata: {
              ...metadata,

              commercialActionId:
                actionInProgress.id,

              commercialActionOrigin:
                actionInProgress.origin,
            },
          },
          {
            commercialRepository,

            now,

            generateEventId,
          },
        )

      resultingJourney =
        transition.journey

      event =
        transition.event

      handlerResult = {
        previousStateId:
          transition
            .previousState
            ?.id ?? null,

        targetStateId:
          transition
            .targetState
            .id,

        eventId:
          transition.event.id,
      }
    } else {
      const handler =
        handlers[
          actionInProgress.type
        ]

      if (!handler) {
        throw new Error(
          `Nenhum executor foi registrado para ações do tipo "${actionInProgress.type}".`,
        )
      }

      handlerResult =
        await handler({
          action:
            actionInProgress,

          journey,

          commercialRepository,

          now,
        })
    }

    const completedAction =
      requirePersistedAction(
        await commercialRepository
          .actions
          .update(
            markActionCompleted(
              actionInProgress,
              timestamp,
            ),
          ),
        actionInProgress.id,
      )

    return {
      action:
        completedAction,

      journey:
        resultingJourney,

      event,

      handlerResult,
    }
  } catch (error) {
    const failureReason =
      getFailureReason(
        error,
      )

    await commercialRepository
      .actions
      .update(
        markActionFailed(
          actionInProgress,
          timestamp,
          failureReason,
        ),
      )

    throw error
  }
}

export function executeCommercialAction(
  input:
    ExecuteCommercialActionInput,
  dependencies:
    CommercialActionExecutorAsyncDependencies,
): Promise<ExecuteCommercialActionResult>

export function executeCommercialAction(
  input:
    ExecuteCommercialActionInput,
  dependencies:
    CommercialActionExecutorLegacyDependencies,
): ExecuteCommercialActionResult

export function executeCommercialAction(
  input:
    ExecuteCommercialActionInput,
  dependencies:
    CommercialActionExecutorDependencies,
):
  | ExecuteCommercialActionResult
  | Promise<ExecuteCommercialActionResult> {
  if (
    isAsyncCommercialRepositories(
      dependencies.commercialRepository,
    )
  ) {
    return executeAsyncCommercialAction(
      input,
      {
        ...dependencies,

        commercialRepository:
          dependencies.commercialRepository,

        handlers:
          dependencies.handlers as
            | AsyncCommercialActionHandlers
            | undefined,
      },
    )
  }

  return executeLegacyCommercialAction(
    input,
    {
      ...dependencies,

      commercialRepository:
        dependencies.commercialRepository,

      handlers:
        dependencies.handlers as
          | CommercialActionHandlers
          | undefined,
    },
  )
}