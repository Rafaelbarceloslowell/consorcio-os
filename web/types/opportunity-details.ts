import type {
  CommercialJourneyOutcome,
  CommercialJourneyPriority,
  ConsortiumType,
  EntityId,
} from "@/types/domain"

export type OpportunityDetailsOrigin =
  | "lead"
  | "client"

export type OpportunityDetailsStatus =
  | "open"
  | "closed"

type OpportunityDetailsCommon = {
  id: EntityId
  workspaceId: EntityId
  title: string
  originName: string
  consultantId: EntityId
  consultantName: string
  priority: CommercialJourneyPriority
  score: number
  consortiumType: ConsortiumType
  phaseId: EntityId
  phaseName: string
  stateId: EntityId
  stateName: string
  outcome: CommercialJourneyOutcome | null
  status: OpportunityDetailsStatus
  stateEnteredAt: string
  lastInteractionAt: string | null
  closedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export type OpportunityDetailsView =
  OpportunityDetailsCommon &
    (
      | {
          origin: "lead"
          leadId: EntityId
          clientId:
            EntityId | null
        }
      | {
          origin: "client"
          leadId: null
          clientId: EntityId
        }
    )
