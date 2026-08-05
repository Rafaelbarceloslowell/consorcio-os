import type {
  CommercialJourneyOutcome,
  CommercialJourneyPriority,
  ConsortiumType,
  EntityId,
} from "@/types/domain"

export type ClientOpportunitySummaryStatus =
  | "open"
  | "closed"

export type ClientOpportunitySummaryView = {
  id: EntityId
  title: string
  consortiumType: ConsortiumType
  priority: CommercialJourneyPriority

  consultantId: EntityId
  consultantName: string

  phaseId: EntityId
  phaseName: string

  stateId: EntityId
  stateName: string

  outcome:
    CommercialJourneyOutcome | null

  status:
    ClientOpportunitySummaryStatus

  updatedAt: string
}

export type ClientOpportunitiesSummaryView = {
  clientId: EntityId
  opportunities:
    ClientOpportunitySummaryView[]
}
