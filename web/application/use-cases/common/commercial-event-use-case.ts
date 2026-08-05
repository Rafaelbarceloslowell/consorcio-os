import {
  publishCommercialEvent as publishRecordedCommercialEvent,
} from "@/application/use-cases/common/commercial-event-dispatcher"

/* R2_PROCESS_LOCAL_COMMERCIAL_EVENT_BRIDGE_V1_IMPORT */
import type {
  ProcessCommercialTransitionInput,
  ProcessCommercialTransitionResult,
} from "@/application/commercial/process-commercial-transition"

import {
  processCommercialTransition,
} from "@/application/commercial/process-commercial-transition"

import type {
  RecordCommercialEventInput,
} from "@/application/commercial/commercial-event-service"

import {
  recordCommercialEvent,
} from "@/application/commercial/commercial-event-service"

import type {
  RunCommercialDecisionCycleLegacyInput,
  RunCommercialDecisionCycleResult,
} from "@/application/decision/run-commercial-decision-cycle"

import {
  runCommercialDecisionCycle,
} from "@/application/decision/run-commercial-decision-cycle"

import {
  normalizeOptionalId,
  resolveCommercialJourney,
} from "@/application/use-cases/common/commercial-use-case-validation"

import type {
  WorkflowTransitionOrigin,
} from "@/engine/decision/workflow/types"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

import type {
  DecisionAutomationRepository,
} from "@/repositories/decision/decision-automation-repository"

import type {
  CommercialActorType,
  CommercialEvent,
  CommercialEventType,
  CommercialJourney,
} from "@/types/domain"

export type CommercialEventUseCaseDependencies = {
  /* R2_PROCESS_LOCAL_COMMERCIAL_EVENT_BRIDGE_V1_DEPENDENCY */
  publishCommercialEvent?: (
    event: CommercialEvent,
  ) => void
  recordCommercialEvent: (
    input: RecordCommercialEventInput,

    dependencies: {
      commercialRepository:
        CommercialRepository

      now?: Date

      generateId?: () => string

      touchJourney?: boolean
    },
  ) => CommercialEvent

  processCommercialTransition: (
    input: ProcessCommercialTransitionInput,
  ) => ProcessCommercialTransitionResult

  runCommercialDecisionCycle: (
    input: RunCommercialDecisionCycleLegacyInput,
  ) => RunCommercialDecisionCycleResult
}

export type CommercialEventUseCaseMessages = {
  operationDescription: string

  eventRegistered: (
    event: CommercialEvent,
  ) => string

  journeyTransitioned: (
    journey: CommercialJourney,
  ) => string

  journeyNotTransitioned: (
    journey: CommercialJourney,
  ) => string

  journeyMissingAfterEvent: (
    journeyId: string,
  ) => string

  journeyMissingAfterProcessing: (
    journeyId: string,
  ) => string
}

export type ExecuteCommercialEventUseCaseInput = {
  commercialRepository:
    CommercialRepository

  crmRepository:
    CrmRepository

  decisionAutomationRepository:
    DecisionAutomationRepository

  workspaceId: string

  journeyId: string

  eventType:
    CommercialEventType

  actorType:
    CommercialActorType

  actorId:
    string | null

  targetStateId?: string

  origin?:
    WorkflowTransitionOrigin

  payload?: Record<string, unknown>

  expectedVersion?: number

  now?: Date

  executionLimit?: number

  generateEventId?: () => string

  messages:
    CommercialEventUseCaseMessages

  dependencies?:
    Partial<CommercialEventUseCaseDependencies>
}

export type ExecuteCommercialEventUseCaseResult = {
  journeyId: string

  workspaceId: string

  journey:
    CommercialJourney

  event:
    CommercialEvent

  transition:
    ProcessCommercialTransitionResult | null

  decisionCycle:
    RunCommercialDecisionCycleResult

  transitioned: boolean

  diagnostics: string[]

  warnings: string[]
}

const defaultDependencies:
  CommercialEventUseCaseDependencies = {
    recordCommercialEvent,

    processCommercialTransition,

    runCommercialDecisionCycle,
  }

function resolveDependencies(
  dependencies:
    Partial<CommercialEventUseCaseDependencies> = {},
): CommercialEventUseCaseDependencies {
  return {
    /* R2_PROCESS_LOCAL_COMMERCIAL_EVENT_BRIDGE_V1_DEFAULT */
    publishCommercialEvent:
      dependencies
        .publishCommercialEvent ??
      publishRecordedCommercialEvent,
    recordCommercialEvent:
      dependencies.recordCommercialEvent ??
      defaultDependencies
        .recordCommercialEvent,

    processCommercialTransition:
      dependencies.processCommercialTransition ??
      defaultDependencies
        .processCommercialTransition,

    runCommercialDecisionCycle:
      dependencies.runCommercialDecisionCycle ??
      defaultDependencies
        .runCommercialDecisionCycle,
  }
}

