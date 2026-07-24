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
  NextBestAction,
} from "@/types/domain"

import {
  runApplicationDecisionEngine,
} from "./run-decision-engine"

export type RefreshNextBestActionsCommonInput = {
  crmRepository: CrmRepository

  journeyId: string

  workspaceId?: string

  now?: Date
}

export type RefreshNextBestActionsLegacyInput =
  RefreshNextBestActionsCommonInput & {
    commercialRepository:
      CommercialRepository
  }

export type RefreshNextBestActionsAsyncInput =
  RefreshNextBestActionsCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type RefreshNextBestActionsInput =
  | RefreshNextBestActionsLegacyInput
  | RefreshNextBestActionsAsyncInput

export type RefreshNextBestActionsResult = {
  journeyId: string

  workspaceId: string

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

  diagnostics: string[]

  warnings: string[]
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
      "transactions" in
      commercialRepository
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  const transactionsRepository =
    commercialRepository.transactions

  if (
    typeof journeysRepository !==
      "object" ||
    journeysRepository === null ||
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
      "O ID da jornada comercial é obrigatório para atualizar as recomendações.",
    )
  }

  return normalizedJourneyId
}

function validateWorkspace({
  journeyId,
  journeyWorkspaceId,
  requestedWorkspaceId,
}: {
  journeyId: string

  journeyWorkspaceId: string

  requestedWorkspaceId?: string
}): void {
  if (
    requestedWorkspaceId &&
    journeyWorkspaceId !==
      requestedWorkspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journeyId}" não pertence ao workspace "${requestedWorkspaceId}".`,
    )
  }
}

function buildRefreshResult({
  journeyId,
  workspaceId,
  generatedNextBestActions,
  replacementResult,
  diagnostics,
  warnings,
}: {
  journeyId: string

  workspaceId: string

  generatedNextBestActions:
    NextBestAction[]

  replacementResult:
    ReplaceOpenNextBestActionsResult

  diagnostics: string[]

  warnings: string[]
}): RefreshNextBestActionsResult {
  return {
    journeyId,

    workspaceId,

    generatedNextBestActions: [
      ...generatedNextBestActions,
    ],

    preservedNextBestActions: [
      ...replacementResult
        .preservedNextBestActions,
    ],

    removedNextBestActions: [
      ...replacementResult
        .removedNextBestActions,
    ],

    createdNextBestActions: [
      ...replacementResult
        .createdNextBestActions,
    ],

    nextBestActions: [
      ...replacementResult
        .nextBestActions,
    ],

    diagnostics: [
      ...diagnostics,
    ],

    warnings: [
      ...warnings,
    ],
  }
}

function refreshLegacyNextBestActions({
  commercialRepository,
  crmRepository,
  journeyId,
  workspaceId,
  now = new Date(),
}: RefreshNextBestActionsLegacyInput):
  RefreshNextBestActionsResult {
  const normalizedJourneyId =
    normalizeJourneyId(journeyId)

  const journey =
    commercialRepository.getJourneyById(
      normalizedJourneyId,
    )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${normalizedJourneyId}".`,
    )
  }

  validateWorkspace({
    journeyId: journey.id,
    journeyWorkspaceId:
      journey.workspaceId,
    requestedWorkspaceId:
      workspaceId,
  })

  const decisionOutput =
    runApplicationDecisionEngine({
      commercialRepository,
      crmRepository,
      journeyId: journey.id,
      now,
    })

  validateGeneratedNextBestActions({
    journeyId: journey.id,
    workspaceId: journey.workspaceId,
    nextBestActions:
      decisionOutput.nextBestActions,
  })

  const replacementResult =
    commercialRepository
      .replaceOpenNextBestActions({
        workspaceId:
          journey.workspaceId,

        journeyId:
          journey.id,

        nextBestActions:
          decisionOutput.nextBestActions,
      })

  return buildRefreshResult({
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    generatedNextBestActions:
      decisionOutput.nextBestActions,

    replacementResult,

    diagnostics:
      decisionOutput.diagnostics,

    warnings:
      decisionOutput.warnings,
  })
}

async function refreshAsyncNextBestActions({
  commercialRepository,
  crmRepository,
  journeyId,
  workspaceId,
  now = new Date(),
}: RefreshNextBestActionsAsyncInput):
  Promise<RefreshNextBestActionsResult> {
  const normalizedJourneyId =
    normalizeJourneyId(journeyId)

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
    journeyId: journey.id,
    journeyWorkspaceId:
      journey.workspaceId,
    requestedWorkspaceId:
      workspaceId,
  })

  const decisionOutput =
    await runApplicationDecisionEngine({
      commercialRepository,
      crmRepository,
      journeyId: journey.id,
      now,
    })

  validateGeneratedNextBestActions({
    journeyId: journey.id,
    workspaceId: journey.workspaceId,
    nextBestActions:
      decisionOutput.nextBestActions,
  })

  const replacementResult =
    await commercialRepository
      .transactions
      .replaceOpenNextBestActions({
        workspaceId:
          journey.workspaceId,

        journeyId:
          journey.id,

        nextBestActions:
          decisionOutput.nextBestActions,
      })

  return buildRefreshResult({
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    generatedNextBestActions:
      decisionOutput.nextBestActions,

    replacementResult,

    diagnostics:
      decisionOutput.diagnostics,

    warnings:
      decisionOutput.warnings,
  })
}

export function refreshNextBestActions(
  input:
    RefreshNextBestActionsAsyncInput,
): Promise<RefreshNextBestActionsResult>

export function refreshNextBestActions(
  input:
    RefreshNextBestActionsLegacyInput,
): RefreshNextBestActionsResult

export function refreshNextBestActions(
  input:
    RefreshNextBestActionsInput,
):
  | RefreshNextBestActionsResult
  | Promise<RefreshNextBestActionsResult> {
  if (
    isAsyncCommercialRepositories(
      input.commercialRepository,
    )
  ) {
    return refreshAsyncNextBestActions({
      ...input,

      commercialRepository:
        input.commercialRepository,
    })
  }

  return refreshLegacyNextBestActions({
    ...input,

    commercialRepository:
      input.commercialRepository,
  })
}

type ValidateGeneratedNextBestActionsInput = {
  journeyId: string

  workspaceId: string

  nextBestActions: NextBestAction[]
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