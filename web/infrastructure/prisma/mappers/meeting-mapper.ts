import {
    MeetingOutcome as PrismaMeetingOutcome,
    MeetingStatus as PrismaMeetingStatus,
    MeetingType as PrismaMeetingType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Meeting as PrismaMeeting,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Meeting,
    MeetingOutcome,
    MeetingStatus,
    MeetingType,
  } from "@/types/domain"
  
  const meetingTypeToPrisma: Record<
    MeetingType,
    PrismaMeetingType
  > = {
    in_person:
      PrismaMeetingType.IN_PERSON,
    online:
      PrismaMeetingType.ONLINE,
    phone:
      PrismaMeetingType.PHONE,
  }
  
  const meetingTypeToDomain: Record<
    PrismaMeetingType,
    MeetingType
  > = {
    [PrismaMeetingType.IN_PERSON]:
      "in_person",
    [PrismaMeetingType.ONLINE]:
      "online",
    [PrismaMeetingType.PHONE]:
      "phone",
  }
  
  const meetingStatusToPrisma: Record<
    MeetingStatus,
    PrismaMeetingStatus
  > = {
    scheduled:
      PrismaMeetingStatus.SCHEDULED,
    completed:
      PrismaMeetingStatus.COMPLETED,
    cancelled:
      PrismaMeetingStatus.CANCELLED,
    no_show:
      PrismaMeetingStatus.NO_SHOW,
  }
  
  const meetingStatusToDomain: Record<
    PrismaMeetingStatus,
    MeetingStatus
  > = {
    [PrismaMeetingStatus.SCHEDULED]:
      "scheduled",
    [PrismaMeetingStatus.COMPLETED]:
      "completed",
    [PrismaMeetingStatus.CANCELLED]:
      "cancelled",
    [PrismaMeetingStatus.NO_SHOW]:
      "no_show",
  }
  
  const meetingOutcomeToPrisma: Record<
    MeetingOutcome,
    PrismaMeetingOutcome
  > = {
    proposal_sent:
      PrismaMeetingOutcome.PROPOSAL_SENT,
    follow_up_scheduled:
      PrismaMeetingOutcome.FOLLOW_UP_SCHEDULED,
    not_interested:
      PrismaMeetingOutcome.NOT_INTERESTED,
    converted:
      PrismaMeetingOutcome.CONVERTED,
    no_answer:
      PrismaMeetingOutcome.NO_ANSWER,
    other:
      PrismaMeetingOutcome.OTHER,
  }
  
  const meetingOutcomeToDomain: Record<
    PrismaMeetingOutcome,
    MeetingOutcome
  > = {
    [PrismaMeetingOutcome.PROPOSAL_SENT]:
      "proposal_sent",
    [PrismaMeetingOutcome.FOLLOW_UP_SCHEDULED]:
      "follow_up_scheduled",
    [PrismaMeetingOutcome.NOT_INTERESTED]:
      "not_interested",
    [PrismaMeetingOutcome.CONVERTED]:
      "converted",
    [PrismaMeetingOutcome.NO_ANSWER]:
      "no_answer",
    [PrismaMeetingOutcome.OTHER]:
      "other",
  }
  
  export type MeetingPersistenceInput = {
    workspaceId: string
    meeting: Meeting
  }
  
  export class MeetingMapper {
    static toDomain(
      raw: PrismaMeeting,
    ): Meeting {
      return {
        id: raw.id,
        title: raw.title,
        description:
          raw.description ?? undefined,
        type:
          meetingTypeToDomain[
            raw.type
          ],
        status:
          meetingStatusToDomain[
            raw.status
          ],
        startAt:
          raw.startAt.toISOString(),
        endAt:
          raw.endAt.toISOString(),
        location:
          raw.location ?? undefined,
        meetingUrl:
          raw.meetingUrl ?? undefined,
        consultantId:
          raw.consultantId,
        leadId:
          raw.leadId ?? undefined,
        clientId:
          raw.clientId ?? undefined,
        proposalId:
          raw.proposalId ?? undefined,
        outcome:
          raw.outcome
            ? meetingOutcomeToDomain[
                raw.outcome
              ]
            : undefined,
        notes:
          raw.notes ?? undefined,
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      meeting,
    }: MeetingPersistenceInput): Prisma.MeetingUncheckedCreateInput {
      return {
        id: meeting.id,
        workspaceId,
        title: meeting.title,
        description:
          meeting.description ?? null,
        type:
          meetingTypeToPrisma[
            meeting.type
          ],
        status:
          meetingStatusToPrisma[
            meeting.status
          ],
        startAt:
          new Date(meeting.startAt),
        endAt:
          new Date(meeting.endAt),
        location:
          meeting.location ?? null,
        meetingUrl:
          meeting.meetingUrl ?? null,
        consultantId:
          meeting.consultantId,
        leadId:
          meeting.leadId ?? null,
        clientId:
          meeting.clientId ?? null,
        proposalId:
          meeting.proposalId ?? null,
        outcome:
          meeting.outcome
            ? meetingOutcomeToPrisma[
                meeting.outcome
              ]
            : null,
        notes:
          meeting.notes ?? null,
        createdAt:
          new Date(meeting.createdAt),
        updatedAt:
          new Date(meeting.updatedAt),
      }
    }
  }