export function executeCommercialEventUseCase({
  commercialRepository,
  crmRepository,
  decisionAutomationRepository,
  workspaceId,
  journeyId,
  eventType,
  actorType,
  actorId,
  targetStateId,
  origin = "SYSTEM",
  payload = {},
  expectedVersion,
  now = new Date(),
  executionLimit,
  generateEventId,
  messages,
  dependencies,
}: ExecuteCommercialEventUseCaseInput):
  ExecuteCommercialEventUseCaseResult {
  const {
    journeyId:
      normalizedJourneyId,

    workspaceId:
      normalizedWorkspaceId,
  } = resolveCommercialJourney({
    commercialRepository,

    journeyId,

    workspaceId,

    expectedVersion,

    operationDescription:
      messages.operationDescription,
  })

  const normalizedTargetStateId =
    normalizeOptionalId(
      targetStateId,
    )

  const resolvedDependencies =
    resolveDependencies(
      dependencies,
    )

  const event =
    resolvedDependencies
      .recordCommercialEvent(
        {
          workspaceId:
            normalizedWorkspaceId,

          journeyId:
            normalizedJourneyId,

          type:
            eventType,

          actorType,

          actorId,

          payload,
        },
        {
          commercialRepository,

          now,

          generateId:
            generateEventId,

          touchJourney:
            true,
        },
      )

  /* R2_PROCESS_LOCAL_COMMERCIAL_EVENT_BRIDGE_V1_PUBLISH */
  try {
    resolvedDependencies
      .publishCommercialEvent?.(
        event,
      )
  } catch {
    // R2 presentation must never interrupt the commercial operation.
  }

  const journeyAfterEvent =
    commercialRepository.getJourneyById(
      normalizedJourneyId,
    )

  if (!journeyAfterEvent) {
    throw new Error(
      messages.journeyMissingAfterEvent(
        normalizedJourneyId,
      ),
    )
  }

  let transition:
    ProcessCommercialTransitionResult | null =
      null

  let decisionCycle:
    RunCommercialDecisionCycleResult

  if (normalizedTargetStateId) {
    transition =
      resolvedDependencies
        .processCommercialTransition({
          commercialRepository,

          crmRepository,

          decisionAutomationRepository,

          journeyId:
            journeyAfterEvent.id,

          targetStateId:
            normalizedTargetStateId,

          actorType,

          actorId,

          origin,

          workspaceId:
            normalizedWorkspaceId,

          eventType,

          payload: {
            ...payload,

            sourceEventId:
              event.id,
          },

          expectedVersion:
            journeyAfterEvent.version,

          now,

          executionLimit,
        })

    if (
      transition.changed &&
      transition.decisionCycle !== null
    ) {
      decisionCycle =
        transition.decisionCycle
    } else {
      decisionCycle =
        resolvedDependencies
          .runCommercialDecisionCycle({
            commercialRepository,

            crmRepository,

            decisionAutomationRepository,

            journeyId:
              journeyAfterEvent.id,

            workspaceId:
              normalizedWorkspaceId,

            now,

            executionLimit,
          })
    }
  } else {
    decisionCycle =
      resolvedDependencies
        .runCommercialDecisionCycle({
          commercialRepository,

          crmRepository,

          decisionAutomationRepository,

          journeyId:
            journeyAfterEvent.id,

          workspaceId:
            normalizedWorkspaceId,

          now,

          executionLimit,
        })
  }

  const finalJourney =
    commercialRepository.getJourneyById(
      normalizedJourneyId,
    )

  if (!finalJourney) {
    throw new Error(
      messages.journeyMissingAfterProcessing(
        normalizedJourneyId,
      ),
    )
  }

  const transitioned =
    transition?.changed === true

  const diagnostics = [
    messages.eventRegistered(
      event,
    ),

    transitioned
      ? messages.journeyTransitioned(
          finalJourney,
        )
      : messages.journeyNotTransitioned(
          finalJourney,
        ),

    ...(transition?.diagnostics ?? []),

    ...(
      transition?.decisionCycle ===
      decisionCycle
        ? []
        : decisionCycle.diagnostics
    ),
  ]

  const warnings = [
    ...(transition?.warnings ?? []),

    ...(
      transition?.decisionCycle ===
      decisionCycle
        ? []
        : decisionCycle.warnings
    ),
  ]

  return {
    journeyId:
      finalJourney.id,

    workspaceId:
      finalJourney.workspaceId,

    journey:
      finalJourney,

    event,

    transition,

    decisionCycle,

    transitioned,

    diagnostics,

    warnings,
  }
}