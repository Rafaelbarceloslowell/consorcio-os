import {
  CommercialActionOrigin,
  CommercialActionStatus,
  CommercialActorType,
  CommercialEventType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getApiCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

const NO_ANSWER_CALL_DELAY_MINUTES = 5

const contactOutcomes = [
  "INTERESTED",
  "FOLLOW_UP",
  "NO_ANSWER",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
  "OTHER",
] as const

type ContactOutcome =
  typeof contactOutcomes[number]

type CompleteActionRequest = Readonly<{
  workspaceId: string
  consultantId: string
  contactMade: boolean
  outcome: ContactOutcome
  notes: string | null
  nextFollowUpAt: Date | null
}>

type RouteContext = Readonly<{
  params: Promise<{
    actionId: string
  }>
}>

class ActionConflictError extends Error {}

function json(
  body: unknown,
  status = 200,
): Response {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}

function isContactOutcome(
  value: string,
): value is ContactOutcome {
  return (
    contactOutcomes as readonly string[]
  ).includes(value)
}

function requiresFollowUp(
  outcome: ContactOutcome,
): boolean {
  return outcome === "FOLLOW_UP"
}

function parseOptionalDate(
  value: unknown,
): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  if (typeof value !== "string") {
    throw new Error(
      "nextFollowUpAt must be a valid date.",
    )
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "nextFollowUpAt must be a valid date.",
    )
  }

  return date
}

function parseCompleteActionRequest(
  value: unknown,
): CompleteActionRequest {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "O corpo da conclusão é obrigatório.",
    )
  }

  const body =
    value as Record<string, unknown>

  const workspaceId =
    typeof body.workspaceId === "string"
      ? body.workspaceId.trim()
      : ""

  const consultantId =
    typeof body.consultantId === "string"
      ? body.consultantId.trim()
      : ""

  if (!workspaceId) {
    throw new Error(
      "workspaceId is required.",
    )
  }

  if (!consultantId) {
    throw new Error(
      "consultantId is required.",
    )
  }

  if (
    typeof body.contactMade !==
    "boolean"
  ) {
    throw new Error(
      "Informe se o contato foi realizado.",
    )
  }

  const outcome =
    typeof body.outcome === "string"
      ? body.outcome.trim()
      : ""

  if (
    !isContactOutcome(
      outcome,
    )
  ) {
    throw new Error(
      "Informe um resultado válido para o contato.",
    )
  }

  if (
    body.contactMade &&
    (
      outcome === "NO_ANSWER" ||
      outcome === "WRONG_NUMBER"
    )
  ) {
    throw new Error(
      "O resultado informado não corresponde a um contato realizado.",
    )
  }

  if (
    !body.contactMade &&
    (
      outcome === "INTERESTED" ||
      outcome === "FOLLOW_UP" ||
      outcome === "NOT_INTERESTED"
    )
  ) {
    throw new Error(
      "O resultado informado exige contato com o cliente.",
    )
  }

  const notes =
    typeof body.notes === "string"
      ? body.notes.trim()
      : ""

  if (notes.length > 1000) {
    throw new Error(
      "A observação deve ter no máximo 1000 caracteres.",
    )
  }

  const nextFollowUpAt =
    parseOptionalDate(
      body.nextFollowUpAt,
    )

  if (
    requiresFollowUp(
      outcome,
    ) &&
    !nextFollowUpAt
  ) {
    throw new Error(
      "Informe a data do próximo retorno.",
    )
  }

  if (
    nextFollowUpAt &&
    nextFollowUpAt.getTime() <=
      Date.now()
  ) {
    throw new Error(
      "A data do próximo retorno deve estar no futuro.",
    )
  }

  return {
    workspaceId,
    consultantId,
    contactMade:
      body.contactMade,
    outcome,
    notes:
      notes || null,
    nextFollowUpAt,
  }
}

function buildFollowUpTaskTitle(
  actionTitle: string,
): string {
  const normalizedTitle =
    actionTitle
      .trim()
      .replace(
        /^Retornar contato:\s*/i,
        "",
      )

  const contactMatch =
    normalizedTitle.match(
      /^(?:Fazer novo contato|Retomar contato|Retornar contato|Entrar em contato|Contatar)(?:\s+com)?\s+(.+)$/i,
    )

  if (contactMatch?.[1]?.trim()) {
    return `Retornar contato com ${contactMatch[1].trim()}`
  }

  return `Retorno: ${normalizedTitle}`
}

