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

export type OpportunityTimelineItemView = {
  id: EntityId
  title: string
  description: string | null
  actorLabel: string
  occurredAt: string
  createdAt: string
}

export type OpportunitySuggestedQuestionKind =
  | "situation"
  | "problem"
  | "implication"
  | "need_payoff"

export type OpportunitySuggestedQuestionView = {
  kind: OpportunitySuggestedQuestionKind
  label: string
  question: string
}

export type OpportunityBriefingView = {
  summary: string
  attentionPoint: string
  conversationFocus: string
  recommendedNextStep: string
}

export type OpportunityConversationMemoryView = {
  id: EntityId
  stage:
    | "opening"
    | "rapport"
    | "discovery"
    | "qualification"
    | "diagnosis"
    | "strategy"
    | "meeting"
    | "follow_up"
    | "closing"
  goal:
    | "get_first_response"
    | "understand_interest_area"
    | "understand_project_purpose"
    | "understand_timing"
    | "understand_budget"
    | "understand_objection"
    | "present_strategy"
    | "schedule_meeting"
    | "confirm_follow_up"
    | "close_next_step"
  lastIntent: string | null
  lastIncomingMessage: string | null
  lastSuggestedReply: string | null
  analyzedAt: string | null
  updatedAt: string
  narrativeSummary?: string | null
  structuredFacts?: Readonly<Record<string, unknown>>
  factProvenance?: Readonly<Record<string, unknown>>
  observedAt?: string | null
}

export type OpportunityContactContextView = {
  approachType?: "new" | "reactivation" | null
  isReactivated: boolean
  phone: string | null
  email: string | null
  sourceLabel: string
  importedAt: string | null
  objective: string | null
  currentSituation: string | null
  originalInformation: string | null
}

type OpportunityDetailsCommon = {
  id: EntityId
  workspaceId: EntityId
  title: string
  originName: string
  contactContext?: OpportunityContactContextView | null
  conversationMemory?: OpportunityConversationMemoryView | null
  suggestedMessage?: string | null
  suggestedQuestions?: OpportunitySuggestedQuestionView[] | null
  briefing?: OpportunityBriefingView | null
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
  timeline: OpportunityTimelineItemView[]
}

export type OpportunityDetailsView =
  OpportunityDetailsCommon &
    (
      | {
          origin: "lead"
          leadId: EntityId
          clientId: EntityId | null
        }
      | {
          origin: "client"
          leadId: null
          clientId: EntityId
        }
    )
