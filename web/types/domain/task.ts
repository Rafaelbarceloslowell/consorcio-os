import type { EntityId, Timestamps } from "./common"

export type TaskPriority = "high" | "medium" | "low"

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"

export type TaskType =
  | "call"
  | "email"
  | "follow_up"
  | "document"
  | "meeting_prep"
  | "proposal_review"
  | "other"

export type Task = {
  id: EntityId
  title: string
  description?: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  dueAt: string
  assignedToId: EntityId
  leadId?: EntityId
  clientId?: EntityId
  meetingId?: EntityId
  proposalId?: EntityId
  opportunityId?: EntityId
  executionType?: string
  reason?: string
  completedAt?: string
} & Timestamps
