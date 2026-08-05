import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialJourney,
  CommercialJourneyPriority,
  ConsortiumType,
  EntityId,
} from "@/types/domain"

export type OpportunityQueryStatus =
  | "open"
  | "closed"

export type OpportunityOrigin =
  | "lead"
  | "client"

export type ListOpportunitiesInput = {
  workspaceId: EntityId
  clientId?: EntityId
  consultantId?: EntityId
  consortiumType?: ConsortiumType
  priority?: CommercialJourneyPriority
  currentPhaseId?: EntityId
  currentStateId?: EntityId
  status?: OpportunityQueryStatus
  origin?: OpportunityOrigin
  search?: string
}

export type ListOpportunitiesOutput = {
  opportunities: CommercialJourney[]
  total: number
}

export type ListOpportunitiesAsyncDependencies =
  Pick<
    AsyncCommercialRepositories,
    "journeys"
  >

const CONSORTIUM_TYPES:
  ConsortiumType[] = [
    "real_estate",
    "vehicle",
    "heavy_vehicle",
    "services",
    "other",
  ]

const PRIORITIES:
  CommercialJourneyPriority[] = [
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
  ]

const STATUSES:
  OpportunityQueryStatus[] = [
    "open",
    "closed",
  ]

const ORIGINS:
  OpportunityOrigin[] = [
    "lead",
    "client",
  ]

function normalizeSearch(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]/g,
      "",
    )
}

function normalizeOptionalId(
  value: string | undefined,
  errorMessage: string,
): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalized =
    value.trim()

  if (!normalized) {
    throw new Error(
      errorMessage,
    )
  }

  return normalized
}

function compareOpportunities(
  first: CommercialJourney,
  second: CommercialJourney,
): number {
  const updatedAtDifference =
    new Date(
      second.updatedAt,
    ).getTime() -
    new Date(
      first.updatedAt,
    ).getTime()

  if (updatedAtDifference !== 0) {
    return updatedAtDifference
  }

  const scoreDifference =
    second.score -
    first.score

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  const titleDifference =
    first.title.localeCompare(
      second.title,
      "pt-BR",
      {
        sensitivity: "base",
      },
    )

  if (titleDifference !== 0) {
    return titleDifference
  }

  return first.id.localeCompare(
    second.id,
  )
}

export class ListOpportunitiesAsync {
  constructor(
    private readonly dependencies:
      ListOpportunitiesAsyncDependencies,
  ) {}

  async execute(
    input: ListOpportunitiesInput,
  ): Promise<ListOpportunitiesOutput> {
    const workspaceId =
      input.workspaceId.trim()

    if (!workspaceId) {
      throw new Error(
        "O workspace é obrigatório para listar oportunidades.",
      )
    }

    const clientId =
      normalizeOptionalId(
        input.clientId,
        "O ID do cliente informado para o filtro é inválido.",
      )

    const consultantId =
      normalizeOptionalId(
        input.consultantId,
        "O ID do consultor informado para o filtro é inválido.",
      )

    const currentPhaseId =
      normalizeOptionalId(
        input.currentPhaseId,
        "O ID da fase informado para o filtro é inválido.",
      )

    const currentStateId =
      normalizeOptionalId(
        input.currentStateId,
        "O ID do estado informado para o filtro é inválido.",
      )

    if (
      input.consortiumType !==
        undefined &&
      !CONSORTIUM_TYPES.includes(
        input.consortiumType,
      )
    ) {
      throw new Error(
        "O tipo de consórcio informado é inválido.",
      )
    }

    if (
      input.priority !== undefined &&
      !PRIORITIES.includes(
        input.priority,
      )
    ) {
      throw new Error(
        "A prioridade da oportunidade é inválida.",
      )
    }

    if (
      input.status !== undefined &&
      !STATUSES.includes(
        input.status,
      )
    ) {
      throw new Error(
        "O status informado para oportunidades é inválido.",
      )
    }

    if (
      input.origin !== undefined &&
      !ORIGINS.includes(
        input.origin,
      )
    ) {
      throw new Error(
        "A origem informada para oportunidades é inválida.",
      )
    }

    const repositoryOpportunities =
      clientId
        ? await this.dependencies
            .journeys
            .findByClientId(
              clientId,
            )
        : consultantId
          ? await this.dependencies
              .journeys
              .findByConsultantId(
                consultantId,
              )
          : await this.dependencies
              .journeys
              .findAll()

    const normalizedSearch =
      input.search
        ? normalizeSearch(
            input.search,
          )
        : ""

    const opportunities =
      repositoryOpportunities
        .filter(
          (opportunity) =>
            opportunity.workspaceId ===
            workspaceId,
        )
        .filter(
          (opportunity) =>
            !clientId ||
            opportunity.clientId ===
              clientId,
        )
        .filter(
          (opportunity) =>
            !consultantId ||
            opportunity.consultantId ===
              consultantId,
        )
        .filter(
          (opportunity) =>
            !input.consortiumType ||
            opportunity.consortiumType ===
              input.consortiumType,
        )
        .filter(
          (opportunity) =>
            !input.priority ||
            opportunity.priority ===
              input.priority,
        )
        .filter(
          (opportunity) =>
            !currentPhaseId ||
            opportunity.currentPhaseId ===
              currentPhaseId,
        )
        .filter(
          (opportunity) =>
            !currentStateId ||
            opportunity.currentStateId ===
              currentStateId,
        )
        .filter(
          (opportunity) =>
            input.status !== "open" ||
            (
              opportunity.closedAt ===
                null &&
              opportunity.outcome ===
                null
            ),
        )
        .filter(
          (opportunity) =>
            input.status !== "closed" ||
            opportunity.closedAt !==
              null ||
            opportunity.outcome !==
              null,
        )
        .filter(
          (opportunity) =>
            input.origin !== "lead" ||
            opportunity.leadId !==
              null,
        )
        .filter(
          (opportunity) =>
            input.origin !== "client" ||
            (
              opportunity.leadId ===
                null &&
              opportunity.clientId !==
                null
            ),
        )
        .filter(
          (opportunity) =>
            !normalizedSearch ||
            normalizeSearch(
              opportunity.title,
            ).includes(
              normalizedSearch,
            ),
        )
        .sort(
          compareOpportunities,
        )

    return {
      opportunities,
      total:
        opportunities.length,
    }
  }
}
