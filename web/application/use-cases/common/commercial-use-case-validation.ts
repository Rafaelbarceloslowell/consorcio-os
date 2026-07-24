import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CommercialJourney,
} from "@/types/domain"

export type ResolveCommercialJourneyCommonInput = {
  journeyId: string

  workspaceId: string

  expectedVersion?: number

  operationDescription: string
}

export type ResolveCommercialJourneyLegacyInput =
  ResolveCommercialJourneyCommonInput & {
    commercialRepository:
      CommercialRepository
  }

export type ResolveCommercialJourneyAsyncInput =
  ResolveCommercialJourneyCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type ResolveCommercialJourneyInput =
  | ResolveCommercialJourneyLegacyInput
  | ResolveCommercialJourneyAsyncInput

export type ResolveCommercialJourneyResult = {
  journey:
    CommercialJourney

  journeyId: string

  workspaceId: string
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
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  return (
    typeof journeysRepository ===
      "object" &&
    journeysRepository !== null &&
    "findById" in
      journeysRepository &&
    typeof journeysRepository.findById ===
      "function"
  )
}

export function normalizeRequiredId(
  value: string,
  fieldName: string,
  operationDescription: string,
): string {
  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório para ${operationDescription}.`,
    )
  }

  return normalizedValue
}

export function normalizeOptionalId(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalizedValue =
    value.trim()

  return normalizedValue ||
    undefined
}

function validateResolvedJourney({
  journey,
  normalizedJourneyId,
  normalizedWorkspaceId,
  expectedVersion,
}: {
  journey:
    CommercialJourney | undefined

  normalizedJourneyId: string

  normalizedWorkspaceId: string

  expectedVersion?: number
}): ResolveCommercialJourneyResult {
  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${normalizedJourneyId}".`,
    )
  }

  if (
    journey.workspaceId !==
      normalizedWorkspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" não pertence ao workspace "${normalizedWorkspaceId}".`,
    )
  }

  if (
    expectedVersion !== undefined &&
    journey.version !==
      expectedVersion
  ) {
    throw new Error(
      `Conflito de versão na jornada comercial "${journey.id}": esperado ${expectedVersion}, atual ${journey.version}.`,
    )
  }

  return {
    journey,

    journeyId:
      normalizedJourneyId,

    workspaceId:
      normalizedWorkspaceId,
  }
}

function normalizeResolveCommercialJourneyInput({
  journeyId,
  workspaceId,
  operationDescription,
}: {
  journeyId: string

  workspaceId: string

  operationDescription: string
}): {
  normalizedJourneyId: string

  normalizedWorkspaceId: string
} {
  const normalizedWorkspaceId =
    normalizeRequiredId(
      workspaceId,
      "O ID do workspace",
      operationDescription,
    )

  const normalizedJourneyId =
    normalizeRequiredId(
      journeyId,
      "O ID da jornada comercial",
      operationDescription,
    )

  return {
    normalizedJourneyId,
    normalizedWorkspaceId,
  }
}

function resolveLegacyCommercialJourney({
  commercialRepository,
  journeyId,
  workspaceId,
  expectedVersion,
  operationDescription,
}: ResolveCommercialJourneyLegacyInput):
  ResolveCommercialJourneyResult {
  const {
    normalizedJourneyId,
    normalizedWorkspaceId,
  } = normalizeResolveCommercialJourneyInput({
    journeyId,
    workspaceId,
    operationDescription,
  })

  const journey =
    commercialRepository
      .getJourneyById(
        normalizedJourneyId,
      )

  return validateResolvedJourney({
    journey,

    normalizedJourneyId,

    normalizedWorkspaceId,

    expectedVersion,
  })
}

async function resolveAsyncCommercialJourney({
  commercialRepository,
  journeyId,
  workspaceId,
  expectedVersion,
  operationDescription,
}: ResolveCommercialJourneyAsyncInput):
  Promise<ResolveCommercialJourneyResult> {
  const {
    normalizedJourneyId,
    normalizedWorkspaceId,
  } = normalizeResolveCommercialJourneyInput({
    journeyId,
    workspaceId,
    operationDescription,
  })

  const journey =
    await commercialRepository
      .journeys
      .findById(
        normalizedJourneyId,
      )

  return validateResolvedJourney({
    journey,

    normalizedJourneyId,

    normalizedWorkspaceId,

    expectedVersion,
  })
}

export function resolveCommercialJourney(
  input:
    ResolveCommercialJourneyAsyncInput,
): Promise<ResolveCommercialJourneyResult>

export function resolveCommercialJourney(
  input:
    ResolveCommercialJourneyLegacyInput,
): ResolveCommercialJourneyResult

export function resolveCommercialJourney(
  input:
    ResolveCommercialJourneyInput,
):
  | ResolveCommercialJourneyResult
  | Promise<ResolveCommercialJourneyResult> {
  if (
    isAsyncCommercialRepositories(
      input.commercialRepository,
    )
  ) {
    return resolveAsyncCommercialJourney({
      ...input,

      commercialRepository:
        input.commercialRepository,
    })
  }

  return resolveLegacyCommercialJourney({
    ...input,

    commercialRepository:
      input.commercialRepository,
  })
}