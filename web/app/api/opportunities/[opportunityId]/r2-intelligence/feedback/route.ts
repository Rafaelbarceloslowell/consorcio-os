import {
  CommercialActorType,
  CommercialEventType,
  ConsortiumType as PrismaConsortiumType,
} from "@/lib/generated/prisma/client"

import type {
  Prisma,
} from "@/lib/generated/prisma/client"

import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import type {
  ConsortiumType,
} from "@/types/domain"

import {
  runApplicationDecisionEngine,
} from "@/application/decision/run-decision-engine"

import {
  buildR2ConsultantCorrectionContext,
  feedbackEventId,
  feedbackOutcomeEventId,
  feedbackRegenerationFailureEventId,
  feedbackRevisionEventId,
  parseR2ConsultantFeedback,
  prepareR2ConsultantCorrection,
  regeneratePreparedR2ConsultantCorrection,
} from "@/application/r2/feedback"

import {
  buildR2EvidenceContextFromMemory,
  checkR2DecisionSafety,
} from "@/application/r2/evidence"

import type {
  R2CustomerBoundaryContext,
} from "@/application/r2/boundary"

import {
  PrismaConsortiumCatalogProvider,
} from "@/infrastructure/prisma/providers/prisma-consortium-catalog-provider"

import {
  PrismaCommercialEventRepository,
} from "@/infrastructure/prisma/repositories/commercial/prisma-commercial-event-repository"

