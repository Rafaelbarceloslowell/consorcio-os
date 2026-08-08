"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  CommercialActorType,
  CommercialEventType,
  MeetingStatus,
  MeetingType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  getWorkspaceSlug,
} from "@/lib/workspace/workspace-slug"

import type {
  AgendaCreateActionState,
  AgendaCreateFieldErrors,
  AgendaCreateValues,
} from "@/types/agenda"

const WORKSPACE_SLUG =
  getWorkspaceSlug()

class AgendaCreateError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?:
      AgendaCreateFieldErrors,
  ) {
    super(message)
    this.name =
      "AgendaCreateError"
  }
}

type ParsedAgendaInput = {
  kind: "task" | "meeting"
  leadId: string
  title: string
  description: string | null
  startAt: Date
  endAt: Date | null
  meetingType: MeetingType
  taskType: TaskType
  priority: TaskPriority
  location: string | null
  meetingUrl: string | null
}

function readValue(
  formData: FormData,
  field: keyof AgendaCreateValues,
): string {
  const value =
    formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function readValues(
  formData: FormData,
): AgendaCreateValues {
  return {
    kind:
      readValue(
        formData,
        "kind",
      ),
    leadId:
      readValue(
        formData,
        "leadId",
      ),
    title:
      readValue(
        formData,
        "title",
      ),
    description:
      readValue(
        formData,
        "description",
      ),
    startAt:
      readValue(
        formData,
        "startAt",
      ),
    endAt:
      readValue(
        formData,
        "endAt",
      ),
    meetingType:
      readValue(
        formData,
        "meetingType",
      ),
    taskType:
      readValue(
        formData,
        "taskType",
      ),
    priority:
      readValue(
        formData,
        "priority",
      ),
    location:
      readValue(
        formData,
        "location",
      ),
    meetingUrl:
      readValue(
        formData,
        "meetingUrl",
      ),
  }
}

function parseMeetingType(
  value: string,
): MeetingType | null {
  const values: Record<
    string,
    MeetingType
  > = {
    phone:
      MeetingType.PHONE,
    online:
      MeetingType.ONLINE,
    in_person:
      MeetingType.IN_PERSON,
  }

  return values[value] ?? null
}

function parseTaskType(
  value: string,
): TaskType | null {
  const values: Record<
    string,
    TaskType
  > = {
    follow_up:
      TaskType.FOLLOW_UP,
    call:
      TaskType.CALL,
    email:
      TaskType.EMAIL,
    document:
      TaskType.DOCUMENT,
    proposal_review:
      TaskType.PROPOSAL_REVIEW,
    other:
      TaskType.OTHER,
  }

  return values[value] ?? null
}

function parsePriority(
  value: string,
): TaskPriority | null {
  const values: Record<
    string,
    TaskPriority
  > = {
    high:
      TaskPriority.HIGH,
    medium:
      TaskPriority.MEDIUM,
    low:
      TaskPriority.LOW,
  }

  return values[value] ?? null
}

function parseDate(
  value: string,
): Date | null {
  if (!value.trim()) {
    return null
  }

  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date
}

function parseInput(
  values: AgendaCreateValues,
): ParsedAgendaInput {
  const fieldErrors:
    AgendaCreateFieldErrors = {}

  const kind =
    values.kind === "task" ||
    values.kind === "meeting"
      ? values.kind
      : null
  const leadId =
    values.leadId.trim()
  const title =
    values.title.trim()
  const description =
    values.description.trim()
  const startAt =
    parseDate(values.startAt)
  const endAt =
    parseDate(values.endAt)
  const meetingType =
    parseMeetingType(
      values.meetingType,
    )
  const taskType =
    parseTaskType(
      values.taskType,
    )
  const priority =
    parsePriority(
      values.priority,
    )
  const location =
    values.location.trim()
  const meetingUrl =
    values.meetingUrl.trim()

  if (!kind) {
    fieldErrors.kind =
      "Selecione o tipo de compromisso."
  }

  if (!leadId) {
    fieldErrors.leadId =
      "Selecione o lead."
  }

  if (!title) {
    fieldErrors.title =
      "Informe o título."
  }

  if (!startAt) {
    fieldErrors.startAt =
      "Informe uma data válida."
  }
  else if (
    startAt.getTime() <=
    Date.now()
  ) {
    fieldErrors.startAt =
      "A data deve estar no futuro."
  }

  if (
    kind === "meeting" &&
    !endAt
  ) {
    fieldErrors.endAt =
      "Informe o término da reunião."
  }

  if (
    kind === "meeting" &&
    startAt &&
    endAt &&
    endAt.getTime() <=
      startAt.getTime()
  ) {
    fieldErrors.endAt =
      "O término deve ser posterior ao início."
  }

  if (!meetingType) {
    fieldErrors.meetingType =
      "Selecione o tipo de reunião."
  }

  if (!taskType) {
    fieldErrors.taskType =
      "Selecione o tipo de tarefa."
  }

  if (!priority) {
    fieldErrors.priority =
      "Selecione a prioridade."
  }

  if (
    meetingUrl &&
    !/^https?:\/\//i.test(
      meetingUrl,
    )
  ) {
    fieldErrors.meetingUrl =
      "Informe um link iniciado por http:// ou https://."
  }

  if (
    description.length > 1000
  ) {
    fieldErrors.description =
      "A descrição deve ter no máximo 1000 caracteres."
  }

  if (
    Object.keys(
      fieldErrors,
    ).length > 0 ||
    !kind ||
    !startAt ||
    !meetingType ||
    !taskType ||
    !priority
  ) {
    throw new AgendaCreateError(
      "Revise os campos destacados.",
      fieldErrors,
    )
  }

  return {
    kind,
    leadId,
    title,
    description:
      description || null,
    startAt,
    endAt:
      kind === "meeting"
        ? endAt
        : null,
    meetingType,
    taskType,
    priority,
    location:
      location || null,
    meetingUrl:
      meetingUrl || null,
  }
}

