import {
    CommercialActionType as PrismaCommercialActionType,
    NextBestActionPriority as PrismaNextBestActionPriority,
    NextBestActionSource as PrismaNextBestActionSource,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    NextBestAction as PrismaNextBestAction,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialActionType,
    NextBestAction,
    NextBestActionPriority,
    NextBestActionSource,
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
  
  const nextBestActionPriorityToPrisma: Record<
    NextBestActionPriority,
    PrismaNextBestActionPriority
  > = {
    LOW:
      PrismaNextBestActionPriority.LOW,
  
    NORMAL:
      PrismaNextBestActionPriority.NORMAL,
  
    HIGH:
      PrismaNextBestActionPriority.HIGH,
  
    URGENT:
      PrismaNextBestActionPriority.URGENT,
  }
  
  const nextBestActionPriorityToDomain: Record<
    PrismaNextBestActionPriority,
    NextBestActionPriority
  > = {
    [PrismaNextBestActionPriority.LOW]:
      "LOW",
  
    [PrismaNextBestActionPriority.NORMAL]:
      "NORMAL",
  
    [PrismaNextBestActionPriority.HIGH]:
      "HIGH",
  
    [PrismaNextBestActionPriority.URGENT]:
      "URGENT",
  }
  
  const nextBestActionSourceToPrisma: Record<
    NextBestActionSource,
    PrismaNextBestActionSource
  > = {
    RULE_ENGINE:
      PrismaNextBestActionSource.RULE_ENGINE,
  
    AI:
      PrismaNextBestActionSource.AI,
  
    SYSTEM:
      PrismaNextBestActionSource.SYSTEM,
  
    CONSULTANT:
      PrismaNextBestActionSource.CONSULTANT,
  }
  
  const nextBestActionSourceToDomain: Record<
    PrismaNextBestActionSource,
    NextBestActionSource
  > = {
    [PrismaNextBestActionSource.RULE_ENGINE]:
      "RULE_ENGINE",
  
    [PrismaNextBestActionSource.AI]:
      "AI",
  
    [PrismaNextBestActionSource.SYSTEM]:
      "SYSTEM",
  
    [PrismaNextBestActionSource.CONSULTANT]:
      "CONSULTANT",
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
  
  export type NextBestActionPersistenceInput = {
    workspaceId: string
    nextBestAction: NextBestAction
  }
  
  export class NextBestActionMapper {
    static toDomain(
      raw: PrismaNextBestAction,
    ): NextBestAction {
      return {
        id:
          raw.id,
  
        workspaceId:
          raw.workspaceId,
  
        journeyId:
          raw.journeyId,
  
        actionType:
          commercialActionTypeToDomain[
            raw.actionType
          ],
  
        title:
          raw.title,
  
        description:
          raw.description ?? undefined,
  
        reason:
          raw.reason,
  
        confidence:
          raw.confidence.toNumber(),
  
        priority:
          nextBestActionPriorityToDomain[
            raw.priority
          ],
  
        source:
          nextBestActionSourceToDomain[
            raw.source
          ],
  
        expiresAt:
          dateToISOString(
            raw.expiresAt,
          ),
  
        acceptedAt:
          dateToISOString(
            raw.acceptedAt,
          ),
  
        rejectedAt:
          dateToISOString(
            raw.rejectedAt,
          ),
  
        executedActionId:
          raw.executedActionId,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      nextBestAction,
    }: NextBestActionPersistenceInput): Prisma.NextBestActionUncheckedCreateInput {
      return {
        id:
          nextBestAction.id,
  
        workspaceId,
  
        journeyId:
          nextBestAction.journeyId,
  
        actionType:
          commercialActionTypeToPrisma[
            nextBestAction.actionType
          ],
  
        title:
          nextBestAction.title,
  
        description:
          nextBestAction.description ?? null,
  
        reason:
          nextBestAction.reason,
  
        confidence:
          new Prisma.Decimal(
            nextBestAction.confidence,
          ),
  
        priority:
          nextBestActionPriorityToPrisma[
            nextBestAction.priority
          ],
  
        source:
          nextBestActionSourceToPrisma[
            nextBestAction.source
          ],
  
        expiresAt:
          isoStringToDate(
            nextBestAction.expiresAt,
          ),
  
        acceptedAt:
          isoStringToDate(
            nextBestAction.acceptedAt,
          ),
  
        rejectedAt:
          isoStringToDate(
            nextBestAction.rejectedAt,
          ),
  
        executedActionId:
          nextBestAction.executedActionId,
  
        createdAt:
          new Date(
            nextBestAction.createdAt,
          ),
  
        updatedAt:
          new Date(
            nextBestAction.updatedAt,
          ),
      }
    }
  }