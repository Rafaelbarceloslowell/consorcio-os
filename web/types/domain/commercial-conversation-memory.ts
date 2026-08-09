import type {
  EntityId,
  Timestamps,
} from "./common"

export type CommercialConversationStage =
  | "opening"
  | "rapport"
  | "discovery"
  | "qualification"
  | "diagnosis"
  | "strategy"
  | "meeting"
  | "follow_up"
  | "closing"

export type CommercialConversationGoal =
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

export type CommercialConversationMemory = {
  id: EntityId
  workspaceId: EntityId
  journeyId: EntityId
  stage: CommercialConversationStage
  goal: CommercialConversationGoal
  lastIntent: string | null
  lastIncomingMessage: string | null
  lastSuggestedReply: string | null
  analyzedAt: string | null
  structuredFacts?: Readonly<Record<string, unknown>>
  narrativeSummary?: string | null
  factProvenance?: Readonly<Record<string, unknown>>
  observedAt?: string | null
} & Timestamps
