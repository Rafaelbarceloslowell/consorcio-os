import type { EntityId, Timestamps } from "./common"
import type { CommercialActionType } from "./commercial-action"

export type NextBestActionSource =
  | "RULE_ENGINE"
  | "AI"
  | "SYSTEM"
  | "CONSULTANT"

export type NextBestActionPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT"

export type NextBestAction = {
  id: EntityId

  workspaceId: EntityId

  journeyId: EntityId

  actionType: CommercialActionType

  title: string

  description?: string

  reason: string

  confidence: number

  priority: NextBestActionPriority

  source: NextBestActionSource

  expiresAt: string | null

  acceptedAt: string | null

  rejectedAt: string | null

  executedActionId: EntityId | null
} & Timestamps