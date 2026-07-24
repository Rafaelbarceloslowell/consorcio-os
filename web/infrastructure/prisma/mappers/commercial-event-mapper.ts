import {
    CommercialActorType as PrismaCommercialActorType,
    CommercialEventType as PrismaCommercialEventType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialEvent as PrismaCommercialEvent,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialActorType,
    CommercialEvent,
    CommercialEventType,
  } from "@/types/domain"
  
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
  
  const commercialEventTypeToPrisma: Record<
    CommercialEventType,
    PrismaCommercialEventType
  > = {
    LEAD_CREATED:
      PrismaCommercialEventType.LEAD_CREATED,
  
    LEAD_REPLIED:
      PrismaCommercialEventType.LEAD_REPLIED,
  
    MEETING_SCHEDULED:
      PrismaCommercialEventType.MEETING_SCHEDULED,
  
    MEETING_COMPLETED:
      PrismaCommercialEventType.MEETING_COMPLETED,
  
    PROPOSAL_SENT:
      PrismaCommercialEventType.PROPOSAL_SENT,
  
    PROPOSAL_ACCEPTED:
      PrismaCommercialEventType.PROPOSAL_ACCEPTED,
  
    DOCUMENT_REQUESTED:
      PrismaCommercialEventType.DOCUMENT_REQUESTED,
  
    DOCUMENT_RECEIVED:
      PrismaCommercialEventType.DOCUMENT_RECEIVED,
  
    PAYMENT_CONFIRMED:
      PrismaCommercialEventType.PAYMENT_CONFIRMED,
  
    SALE_COMPLETED:
      PrismaCommercialEventType.SALE_COMPLETED,
  
    STATE_CHANGED:
      PrismaCommercialEventType.STATE_CHANGED,
  
    NOTE_ADDED:
      PrismaCommercialEventType.NOTE_ADDED,
  
    TASK_CREATED:
      PrismaCommercialEventType.TASK_CREATED,
  
    TASK_COMPLETED:
      PrismaCommercialEventType.TASK_COMPLETED,
  }
  
  const commercialEventTypeToDomain: Record<
    PrismaCommercialEventType,
    CommercialEventType
  > = {
    [PrismaCommercialEventType.LEAD_CREATED]:
      "LEAD_CREATED",
  
    [PrismaCommercialEventType.LEAD_REPLIED]:
      "LEAD_REPLIED",
  
    [PrismaCommercialEventType.MEETING_SCHEDULED]:
      "MEETING_SCHEDULED",
  
    [PrismaCommercialEventType.MEETING_COMPLETED]:
      "MEETING_COMPLETED",
  
    [PrismaCommercialEventType.PROPOSAL_SENT]:
      "PROPOSAL_SENT",
  
    [PrismaCommercialEventType.PROPOSAL_ACCEPTED]:
      "PROPOSAL_ACCEPTED",
  
    [PrismaCommercialEventType.DOCUMENT_REQUESTED]:
      "DOCUMENT_REQUESTED",
  
    [PrismaCommercialEventType.DOCUMENT_RECEIVED]:
      "DOCUMENT_RECEIVED",
  
    [PrismaCommercialEventType.PAYMENT_CONFIRMED]:
      "PAYMENT_CONFIRMED",
  
    [PrismaCommercialEventType.SALE_COMPLETED]:
      "SALE_COMPLETED",
  
    [PrismaCommercialEventType.STATE_CHANGED]:
      "STATE_CHANGED",
  
    [PrismaCommercialEventType.NOTE_ADDED]:
      "NOTE_ADDED",
  
    [PrismaCommercialEventType.TASK_CREATED]:
      "TASK_CREATED",
  
    [PrismaCommercialEventType.TASK_COMPLETED]:
      "TASK_COMPLETED",
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
  
  export type CommercialEventPersistenceInput = {
    workspaceId: string
    event: CommercialEvent
  }
  
  export class CommercialEventMapper {
    static toDomain(
      raw: PrismaCommercialEvent,
    ): CommercialEvent {
      return {
        id:
          raw.id,
  
        workspaceId:
          raw.workspaceId,
  
        journeyId:
          raw.journeyId,
  
        type:
          commercialEventTypeToDomain[
            raw.type
          ],
  
        actorType:
          commercialActorTypeToDomain[
            raw.actorType
          ],
  
        actorId:
          raw.actorId,
  
        payload:
          jsonToRecord(
            raw.payload,
          ),
  
        occurredAt:
          raw.occurredAt.toISOString(),
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      event,
    }: CommercialEventPersistenceInput): Prisma.CommercialEventUncheckedCreateInput {
      return {
        id:
          event.id,
  
        workspaceId,
  
        journeyId:
          event.journeyId,
  
        type:
          commercialEventTypeToPrisma[
            event.type
          ],
  
        actorType:
          commercialActorTypeToPrisma[
            event.actorType
          ],
  
        actorId:
          event.actorId,
  
        payload:
          event.payload as Prisma.InputJsonValue,
  
        occurredAt:
          new Date(
            event.occurredAt,
          ),
  
        createdAt:
          new Date(
            event.createdAt,
          ),
  
        updatedAt:
          new Date(
            event.updatedAt,
          ),
      }
    }
  }