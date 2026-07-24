import type { EntityId, Timestamps } from "./common"
import type { CommercialActionType } from "./commercial-action"

export type WorkflowRuleConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "IN"
  | "NOT_IN"
  | "EXISTS"
  | "NOT_EXISTS"

export type WorkflowRuleCondition = {
  field: string
  operator: WorkflowRuleConditionOperator
  value?: unknown
}

export type WorkflowRuleActionType = Extract<
  CommercialActionType,
  | "CHANGE_STATE"
  | "CREATE_TASK"
  | "ADD_NOTE"
  | "UPDATE_PRIORITY"
  | "UPDATE_SCORE"
  | "ASSIGN_CONSULTANT"
  | "SEND_NOTIFICATION"
  | "TRIGGER_AUTOMATION"
>

export type WorkflowRuleAction = {
  type: WorkflowRuleActionType
  payload: Record<string, unknown>
}

export type WorkflowRule = {
  id: EntityId
  workspaceId: EntityId | null

  name: string
  description?: string

  eventType: string

  sourceStateId?: EntityId
  targetStateId?: EntityId

  conditions: WorkflowRuleCondition[]
  actions: WorkflowRuleAction[]

  priority: number
  stopProcessingAfterMatch: boolean
  isActive: boolean
} & Timestamps