export async function createAgendaCommitmentAction(
  _previousState:
    AgendaCreateActionState,
  formData: FormData,
): Promise<AgendaCreateActionState> {
  const values =
    readValues(formData)

  let input: ParsedAgendaInput

  try {
    input =
      parseInput(values)
  }
  catch (error) {
    if (
      error instanceof
      AgendaCreateError
    ) {
      return {
        status: "error",
        message:
          error.message,
        values,
        fieldErrors:
          error.fieldErrors,
      }
    }

    throw error
  }

  try {
    const workspace =
      await prisma.workspace.findUnique({
        where: {
          slug:
            WORKSPACE_SLUG,
        },
        select: {
          id: true,
        },
      })

    if (!workspace) {
      throw new AgendaCreateError(
        `Workspace "${WORKSPACE_SLUG}" não encontrado.`,
      )
    }

    await prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        const lead =
          await transaction
            .lead
            .findFirst({
              where: {
                id: input.leadId,
                workspaceId:
                  workspace.id,
                convertedClientId:
                  null,
              },
              select: {
                id: true,
                name: true,
                consultantId: true,
                commercialJourneys: {
                  where: {
                    closedAt: null,
                  },
                  orderBy: {
                    createdAt:
                      "desc",
                  },
                  take: 1,
                  select: {
                    id: true,
                  },
                },
              },
            })

        if (!lead) {
          throw new AgendaCreateError(
            "O lead não está disponível para receber compromissos.",
            {
              leadId:
                "Selecione um lead ativo.",
            },
          )
        }

        const now = new Date()
        const journey =
          lead.commercialJourneys[0]

        if (
          input.kind === "task"
        ) {
          const task =
            await transaction
              .task
              .create({
                data: {
                  workspaceId:
                    workspace.id,
                  title:
                    input.title,
                  description:
                    input.description,
                  type:
                    input.taskType,
                  status:
                    TaskStatus.PENDING,
                  priority:
                    input.priority,
                  dueAt:
                    input.startAt,
                  assignedToId:
                    lead.consultantId,
                  leadId:
                    lead.id,
                  clientId:
                    null,
                },
                select: {
                  id: true,
                },
              })

          if (journey) {
            await transaction
              .commercialEvent
              .create({
                data: {
                  workspaceId:
                    workspace.id,
                  journeyId:
                    journey.id,
                  type:
                    CommercialEventType.TASK_CREATED,
                  actorType:
                    CommercialActorType.CONSULTANT,
                  actorId:
                    lead.consultantId,
                  payload: {
                    category:
                      "agenda_task_created",
                    taskId:
                      task.id,
                    title:
                      input.title,
                    dueAt:
                      input.startAt.toISOString(),
                    clientId:
                      null,
                  },
                  occurredAt:
                    now,
                },
              })
          }

          return
        }

        const meeting =
          await transaction
            .meeting
            .create({
              data: {
                workspaceId:
                  workspace.id,
                title:
                  input.title,
                description:
                  input.description,
                type:
                  input.meetingType,
                status:
                  MeetingStatus.SCHEDULED,
                startAt:
                  input.startAt,
                endAt:
                  input.endAt as Date,
                location:
                  input.location,
                meetingUrl:
                  input.meetingUrl,
                consultantId:
                  lead.consultantId,
                leadId:
                  lead.id,
                clientId:
                  null,
              },
              select: {
                id: true,
              },
            })

        if (journey) {
          await transaction
            .commercialEvent
            .create({
              data: {
                workspaceId:
                  workspace.id,
                journeyId:
                  journey.id,
                type:
                  CommercialEventType.MEETING_SCHEDULED,
                actorType:
                  CommercialActorType.CONSULTANT,
                actorId:
                  lead.consultantId,
                payload: {
                  category:
                    "agenda_meeting_created",
                  meetingId:
                    meeting.id,
                  title:
                    input.title,
                  startAt:
                    input.startAt.toISOString(),
                  endAt:
                    input.endAt?.toISOString() ??
                    null,
                  clientId:
                    null,
                },
                occurredAt:
                  now,
              },
            })
        }
      },
    )
  }
  catch (error) {
    if (
      error instanceof
      AgendaCreateError
    ) {
      return {
        status: "error",
        message:
          error.message,
        values,
        fieldErrors:
          error.fieldErrors,
      }
    }

    throw error
  }

  revalidatePath("/agenda")
  revalidatePath("/")
  redirect("/agenda")
}
