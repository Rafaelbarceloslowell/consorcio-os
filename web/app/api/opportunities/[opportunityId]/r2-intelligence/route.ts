import {
  CommercialActorType,
  CommercialConversationGoal,
  CommercialConversationStage,
  CommercialEventType,
  ConsortiumType as PrismaConsortiumType,
} from "@/lib/generated/prisma/client"

import type {
  ConsortiumType,
} from "@/types/domain"

import {
  analyzeManualWhatsAppMessage,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  buildManualWhatsAppReply,
} from "@/application/opportunity/build-manual-whatsapp-reply"

import {
  buildNextGoal,
} from "@/application/opportunity/conversation/build-next-goal"

import type {
  ConversationStage,
} from "@/application/opportunity/conversation/conversation-stage"

import {
  resolveR2Intelligence,
} from "@/application/r2/resolve-r2-intelligence"

import {
  PrismaConsortiumCatalogProvider,
} from "@/infrastructure/prisma/providers/prisma-consortium-catalog-provider"

import {
  PrismaCommercialEventRepository,
} from "@/infrastructure/prisma/repositories/commercial/prisma-commercial-event-repository"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getApiCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

type RouteContext = Readonly<{
  params: Promise<{
    opportunityId: string
  }>
}>

export const dynamic = "force-dynamic"

const consortiumTypeToDomain: Record<
  PrismaConsortiumType,
  ConsortiumType
