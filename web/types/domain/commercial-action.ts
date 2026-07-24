import type { EntityId, Timestamps } from "./common"
import type { CommercialActorType } from "./commercial-actor"

export type CommercialActionType =
  | "CHANGE_STATE"
  | "CREATE_TASK"
  | "COMPLETE_TASK"
  | "ADD_NOTE"
  | "UPDATE_PRIORITY"
  | "UPDATE_SCORE"
  | "ASSIGN_CONSULTANT"
  | "SEND_NOTIFICATION"
  | "SEND_MESSAGE"
  | "REQUEST_DOCUMENT"
  | "CREATE_PROPOSAL"
  | "TRIGGER_AUTOMATION"

export type CommercialActionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"

export type CommercialActionOrigin =
  | "MANUAL"
  | "WORKFLOW_RULE"
  | "NEXT_BEST_ACTION"
  | "AI"
  | "SYSTEM"

export type CommercialAction = {
  id: EntityId
  workspaceId: EntityId
  journeyId: EntityId

  type: CommercialActionType
  status: CommercialActionStatus
  origin: CommercialActionOrigin

  actorType: CommercialActorType
  actorId: EntityId | null

  title: string
  description?: string

  payload: Record<string, unknown>

  scheduledFor: string | null
  startedAt: string | null
  completedAt: string | null
  failedAt: string | null

  failureReason: string | null

  createdBy: EntityId | null
} & Timestamps