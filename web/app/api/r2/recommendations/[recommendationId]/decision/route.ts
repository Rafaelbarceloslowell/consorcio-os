import {
  CommercialActionOrigin,
  CommercialActionStatus,
  CommercialActorType,
  CommercialEventType,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

const PILOT_WORKSPACE_SLUG = "consorcio-os"
const DEFAULT_POSTPONE_MINUTES = 24 * 60
const MIN_POSTPONE_MINUTES = 30
const MAX_POSTPONE_MINUTES = 7 * 24 * 60

type R2PilotDecision =
  | "ACCEPT"
  | "POSTPONE"
  | "REJECT"

type DecisionRequest = Readonly<{
  workspaceId: string
  consultantId: string
  decision: R2PilotDecision
  postponeMinutes?: number
}>

type RouteContext = Readonly<{
  params: Promise<{
    recommendationId: string
  }>
}>

class RecommendationConflictError extends Error {}

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

function isDecision(
  value: unknown,
): value is R2PilotDecision {
  return (
    value === "ACCEPT" ||
    value === "POSTPONE" ||
    value === "REJECT"
  )
}

function parseDecisionRequest(
  value: unknown,
): DecisionRequest {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "O corpo da decisÃ£o Ã© obrigatÃ³rio.",
    )
  }

  const body = value as Record<string, unknown>
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

  if (!isDecision(body.decision)) {
    throw new Error(
      "decision must be ACCEPT, POSTPONE or REJECT.",
    )
  }

  let postponeMinutes: number | undefined

  if (body.decision === "POSTPONE") {
    postponeMinutes =
      body.postponeMinutes === undefined
        ? DEFAULT_POSTPONE_MINUTES
        : Number(body.postponeMinutes)

    if (
      !Number.isInteger(postponeMinutes) ||
      postponeMinutes < MIN_POSTPONE_MINUTES ||
      postponeMinutes > MAX_POSTPONE_MINUTES
    ) {
      throw new Error(
        `postponeMinutes must be an integer between ${MIN_POSTPONE_MINUTES} and ${MAX_POSTPONE_MINUTES}.`,
      )
    }
  }

  return {
    workspaceId,
    consultantId,
    decision: body.decision,
    postponeMinutes,
  }
}

