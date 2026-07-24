import type {
  DecisionEngineOutput,
} from "@/engine/decision"

import {
  runAutomationEngine,
} from "@/engine/decision/automation"

import type {
  AutomationEngineOutput,
} from "@/engine/decision/automation"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

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
  CommercialAction,
  CommercialJourney,
} from "@/types/domain"

import {
  runApplicationDecisionEngine,
} from "./run-decision-engine"

export type RunDecisionAutomationPipelineCommonInput = {
  crmRepository:
    CrmRepository

  decisionAutomationRepository:
    DecisionAutomationRepository

  journeyId: string

  workspaceId?: string

  now?: Date

  executionLimit?: number
}

export type RunDecisionAutomationPipelineLegacyInput =
  RunDecisionAutomationPipelineCommonInput & {
    commercialRepository:
      CommercialRepository
  }

export type RunDecisionAutomationPipelineAsyncInput =
  RunDecisionAutomationPipelineCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type RunDecisionAutomationPipelineInput =
  | RunDecisionAutomationPipelineLegacyInput
  | RunDecisionAutomationPipelineAsyncInput

export type RunDecisionAutomationPipelineResult = {
  journeyId: string

  workspaceId: string

  journey:
    CommercialJourney

  decision:
    DecisionEngineOutput

  automation:
    AutomationEngineOutput

  persistedActions:
    CommercialAction[]

  existingActions:
    CommercialAction[]

  diagnostics: string[]

  warnings: string[]
}

type PersistCreatedActionsResult = {
  persistedActions:
    CommercialAction[]

  existingActions:
    CommercialAction[]
}

type BuildPipelineResultInput = {
  journey:
    CommercialJourney

  decision:
    DecisionEngineOutput

  automation:
    AutomationEngineOutput

  persistedActions:
    CommercialAction[]

  existingActions:
    CommercialAction[]

  activePersistedStrategyId?:
    string
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
      "actions" in
      commercialRepository
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  const actionsRepository =
    commercialRepository.actions

  if (
    typeof journeysRepository !==
      "object" ||
    journeysRepository === null ||
    typeof actionsRepository !==
      "object" ||
    actionsRepository === null
  ) {
    return false
  }

  return (
    "findById" in
      journeysRepository &&
    typeof journeysRepository.findById ===
      "function" &&
    "findById" in
      actionsRepository &&
    typeof actionsRepository.findById ===
      "function" &&
    "create" in
      actionsRepository &&
    typeof actionsRepository.create ===
      "function"
  )
}

function normalizeJourneyId(
  journeyId: string,
): string {
  const normalizedJourneyId =
    journeyId.trim()

  if (!normalizedJourneyId) {
    throw new Error(
      "O ID da jornada comercial é obrigatório para executar o pipeline de decisão e automação.",
    )
  }

  return normalizedJourneyId
}

function validateWorkspace({
  journey,
  workspaceId,
}: {
  journey:
    CommercialJourney

  workspaceId?: string
}): void {
  if (
    workspaceId !== undefined &&
    journey.workspaceId !==
      workspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" não pertence ao workspace "${workspaceId}".`,
    )
  }
}

function persistLegacyCreatedActions(
  commercialRepository:
    CommercialRepository,

  createdActions:
    CommercialAction[],
): PersistCreatedActionsResult {
  const persistedActions:
    CommercialAction[] = []

  const existingActions:
    CommercialAction[] = []

  for (
    const action of
    createdActions
  ) {
    const existingAction =
      commercialRepository
        .getActionById(
          action.id,
        )

    if (existingAction) {
      existingActions.push(
        existingAction,
      )

      continue
    }

    const persistedAction =
      commercialRepository
        .createAction(
          action,
        )

    persistedActions.push(
      persistedAction,
    )
  }

  return {
    persistedActions,
    existingActions,
  }
}

async function persistAsyncCreatedActions(
  commercialRepository:
    AsyncCommercialRepositories,

  createdActions:
    CommercialAction[],
): Promise<PersistCreatedActionsResult> {
  const persistedActions:
    CommercialAction[] = []

  const existingActions:
    CommercialAction[] = []

  for (
    const action of
    createdActions
  ) {
    const existingAction =
      await commercialRepository
        .actions
        .findById(
          action.id,
        )

    if (existingAction) {
      existingActions.push(
        existingAction,
      )

      continue
    }

    const persistedAction =
      await commercialRepository
        .actions
        .create(
          action,
        )

    persistedActions.push(
      persistedAction,
    )
  }

  return {
    persistedActions,
    existingActions,
  }
}

