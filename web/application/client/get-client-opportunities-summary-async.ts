import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  EntityId,
} from "@/types/domain"

import type {
  ClientOpportunitiesSummaryView,
  ClientOpportunitySummaryView,
} from "@/types/client-opportunity-summary"

export type GetClientOpportunitiesSummaryInput = {
  workspaceId: EntityId
  clientId: EntityId
}

export type GetClientOpportunitiesSummaryOutput = {
  summary: ClientOpportunitiesSummaryView
}

export type GetClientOpportunitiesSummaryAsyncDependencies = {
  workspaceId: EntityId
  journeys:
    Pick<
      AsyncCommercialRepositories["journeys"],
      "findByClientId"
    >
  phases:
    Pick<
      AsyncCommercialRepositories["phases"],
      "findById"
    >
  states:
    Pick<
      AsyncCommercialRepositories["states"],
      "findById"
    >
  consultants:
    Pick<
      AsyncCrmRepositories["consultants"],
      "findById"
    >
}

export class GetClientOpportunitiesSummaryAsync {
  constructor(
    private readonly dependencies:
      GetClientOpportunitiesSummaryAsyncDependencies,
  ) {}

  async execute(
    input: GetClientOpportunitiesSummaryInput,
  ): Promise<GetClientOpportunitiesSummaryOutput> {
    const workspaceId =
      input.workspaceId.trim()

    if (!workspaceId) {
      throw new Error(
        "O workspace é obrigatório para consultar as oportunidades do cliente.",
      )
    }

    const clientId =
      input.clientId.trim()

    if (!clientId) {
      throw new Error(
        "O ID do cliente é obrigatório para consultar as oportunidades.",
      )
    }

    if (
      workspaceId !==
      this.dependencies.workspaceId
    ) {
      return {
        summary: {
          clientId,
          opportunities: [],
        },
      }
    }

    const repositoryOpportunities =
      await this.dependencies
        .journeys
        .findByClientId(clientId)

    const opportunities =
      await Promise.all(
        repositoryOpportunities
          .filter(
            (opportunity) =>
              opportunity.workspaceId ===
                workspaceId &&
              opportunity.clientId ===
                clientId,
          )
          .map(
            async (
              opportunity,
            ): Promise<ClientOpportunitySummaryView> => {
              const [
                consultant,
                phase,
                state,
              ] = await Promise.all([
                this.dependencies
                  .consultants
                  .findById(
                    opportunity.consultantId,
                  ),
                this.dependencies
                  .phases
                  .findById(
                    opportunity.currentPhaseId,
                  ),
                this.dependencies
                  .states
                  .findById(
                    opportunity.currentStateId,
                  ),
              ])

              return {
                id: opportunity.id,
                title:
                  opportunity.title,
                consortiumType:
                  opportunity.consortiumType,
                priority:
                  opportunity.priority,
                consultantId:
                  opportunity.consultantId,
                consultantName:
                  consultant?.name ??
                  "Consultor não identificado",
                phaseId:
                  opportunity.currentPhaseId,
                phaseName:
                  phase?.name ??
                  "Fase indisponível",
                stateId:
                  opportunity.currentStateId,
                stateName:
                  state?.name ??
                  "Estado indisponível",
                outcome:
                  opportunity.outcome,
                status:
                  opportunity.closedAt !==
                    null ||
                  opportunity.outcome !==
                    null
                    ? "closed"
                    : "open",
                updatedAt:
                  opportunity.updatedAt,
              }
            },
          ),
      )

    opportunities.sort(
      (
        first,
        second,
      ) => {
        const updatedAtComparison =
          second.updatedAt.localeCompare(
            first.updatedAt,
          )

        if (
          updatedAtComparison !== 0
        ) {
          return updatedAtComparison
        }

        return first.id.localeCompare(
          second.id,
          "pt-BR",
        )
      },
    )

    return {
      summary: {
        clientId,
        opportunities,
      },
    }
  }
}
