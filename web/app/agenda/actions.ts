"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  CommercialActorType,
  CommercialEventType,
  MeetingOutcome,
  MeetingStatus,
  Prisma,
  TaskStatus,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  getWorkspaceSlug,
} from "@/lib/workspace/workspace-slug"

import {
  registerMeetingNoShowExecution,
  scheduleMeetingExecution,
} from "@/application/execution/r2-execution-service"

import {
  MEETING_NO_SHOW_GRACE_MINUTES,
} from "@/application/execution/commercial-execution-policy"

const WORKSPACE_SLUG =
  getWorkspaceSlug()

type Transaction =
  Prisma.TransactionClient

function requiredValue(
  formData: FormData,
  field: string,
): string {
  const value =
    formData.get(field)

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${field} é obrigatório.`,
    )
  }

  return value.trim()
}

function optionalValue(
  formData: FormData,
  field: string,
): string | null {
  const value =
    formData.get(field)

  if (typeof value !== "string") {
    return null
  }

  return value.trim() || null
}

function parseDate(
  value: string,
  fieldLabel: string,
): Date {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${fieldLabel} é inválida.`,
    )
  }

  return date
}

function parseMeetingOutcome(
  value: string,
): MeetingOutcome {
  const outcomes: Record<
    string,
    MeetingOutcome
  > = {
    proposal_sent:
      MeetingOutcome.PROPOSAL_SENT,
    follow_up_scheduled:
      MeetingOutcome.FOLLOW_UP_SCHEDULED,
    not_interested:
      MeetingOutcome.NOT_INTERESTED,
    no_answer:
      MeetingOutcome.NO_ANSWER,
    other:
      MeetingOutcome.OTHER,
  }

  const outcome =
    outcomes[value]

  if (!outcome) {
    throw new Error(
      "Resultado da reunião inválido.",
    )
  }

  return outcome
}

async function resolveWorkspaceId(): Promise<string> {
  const workspace =
    await prisma.workspace.findUnique({
      where: {
        slug: WORKSPACE_SLUG,
      },
      select: {
        id: true,
      },
    })

  if (!workspace) {
    throw new Error(
      `Workspace "${WORKSPACE_SLUG}" não encontrado.`,
    )
  }

  return workspace.id
}