function buildPipelineResult({
  journey,
  decision,
  automation,
  persistedActions,
  existingActions,
  activePersistedStrategyId,
}: BuildPipelineResultInput):
  RunDecisionAutomationPipelineResult {
  const diagnostics = [
    ...decision.diagnostics,

    ...automation.diagnostics,
  ]

  const warnings = [
    ...decision.warnings,

    ...automation.warnings,
  ]

  if (
    activePersistedStrategyId !==
      undefined &&
    decision.strategy !== null &&
    activePersistedStrategyId !==
      decision.strategy.id
  ) {
    diagnostics.push(
      `A estratégia ativa "${activePersistedStrategyId}" foi preservada para a jornada "${journey.id}".`,
    )
  }

  if (
    persistedActions.length > 0
  ) {
    diagnostics.push(
      `${persistedActions.length} ações comerciais foram persistidas pelo pipeline.`,
    )
  }

  if (
    existingActions.length > 0
  ) {
    diagnostics.push(
      `${existingActions.length} ações comerciais já existentes foram preservadas.`,
    )
  }

  return {
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    journey,

    decision,

    automation,

    persistedActions,

    existingActions,

    diagnostics,

    warnings,
  }
}

function runLegacyDecisionAutomationPipeline({
  commercialRepository,
  crmRepository,
  decisionAutomationRepository,
  journeyId,
  workspaceId,
  now = new Date(),
  executionLimit,
}: RunDecisionAutomationPipelineLegacyInput):
  RunDecisionAutomationPipelineResult {
  const normalizedJourneyId =
    normalizeJourneyId(
      journeyId,
    )

  const journey =
    commercialRepository
      .getJourneyById(
        normalizedJourneyId,
      )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${normalizedJourneyId}".`,
    )
  }

  validateWorkspace({
    journey,

    workspaceId,
  })

  const decision =
    runApplicationDecisionEngine({
      commercialRepository,

      crmRepository,

      journeyId:
        journey.id,

      now,
    })

  const activePersistedStrategy =
    decisionAutomationRepository
      .getActiveStrategyByJourneyId(
        journey.id,
      )

  const strategyToExecute =
    activePersistedStrategy ??
    decision.strategy

  const currentQueue =
    decisionAutomationRepository
      .getAutomationQueueByJourneyId(
        journey.id,
      )

  const automation =
    runAutomationEngine({
      strategy:
        strategyToExecute,

      journey,

      queue:
        currentQueue,

      now,

      executionLimit,
    })

  decisionAutomationRepository
    .saveDecisionAutomationState({
      strategy:
        automation.strategy,

      queue:
        automation.queue,
    })

  const {
    persistedActions,
    existingActions,
  } = persistLegacyCreatedActions(
    commercialRepository,

    automation.createdActions,
  )

  return buildPipelineResult({
    journey,

    decision,

    automation,

    persistedActions,

    existingActions,

    activePersistedStrategyId:
      activePersistedStrategy?.id,
  })
}

async function runAsyncDecisionAutomationPipeline({
  commercialRepository,
  crmRepository,
  decisionAutomationRepository,
  journeyId,
  workspaceId,
  now = new Date(),
  executionLimit,
}: RunDecisionAutomationPipelineAsyncInput):
  Promise<RunDecisionAutomationPipelineResult> {
  const normalizedJourneyId =
    normalizeJourneyId(
      journeyId,
    )

  const journey =
    await commercialRepository
      .journeys
      .findById(
        normalizedJourneyId,
      )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${normalizedJourneyId}".`,
    )
  }

  validateWorkspace({
    journey,

    workspaceId,
  })

  const decision =
    await runApplicationDecisionEngine({
      commercialRepository,

      crmRepository,

      journeyId:
        journey.id,

      now,
    })

  const activePersistedStrategy =
    decisionAutomationRepository
      .getActiveStrategyByJourneyId(
        journey.id,
      )

  const strategyToExecute =
    activePersistedStrategy ??
    decision.strategy

  const currentQueue =
    decisionAutomationRepository
      .getAutomationQueueByJourneyId(
        journey.id,
      )

  const automation =
    runAutomationEngine({
      strategy:
        strategyToExecute,

      journey,

      queue:
        currentQueue,

      now,

      executionLimit,
    })

  decisionAutomationRepository
    .saveDecisionAutomationState({
      strategy:
        automation.strategy,

      queue:
        automation.queue,
    })

  const {
    persistedActions,
    existingActions,
  } = await persistAsyncCreatedActions(
    commercialRepository,

    automation.createdActions,
  )

  return buildPipelineResult({
    journey,

    decision,

    automation,

    persistedActions,

    existingActions,

    activePersistedStrategyId:
      activePersistedStrategy?.id,
  })
}

export function runDecisionAutomationPipeline(
  input:
    RunDecisionAutomationPipelineAsyncInput,
): Promise<RunDecisionAutomationPipelineResult>

export function runDecisionAutomationPipeline(
  input:
    RunDecisionAutomationPipelineLegacyInput,
): RunDecisionAutomationPipelineResult

export function runDecisionAutomationPipeline(
  input:
    RunDecisionAutomationPipelineInput,
):
  | RunDecisionAutomationPipelineResult
  | Promise<RunDecisionAutomationPipelineResult> {
  if (
    isAsyncCommercialRepositories(
      input.commercialRepository,
    )
  ) {
    return runAsyncDecisionAutomationPipeline({
      ...input,

      commercialRepository:
        input.commercialRepository,
    })
  }

  return runLegacyDecisionAutomationPipeline({
    ...input,

    commercialRepository:
      input.commercialRepository,
  })
}