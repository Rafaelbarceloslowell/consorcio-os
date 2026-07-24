import type { EntityId, Timestamps } from "./common"

export type MeetingType = "in_person" | "online" | "phone"

export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "no_show"

export type MeetingOutcome =
  | "proposal_sent"
  | "follow_up_scheduled"
  | "not_interested"
  | "converted"
  | "no_answer"
  | "other"

export type Meeting = {
  id: EntityId
  title: string
  description?: string
  type: MeetingType
  status: MeetingStatus
  startAt: string
  endAt: string
  location?: string
  meetingUrl?: string
  consultantId: EntityId
  leadId?: EntityId
  clientId?: EntityId
  proposalId?: EntityId
  outcome?: MeetingOutcome
  notes?: string
} & Timestamps