function buildNoAnswerCallTaskTitle(
  actionTitle: string,
): string {
  const followUpTitle =
    buildFollowUpTaskTitle(
      actionTitle,
    )

  if (
    followUpTitle.startsWith(
      "Retornar contato com ",
    )
  ) {
    return followUpTitle.replace(
      "Retornar contato com ",
      "Ligar para ",
    )
  }

  return `Ligar agora: ${actionTitle.trim()}`
}

function asJsonObject(
  value: Prisma.JsonValue,
): Prisma.JsonObject {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value
  }

  return {}
}

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const authenticatedContext =
    await getApiCommercialContext()

  if (authenticatedContext instanceof Response) {
    return authenticatedContext
  }

  const {
    actionId: rawActionId,
  } = await context.params

  const actionId =
    rawActionId.trim()

  if (!actionId) {
    return json(
      {
        error:
          "actionId is required.",
      },
      400,
    )
  }

  let input: CompleteActionRequest

  try {
    input =
      parseCompleteActionRequest(
        await request.json(),
      )
  }
  catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid R2 contact outcome request.",
      },
      400,
    )
  }

  if (
    input.workspaceId !== authenticatedContext.workspaceId ||
    input.consultantId !== authenticatedContext.consultantId
  ) {
    return json(
      {
        error:
          "O contexto informado não corresponde ao usuário autenticado.",
      },
      403,
    )
  }

  const action =
    await prisma.commercialAction.findFirst({
      where: {
        id: actionId,
        workspaceId:
          authenticatedContext.workspaceId,
      },
      select: {
        id: true,
        workspaceId: true,
        journeyId: true,
        status: true,
        origin: true,
        actorId: true,
        title: true,
        payload: true,
        startedAt: true,
        journey: {
          select: {
            consultantId: true,
            leadId: true,
            clientId: true,
            closedAt: true,
          },
        },
      },
    })

  if (!action) {
    return json(
      {
        error:
          "A ação não foi encontrada neste workspace.",
      },
      404,
    )
  }

  if (
    action.actorId !==
      input.consultantId ||
    action.journey.consultantId !==
      input.consultantId
  ) {
    return json(
      {
        error:
          "A ação pertence a outro consultor.",
      },
      403,
    )
  }

  if (
    action.origin !==
    CommercialActionOrigin.NEXT_BEST_ACTION
  ) {
    return json(
      {
        error:
          "A ação não pertence ao fluxo autorizado do R2.",
      },
      409,
    )
  }

  if (
    action.journey.closedAt !==
    null
  ) {
    return json(
      {
        error:
          "A oportunidade já foi encerrada.",
      },
      409,
    )
  }

  if (
    action.status !==
      CommercialActionStatus.PENDING &&
    action.status !==
      CommercialActionStatus.IN_PROGRESS
  ) {
    return json(
      {
        error:
          "A ação já foi concluída ou encerrada.",
      },
      409,
    )
  }

  const now = new Date()

  const automaticNoAnswerCall =
    input.outcome === "NO_ANSWER" &&
    input.nextFollowUpAt === null

  const followUpDueAt =
    input.nextFollowUpAt ??
    (
      automaticNoAnswerCall
        ? new Date(
            now.getTime() +
              NO_ANSWER_CALL_DELAY_MINUTES *
                60 *
                1000,
          )
        : null
    )

  const existingPayload =
    asJsonObject(
      action.payload,
    )

  try {
    const transactionResult =
      await prisma.$transaction(
        async (transaction) => {
          const updateResult =
            await transaction
              .commercialAction
              .updateMany({
                where: {
                  id: action.id,
                  workspaceId:
                    authenticatedContext.workspaceId,
                  status: {
                    in: [
                      CommercialActionStatus.PENDING,
                      CommercialActionStatus.IN_PROGRESS,
                    ],
                  },
                },
                data: {
                  status:
                    CommercialActionStatus.COMPLETED,
                  payload: {
                    ...existingPayload,
                    contactOutcome: {
                      contactMade:
                        input.contactMade,
                      outcome:
                        input.outcome,
                      notes:
                        input.notes,
                      nextFollowUpAt:
                        input.nextFollowUpAt?.toISOString() ??
                        null,
                      automaticCallAt:
                        automaticNoAnswerCall
                          ? followUpDueAt?.toISOString() ??
                            null
                          : null,
                      recordedAt:
                        now.toISOString(),
                    },
                  },
                  startedAt:
                    action.startedAt ??
                    now,
                  completedAt:
                    now,
                },
              })

          if (
            updateResult.count !== 1
          ) {
            throw new ActionConflictError(
              "A ação foi concluída durante esta operação.",
            )
          }

          const journeyUpdate =
            await transaction
              .commercialJourney
              .updateMany({
                where: {
                  id:
                    action.journeyId,
                  workspaceId:
                    authenticatedContext.workspaceId,
                  consultantId:
                    input.consultantId,
                  closedAt: null,
                },
                data: {
                  lastInteractionAt:
                    now,
                  version: {
                    increment: 1,
                  },
                },
              })

          if (
            journeyUpdate.count !== 1
          ) {
            throw new ActionConflictError(
              "A oportunidade foi alterada durante esta operação.",
            )
          }

          let followUpTaskId:
            | string
            | null = null

          if (followUpDueAt) {
            const followUpTask =
              await transaction
                .task
                .create({
                  data: {
                    workspaceId:
                      authenticatedContext.workspaceId,
                    title:
                      automaticNoAnswerCall
                        ? buildNoAnswerCallTaskTitle(
                            action.title,
                          )
                        : buildFollowUpTaskTitle(
                            action.title,
                          ),
                    description:
                      automaticNoAnswerCall
                        ? "O cliente não respondeu ao WhatsApp. Faça uma ligação agora."
                        : input.notes ??
                          "Retorno criado automaticamente pelo R2 após o registro do contato.",
                    type:
                      TaskType.FOLLOW_UP,
                    status:
                      TaskStatus.PENDING,
                    priority:
                      automaticNoAnswerCall
                        ? TaskPriority.HIGH
                        : TaskPriority.MEDIUM,
                    dueAt:
                      followUpDueAt,
                    assignedToId:
                      input.consultantId,
                    leadId:
                      action.journey.leadId,
                    clientId:
                      action.journey.clientId,
                  },
                  select: {
                    id: true,
                  },
                })

            followUpTaskId =
              followUpTask.id

            await transaction
              .commercialEvent
              .create({
                data: {
                  workspaceId:
                    authenticatedContext.workspaceId,
                  journeyId:
                    action.journeyId,
                  type:
                    CommercialEventType.TASK_CREATED,
                  actorType:
                    CommercialActorType.CONSULTANT,
                  actorId:
                    input.consultantId,
                  payload: {
                    category:
                      automaticNoAnswerCall
                        ? "r2_no_answer_call_task_created"
                        : "r2_follow_up_task_created",
                    commercialActionId:
                      action.id,
                    taskId:
                      followUpTask.id,
                    dueAt:
                      followUpDueAt.toISOString(),
                    automaticNoAnswerCall,
                    delayMinutes:
                      automaticNoAnswerCall
                        ? NO_ANSWER_CALL_DELAY_MINUTES
                        : null,
                  },
                  occurredAt:
                    now,
                },
              })
          }

          await transaction
            .commercialEvent
            .create({
              data: {
                workspaceId:
                  authenticatedContext.workspaceId,
                journeyId:
                  action.journeyId,
                type:
                  CommercialEventType.NOTE_ADDED,
                actorType:
                  CommercialActorType.CONSULTANT,
                actorId:
                  input.consultantId,
                payload: {
                  category:
                    "r2_contact_outcome_recorded",
                  commercialActionId:
                    action.id,
                  actionTitle:
                    action.title,
                  contactMade:
                    input.contactMade,
                  outcome:
                    input.outcome,
                  notes:
                    input.notes,
                  nextFollowUpAt:
                    input.nextFollowUpAt?.toISOString() ??
                    null,
                  followUpTaskId,
                  completedAt:
                    now.toISOString(),
                },
                occurredAt:
                  now,
              },
            })

          return {
            followUpTaskId,
          }
        },
      )

    return json({
      actionId:
        action.id,
      journeyId:
        action.journeyId,
      status:
        CommercialActionStatus.COMPLETED,
      completedAt:
        now.toISOString(),
      contactMade:
        input.contactMade,
      outcome:
        input.outcome,
      followUpTaskId:
        transactionResult.followUpTaskId,
      message:
        automaticNoAnswerCall
          ? "Resultado registrado. Se não houver resposta, a ligação entrará na fila em 5 minutos."
          : transactionResult.followUpTaskId
            ? "Resultado registrado, ação concluída e próximo retorno agendado."
            : "Resultado registrado e ação concluída. O R2 vai buscar a próxima prioridade.",
    })
  }
  catch (error) {
    if (
      error instanceof
      ActionConflictError
    ) {
      return json(
        {
          error:
            error.message,
        },
        409,
      )
    }

    return json(
      {
        error:
          "Não foi possível registrar o resultado da ação do R2.",
      },
      500,
    )
  }
}