async function findJourney({
  transaction,
  workspaceId,
  leadId,
  clientId,
}: {
  transaction: Transaction
  workspaceId: string
  leadId: string | null
  clientId: string | null
}) {
  if (!leadId && !clientId) {
    return null
  }

  return transaction
    .commercialJourney
    .findFirst({
      where: {
        workspaceId,
        closedAt: null,
        OR: [
          ...(leadId
            ? [
                {
                  leadId,
                },
              ]
            : []),
          ...(clientId
            ? [
                {
                  clientId,
                },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    })
}

async function registerEvent({
  transaction,
  workspaceId,
  journeyId,
  type,
  actorId,
  payload,
  occurredAt,
}: {
  transaction: Transaction
  workspaceId: string
  journeyId: string | null
  type: CommercialEventType
  actorId: string
  payload: Prisma.InputJsonObject
  occurredAt: Date
}): Promise<void> {
  if (!journeyId) {
    return
  }

  await transaction
    .commercialEvent
    .create({
      data: {
        workspaceId,
        journeyId,
        type,
        actorType:
          CommercialActorType.CONSULTANT,
        actorId,
        payload,
        occurredAt,
      },
    })
}

export async function completeAgendaTaskAction(
  formData: FormData,
): Promise<void> {
  const taskId =
    requiredValue(
      formData,
      "taskId",
    )
  const workspaceId =
    await resolveWorkspaceId()
  const now = new Date()

  await prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const task =
        await transaction.task.findFirst({
          where: {
            id: taskId,
            workspaceId,
            status: {
              in: [
                TaskStatus.PENDING,
                TaskStatus.IN_PROGRESS,
              ],
            },
          },
          select: {
            id: true,
            title: true,
            assignedToId: true,
            leadId: true,
            clientId: true,
          },
        })

      if (!task) {
        throw new Error(
          "A tarefa não está disponível para conclusão.",
        )
      }

      await transaction.task.update({
        where: {
          id: task.id,
        },
        data: {
          status:
            TaskStatus.COMPLETED,
          completedAt: now,
        },
      })

      const journey =
        await findJourney({
          transaction,
          workspaceId,
          leadId: task.leadId,
          clientId:
            task.clientId,
        })

      await registerEvent({
        transaction,
        workspaceId,
        journeyId:
          journey?.id ?? null,
        type:
          CommercialEventType.TASK_COMPLETED,
        actorId:
          task.assignedToId,
        payload: {
          category:
            "agenda_task_completed",
          taskId: task.id,
          title: task.title,
          completedAt:
            now.toISOString(),
        },
        occurredAt: now,
      })
    },
  )

  revalidatePath("/agenda")
  revalidatePath("/")
}

export async function rescheduleAgendaTaskAction(
  formData: FormData,
): Promise<void> {
  const taskId =
    requiredValue(
      formData,
      "taskId",
    )
  const dueAt =
    parseDate(
      requiredValue(
        formData,
        "dueAt",
      ),
      "A nova data",
    )

  if (
    dueAt.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "A nova data da tarefa deve estar no futuro.",
    )
  }

  const workspaceId =
    await resolveWorkspaceId()

  const updated =
    await prisma.task.updateMany({
      where: {
        id: taskId,
        workspaceId,
        status: {
          in: [
            TaskStatus.PENDING,
            TaskStatus.IN_PROGRESS,
          ],
        },
      },
      data: {
        dueAt,
      },
    })

  if (updated.count !== 1) {
    throw new Error(
      "A tarefa não está disponível para remarcação.",
    )
  }

  revalidatePath("/agenda")
  revalidatePath("/")
}

export async function completeAgendaMeetingAction(
  formData: FormData,
): Promise<void> {
  const meetingId =
    requiredValue(
      formData,
      "meetingId",
    )
  const outcome =
    parseMeetingOutcome(
      requiredValue(
        formData,
        "outcome",
      ),
    )
  const notes =
    optionalValue(
      formData,
      "notes",
    )

  if (
    notes &&
    notes.length > 1000
  ) {
    throw new Error(
      "A observação deve ter no máximo 1000 caracteres.",
    )
  }

  const workspaceId =
    await resolveWorkspaceId()
  const now = new Date()
  let noShowExecution: {
    workspaceId: string
    opportunityId: string
    consultantId: string
    meetingId: string
  } | null = null

  await prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const meeting =
        await transaction
          .meeting
          .findFirst({
            where: {
              id: meetingId,
              workspaceId,
              status:
                MeetingStatus.SCHEDULED,
            },
            select: {
              id: true,
              title: true,
              consultantId: true,
              leadId: true,
              clientId: true,
              opportunityId: true,
              endAt: true,
            },
          })

      if (!meeting) {
        throw new Error(
          "A reunião não está disponível para conclusão.",
        )
      }

      const isNoShow =
        outcome === MeetingOutcome.NO_ANSWER

      if (
        isNoShow &&
        now.getTime() <
          meeting.endAt.getTime() +
            MEETING_NO_SHOW_GRACE_MINUTES * 60_000
      ) {
        throw new Error(
          `Aguarde ${MEETING_NO_SHOW_GRACE_MINUTES} minutos após o horário da reunião antes de registrar não comparecimento.`,
        )
      }

      await transaction
        .meeting
        .update({
          where: {
            id: meeting.id,
          },
          data: {
            status:
              isNoShow
                ? MeetingStatus.NO_SHOW
                : MeetingStatus.COMPLETED,
            outcome,
            notes,
          },
        })

      const journey =
        await findJourney({
          transaction,
          workspaceId,
          leadId:
            meeting.leadId,
          clientId:
            meeting.clientId,
        })

      await registerEvent({
        transaction,
        workspaceId,
        journeyId:
          journey?.id ?? null,
        type:
          CommercialEventType.MEETING_COMPLETED,
        actorId:
          meeting.consultantId,
        payload: {
          category:
            isNoShow
              ? "agenda_meeting_no_show"
              : "agenda_meeting_completed",
          meetingId:
            meeting.id,
          title:
            meeting.title,
          outcome,
          notes,
          completedAt:
            now.toISOString(),
        },
        occurredAt: now,
      })

      if (
        isNoShow &&
        meeting.opportunityId
      ) {
        noShowExecution = {
          workspaceId,
          opportunityId:
            meeting.opportunityId,
          consultantId:
            meeting.consultantId,
          meetingId:
            meeting.id,
        }
      }
    },
  )

  if (noShowExecution) {
    await registerMeetingNoShowExecution(
      noShowExecution,
    )
  }

  revalidatePath("/agenda")
  revalidatePath("/")
}

export async function rescheduleAgendaMeetingAction(
  formData: FormData,
): Promise<void> {
  const meetingId =
    requiredValue(
      formData,
      "meetingId",
    )
  const startAt =
    parseDate(
      requiredValue(
        formData,
        "startAt",
      ),
      "A data de início",
    )
  const endAt =
    parseDate(
      requiredValue(
        formData,
        "endAt",
      ),
      "A data de término",
    )

  if (
    startAt.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "O novo início da reunião deve estar no futuro.",
    )
  }

  if (
    endAt.getTime() <=
    startAt.getTime()
  ) {
    throw new Error(
      "O término deve ser posterior ao início.",
    )
  }

  const workspaceId =
    await resolveWorkspaceId()

  const meeting =
    await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        workspaceId,
        status:
          MeetingStatus.SCHEDULED,
      },
      select: {
        id: true,
        opportunityId: true,
        consultantId: true,
      },
    })

  if (!meeting) {
    throw new Error(
      "A reunião não está disponível para remarcação.",
    )
  }

  await prisma.meeting.update({
    where: {
      id: meeting.id,
    },
    data: {
      startAt,
      endAt,
    },
  })

  if (meeting.opportunityId) {
    await scheduleMeetingExecution({
      workspaceId,
      opportunityId:
        meeting.opportunityId,
      consultantId:
        meeting.consultantId,
      meetingId:
        meeting.id,
      startAt,
    })
  }

  revalidatePath("/agenda")
  revalidatePath("/")
}
