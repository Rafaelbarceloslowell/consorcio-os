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
  ReplaceOpenNextBestActionsResult,
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
  NextBestAction,
} from "@/types/domain"

import {
  runApplicationDecisionEngine,
} from "./run-decision-engine"

export type RunCommercialDecisionCycleCommonInput = {
  crmRepository:
    CrmRepository

  decisionAutomationRepository:
    DecisionAutomationRepository

  journeyId: string

  workspaceId?: string

  now?: Date

  executionLimit?: number
}

export type RunCommercialDecisionCycleLegacyInput =
  RunCommercialDecisionCycleCommonInput & {
    commercialRepository:
      CommercialRepository
  }

export type RunCommercialDecisionCycleAsyncInput =
  RunCommercialDecisionCycleCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type RunCommercialDecisionCycleInput =
  | RunCommercialDecisionCycleLegacyInput
  | RunCommercialDecisionCycleAsyncInput

export type RunCommercialDecisionCycleResult = {
  journeyId: string

  workspaceId: string

  journey:
    CommercialJourney

  decision:
    DecisionEngineOutput

  generatedNextBestActions:
    NextBestAction[]

  preservedNextBestActions:
    NextBestAction[]

  removedNextBestActions:
    NextBestAction[]

  createdNextBestActions:
    NextBestAction[]

  nextBestActions:
    NextBestAction[]

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

type BuildCycleResultInput = {
  journey:
    CommercialJourney

  decision:
    DecisionEngineOutput

  recommendationResult:
    ReplaceOpenNextBestActionsResult

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
    ) ||
    !(
      "transactions" in
      commercialRepository
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  const actionsRepository =
    commercialRepository.actions

  const transactionsRepository =
    commercialRepository.transactions

  if (
    typeof journeysRepository !==
      "object" ||
    journeysRepository === null ||
    typeof actionsRepository !==
      "object" ||
    actionsRepository === null ||
    typeof transactionsRepository !==
      "object" ||
    transactionsRepository === null
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
      "function" &&
    "replaceOpenNextBestActions" in
      transactionsRepository &&
    typeof transactionsRepository
      .replaceOpenNextBestActions ===
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
      "O ID da jornada comercial é obrigatório para executar o ciclo comercial de decisão.",
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

type ValidateGeneratedNextBestActionsInput = {
  journeyId: string

  workspaceId: string

  nextBestActions:
    NextBestAction[]
}

function validateGeneratedNextBestActions({
  journeyId,
  workspaceId,
  nextBestActions,
}: ValidateGeneratedNextBestActionsInput): void {
  const recommendationIds =
    new Set<string>()

  for (
    const nextBestAction of
    nextBestActions
  ) {
    if (
      nextBestAction.journeyId !==
      journeyId
    ) {
      throw new Error(
        `A recomendação comercial "${nextBestAction.id}" foi gerada para a jornada incorreta "${nextBestAction.journeyId}".`,
      )
    }

    if (
      nextBestAction.workspaceId !==
      workspaceId
    ) {
      throw new Error(
        `A recomendação comercial "${nextBestAction.id}" foi gerada para o workspace incorreto "${nextBestAction.workspaceId}".`,
      )
    }

    if (
      recommendationIds.has(
        nextBestAction.id,
      )
    ) {
      throw new Error(
        `O motor de decisão gerou recomendações duplicadas com o ID "${nextBestAction.id}".`,
      )
    }

    recommendationIds.add(
      nextBestAction.id,
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

function buildCycleResult({
  journey,
  decision,
  recommendationResult,
  automation,
  persistedActions,
  existingActions,
  activePersistedStrategyId,
}: BuildCycleResultInput):
  RunCommercialDecisionCycleResult {
  const diagnostics = [
    ...decision.diagnostics,
    ...automation.diagnostics,
  ]

  const warnings = [
    ...decision.warnings,
    ...automation.warnings,
  ]

  diagnostics.push(
    `${recommendationResult.createdNextBestActions.length} novas recomendações comerciais foram persistidas para a jornada "${journey.id}".`,
  )

  if (
    recommendationResult
      .removedNextBestActions
      .length > 0
  ) {
    diagnostics.push(
      `${recommendationResult.removedNextBestActions.length} recomendações abertas anteriores foram substituídas.`,
    )
  }

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
      `${persistedActions.length} ações comerciais foram persistidas pelo ciclo comercial.`,
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

    generatedNextBestActions: [
      ...decision.nextBestActions,
    ],

    preservedNextBestActions: [
      ...recommendationResult
        .preservedNextBestActions,
    ],

    removedNextBestActions: [
      ...recommendationResult
        .removedNextBestActions,
    ],

    createdNextBestActions: [
      ...recommendationResult
        .createdNextBestActions,
    ],

    nextBestActions: [
      ...recommendationResult
        .nextBestActions,
    ],

    automation,

    persistedActions,

    existingActions,

    diagnostics,

    warnings,
  }
}

function runLegacyCommercialDecisionCycle({
  commercialRepository,
  crmRepository,
  decisionAutomationRepository,
  journeyId,
  workspaceId,
  now = new Date(),
  executionLimit,
}: RunCommercialDecisionCycleLegacyInput):
  RunCommercialDecisionCycleResult {
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

  validateGeneratedNextBestActions({
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    nextBestActions:
      decision.nextBestActions,
  })

  const recommendationResult =
    commercialRepository
      .replaceOpenNextBestActions({
        workspaceId:
          journey.workspaceId,

        journeyId:
          journey.id,

        nextBestActions:
          decision.nextBestActions,
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

  return buildCycleResult({
    journey,
    decision,
    recommendationResult,
    automation,
    persistedActions,
    existingActions,
    activePersistedStrategyId:
      activePersistedStrategy?.id,
  })
}

async function runAsyncCommercialDecisionCycle({
  commercialRepository,
  crmRepository,
  decisionAutomationRepository,
  journeyId,
  workspaceId,
  now = new Date(),
  executionLimit,
}: RunCommercialDecisionCycleAsyncInput):
  Promise<RunCommercialDecisionCycleResult> {
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

  validateGeneratedNextBestActions({
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    nextBestActions:
      decision.nextBestActions,
  })

  const recommendationResult =
    await commercialRepository
      .transactions
      .replaceOpenNextBestActions({
        workspaceId:
          journey.workspaceId,

        journeyId:
          journey.id,

        nextBestActions:
          decision.nextBestActions,
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

  return buildCycleResult({
    journey,
    decision,
    recommendationResult,
    automation,
    persistedActions,
    existingActions,
    activePersistedStrategyId:
      activePersistedStrategy?.id,
  })
}

export function runCommercialDecisionCycle(
  input:
    RunCommercialDecisionCycleAsyncInput,
): Promise<RunCommercialDecisionCycleResult>

export function runCommercialDecisionCycle(
  input:
    RunCommercialDecisionCycleLegacyInput,
): RunCommercialDecisionCycleResult

export function runCommercialDecisionCycle(
  input:
    RunCommercialDecisionCycleInput,
):
  | RunCommercialDecisionCycleResult
  | Promise<RunCommercialDecisionCycleResult> {
  if (
    isAsyncCommercialRepositories(
      input.commercialRepository,
    )
  ) {
    return runAsyncCommercialDecisionCycle({
      ...input,

      commercialRepository:
        input.commercialRepository,
    })
  }

  return runLegacyCommercialDecisionCycle({
    ...input,

    commercialRepository:
      input.commercialRepository,
  })
}