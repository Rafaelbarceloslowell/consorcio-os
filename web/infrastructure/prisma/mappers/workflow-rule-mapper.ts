import type {
    Prisma,
    WorkflowRule as PrismaWorkflowRule,
  } from "@/lib/generated/prisma/client"
  
  import type {
    WorkflowRule,
    WorkflowRuleAction,
    WorkflowRuleCondition,
  } from "@/types/domain"
  
  function jsonToWorkflowRuleConditions(
    value: Prisma.JsonValue,
  ): WorkflowRuleCondition[] {
    if (!Array.isArray(value)) {
      return []
    }
  
    return value as WorkflowRuleCondition[]
  }
  
  function jsonToWorkflowRuleActions(
    value: Prisma.JsonValue,
  ): WorkflowRuleAction[] {
    if (!Array.isArray(value)) {
      return []
    }
  
    return value as WorkflowRuleAction[]
  }
  
  export type WorkflowRulePersistenceInput = {
    rule: WorkflowRule
  }
  
  export class WorkflowRuleMapper {
    static toDomain(
      raw: PrismaWorkflowRule,
    ): WorkflowRule {
      return {
        id:
          raw.id,
  
        workspaceId:
          raw.workspaceId,
  
        name:
          raw.name,
  
        description:
          raw.description ?? undefined,
  
        eventType:
          raw.eventType,
  
        sourceStateId:
          raw.sourceStateId ?? undefined,
  
        targetStateId:
          raw.targetStateId ?? undefined,
  
        conditions:
          jsonToWorkflowRuleConditions(
            raw.conditions,
          ),
  
        actions:
          jsonToWorkflowRuleActions(
            raw.actions,
          ),
  
        priority:
          raw.priority,
  
        stopProcessingAfterMatch:
          raw.stopProcessingAfterMatch,
  
        isActive:
          raw.isActive,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      rule,
    }: WorkflowRulePersistenceInput): Prisma.WorkflowRuleUncheckedCreateInput {
      return {
        id:
          rule.id,
  
        workspaceId:
          rule.workspaceId,
  
        name:
          rule.name,
  
        description:
          rule.description ?? null,
  
        eventType:
          rule.eventType,
  
        sourceStateId:
          rule.sourceStateId ?? null,
  
        targetStateId:
          rule.targetStateId ?? null,
  
        conditions:
          rule.conditions as Prisma.InputJsonValue,
  
        actions:
          rule.actions as Prisma.InputJsonValue,
  
        priority:
          rule.priority,
  
        stopProcessingAfterMatch:
          rule.stopProcessingAfterMatch,
  
        isActive:
          rule.isActive,
  
        createdAt:
          new Date(
            rule.createdAt,
          ),
  
        updatedAt:
          new Date(
            rule.updatedAt,
          ),
      }
    }
  }