import {
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

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

type JsonRecord = Record<string, unknown>

class R2FeedbackConcurrencyError extends Error {}

export const dynamic = "force-dynamic"

const consortiumTypeToDomain: Record<
  PrismaConsortiumType,
  ConsortiumType
> = {
  [PrismaConsortiumType.REAL_ESTATE]: "real_estate",
  [PrismaConsortiumType.VEHICLE]: "vehicle",
  [PrismaConsortiumType.HEAVY_VEHICLE]: "heavy_vehicle",
  [PrismaConsortiumType.SERVICES]: "services",
  [PrismaConsortiumType.OTHER]: "other",
}

function json(
  body: unknown,
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

function isRecord(
  value: unknown,
): value is JsonRecord {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
}

function text(
  value: unknown,
): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null
}

function customerBoundaryFromValue(
  value: unknown,
): R2CustomerBoundaryContext | null {
  if (
    !isRecord(value) ||
    typeof value.signal !== "string" ||
    typeof value.state !== "string" ||
    typeof value.terminal !== "boolean" ||
    typeof value.fingerprint !== "string" ||
    typeof value.sourceReference !== "string" ||
    typeof value.observedAt !== "string" ||
    typeof value.explicitRejectionCount !== "number"
  ) {
    return null
  }

  return value as R2CustomerBoundaryContext
}

function analysisFromSnapshot(
  payload: JsonRecord,
): ManualWhatsAppAnalysis | null {
  const snapshot = payload.analysisSnapshot

  if (!isRecord(snapshot)) return null

  const intent = text(snapshot.intent)
  const stage = text(snapshot.stage)
  const label = text(snapshot.label)
  const summary = text(snapshot.summary)
  const recommendedAction =
    text(snapshot.recommendedAction)
  const customerBoundary =
    customerBoundaryFromValue(
      snapshot.customerBoundary,
    )

  const validIntents = new Set<ManualWhatsAppAnalysis["intent"]>([
    "callback_requested",
    "not_interested",
    "pricing_question",
    "meeting_interest",
    "interest_area",
    "interested",
    "no_previous_response",
    "stopped_replying",
    "objection",
    "needs_review",
  ])
  const validStages = new Set<ManualWhatsAppAnalysis["stage"]>([
    "opening",
    "discovery",
    "diagnosis",
    "qualification",
    "strategy",
    "call_to_action",
    "follow_up",
    "closing",
  ])

  if (
    !intent ||
    !validIntents.has(intent as ManualWhatsAppAnalysis["intent"]) ||
    !stage ||
    !validStages.has(stage as ManualWhatsAppAnalysis["stage"]) ||
    !label ||
    !summary ||
    !recommendedAction
  ) {
    return null
  }

  return {
    intent: intent as ManualWhatsAppAnalysis["intent"],
    stage: stage as ManualWhatsAppAnalysis["stage"],
    label,
    summary,
    recommendedAction,
    ...(
      customerBoundary
        ? {
            customerBoundary,
            intentConfidence:
              customerBoundary.intentConfidence,
            reasonForRejectionConfidence:
              customerBoundary.reasonForRejectionConfidence,
          }
        : {}
    ),
  }
}

function eventPayload(
  value: Prisma.JsonValue,
): JsonRecord {
  return isRecord(value) ? value : {}
}

function isUniqueError(
  error: unknown,
): boolean {
  return isRecord(error) && error.code === "P2002"
}

async function lockJourney(
  transaction: Prisma.TransactionClient,
  journeyId: string,
  workspaceId: string,
  version: number,
): Promise<void> {
  const updated =
    await transaction.commercialJourney.updateMany({
      where: {
        id: journeyId,
        workspaceId,
        version,
      },
      data: {
        version: {
          increment: 1,
        },
      },
    })

  if (updated.count !== 1) {
    throw new R2FeedbackConcurrencyError(
      "A oportunidade mudou durante o feedback.",
    )
  }
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
    (await context.params).opportunityId.trim()

  if (!opportunityId) {
    return json(
      { error: "opportunityId is required." },
      400,
    )
  }

  let feedback

  try {
    feedback = parseR2ConsultantFeedback(
      await request.json(),
    )
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "O feedback é inválido.",
      },
      400,
    )
  }

  const now = new Date()
  const journey =
    await prisma.commercialJourney.findFirst({
      where: {
        id: opportunityId,
        workspaceId: authenticated.workspaceId,
      },
      select: {
        id: true,
        version: true,
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
        conversationMemory: {
          select: {
            structuredFacts: true,
            factProvenance: true,
          },
        },
        nextBestActions: {
          where: {
            acceptedAt: null,
            rejectedAt: null,
            executedActionId: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
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

  if (journey.consultantId !== authenticated.consultantId) {
    return json(
      { error: "A oportunidade pertence a outro consultor." },
      403,
    )
  }

  const recommendationEvents =
    await prisma.commercialEvent.findMany({
      where: {
        workspaceId: authenticated.workspaceId,
        journeyId: journey.id,
        type: CommercialEventType.NOTE_ADDED,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 200,
      select: {
        id: true,
        payload: true,
      },
    })
  const originalEvent = recommendationEvents.find(
    (event) => {
      const payload = eventPayload(event.payload)

      return (
        payload.category ===
          "r2_intelligence_recommendation" ||
        payload.category ===
          "r2_consultant_case_correction_applied"
      ) &&
        payload.recommendationId ===
          feedback.recommendationId
    },
  )

  if (!originalEvent) {
    return json(
      { error: "Recomendação não encontrada para esta oportunidade." },
      404,
    )
  }

  const originalPayload =
    eventPayload(originalEvent.payload)

  if (feedback.action === "OUTCOME") {
    const outcomeId = feedbackOutcomeEventId(
      feedback.idempotencyKey,
    )
    const [existing, relatedFeedback] = await Promise.all([
      prisma.commercialEvent.findUnique({
        where: { id: outcomeId },
        select: {
          id: true,
          workspaceId: true,
          journeyId: true,
        },
      }),
      prisma.commercialEvent.findFirst({
        where: {
          id: feedback.feedbackId,
          workspaceId: authenticated.workspaceId,
          journeyId: journey.id,
        },
        select: { id: true, payload: true },
      }),
    ])

    if (
      existing &&
      (
        existing.workspaceId !== authenticated.workspaceId ||
        existing.journeyId !== journey.id
      )
    ) {
      return json(
        { error: "A chave idempotente já pertence a outro contexto." },
        409,
      )
    }

    if (existing) {
      return json({
        status: "OUTCOME_RECORDED",
        duplicate: true,
        feedbackId: feedback.feedbackId,
      })
    }

    if (
      !relatedFeedback ||
      eventPayload(relatedFeedback.payload).category !==
        "r2_consultant_feedback"
    ) {
      return json(
        { error: "Feedback não encontrado para esta oportunidade." },
        404,
      )
    }

    try {
      await prisma.$transaction(async (transaction) => {
        await lockJourney(
          transaction,
          journey.id,
          authenticated.workspaceId,
          journey.version,
        )
        await transaction.commercialEvent.create({
          data: {
            id: outcomeId,
            workspaceId: authenticated.workspaceId,
            journeyId: journey.id,
            type: CommercialEventType.NOTE_ADDED,
            actorType: CommercialActorType.CONSULTANT,
            actorId: authenticated.consultantId,
            payload: {
              category: "r2_consultant_correction_outcome",
              opportunityId: journey.id,
              recommendationId: feedback.recommendationId,
              feedbackId: feedback.feedbackId,
              outcome: feedback.outcome,
              automaticGlobalModelUpdate: false,
              recordedAt: now.toISOString(),
            },
            occurredAt: now,
          },
        })
      })
    } catch (error) {
      if (error instanceof R2FeedbackConcurrencyError) {
        return json(
          { error: "A oportunidade foi atualizada. Recarregue antes de registrar o resultado." },
          409,
        )
      }

      if (isUniqueError(error)) {
        return json({
          status: "OUTCOME_RECORDED",
          duplicate: true,
          feedbackId: feedback.feedbackId,
        })
      }

      throw error
    }

    return json({
      status: "OUTCOME_RECORDED",
      duplicate: false,
      feedbackId: feedback.feedbackId,
    })
  }

  const stableFeedbackId = feedbackEventId(
    feedback.idempotencyKey,
  )
  const existingFeedback =
    await prisma.commercialEvent.findUnique({
      where: { id: stableFeedbackId },
      select: {
        id: true,
        workspaceId: true,
        journeyId: true,
        payload: true,
      },
    })

  if (
    existingFeedback &&
    (
      existingFeedback.workspaceId !== authenticated.workspaceId ||
      existingFeedback.journeyId !== journey.id
    )
  ) {
    return json(
      { error: "A chave idempotente já pertence a outro contexto." },
      409,
    )
  }

  if (feedback.action === "ACCEPT") {
    if (existingFeedback) {
      return json({
        status: "ACCEPTED",
        duplicate: true,
        feedbackId: stableFeedbackId,
      })
    }

    try {
      await prisma.$transaction(async (transaction) => {
        await lockJourney(
          transaction,
          journey.id,
          authenticated.workspaceId,
          journey.version,
        )
        await transaction.commercialEvent.create({
          data: {
            id: stableFeedbackId,
            workspaceId: authenticated.workspaceId,
            journeyId: journey.id,
            type: CommercialEventType.NOTE_ADDED,
            actorType: CommercialActorType.CONSULTANT,
            actorId: authenticated.consultantId,
            payload: {
              category: "r2_consultant_feedback",
              feedback: "ACCEPTED",
              opportunityId: journey.id,
              recommendationId: feedback.recommendationId,
              originalRecommendation: originalPayload.recommendationSnapshot ?? null,
              evidenceSnapshot: originalPayload.evidence ?? null,
              decisionContext: originalPayload.decisionContext ?? null,
              commercialTechniqueIds: originalPayload.commercialTechniqueIds ?? [],
              consortiumCandidateId: originalPayload.consortiumCandidateId ?? null,
              safetyResult: originalPayload.safetyCheck ?? null,
              learningStatus: "LEARNING_CANDIDATE",
              reviewStatus: "PENDING_HUMAN_REVIEW",
              automaticGlobalModelUpdate: false,
              createdAt: now.toISOString(),
            },
            occurredAt: now,
          },
        })
      })
    } catch (error) {
      if (error instanceof R2FeedbackConcurrencyError) {
        return json(
          { error: "A oportunidade foi atualizada. Recarregue antes de avaliar." },
          409,
        )
      }

      if (isUniqueError(error)) {
        return json({
          status: "ACCEPTED",
          duplicate: true,
          feedbackId: stableFeedbackId,
        })
      }

      throw error
    }

    return json({
      status: "ACCEPTED",
      duplicate: false,
      feedbackId: stableFeedbackId,
    })
  }

  const revisionId = feedbackRevisionEventId(
    feedback.idempotencyKey,
  )
  const existingRevision =
    await prisma.commercialEvent.findUnique({
      where: { id: revisionId },
      select: {
        id: true,
        workspaceId: true,
        journeyId: true,
      },
    })

  if (
    existingRevision &&
    (
      existingRevision.workspaceId !== authenticated.workspaceId ||
      existingRevision.journeyId !== journey.id
    )
  ) {
    return json(
      { error: "A revisão idempotente já pertence a outro contexto." },
      409,
    )
  }

  if (existingRevision) {
    return json({
      status: "CORRECTION_APPLIED",
      duplicate: true,
      feedbackId: stableFeedbackId,
      revisionEventId: revisionId,
    })
  }

  const correction =
    buildR2ConsultantCorrectionContext(
      feedback,
      stableFeedbackId,
    )
  const subject = journey.lead?.name ??
    journey.client?.name ??
    "Contato"
  const currentEvidence =
    buildR2EvidenceContextFromMemory(
      journey.conversationMemory?.structuredFacts,
    )
  const baseAnalysis =
    analysisFromSnapshot(originalPayload)
  const originalCustomerBoundary =
    baseAnalysis?.customerBoundary ??
    customerBoundaryFromValue(
      originalPayload.customerBoundary,
    )
  const preparedCorrection = baseAnalysis
    ? prepareR2ConsultantCorrection({
        opportunityId: journey.id,
        subject,
        originalAnalysis: baseAnalysis,
        correction,
        consultantId:
          authenticated.consultantId,
        structuredFacts:
          journey.conversationMemory?.structuredFacts,
        factProvenance:
          journey.conversationMemory?.factProvenance,
        now,
      })
    : null
  const proposedPathSafety =
    preparedCorrection?.proposedPathSafety ??
    checkR2DecisionSafety({
      decisionText: feedback.correctPath,
      evidence: currentEvidence,
      customerBoundary:
        originalCustomerBoundary,
    })

  if (!existingFeedback) {
    try {
      await prisma.$transaction(async (transaction) => {
        await lockJourney(
          transaction,
          journey.id,
          authenticated.workspaceId,
          journey.version,
        )
        await transaction.commercialEvent.create({
          data: {
            id: stableFeedbackId,
            workspaceId: authenticated.workspaceId,
            journeyId: journey.id,
            type: CommercialEventType.NOTE_ADDED,
            actorType: CommercialActorType.CONSULTANT,
            actorId: authenticated.consultantId,
            payload: {
              category: "r2_consultant_feedback",
              feedback: "DISAGREED",
              opportunityId: journey.id,
              recommendationId: feedback.recommendationId,
              originalRecommendation: originalPayload.recommendationSnapshot ?? null,
              evidenceSnapshot: originalPayload.evidence ?? null,
              decisionContext: originalPayload.decisionContext ?? null,
              commercialTechniqueIds: originalPayload.commercialTechniqueIds ?? [],
              safetyResult: originalPayload.safetyCheck ?? null,
              errorCategory: feedback.errorCategory,
              disagreementReason: feedback.disagreementReason,
              proposedCorrectPath: feedback.correctPath,
              correctionType: correction.correctionType,
              correctionScope: correction.scope,
              consultantReportsCustomerConfirmation:
                correction.consultantReportsCustomerConfirmation,
              learningStatus: correction.learningStatus,
              reviewStatus: correction.reviewStatus,
              automaticGlobalModelUpdate: false,
              regenerationStatus: proposedPathSafety.safeToPresent
                ? "PENDING"
                : "BLOCKED_BY_SAFETY",
              proposedPathSafety,
              createdAt: now.toISOString(),
            },
            occurredAt: now,
          },
        })
      })
    } catch (error) {
      if (error instanceof R2FeedbackConcurrencyError) {
        return json(
          { error: "A oportunidade foi atualizada. Recarregue antes de corrigir." },
          409,
        )
      }

      if (!isUniqueError(error)) throw error
    }
  }

  if (!proposedPathSafety.safeToPresent) {
    return json(
      {
        status: "BLOCKED_BY_SAFETY",
        feedbackPersisted: true,
        feedbackId: stableFeedbackId,
        safetyCheck: proposedPathSafety,
        message:
          "A estratégia foi registrada como feedback, mas essa formulação não pode ser aplicada porque ultrapassa os guardrails comerciais.",
      },
      422,
    )
  }

  if (!preparedCorrection) {
    return json(
      {
        error: "A recomendação original não possui contexto suficiente para regeneração.",
        feedbackPersisted: true,
        feedbackId: stableFeedbackId,
      },
      409,
    )
  }

  try {
    const approachType =
      journey.lead?.approachType === "REACTIVATION"
        ? "reactivation" as const
        : "new" as const
    const assetCategory =
      consortiumTypeToDomain[journey.consortiumType]
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
        catalogProvider.listCandidates({ assetCategory }),
        eventRepository.findAll(),
      ])
    const regenerated =
      await regeneratePreparedR2ConsultantCorrection({
        prepared: preparedCorrection,
        correction,
        workspaceId: authenticated.workspaceId,
        opportunityId: journey.id,
        approachType,
        profile: {
          assetCategory,
          desiredCredit: journey.lead
            ? Number(journey.lead.desiredCreditValue)
            : null,
          targetTimelineMonths:
            journey.lead?.desiredTermMonths ?? null,
        },
        candidates,
        commercialEvents,
        operationalAction:
          originalCustomerBoundary?.terminal
            ? null
            : journey.nextBestActions[0] ??
              null,
        contactName: subject,
        now,
        runDecisionEngine: (evidenceContext) =>
          runApplicationDecisionEngine({
            commercialRepository:
              createPrismaCommercialRepositories({
                workspaceId: authenticated.workspaceId,
              }),
            crmRepository:
              createPrismaCrmRepositories({
                workspaceId: authenticated.workspaceId,
              }),
            journeyId: journey.id,
            now,
            evidenceContext,
            customerBoundaryContext:
              preparedCorrection.customerBoundary ?? undefined,
          }),
      })
    const {
      analysis: revisedAnalysis,
      evidence,
      evidenceContext,
      decision: runtimeDecision,
      intelligence,
      reply: preparedReply,
      safetyCheck: revisedSafety,
    } = regenerated
    const revisedRecommendationId =
      intelligence.recommendationId
    const versionAfterFeedback = existingFeedback
      ? journey.version
      : journey.version + 1

    await prisma.$transaction(async (transaction) => {
      await lockJourney(
        transaction,
        journey.id,
        authenticated.workspaceId,
        versionAfterFeedback,
      )

      if (evidence) {
        await transaction.commercialConversationMemory.update({
          where: { journeyId: journey.id },
          data: {
            lastIntent: revisedAnalysis.intent,
            lastSuggestedReply: preparedReply,
            analyzedAt: now,
            structuredFacts:
              evidence.structuredFacts as Prisma.InputJsonValue,
            factProvenance:
              evidence.factProvenance as Prisma.InputJsonValue,
            narrativeSummary:
              "Contexto factual reavaliado após correção supervisionada do consultor.",
            observedAt: now,
          },
        })
      }

      await transaction.commercialEvent.create({
        data: {
          id: revisionId,
          workspaceId: authenticated.workspaceId,
          journeyId: journey.id,
          type: CommercialEventType.NOTE_ADDED,
          actorType: CommercialActorType.AI,
          actorId: null,
          payload: {
            category: "r2_consultant_case_correction_applied",
            opportunityId: journey.id,
            feedbackId: stableFeedbackId,
            recommendationId: revisedRecommendationId,
            version:
              typeof originalPayload.version === "number"
                ? originalPayload.version + 1
                : 2,
            parentRecommendationId: feedback.recommendationId,
            supersedesRecommendationId: feedback.recommendationId,
            correctionType: correction.correctionType,
            errorCategory: correction.errorCategory,
            correctionScope: correction.scope,
            originalRecommendation:
              originalPayload.recommendationSnapshot ?? null,
            recommendationSnapshot: {
              title: intelligence.nextBestAction.title,
              explanation: intelligence.explanation,
              source: intelligence.nextBestAction.source,
              suggestedNextStep:
                intelligence.commercialStrategy.suggestedNextStep,
              suggestedQuestion:
                intelligence.commercialStrategy.suggestedQuestion,
              preparedReply,
            },
            revisedRecommendation: {
              title: intelligence.nextBestAction.title,
              explanation: intelligence.explanation,
              suggestedNextStep:
                intelligence.commercialStrategy.suggestedNextStep,
              suggestedQuestion:
                intelligence.commercialStrategy.suggestedQuestion,
              preparedReply,
            },
            analysisSnapshot: {
              intent: revisedAnalysis.intent,
              stage: revisedAnalysis.stage,
              label: revisedAnalysis.label,
              summary: revisedAnalysis.summary,
              recommendedAction:
                revisedAnalysis.recommendedAction,
              context:
                revisedAnalysis.context ?? null,
            },
            decisionContext: {
              approachType,
              assetCategory,
              desiredCredit: journey.lead
                ? Number(journey.lead.desiredCreditValue)
                : null,
              targetTimelineMonths:
                journey.lead?.desiredTermMonths ?? null,
              operationalActionId:
                runtimeDecision.nextBestActions[0]?.id ??
                journey.nextBestActions[0]?.id ??
                null,
            },
            commercialTechniqueIds:
              intelligence.observability.commercialTechniqueIds,
            evidence: {
              status: evidenceContext.status,
              confidence: evidenceContext.confidence,
              outcome: evidenceContext.outcome,
              claimIds:
                evidence?.claims.map((claim) => claim.id) ?? [],
              relationships:
                evidence?.assessments.map((assessment) => ({
                  claimId: assessment.claim?.id ?? null,
                  relationship: assessment.relationship,
                  relatedClaimIds: assessment.relatedClaimIds,
                })) ?? [],
            },
            decisionEngine: {
              evidenceStatus:
                runtimeDecision.evidenceContext?.status ?? null,
              recommendationCount:
                runtimeDecision.nextBestActions.length,
              warningCount: runtimeDecision.warnings.length,
            },
            safetyCheck: revisedSafety,
            applicationStatus:
              revisedSafety.safeToPresent
                ? "APPLIED"
                : "REQUIRES_HUMAN_REVIEW",
            learningStatus: correction.learningStatus,
            reviewStatus: correction.reviewStatus,
            automaticGlobalModelUpdate: false,
            generatedAt:
              intelligence.observability.generatedAt,
          },
          occurredAt: now,
        },
      })
    })

    return json({
      status: revisedSafety.safeToPresent
        ? "CORRECTION_APPLIED"
        : "REVISION_REQUIRES_REVIEW",
      duplicate: false,
      feedbackPersisted: true,
      feedbackId: stableFeedbackId,
      revisionEventId: revisionId,
      ...(revisedSafety.safeToPresent
        ? {
            intelligence,
            analysis: revisedAnalysis,
            reply: preparedReply,
          }
        : {}),
      evidence: evidenceContext,
      safetyCheck: revisedSafety,
      message: revisedSafety.safeToPresent
        ? "Correção aplicada neste caso e registrada para avaliação de aprendizado."
        : "A correção foi reprocessada, mas a nova recomendação requer revisão de segurança.",
    })
  } catch (error) {
    if (error instanceof R2FeedbackConcurrencyError) {
      return json(
        {
          error: "A oportunidade mudou após o feedback. O feedback foi preservado; tente regenerar novamente.",
          feedbackPersisted: true,
          feedbackId: stableFeedbackId,
        },
        409,
      )
    }

    try {
      await prisma.commercialEvent.create({
        data: {
          id: feedbackRegenerationFailureEventId(
            feedback.idempotencyKey,
          ),
          workspaceId: authenticated.workspaceId,
          journeyId: journey.id,
          type: CommercialEventType.NOTE_ADDED,
          actorType: CommercialActorType.SYSTEM,
          actorId: null,
          payload: {
            category: "r2_consultant_feedback_regeneration_failed",
            feedbackId: stableFeedbackId,
            recommendationId: feedback.recommendationId,
            retryable: true,
            errorName:
              error instanceof Error
                ? error.name
                : "UnknownError",
            occurredAt: now.toISOString(),
          },
          occurredAt: now,
        },
      })
    } catch (failureAuditError) {
      console.error(
        "Falha ao auditar erro de regeneração do feedback R2.",
        failureAuditError,
      )
    }

    return json(
      {
        error: "O feedback foi salvo, mas a regeneração falhou. Tente novamente.",
        feedbackPersisted: true,
        feedbackId: stableFeedbackId,
      },
      500,
    )
  }
}
