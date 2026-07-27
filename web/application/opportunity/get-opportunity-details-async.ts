import {
  presentCommercialEvent,
} from "@/lib/commercial-event-presenter"

import type {
  AsyncCommercialEventRepository,
  AsyncCommercialJourneyRepository,
  AsyncJourneyPhaseRepository,
  AsyncJourneyStateRepository,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  EntityId,
} from "@/types/domain"

import type {
  OpportunityDetailsView,
} from "@/types/opportunity-details"

import {
  GetOpportunityAsync,
} from "./get-opportunity-async"

export type GetOpportunityDetailsInput = {
  workspaceId: EntityId
  opportunityId: EntityId
}

export type GetOpportunityDetailsOutput = {
  opportunity: OpportunityDetailsView
}

type OpportunityDetailsOriginFields =
  | Pick<
      Extract<
        OpportunityDetailsView,
        { origin: "lead" }
      >,
      "origin" | "leadId" | "clientId"
    >
  | Pick<
      Extract<
        OpportunityDetailsView,
        { origin: "client" }
      >,
      "origin" | "leadId" | "clientId"
    >

export type GetOpportunityDetailsAsyncDependencies =
  {
    journeys:
      AsyncCommercialJourneyRepository
    events:
      Pick<
        AsyncCommercialEventRepository,
        "findByJourneyId"
      >
    phases:
      Pick<
        AsyncJourneyPhaseRepository,
        "findById"
      >
    states:
      Pick<
        AsyncJourneyStateRepository,
        "findById"
      >
    leads:
      Pick<
        AsyncCrmRepositories["leads"],
        "findById"
      >
    clients:
      Pick<
        AsyncCrmRepositories["clients"],
        "findById"
      >
    consultants:
      Pick<
        AsyncCrmRepositories["consultants"],
        "findById"
      >
  }

export class GetOpportunityDetailsAsync {
  constructor(
    private readonly dependencies:
      GetOpportunityDetailsAsyncDependencies,
  ) {}

  async execute(
    input: GetOpportunityDetailsInput,
  ): Promise<GetOpportunityDetailsOutput> {
    const { opportunity } =
      await new GetOpportunityAsync({
        journeys:
          this.dependencies.journeys,
      }).execute(input)

    const origin =
      opportunity.leadId !== null
        ? "lead"
        : "client"

    const leadId =
      opportunity.leadId

    const clientId =
      opportunity.clientId

    let originDetails:
      OpportunityDetailsOriginFields

    if (leadId !== null) {
      originDetails = {
        origin: "lead",
        leadId,
        clientId,
      }
    } else {
      if (clientId === null) {
        throw new Error(
          `A oportunidade comercial "${opportunity.id}" não possui uma origem válida.`,
        )
      }

      originDetails = {
        origin: "client",
        leadId: null,
        clientId,
      }
    }

    const [
      consultant,
      phase,
      state,
      originEntity,
      events,
    ] = await Promise.all([
      this.dependencies.consultants
        .findById(
          opportunity.consultantId,
        ),
      this.dependencies.phases
        .findById(
          opportunity.currentPhaseId,
        ),
      this.dependencies.states
        .findById(
          opportunity.currentStateId,
        ),
      leadId !== null
        ? this.dependencies.leads
            .findById(
              leadId,
            )
        : clientId !== null
          ? this.dependencies.clients
              .findById(
                clientId,
              )
          : Promise.resolve(undefined),
      this.dependencies.events
        .findByJourneyId(
          opportunity.id,
        ),
    ])

    const timeline =
      events.map((event) => {
        const presentation =
          presentCommercialEvent(
            event,
          )

        return {
          id: event.id,
          title:
            presentation.title,
          description:
            presentation.description,
          actorLabel:
            presentation.actorLabel,
          occurredAt:
            event.occurredAt,
          createdAt:
            event.createdAt,
        }
      })

    return {
      opportunity: {
        id: opportunity.id,
        workspaceId:
          opportunity.workspaceId,
        title: opportunity.title,
        originName:
          originEntity?.name ??
          (
            origin === "lead"
              ? "Lead não identificado"
              : "Cliente não identificado"
          ),
        ...originDetails,
        consultantId:
          opportunity.consultantId,
        consultantName:
          consultant?.name ??
          "Consultor não identificado",
        priority:
          opportunity.priority,
        score:
          opportunity.score,
        consortiumType:
          opportunity.consortiumType,
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
          opportunity.closedAt !== null ||
          opportunity.outcome !== null
            ? "closed"
            : "open",
        stateEnteredAt:
          opportunity.stateEnteredAt,
        lastInteractionAt:
          opportunity.lastInteractionAt,
        closedAt:
          opportunity.closedAt,
        version:
          opportunity.version,
        createdAt:
          opportunity.createdAt,
        updatedAt:
          opportunity.updatedAt,
        timeline,
      },
    }
  }
}
