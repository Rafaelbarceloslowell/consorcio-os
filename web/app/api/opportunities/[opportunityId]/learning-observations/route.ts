import {
  CommercialActorType,
  CommercialEventType,
} from "@/lib/generated/prisma/client"

import {
  buildR2LearningObservation,
} from "@/application/learning/build-r2-learning-observation"

import {
  prisma,
} from "@/infrastructure/prisma/client"

const WORKSPACE_SLUG =
  "consorcio-os"

type RouteContext = Readonly<{
  params: Promise<{
    opportunityId: string
  }>
}>

class LearningObservationConflictError
  extends Error {}

function json(
  body: unknown,
  status = 200,
): Response {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  )
}

function parseBody(
  value: unknown,
  opportunityId: string,
) {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    throw new Error(
      "O corpo do registro é obrigatório.",
    )
  }

  const body =
    value as
      Record<string, unknown>

  return buildR2LearningObservation({
    opportunityId,
    consultantId:
      typeof body.consultantId ===
      "string"
        ? body.consultantId
        : "",
    contactName:
      typeof body.contactName ===
      "string"
        ? body.contactName
        : "",
    sourceIncomingMessage:
      typeof body.sourceIncomingMessage ===
        "string"
        ? body.sourceIncomingMessage
        : null,
    originalSuggestion:
      typeof body.originalSuggestion ===
      "string"
        ? body.originalSuggestion
        : "",
    finalSentMessage:
      typeof body.finalSentMessage ===
      "string"
        ? body.finalSentMessage
        : "",
    customerResponse:
      typeof body.customerResponse ===
        "string"
        ? body.customerResponse
        : null,
    outcome:
      typeof body.outcome ===
      "string"
        ? body.outcome as
          Parameters<
            typeof buildR2LearningObservation
          >[0]["outcome"]
        : "OTHER",
    intent:
      typeof body.intent ===
        "string"
        ? body.intent
        : null,
    stage:
      typeof body.stage ===
        "string"
        ? body.stage
        : null,
    goal:
      typeof body.goal ===
        "string"
        ? body.goal
        : null,
    notes:
      typeof body.notes ===
        "string"
        ? body.notes
        : null,
  })
}

export const dynamic =
  "force-dynamic"

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
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

  let observation:
    ReturnType<
      typeof buildR2LearningObservation
    >

  try {
    observation =
      parseBody(
        await request.json(),
        opportunityId,
      )
  }
  catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Registro de aprendizado inválido.",
      },
      400,
    )
  }

  const workspace =
    await prisma
      .workspace
      .findUnique({
        where: {
          slug:
            WORKSPACE_SLUG,
        },
        select: {
          id: true,
        },
      })

  if (!workspace) {
    return json(
      {
        error:
          "Workspace não encontrado.",
      },
      404,
    )
  }

  const journey =
    await prisma
      .commercialJourney
      .findFirst({
        where: {
          id:
            opportunityId,
          workspaceId:
            workspace.id,
        },
        select: {
          id: true,
          consultantId: true,
          closedAt: true,
        },
      })

  if (!journey) {
    return json(
      {
        error:
          "Oportunidade não encontrada.",
      },
      404,
    )
  }

  if (
    journey.consultantId !==
    observation.consultantId
  ) {
    return json(
      {
        error:
          "A oportunidade pertence a outro consultor.",
      },
      403,
    )
  }

  if (
    journey.closedAt !==
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

  const occurredAt =
    new Date(
      observation.recordedAt,
    )

  try {
    const result =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const updateResult =
            await transaction
              .commercialJourney
              .updateMany({
                where: {
                  id:
                    journey.id,
                  workspaceId:
                    workspace.id,
                  consultantId:
                    observation
                      .consultantId,
                  closedAt:
                    null,
                },
                data: {
                  lastInteractionAt:
                    occurredAt,
                  version: {
                    increment: 1,
                  },
                },
              })

          if (
            updateResult.count !==
            1
          ) {
            throw new LearningObservationConflictError(
              "A oportunidade foi alterada durante o registro.",
            )
          }

          const event =
            await transaction
              .commercialEvent
              .create({
                data: {
                  workspaceId:
                    workspace.id,
                  journeyId:
                    journey.id,
                  type:
                    CommercialEventType
                      .NOTE_ADDED,
                  actorType:
                    CommercialActorType
                      .CONSULTANT,
                  actorId:
                    observation
                      .consultantId,
                  payload: {
                    category:
                      "r2_learning_observation_recorded",
                    source:
                      "manual_whatsapp_pilot",
                    ...observation,
                  },
                  occurredAt,
                },
                select: {
                  id: true,
                },
              })

          return event
        },
      )

    return json({
      observationId:
        result.id,
      message:
        "Observação registrada para revisão do aprendizado do R2.",
      learning: {
        consultantEdited:
          observation
            .consultantEdited,
        signal:
          observation.signal,
        reviewStatus:
          observation
            .reviewStatus,
        humanReviewRequired:
          true,
        automaticModelUpdateApplied:
          false,
      },
    })
  }
  catch (error) {
    if (
      error instanceof
      LearningObservationConflictError
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
          "Não foi possível registrar a observação do R2.",
      },
      500,
    )
  }
}
