import {
  CommercialConversationGoal,
  CommercialConversationStage,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  manualMessagingProvider,
} from "@/application/messaging/manual-messaging-provider"

import {
  getApiCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

const stages = [
  "opening",
  "rapport",
  "discovery",
  "qualification",
  "diagnosis",
  "strategy",
  "meeting",
  "follow_up",
  "closing",
] as const

const goals = [
  "get_first_response",
  "understand_interest_area",
  "understand_project_purpose",
  "understand_timing",
  "understand_budget",
  "understand_objection",
  "present_strategy",
  "schedule_meeting",
  "confirm_follow_up",
  "close_next_step",
] as const

type ConversationStage =
  typeof stages[number]

type ConversationGoal =
  typeof goals[number]

type SaveConversationMemoryRequest = {
  stage: ConversationStage
  goal: ConversationGoal
  intent: string | null
  incomingMessage: string | null
  suggestedReply: string | null
}

type RouteContext = {
  params: Promise<{
    opportunityId: string
  }>
}

const stageToPrisma: Record<
  ConversationStage,
  CommercialConversationStage
> = {
  opening:
    CommercialConversationStage.OPENING,
  rapport:
    CommercialConversationStage.RAPPORT,
  discovery:
    CommercialConversationStage.DISCOVERY,
  qualification:
    CommercialConversationStage.QUALIFICATION,
  diagnosis:
    CommercialConversationStage.DIAGNOSIS,
  strategy:
    CommercialConversationStage.STRATEGY,
  meeting:
    CommercialConversationStage.MEETING,
  follow_up:
    CommercialConversationStage.FOLLOW_UP,
  closing:
    CommercialConversationStage.CLOSING,
}

const goalToPrisma: Record<
  ConversationGoal,
  CommercialConversationGoal
> = {
  get_first_response:
    CommercialConversationGoal.GET_FIRST_RESPONSE,
  understand_interest_area:
    CommercialConversationGoal.UNDERSTAND_INTEREST_AREA,
  understand_project_purpose:
    CommercialConversationGoal.UNDERSTAND_PROJECT_PURPOSE,
  understand_timing:
    CommercialConversationGoal.UNDERSTAND_TIMING,
  understand_budget:
    CommercialConversationGoal.UNDERSTAND_BUDGET,
  understand_objection:
    CommercialConversationGoal.UNDERSTAND_OBJECTION,
  present_strategy:
    CommercialConversationGoal.PRESENT_STRATEGY,
  schedule_meeting:
    CommercialConversationGoal.SCHEDULE_MEETING,
  confirm_follow_up:
    CommercialConversationGoal.CONFIRM_FOLLOW_UP,
  close_next_step:
    CommercialConversationGoal.CLOSE_NEXT_STEP,
}

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

function isStage(
  value: string,
): value is ConversationStage {
  return (
    stages as readonly string[]
  ).includes(value)
}

function isGoal(
  value: string,
): value is ConversationGoal {
  return (
    goals as readonly string[]
  ).includes(value)
}

function optionalText(
  value: unknown,
  maxLength: number,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (typeof value !== "string") {
    throw new Error(
      "Os campos de texto devem ser válidos.",
    )
  }

  const normalized =
    value.trim()

  if (!normalized) {
    return null
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new Error(
      `O texto excede o limite de ${maxLength} caracteres.`,
    )
  }

  return normalized
}

function parseRequest(
  value: unknown,
): SaveConversationMemoryRequest {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "O corpo da requisição é obrigatório.",
    )
  }

  const body =
    value as Record<string, unknown>

  const stage =
    typeof body.stage === "string"
      ? body.stage.trim()
      : ""

  const goal =
    typeof body.goal === "string"
      ? body.goal.trim()
      : ""

  if (!isStage(stage)) {
    throw new Error(
      "Estágio comercial inválido.",
    )
  }

  if (!isGoal(goal)) {
    throw new Error(
      "Objetivo comercial inválido.",
    )
  }

  return {
    stage,
    goal,
    intent:
      optionalText(
        body.intent,
        100,
      ),
    incomingMessage:
      optionalText(
        body.incomingMessage,
        5000,
      ),
    suggestedReply:
      optionalText(
        body.suggestedReply,
        5000,
      ),
  }
}

export const dynamic =
  "force-dynamic"

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
    opportunityId:
      rawOpportunityId,
  } = await context.params

  const opportunityId =
    rawOpportunityId.trim()

  if (!opportunityId) {
    return json(
      {
        error:
          "opportunityId is required.",
      },
      400,
    )
  }

  let input:
    SaveConversationMemoryRequest

  try {
    input =
      parseRequest(
        await request.json(),
      )
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Requisição inválida.",
      },
      400,
    )
  }

  const journey =
    await prisma.commercialJourney.findFirst({
      where: {
        id:
          opportunityId,
        workspaceId:
          authenticatedContext.workspaceId,
        consultantId:
          authenticatedContext.consultantId,
        closedAt:
          null,
      },
      select: {
        id: true,
      },
    })

  if (!journey) {
    return json(
      {
        error:
          "Oportunidade não encontrada ou já encerrada.",
      },
      404,
    )
  }

  const normalizedMessage =
    input.incomingMessage
      ? manualMessagingProvider
          .normalizeInbound({
            conversationId:
              journey.id,
            text:
              input.incomingMessage,
          })
      : null

  const analyzedAt =
    normalizedMessage?.occurredAt ??
    new Date()

  try {
    const memory =
      await prisma
        .commercialConversationMemory
        .upsert({
          where: {
            journeyId:
              journey.id,
          },
          create: {
            workspaceId:
              authenticatedContext.workspaceId,
            journeyId:
              journey.id,
            stage:
              stageToPrisma[
                input.stage
              ],
            goal:
              goalToPrisma[
                input.goal
              ],
            lastIntent:
              input.intent,
            lastIncomingMessage:
              normalizedMessage?.text ?? null,
            lastSuggestedReply:
              input.suggestedReply,
            analyzedAt,
          },
          update: {
            stage:
              stageToPrisma[
                input.stage
              ],
            goal:
              goalToPrisma[
                input.goal
              ],
            lastIntent:
              input.intent,
            lastIncomingMessage:
              normalizedMessage?.text ?? null,
            lastSuggestedReply:
              input.suggestedReply,
            analyzedAt,
          },
          select: {
            id: true,
            journeyId: true,
            stage: true,
            goal: true,
            analyzedAt: true,
            updatedAt: true,
          },
        })

    return json({
      memory,
      message:
        "Memória comercial atualizada.",
    })
  } catch {
    return json(
      {
        error:
          "Não foi possível salvar a memória comercial.",
      },
      500,
    )
  }
}
