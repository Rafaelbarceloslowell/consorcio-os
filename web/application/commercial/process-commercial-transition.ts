import {
  runCommercialDecisionCycle,
} from "@/application/decision/run-commercial-decision-cycle"

import type {
  RunCommercialDecisionCycleLegacyInput,
  RunCommercialDecisionCycleResult,
} from "@/application/decision/run-commercial-decision-cycle"

import {
  runWorkflowEngine,
} from "@/engine/decision/workflow/engine"

import type {
  WorkflowEngineInput,
  WorkflowEngineOutput,
  WorkflowTransitionOrigin,
} from "@/engine/decision/workflow/types"

import type {
  CommercialRepository,
  CommitJourneyTransitionResult,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

import type {
  DecisionAutomationRepository,
} from "@/repositories/decision/decision-automation-repository"

import type {
  CommercialActorType,
  CommercialEventType,
} from "@/types/domain"

import {
  synchronizeCommercialJourneyWithCrm,
} from "./crm-synchronizer"

import type {
  SynchronizeCommercialJourneyWithCrmLegacyInput,
  SynchronizeCommercialJourneyWithCrmResult,
} from "./crm-synchronizer"

export type ProcessCommercialTransitionDependencies = {
  runWorkflowEngine: (
    input: WorkflowEngineInput,
  ) => WorkflowEngineOutput

  synchronizeCommercialJourneyWithCrm: (
    input:
      SynchronizeCommercialJourneyWithCrmLegacyInput,
  ) => SynchronizeCommercialJourneyWithCrmResult

  runCommercialDecisionCycle: (
    input: RunCommercialDecisionCycleLegacyInput,
  ) => RunCommercialDecisionCycleResult
}

export type ProcessCommercialTransitionInput = {
  commercialRepository:
    CommercialRepository

  crmRepository:
    CrmRepository

  decisionAutomationRepository:
    DecisionAutomationRepository

  journeyId: string

  targetStateId: string

  actorType:
    CommercialActorType

  actorId:
    string | null

  origin:
    WorkflowTransitionOrigin

  workspaceId?: string

  eventType?: CommercialEventType

  payload?: Record<string, unknown>

  expectedVersion?: number

  now?: Date

  executionLimit?: number

  dependencies?:
    Partial<ProcessCommercialTransitionDependencies>
}

export type ProcessCommercialTransitionResult = {
  journeyId: string

  workspaceId: string

  workflow:
    WorkflowEngineOutput

  committedTransition:
    CommitJourneyTransitionResult | null

  crmSynchronization:
    SynchronizeCommercialJourneyWithCrmResult | null

  decisionCycle:
    RunCommercialDecisionCycleResult | null

  changed: boolean

  diagnostics: string[]

  warnings: string[]
}

const defaultDependencies:
  ProcessCommercialTransitionDependencies = {
    runWorkflowEngine,

    synchronizeCommercialJourneyWithCrm,

    runCommercialDecisionCycle,
  }

function resolveDependencies(
  dependencies:
    Partial<ProcessCommercialTransitionDependencies> = {},
): ProcessCommercialTransitionDependencies {
  return {
    runWorkflowEngine:
      dependencies.runWorkflowEngine ??
      defaultDependencies.runWorkflowEngine,

    synchronizeCommercialJourneyWithCrm:
      dependencies.synchronizeCommercialJourneyWithCrm ??
      defaultDependencies
        .synchronizeCommercialJourneyWithCrm,

    runCommercialDecisionCycle:
      dependencies.runCommercialDecisionCycle ??
      defaultDependencies
        .runCommercialDecisionCycle,
  }
}

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório para processar a transição comercial.`,
    )
  }

  return normalizedValue
}

export function processCommercialTransition({
  commercialRepository,
  crmRepository,
  decisionAutomationRepository,
  journeyId,
  targetStateId,
  actorType,
  actorId,
  origin,
  workspaceId,
  eventType,
  payload = {},
  expectedVersion,
  now = new Date(),
  executionLimit,
  dependencies,
}: ProcessCommercialTransitionInput):
  ProcessCommercialTransitionResult {
  const normalizedJourneyId =
    normalizeRequiredId(
      journeyId,
      "O ID da jornada comercial",
    )

  const normalizedTargetStateId =
    normalizeRequiredId(
      targetStateId,
      "O ID do estado de destino",
    )

  const journey =
    commercialRepository.getJourneyById(
      normalizedJourneyId,
    )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${normalizedJourneyId}".`,
    )
  }

  if (
    workspaceId !== undefined &&
    journey.workspaceId !==
      workspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" não pertence ao workspace "${workspaceId}".`,
    )
  }

  const resolvedDependencies =
    resolveDependencies(
      dependencies,
    )

  const workflow =
    resolvedDependencies
      .runWorkflowEngine({
        journey,

        phases:
          commercialRepository.getPhases(),

        states:
          commercialRepository.getStates(),

        rules:
          commercialRepository.getWorkflowRules(),

        targetStateId:
          normalizedTargetStateId,

        origin,

        actorType,

        actorId,

        now,

        eventType,

        payload,

        expectedVersion,
      })

  if (
    !workflow.changed ||
    workflow.event === null
  ) {
    return {
      journeyId:
        journey.id,

      workspaceId:
        journey.workspaceId,

      workflow,

      committedTransition:
        null,

      crmSynchronization:
        null,

      decisionCycle:
        null,

      changed:
        false,

      diagnostics: [
        ...workflow.diagnostics,

        `Nenhuma alteração foi persistida para a jornada "${journey.id}".`,

        "O CRM não foi sincronizado porque a jornada permaneceu no estado atual.",

        "O ciclo comercial de decisão não foi executado porque a jornada permaneceu no estado atual.",
      ],

      warnings: [
        ...workflow.warnings,
      ],
    }
  }

  const committedTransition =
    commercialRepository
      .commitJourneyTransition({
        journey:
          workflow.journey,

        event:
          workflow.event,
      })

  const crmSynchronization =
    resolvedDependencies
      .synchronizeCommercialJourneyWithCrm({
        journey:
          committedTransition.journey,

        commercialRepository,

        crmRepository,

        now,
      })

  const decisionCycle =
    resolvedDependencies
      .runCommercialDecisionCycle({
        commercialRepository,

        crmRepository,

        decisionAutomationRepository,

        journeyId:
          committedTransition.journey.id,

        workspaceId:
          committedTransition
            .journey
            .workspaceId,

        now,

        executionLimit,
      })

  return {
    journeyId:
      committedTransition.journey.id,

    workspaceId:
      committedTransition
        .journey
        .workspaceId,

    workflow,

    committedTransition,

    crmSynchronization,

    decisionCycle,

    changed:
      true,

    diagnostics: [
      ...workflow.diagnostics,

      `A transição da jornada "${journey.id}" foi persistida com sucesso.`,

      `O evento comercial "${committedTransition.event.id}" foi registrado com sucesso.`,

      ...crmSynchronization.diagnostics,

      ...decisionCycle.diagnostics,
    ],

    warnings: [
      ...workflow.warnings,

      ...crmSynchronization.warnings,

      ...decisionCycle.warnings,
    ],
  }
}