function isRecommendationOpen(
  recommendation: Readonly<{
    acceptedAt: Date | null
    rejectedAt: Date | null
    executedActionId: string | null
    expiresAt: Date | null
  }>,
  now: Date,
): boolean {
  if (
    recommendation.acceptedAt ||
    recommendation.rejectedAt ||
    recommendation.executedActionId
  ) {
    return false
  }

  return (
    recommendation.expiresAt === null ||
    recommendation.expiresAt.getTime() >
      now.getTime()
  )
}

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const {
    recommendationId: rawRecommendationId,
  } = await context.params

  const recommendationId =
    rawRecommendationId.trim()

  if (!recommendationId) {
    return json(
      {
        error:
          "recommendationId is required.",
      },
      400,
    )
  }

  let input: DecisionRequest

  try {
    input = parseDecisionRequest(
      await request.json(),
    )
  }
  catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid R2 decision request.",
      },
      400,
    )
  }

  const workspace =
    await prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        slug: PILOT_WORKSPACE_SLUG,
      },
      select: {
        id: true,
      },
    })

  if (!workspace) {
    return json(
      {
        error:
          "Workspace is not available for R2 pilot decisions.",
      },
      403,
    )
  }

  const recommendation =
    await prisma.nextBestAction.findFirst({
      where: {
        id: recommendationId,
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        workspaceId: true,
        journeyId: true,
        actionType: true,
        title: true,
        description: true,
        reason: true,
        acceptedAt: true,
        rejectedAt: true,
        executedActionId: true,
        expiresAt: true,
        journey: {
          select: {
            id: true,
            consultantId: true,
          },
        },
      },
    })

  if (!recommendation) {
    return json(
      {
        error:
          "A recomendaÃ§Ã£o nÃ£o foi encontrada neste workspace.",
      },
      404,
    )
  }

  if (
    recommendation.journey.consultantId !==
    input.consultantId
  ) {
    return json(
      {
        error:
          "A recomendaÃ§Ã£o pertence a outro consultor.",
      },
      403,
    )
  }

  const now = new Date()

  if (
    !isRecommendationOpen(
      recommendation,
      now,
    )
  ) {
    return json(
      {
        error:
          "A recomendaÃ§Ã£o jÃ¡ foi decidida ou expirou.",
      },
      409,
    )
  }

  try {
    const result =
      await prisma.$transaction(
        async (transaction) => {
          const scheduledFor =
            input.decision === "POSTPONE"
              ? new Date(
                  now.getTime() +
                    (input.postponeMinutes ??
                      DEFAULT_POSTPONE_MINUTES) *
                      60 *
                      1000,
                )
              : input.decision === "ACCEPT"
                ? now
                : null

          let commercialActionId:
            | string
            | null = null

          if (input.decision !== "REJECT") {
            const commercialAction =
              await transaction
                .commercialAction
                .create({
                  data: {
                    workspaceId:
                      workspace.id,
                    journeyId:
                      recommendation.journeyId,
                    type:
                      recommendation.actionType,
                    status:
                      CommercialActionStatus.PENDING,
                    origin:
                      CommercialActionOrigin.NEXT_BEST_ACTION,
                    actorType:
                      CommercialActorType.CONSULTANT,
                    actorId:
                      input.consultantId,
                    title:
                      recommendation.title,
                    description:
                      recommendation.description ??
                      recommendation.reason,
                    payload: {
                      recommendationId:
                        recommendation.id,
                      decision:
                        input.decision,
                      reason:
                        recommendation.reason,
                    },
                    scheduledFor,
                    createdBy:
                      input.consultantId,
                  },
                  select: {
                    id: true,
                  },
                })

            commercialActionId =
              commercialAction.id
          }

          const updateResult =
            await transaction
              .nextBestAction
              .updateMany({
                where: {
                  id: recommendation.id,
                  workspaceId:
                    workspace.id,
                  acceptedAt: null,
                  rejectedAt: null,
                  executedActionId: null,
                },
                data:
                  input.decision === "REJECT"
                    ? {
                        rejectedAt: now,
                      }
                    : {
                        acceptedAt: now,
                        executedActionId:
                          commercialActionId,
                      },
              })

          if (updateResult.count !== 1) {
            throw new RecommendationConflictError(
              "A recomendaÃ§Ã£o foi decidida durante esta operaÃ§Ã£o.",
            )
          }

          await transaction
            .commercialEvent
            .create({
              data: {
                workspaceId:
                  workspace.id,
                journeyId:
                  recommendation.journeyId,
                type:
                  CommercialEventType.NOTE_ADDED,
                actorType:
                  CommercialActorType.CONSULTANT,
                actorId:
                  input.consultantId,
                payload: {
                  category:
                    "r2_recommendation_decision",
                  recommendationId:
                    recommendation.id,
                  commercialActionId,
                  decision:
                    input.decision,
                  scheduledFor:
                    scheduledFor?.toISOString() ??
                    null,
                },
                occurredAt: now,
              },
            })

          return {
            commercialActionId,
            scheduledFor:
              scheduledFor?.toISOString() ??
              null,
          }
        },
      )

    const message =
      input.decision === "ACCEPT"
        ? "RecomendaÃ§Ã£o aceita. A aÃ§Ã£o foi colocada na sua fila."
        : input.decision === "POSTPONE"
          ? "RecomendaÃ§Ã£o agendada para amanhÃ£."
          : "RecomendaÃ§Ã£o descartada. O R2 vai recalcular a prioridade."

    return json({
      decision: input.decision,
      recommendationId:
        recommendation.id,
      journeyId:
        recommendation.journeyId,
      commercialActionId:
        result.commercialActionId,
      scheduledFor:
        result.scheduledFor,
      message,
    })
  }
  catch (error) {
    if (
      error instanceof RecommendationConflictError
    ) {
      return json(
        {
          error: error.message,
        },
        409,
      )
    }

    return json(
      {
        error:
          "NÃ£o foi possÃ­vel registrar a decisÃ£o do R2.",
      },
      500,
    )
  }
}

