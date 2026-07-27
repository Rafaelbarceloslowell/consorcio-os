import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialJourney,
  EntityId,
} from "@/types/domain"

export type GetOpportunityInput = {
  workspaceId: EntityId
  opportunityId: EntityId
}

export type GetOpportunityOutput = {
  opportunity: CommercialJourney
}

export type GetOpportunityAsyncDependencies =
  Pick<
    AsyncCommercialRepositories,
    "journeys"
  >

export class GetOpportunityAsync {
  constructor(
    private readonly dependencies:
      GetOpportunityAsyncDependencies,
  ) {}

  async execute(
    input: GetOpportunityInput,
  ): Promise<GetOpportunityOutput> {
    const workspaceId =
      input.workspaceId.trim()

    if (!workspaceId) {
      throw new Error(
        "O workspace é obrigatório para consultar a oportunidade.",
      )
    }

    const opportunityId =
      input.opportunityId.trim()

    if (!opportunityId) {
      throw new Error(
        "O ID da oportunidade é obrigatório.",
      )
    }

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

    return {
      opportunity,
    }
  }
}
