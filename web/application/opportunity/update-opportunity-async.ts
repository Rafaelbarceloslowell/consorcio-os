import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  CommercialJourney,
  CommercialJourneyPriority,
  EntityId,
} from "@/types/domain"

export type UpdateOpportunityInput = {
  workspaceId: EntityId
  opportunityId: EntityId
  title?: string
  consultantId?: EntityId
  priority?: CommercialJourneyPriority
  score?: number
}

export type UpdateOpportunityOutput = {
  opportunity: CommercialJourney
}

export type UpdateOpportunityOptions = {
  now?: Date
}

export type UpdateOpportunityAsyncDependencies =
  Pick<
    AsyncCommercialRepositories,
    "journeys"
  > &
  Pick<
    AsyncCrmRepositories,
    "consultants"
  >

const OPPORTUNITY_PRIORITIES:
  CommercialJourneyPriority[] = [
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
  ]

type NormalizedUpdate = {
  title?: string
  consultantId?: EntityId
  priority?: CommercialJourneyPriority
  score?: number
}

function normalizeInput(
  input: UpdateOpportunityInput,
): {
  workspaceId: EntityId
  opportunityId: EntityId
  update: NormalizedUpdate
} {
  const workspaceId =
    input.workspaceId.trim()

  if (!workspaceId) {
    throw new Error(
      "O workspace é obrigatório para atualizar a oportunidade.",
    )
  }

  const opportunityId =
    input.opportunityId.trim()

  if (!opportunityId) {
    throw new Error(
      "O ID da oportunidade é obrigatório.",
    )
  }

  const hasTitle =
    input.title !== undefined
  const hasConsultantId =
    input.consultantId !== undefined
  const hasPriority =
    input.priority !== undefined
  const hasScore =
    input.score !== undefined

  if (
    !hasTitle &&
    !hasConsultantId &&
    !hasPriority &&
    !hasScore
  ) {
    throw new Error(
      "Nenhuma alteração foi informada para a oportunidade.",
    )
  }

  const update: NormalizedUpdate = {}

  if (hasTitle) {
    if (
      typeof input.title !==
      "string"
    ) {
      throw new Error(
        "O título da oportunidade não pode estar vazio.",
      )
    }

    const title =
      input.title.trim()

    if (!title) {
      throw new Error(
        "O título da oportunidade não pode estar vazio.",
      )
    }

    update.title = title
  }

  if (hasConsultantId) {
    if (
      typeof input.consultantId !==
      "string"
    ) {
      throw new Error(
        "O ID do consultor informado é inválido.",
      )
    }

    const consultantId =
      input.consultantId.trim()

    if (!consultantId) {
      throw new Error(
        "O ID do consultor informado é inválido.",
      )
    }

    update.consultantId =
      consultantId
  }

  if (hasPriority) {
    if (
      input.priority ===
        undefined ||
      !OPPORTUNITY_PRIORITIES.includes(
        input.priority,
      )
    ) {
      throw new Error(
        "A prioridade da oportunidade é inválida.",
      )
    }

    update.priority =
      input.priority
  }

  if (hasScore) {
    if (
      input.score === undefined ||
      !Number.isInteger(input.score) ||
      input.score < 0 ||
      input.score > 100
    ) {
      throw new Error(
        "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
      )
    }

    update.score = input.score
  }

  return {
    workspaceId,
    opportunityId,
    update,
  }
}

export class UpdateOpportunityAsync {
  constructor(
    private readonly dependencies:
      UpdateOpportunityAsyncDependencies,
    private readonly options:
      UpdateOpportunityOptions = {},
  ) {}

  async execute(
    input: UpdateOpportunityInput,
  ): Promise<UpdateOpportunityOutput> {
    const {
      workspaceId,
      opportunityId,
      update,
    } = normalizeInput(input)

    const opportunity =
      await this.dependencies
        .journeys
        .findById(opportunityId)

    if (
      !opportunity ||
      opportunity.workspaceId !==
        workspaceId
    ) {
      throw new Error(
        `Oportunidade comercial não encontrada para o ID "${opportunityId}".`,
      )
    }

    const changesTitle =
      update.title !== undefined &&
      update.title !==
        opportunity.title
    const changesConsultant =
      update.consultantId !==
        undefined &&
      update.consultantId !==
        opportunity.consultantId
    const changesPriority =
      update.priority !== undefined &&
      update.priority !==
        opportunity.priority
    const changesScore =
      update.score !== undefined &&
      update.score !==
        opportunity.score

    if (
      changesConsultant &&
      update.consultantId !==
        undefined
    ) {
      const consultant =
        await this.dependencies
          .consultants
          .findById(
            update.consultantId,
          )

      if (!consultant) {
        throw new Error(
          `Consultor não encontrado para o ID "${update.consultantId}".`,
        )
      }
    }

    if (
      !changesTitle &&
      !changesConsultant &&
      !changesPriority &&
      !changesScore
    ) {
      return {
        opportunity,
      }
    }

    const timestamp =
      (
        this.options.now ??
        new Date()
      ).toISOString()

    const updatedOpportunity:
      CommercialJourney = {
        ...opportunity,
        title:
          update.title ??
          opportunity.title,
        consultantId:
          update.consultantId ??
          opportunity.consultantId,
        priority:
          update.priority ??
          opportunity.priority,
        score:
          update.score ??
          opportunity.score,
        version:
          opportunity.version + 1,
        updatedAt:
          timestamp,
      }

    const persistedOpportunity =
      await this.dependencies
        .journeys
        .update(updatedOpportunity)

    if (!persistedOpportunity) {
      throw new Error(
        `A oportunidade comercial "${opportunityId}" não pôde ser atualizada.`,
      )
    }

    return {
      opportunity:
        persistedOpportunity,
    }
  }
}