> = {
  [PrismaConsortiumType.REAL_ESTATE]:
    "real_estate",
  [PrismaConsortiumType.VEHICLE]:
    "vehicle",
  [PrismaConsortiumType.HEAVY_VEHICLE]:
    "heavy_vehicle",
  [PrismaConsortiumType.SERVICES]:
    "services",
  [PrismaConsortiumType.OTHER]:
    "other",
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

const goalToPrisma = {
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
} as const

function toConversationStage(
  stage: ManualWhatsAppAnalysis["stage"],
): ConversationStage {
  switch (stage) {
    case "opening":
      return "opening"
    case "discovery":
      return "discovery"
    case "diagnosis":
      return "diagnosis"
    case "qualification":
      return "qualification"
    case "strategy":
      return "strategy"
    case "call_to_action":
      return "meeting"
    case "follow_up":
      return "follow_up"
  }
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

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const authenticated =
    await getApiCommercialContext()

  if (authenticated instanceof Response) {
    return authenticated
  }

  const opportunityId =
    (
      await context.params
    ).opportunityId.trim()

  if (!opportunityId) {
    return json(
      { error: "opportunityId is required." },
      400,
    )
  }

  let incomingMessage = ""

  try {
    const body =
      await request.json() as
        Record<string, unknown>

    incomingMessage =
      typeof body.incomingMessage ===
        "string"
        ? body.incomingMessage.trim()
        : ""
  } catch {
    return json(
      { error: "O corpo da análise é inválido." },
      400,
    )
  }

  if (
    !incomingMessage ||
    incomingMessage.length > 5000
  ) {
    return json(
      {
        error:
          "Informe um contexto de até 5000 caracteres.",
      },
      400,
    )
  }

  const now = new Date()
  const journey =
    await prisma.commercialJourney.findFirst({
      where: {
        id: opportunityId,
        workspaceId:
          authenticated.workspaceId,
      },
      select: {
        id: true,
        consultantId: true,
        consortiumType: true,
        lead: {
          select: {
            name: true,
            approachType: true,
            desiredCreditValue: true,
            desiredTermMonths: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
        nextBestActions: {
          where: {
            acceptedAt: null,
            rejectedAt: null,
            executedActionId: null,
            OR: [
              { expiresAt: null },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },
          orderBy: [
            { priority: "desc" },
            { confidence: "desc" },
            { createdAt: "asc" },
          ],
          take: 1,
          select: {
            id: true,
            title: true,
            reason: true,
          },
        },
      },
    })

  if (!journey) {
    return json(
      { error: "Oportunidade não encontrada." },
      404,
    )
  }

  if (
    journey.consultantId !==
    authenticated.consultantId
  ) {
    return json(
      {
        error:
          "A oportunidade pertence a outro consultor.",
      },
      403,
    )
  }

  const approachType =
    journey.lead?.approachType ===
      "REACTIVATION"
      ? "reactivation" as const
      : "new" as const
  const analysis =
    analyzeManualWhatsAppMessage(
      incomingMessage,
      { approachType },
    )

  if (!analysis) {
    return json(
      { error: "Contexto insuficiente para análise." },
      400,
    )
  }

  const assetCategory =
    consortiumTypeToDomain[
      journey.consortiumType
    ]

  const catalogProvider =
    new PrismaConsortiumCatalogProvider(
      authenticated.workspaceId,
    )
  const eventRepository =
    new PrismaCommercialEventRepository(
      authenticated.workspaceId,
    )
  const [candidates, commercialEvents] =
    await Promise.all([
      catalogProvider.listCandidates({
        assetCategory:
          assetCategory,
      }),
      eventRepository.findAll(),
    ])
  const recommendationId =
    globalThis.crypto.randomUUID()
  const intelligence =
    resolveR2Intelligence({
      recommendationId,
      workspaceId:
        authenticated.workspaceId,
      opportunityId: journey.id,
      approachType,
      analysis,
      profile: {
        assetCategory:
          assetCategory,
        desiredCredit:
          journey.lead
            ? Number(
                journey.lead
                  .desiredCreditValue,
              )
            : null,
        targetTimelineMonths:
          journey.lead
            ?.desiredTermMonths ?? null,
      },
      candidates,
      commercialEvents,
      operationalAction:
        journey.nextBestActions[0] ??
        null,
      now,
    })
  const contactName =
    journey.lead?.name ??
    journey.client?.name ??
    "Contato"
  const reply =
    buildManualWhatsAppReply({
      contactName,
      incomingMessage,
      approachType,
      analysis,
    })
  const preparedReply =
    intelligence.commercialStrategy
      .requiresRecentContext
      ? null
      : reply
  const conversationStage =
    toConversationStage(
      analysis.stage,
    )
  const conversationGoal =
    buildNextGoal({
      approachType,
      stage: conversationStage,
    }).goal

  await prisma.$transaction(
    async (transaction) => {
      await transaction
        .commercialConversationMemory
        .upsert({
          where: {
            journeyId: journey.id,
          },
          create: {
            workspaceId:
              authenticated.workspaceId,
            journeyId: journey.id,
            stage:
              stageToPrisma[
                conversationStage
              ],
            goal:
              goalToPrisma[
                conversationGoal
              ],
            lastIntent:
              analysis.intent,
            lastIncomingMessage:
              incomingMessage,
            lastSuggestedReply:
              preparedReply,
            analyzedAt: now,
            narrativeSummary:
              `Último contexto recebido no estágio ${conversationStage}; objetivo atual ${conversationGoal}.`,
            factProvenance: {
              lastIncomingMessage:
                "manual_context",
              lastSuggestedReply:
                "system_event",
            },
            observedAt: now,
          },
          update: {
            stage:
              stageToPrisma[
                conversationStage
              ],
            goal:
              goalToPrisma[
                conversationGoal
              ],
            lastIntent:
              analysis.intent,
            lastIncomingMessage:
              incomingMessage,
            lastSuggestedReply:
              preparedReply,
            analyzedAt: now,
            narrativeSummary:
              `Último contexto recebido no estágio ${conversationStage}; objetivo atual ${conversationGoal}.`,
            factProvenance: {
              lastIncomingMessage:
                "manual_context",
              lastSuggestedReply:
                "system_event",
            },
            observedAt: now,
          },
        })

      await transaction
        .commercialEvent.create({
          data: {
            workspaceId:
              authenticated.workspaceId,
            journeyId: journey.id,
            type:
              CommercialEventType.NOTE_ADDED,
            actorType:
              CommercialActorType.AI,
            actorId: null,
            payload: {
              category:
                "r2_intelligence_recommendation",
              recommendationId,
              opportunityId:
                journey.id,
              commercialTechniqueIds:
                intelligence.observability
                  .commercialTechniqueIds,
              consortiumCandidateId:
                intelligence.observability
                  .consortiumCandidateId,
              learningApplied:
                intelligence.learningApplied,
              learningEvidenceCount:
                intelligence.observability
                  .learningEvidenceCount,
              confidence:
                intelligence.confidence,
              warnings:
                intelligence.warnings,
              generatedAt:
                intelligence.observability
                  .generatedAt,
            },
            occurredAt: now,
          },
        })
    },
  )

  return json({
    analysis,
    reply: preparedReply,
    intelligence,
    memorySaved: true,
  })
}
