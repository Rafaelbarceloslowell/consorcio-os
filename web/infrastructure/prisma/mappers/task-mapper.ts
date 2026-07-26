import {
    TaskPriority as PrismaTaskPriority,
    TaskStatus as PrismaTaskStatus,
    TaskType as PrismaTaskType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Prisma,
    Task as PrismaTask,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Task,
    TaskPriority,
    TaskStatus,
    TaskType,
  } from "@/types/domain"
  
  const taskPriorityToPrisma: Record<
    TaskPriority,
    PrismaTaskPriority
  > = {
    high: PrismaTaskPriority.HIGH,
    medium: PrismaTaskPriority.MEDIUM,
    low: PrismaTaskPriority.LOW,
  }
  
  const taskPriorityToDomain: Record<
    PrismaTaskPriority,
    TaskPriority
  > = {
    [PrismaTaskPriority.HIGH]: "high",
    [PrismaTaskPriority.MEDIUM]: "medium",
    [PrismaTaskPriority.LOW]: "low",
  }
  
  const taskStatusToPrisma: Record<
    TaskStatus,
    PrismaTaskStatus
  > = {
    pending: PrismaTaskStatus.PENDING,
    in_progress: PrismaTaskStatus.IN_PROGRESS,
    completed: PrismaTaskStatus.COMPLETED,
    cancelled: PrismaTaskStatus.CANCELLED,
  }
  
  const taskStatusToDomain: Record<
    PrismaTaskStatus,
    TaskStatus
  > = {
    [PrismaTaskStatus.PENDING]: "pending",
    [PrismaTaskStatus.IN_PROGRESS]: "in_progress",
    [PrismaTaskStatus.COMPLETED]: "completed",
    [PrismaTaskStatus.CANCELLED]: "cancelled",
  }
  
  const taskTypeToPrisma: Record<
    TaskType,
    PrismaTaskType
  > = {
    call: PrismaTaskType.CALL,
    email: PrismaTaskType.EMAIL,
    follow_up: PrismaTaskType.FOLLOW_UP,
    document: PrismaTaskType.DOCUMENT,
    meeting_prep: PrismaTaskType.MEETING_PREP,
    proposal_review: PrismaTaskType.PROPOSAL_REVIEW,
    other: PrismaTaskType.OTHER,
  }
  
  const taskTypeToDomain: Record<
    PrismaTaskType,
    TaskType
  > = {
    [PrismaTaskType.CALL]: "call",
    [PrismaTaskType.EMAIL]: "email",
    [PrismaTaskType.FOLLOW_UP]: "follow_up",
    [PrismaTaskType.DOCUMENT]: "document",
    [PrismaTaskType.MEETING_PREP]: "meeting_prep",
    [PrismaTaskType.PROPOSAL_REVIEW]: "proposal_review",
    [PrismaTaskType.OTHER]: "other",
  }
  
  export type TaskPersistenceInput = {
    workspaceId: string
    task: Task
  }
  
  export class TaskMapper {
    static toDomain(
      raw: PrismaTask,
    ): Task {
      return {
        id: raw.id,
        title: raw.title,
        description:
          raw.description ?? undefined,
        type:
          taskTypeToDomain[
            raw.type
          ],
        status:
          taskStatusToDomain[
            raw.status
          ],
        priority:
          taskPriorityToDomain[
            raw.priority
          ],
        dueAt:
          raw.dueAt.toISOString(),
        assignedToId:
          raw.assignedToId,
        leadId:
          raw.leadId ?? undefined,
        clientId:
          raw.clientId ?? undefined,
        meetingId:
          raw.meetingId ?? undefined,
        proposalId:
          raw.proposalId ?? undefined,
        completedAt:
          raw.completedAt?.toISOString(),
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      task,
    }: TaskPersistenceInput): Prisma.TaskUncheckedCreateInput {
      return {
        id: task.id,
        workspaceId,
        title: task.title,
        description:
          task.description ?? null,
        type:
          taskTypeToPrisma[
            task.type
          ],
        status:
          taskStatusToPrisma[
            task.status
          ],
        priority:
          taskPriorityToPrisma[
            task.priority
          ],
        dueAt:
          new Date(task.dueAt),
        assignedToId:
          task.assignedToId,
        leadId:
          task.leadId ?? null,
        clientId:
          task.clientId ?? null,
        meetingId:
          task.meetingId ?? null,
        proposalId:
          task.proposalId ?? null,
        completedAt:
          task.completedAt
            ? new Date(task.completedAt)
            : null,
        createdAt:
          new Date(task.createdAt),
        updatedAt:
          new Date(task.updatedAt),
      }
    }
  }