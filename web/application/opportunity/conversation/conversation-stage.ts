export type ConversationStage =
  | "opening"
  | "rapport"
  | "discovery"
  | "qualification"
  | "diagnosis"
  | "strategy"
  | "meeting"
  | "follow_up"
  | "closing"

export type ConversationApproachType =
  | "new"
  | "reactivation"

export type ConversationGoal =
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