import {
    CommercialActionOrigin as PrismaCommercialActionOrigin,
    CommercialActionStatus as PrismaCommercialActionStatus,
    CommercialActionType as PrismaCommercialActionType,
    CommercialActorType as PrismaCommercialActorType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialAction as PrismaCommercialAction,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialAction,
    CommercialActionOrigin,
    CommercialActionStatus,
    CommercialActionType,
    CommercialActorType,
  } from "@/types/domain"
  
  const commercialActionTypeToPrisma: Record<
    CommercialActionType,
    PrismaCommercialActionType
  > = {
    CHANGE_STATE:
      PrismaCommercialActionType.CHANGE_STATE,
  
    CREATE_TASK:
      PrismaCommercialActionType.CREATE_TASK,
  
    COMPLETE_TASK:
      PrismaCommercialActionType.COMPLETE_TASK,
  
    ADD_NOTE:
      PrismaCommercialActionType.ADD_NOTE,
  
    UPDATE_PRIORITY:
      PrismaCommercialActionType.UPDATE_PRIORITY,
  
    UPDATE_SCORE:
      PrismaCommercialActionType.UPDATE_SCORE,
  
    ASSIGN_CONSULTANT:
      PrismaCommercialActionType.ASSIGN_CONSULTANT,
  
    SEND_NOTIFICATION:
      PrismaCommercialActionType.SEND_NOTIFICATION,
  
    SEND_MESSAGE:
      PrismaCommercialActionType.SEND_MESSAGE,
  
    REQUEST_DOCUMENT:
      PrismaCommercialActionType.REQUEST_DOCUMENT,
  
    CREATE_PROPOSAL:
      PrismaCommercialActionType.CREATE_PROPOSAL,
  
    TRIGGER_AUTOMATION:
      PrismaCommercialActionType.TRIGGER_AUTOMATION,
  }
  
  const commercialActionTypeToDomain: Record<
    PrismaCommercialActionType,
    CommercialActionType
  > = {
    [PrismaCommercialActionType.CHANGE_STATE]:
      "CHANGE_STATE",
  
    [PrismaCommercialActionType.CREATE_TASK]:
      "CREATE_TASK",
  
    [PrismaCommercialActionType.COMPLETE_TASK]:
      "COMPLETE_TASK",
  
    [PrismaCommercialActionType.ADD_NOTE]:
      "ADD_NOTE",
  
    [PrismaCommercialActionType.UPDATE_PRIORITY]:
      "UPDATE_PRIORITY",
  
    [PrismaCommercialActionType.UPDATE_SCORE]:
      "UPDATE_SCORE",
  
    [PrismaCommercialActionType.ASSIGN_CONSULTANT]:
      "ASSIGN_CONSULTANT",
  
    [PrismaCommercialActionType.SEND_NOTIFICATION]:
      "SEND_NOTIFICATION",
  
    [PrismaCommercialActionType.SEND_MESSAGE]:
      "SEND_MESSAGE",
  
    [PrismaCommercialActionType.REQUEST_DOCUMENT]:
      "REQUEST_DOCUMENT",
  
    [PrismaCommercialActionType.CREATE_PROPOSAL]:
      "CREATE_PROPOSAL",
  
    [PrismaCommercialActionType.TRIGGER_AUTOMATION]:
      "TRIGGER_AUTOMATION",
  }
  
  const commercialActionStatusToPrisma: Record<
    CommercialActionStatus,
    PrismaCommercialActionStatus
  > = {
    PENDING:
      PrismaCommercialActionStatus.PENDING,
  
    IN_PROGRESS:
      PrismaCommercialActionStatus.IN_PROGRESS,
  
    COMPLETED:
      PrismaCommercialActionStatus.COMPLETED,
  
    FAILED:
      PrismaCommercialActionStatus.FAILED,
  
    CANCELLED:
      PrismaCommercialActionStatus.CANCELLED,
  }
  
  const commercialActionStatusToDomain: Record<
    PrismaCommercialActionStatus,
    CommercialActionStatus
  > = {
    [PrismaCommercialActionStatus.PENDING]:
      "PENDING",
  
    [PrismaCommercialActionStatus.IN_PROGRESS]:
      "IN_PROGRESS",
  
    [PrismaCommercialActionStatus.COMPLETED]:
      "COMPLETED",
  
    [PrismaCommercialActionStatus.FAILED]:
      "FAILED",
  
    [PrismaCommercialActionStatus.CANCELLED]:
      "CANCELLED",
  }
  
  const commercialActionOriginToPrisma: Record<
    CommercialActionOrigin,
    PrismaCommercialActionOrigin
  > = {
    MANUAL:
      PrismaCommercialActionOrigin.MANUAL,
  
    WORKFLOW_RULE:
      PrismaCommercialActionOrigin.WORKFLOW_RULE,
  
    NEXT_BEST_ACTION:
      PrismaCommercialActionOrigin.NEXT_BEST_ACTION,
  
    AI:
      PrismaCommercialActionOrigin.AI,
  
    SYSTEM:
      PrismaCommercialActionOrigin.SYSTEM,
  }
  
  const commercialActionOriginToDomain: Record<
    PrismaCommercialActionOrigin,
    CommercialActionOrigin
  > = {
    [PrismaCommercialActionOrigin.MANUAL]:
      "MANUAL",
  
    [PrismaCommercialActionOrigin.WORKFLOW_RULE]:
      "WORKFLOW_RULE",
  
    [PrismaCommercialActionOrigin.NEXT_BEST_ACTION]:
      "NEXT_BEST_ACTION",
  
    [PrismaCommercialActionOrigin.AI]:
      "AI",
  
    [PrismaCommercialActionOrigin.SYSTEM]:
      "SYSTEM",
  }
  
  const commercialActorTypeToPrisma: Record<
    CommercialActorType,
    PrismaCommercialActorType
  > = {
    LEAD:
      PrismaCommercialActorType.LEAD,
  
    CLIENT:
      PrismaCommercialActorType.CLIENT,
  
    CONSULTANT:
      PrismaCommercialActorType.CONSULTANT,
  
    AI:
      PrismaCommercialActorType.AI,
  
    SYSTEM:
      PrismaCommercialActorType.SYSTEM,
  
    AUTOMATION:
      PrismaCommercialActorType.AUTOMATION,
  
    ADMINISTRATOR:
      PrismaCommercialActorType.ADMINISTRATOR,
  }
  
  const commercialActorTypeToDomain: Record<
    PrismaCommercialActorType,
    CommercialActorType
  > = {
    [PrismaCommercialActorType.LEAD]:
      "LEAD",
  
    [PrismaCommercialActorType.CLIENT]:
      "CLIENT",
  
    [PrismaCommercialActorType.CONSULTANT]:
      "CONSULTANT",
  
    [PrismaCommercialActorType.AI]:
      "AI",
  
    [PrismaCommercialActorType.SYSTEM]:
      "SYSTEM",
  
    [PrismaCommercialActorType.AUTOMATION]:
      "AUTOMATION",
  
    [PrismaCommercialActorType.ADMINISTRATOR]:
      "ADMINISTRATOR",
  }
  
  function jsonToRecord(
    value: Prisma.JsonValue,
  ): Record<string, unknown> {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      return value as Record<string, unknown>
    }
  
    return {}
  }
  
  function dateToISOString(
    value: Date | null,
  ): string | null {
    return value?.toISOString() ?? null
  }
  
  function isoStringToDate(
    value: string | null,
  ): Date | null {
    return value
      ? new Date(value)
      : null
  }
  
  export type CommercialActionPersistenceInput = {
    workspaceId: string
    action: CommercialAction
  }
  
  export class CommercialActionMapper {
    static toDomain(
      raw: PrismaCommercialAction,
    ): CommercialAction {
      return {
        id:
          raw.id,
  
        workspaceId:
          raw.workspaceId,
  
        journeyId:
          raw.journeyId,
  
        type:
          commercialActionTypeToDomain[
            raw.type
          ],
  
        status:
          commercialActionStatusToDomain[
            raw.status
          ],
  
        origin:
          commercialActionOriginToDomain[
            raw.origin
          ],
  
        actorType:
          commercialActorTypeToDomain[
            raw.actorType
          ],
  
        actorId:
          raw.actorId,
  
        title:
          raw.title,
  
        description:
          raw.description ?? undefined,
  
        payload:
          jsonToRecord(
            raw.payload,
          ),
  
        scheduledFor:
          dateToISOString(
            raw.scheduledFor,
          ),
  
        startedAt:
          dateToISOString(
            raw.startedAt,
          ),
  
        completedAt:
          dateToISOString(
            raw.completedAt,
          ),
  
        failedAt:
          dateToISOString(
            raw.failedAt,
          ),
  
        failureReason:
          raw.failureReason,
  
        createdBy:
          raw.createdBy,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      action,
    }: CommercialActionPersistenceInput): Prisma.CommercialActionUncheckedCreateInput {
      return {
        id:
          action.id,
  
        workspaceId,
  
        journeyId:
          action.journeyId,
  
        type:
          commercialActionTypeToPrisma[
            action.type
          ],
  
        status:
          commercialActionStatusToPrisma[
            action.status
          ],
  
        origin:
          commercialActionOriginToPrisma[
            action.origin
          ],
  
        actorType:
          commercialActorTypeToPrisma[
            action.actorType
          ],
  
        actorId:
          action.actorId,
  
        title:
          action.title,
  
        description:
          action.description ?? null,
  
        payload:
          action.payload as Prisma.InputJsonValue,
  
        scheduledFor:
          isoStringToDate(
            action.scheduledFor,
          ),
  
        startedAt:
          isoStringToDate(
            action.startedAt,
          ),
  
        completedAt:
          isoStringToDate(
            action.completedAt,
          ),
  
        failedAt:
          isoStringToDate(
            action.failedAt,
          ),
  
        failureReason:
          action.failureReason,
  
        createdBy:
          action.createdBy,
  
        createdAt:
          new Date(
            action.createdAt,
          ),
  
        updatedAt:
          new Date(
            action.updatedAt,
          ),
      }
    }
  }