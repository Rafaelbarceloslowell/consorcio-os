import {
  CommercialActorType,
  CommercialCommitmentStatus,
  CommercialConversationGoal,
  CommercialConversationStage,
  CommercialEventType,
  ConsortiumType as PrismaConsortiumType,
  TaskStatus,
} from "@/lib/generated/prisma/client"

import type {
  Prisma,
} from "@/lib/generated/prisma/client"

import type {
  ConsortiumType,
} from "@/types/domain"

import {
  analyzeManualWhatsAppMessage,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  reconcileReactivationContext,
} from "@/application/opportunity/reconcile-reactivation-context"

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
  analyzeR2CustomerBoundary,
  evolveR2CustomerBoundaryMemory,
  writeR2CustomerBoundaryMemory,
} from "@/application/r2/boundary"

import {
  buildR2EvidenceSourceReference,
  checkR2DecisionSafety,
  processR2Evidence,
} from "@/application/r2/evidence"

import {
  runApplicationDecisionEngine,
} from "@/application/decision/run-decision-engine"

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

class R2EvidenceConcurrencyError extends Error {}

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
    case "closing":
      return "closing"
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
  let contextDecision:
    | "CONFIRM_CONTEXT"
    | "CONFIRM_EVIDENCE"
    | null = null
  let sourceReference: string | null = null

  try {
    const body =
      await request.json() as
        Record<string, unknown>

    incomingMessage =
      typeof body.incomingMessage ===
        "string"
        ? body.incomingMessage.trim()
        : ""

    contextDecision =
      body.contextDecision ===
        "CONFIRM_CONTEXT"
        ? "CONFIRM_CONTEXT"
        : body.contextDecision ===
            "CONFIRM_EVIDENCE"
          ? "CONFIRM_EVIDENCE"
          : null

    sourceReference =
      typeof body.sourceReference === "string" &&
      body.sourceReference.trim()
        ? body.sourceReference.trim().slice(0, 300)
        : null
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
        reactivationContexts: {
          orderBy: {
            providedAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            contextSummary: true,
            contextState: true,
          },
        },
        conversationMemory: {
          select: {
            structuredFacts: true,
            factProvenance: true,
            lastIncomingMessage: true,
          },
        },
        commercialEvents: {
          where: {
            type: CommercialEventType.NOTE_ADDED,
          },
          orderBy: {
            occurredAt: "desc",
          },
          take: 50,
          select: {
            id: true,
            payload: true,
            occurredAt: true,
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
  const latestReactivationContext =
    journey.reactivationContexts[0] ??
    null

  const reconciliation =
    approachType ===
      "reactivation"
      ? reconcileReactivationContext({
          savedContext:
            latestReactivationContext
              ?.contextSummary ??
            null,
          currentObservation:
            incomingMessage,
          consultantConfirmed:
            contextDecision ===
            "CONFIRM_CONTEXT",
        })
      : null

  if (
    reconciliation &&
    reconciliation.status !==
      "CONSISTENT"
  ) {
    return json({
      reconciliation,
      analysis: null,
      reply: null,
      intelligence: null,
      memorySaved: false,
    })
  }

  const effectiveIncomingMessage =
    reconciliation
      ?.effectiveContext ??
    incomingMessage

  const effectiveSourceReference =
    sourceReference ??
    buildR2EvidenceSourceReference(
      journey.id,
      effectiveIncomingMessage,
    )
  const customerBoundary =
    analyzeR2CustomerBoundary({
      opportunityId: journey.id,
      message: effectiveIncomingMessage,
      structuredFacts:
        journey.conversationMemory
          ?.structuredFacts,
      recentMessages:
        journey.conversationMemory
          ?.lastIncomingMessage
          ? [
              journey.conversationMemory
                .lastIncomingMessage,
            ]
          : [],
      commercialEvents:
        (journey.commercialEvents ?? []).map(
          (event) => ({
            id: event.id,
            payload:
              typeof event.payload === "object" &&
              event.payload !== null &&
              !Array.isArray(event.payload)
                ? event.payload as Record<string, unknown>
                : {},
            occurredAt: event.occurredAt,
          }),
        ),
      sourceReference:
        effectiveSourceReference,
      observedAt: now,
    })
  const analysis =
    analyzeManualWhatsAppMessage(
      effectiveIncomingMessage,
      {
        approachType,
        customerBoundary,
      },
    )

  if (!analysis) {
    return json(
      { error: "Contexto insuficiente para anÃ¡lise." },
      400,
    )
  }

  const boundaryMemory =
    evolveR2CustomerBoundaryMemory({
      structuredFacts:
        journey.conversationMemory
          ?.structuredFacts,
      boundary: customerBoundary,
    })

  const evidence = processR2Evidence({
    opportunityId: journey.id,
    subject:
      journey.lead?.name ??
      journey.client?.name ??
      "Contato",
    text: effectiveIncomingMessage,
    sourceType:
      approachType === "reactivation" ||
      /^\s*consultor\s*:/iu.test(
        effectiveIncomingMessage,
      )
        ? "CONSULTANT_INPUT"
        : "CUSTOMER_MESSAGE",
    sourceReference:
      effectiveSourceReference,
    actorId:
      approachType === "reactivation"
        ? authenticated.consultantId
        : null,
    observedAt: now,
    receivedAt: now,
    structuredFacts:
      journey.conversationMemory
        ?.structuredFacts,
    factProvenance:
      journey.conversationMemory
        ?.factProvenance,
    humanConfirmed:
      contextDecision === "CONFIRM_CONTEXT" ||
      contextDecision === "CONFIRM_EVIDENCE",
  })
  const structuredFactsWithBoundary =
    writeR2CustomerBoundaryMemory(
      evidence.structuredFacts,
      boundaryMemory,
    )
  const runtimeDecision =
    await runApplicationDecisionEngine({
      commercialRepository:
        createPrismaCommercialRepositories({
          workspaceId:
            authenticated.workspaceId,
        }),
      crmRepository:
        createPrismaCrmRepositories({
          workspaceId:
            authenticated.workspaceId,
        }),
      journeyId:
        journey.id,
      now,
      evidenceContext:
        evidence.decisionContext,
      customerBoundaryContext:
        customerBoundary,
    })

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
        runtimeDecision.nextBestActions[0] ??
        (
          evidence.decisionContext
            .humanConfirmationRequired ||
          customerBoundary.terminal
            ? null
            : journey.nextBestActions[0]
        ) ??
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
      incomingMessage:
        effectiveIncomingMessage,
      approachType,
      analysis,
    })
  const candidateReply =
    intelligence.commercialStrategy
      .requiresRecentContext
      ? null
      : reply
  const safetyCheck =
    checkR2DecisionSafety({
      decisionText: [
        intelligence.nextBestAction.title,
        intelligence.commercialStrategy.objective,
        intelligence.commercialStrategy.callToAction,
        intelligence.commercialStrategy.suggestedQuestion,
        candidateReply,
      ].filter(
        (value): value is string =>
          typeof value === "string" &&
          Boolean(value.trim()),
      ).join(" "),
      evidence:
        evidence.decisionContext,
      customerBoundary,
      decisionConsistency: {
        signal: customerBoundary.signal,
        intent: analysis.intent,
        objective:
          intelligence.commercialStrategy.objective,
        technique:
          intelligence.commercialStrategy.primaryTechnique,
        callToAction:
          intelligence.commercialStrategy.callToAction,
        question:
          intelligence.commercialStrategy.suggestedQuestion,
        avoid:
          intelligence.commercialStrategy.avoid,
      },
    })
  const preparedReply =
    evidence.decisionContext
      .humanConfirmationRequired ||
    !safetyCheck.safeToPresent
      ? null
      : candidateReply
  const conversationStage =
    toConversationStage(
      analysis.stage,
    )
  const conversationGoal =
    buildNextGoal({
      approachType,
      stage: conversationStage,
    }).goal

  try {
    await prisma.$transaction(
      async (transaction) => {
        const journeyUpdate =
          await transaction
            .commercialJourney
            .updateMany({
              where: {
                id: journey.id,
                workspaceId:
                  authenticated.workspaceId,
                version:
                  journey.version,
              },
              data: {
                version: {
                  increment: 1,
                },
                lastInteractionAt:
                  now,
              },
            })

        if (journeyUpdate.count !== 1) {
          throw new R2EvidenceConcurrencyError(
            "A memória comercial foi alterada durante a análise.",
          )
        }

      if (
        approachType ===
          "reactivation" &&
        latestReactivationContext &&
        reconciliation?.status ===
          "CONSISTENT"
      ) {
        await transaction
          .reactivationContext
          .update({
            where: {
              id:
                latestReactivationContext.id,
            },
            data: {
              contextSummary:
                effectiveIncomingMessage,
              providedAt:
                now,
            },
          })
      }

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
              effectiveIncomingMessage,
            lastSuggestedReply:
              preparedReply,
            analyzedAt: now,
            structuredFacts:
              structuredFactsWithBoundary as Prisma.InputJsonValue,
            narrativeSummary:
              `Último contexto recebido no estágio ${conversationStage}; objetivo atual ${conversationGoal}.`,
            factProvenance: {
              ...evidence.factProvenance,
              lastIncomingMessage:
                contextDecision === "CONFIRM_CONTEXT" ||
                contextDecision === "CONFIRM_EVIDENCE"
                  ? "consultant_confirmation"
                  : "manual_context",
              lastSuggestedReply:
                "system_event",
              r2CustomerBoundary:
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
              effectiveIncomingMessage,
            lastSuggestedReply:
              preparedReply,
            analyzedAt: now,
            structuredFacts:
              structuredFactsWithBoundary as Prisma.InputJsonValue,
            narrativeSummary:
              `Último contexto recebido no estágio ${conversationStage}; objetivo atual ${conversationGoal}.`,
            factProvenance: {
              ...evidence.factProvenance,
              lastIncomingMessage:
                contextDecision === "CONFIRM_CONTEXT" ||
                contextDecision === "CONFIRM_EVIDENCE"
                  ? "consultant_confirmation"
                  : "manual_context",
              lastSuggestedReply:
                "system_event",
              r2CustomerBoundary:
                "system_event",
            },
            observedAt: now,
          },
        })

      if (customerBoundary.terminal) {
        const cancellationReason =
          "Customer Boundary encerrou a comunicação comercial proativa."

        await transaction.task.updateMany({
          where: {
            workspaceId:
              authenticated.workspaceId,
            opportunityId: journey.id,
            status: {
              in: [
                TaskStatus.PENDING,
                TaskStatus.IN_PROGRESS,
              ],
            },
          },
          data: {
            status: TaskStatus.CANCELLED,
            cancelledAt: now,
            supersededAt: now,
            reason: cancellationReason,
          },
        })
        await transaction
          .commercialCommitment
          .updateMany({
            where: {
              workspaceId:
                authenticated.workspaceId,
              opportunityId: journey.id,
              status:
                CommercialCommitmentStatus.PENDING,
            },
            data: {
              status:
                CommercialCommitmentStatus.CANCELLED,
              cancelledAt: now,
            },
          })
      }

      if (customerBoundary.isNewObservation) {
        await transaction
          .commercialEvent.create({
            data: {
              id:
                `r2-boundary-${journey.id}-${customerBoundary.fingerprint}`,
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
                  "r2_customer_boundary_detected",
                schemaVersion: "1.0",
                signal:
                  customerBoundary.signal,
                state:
                  customerBoundary.state,
                explicitRejectionCount:
                  customerBoundary.explicitRejectionCount,
                intentConfidence:
                  customerBoundary.intentConfidence,
                reasonForRejectionConfidence:
                  customerBoundary.reasonForRejectionConfidence,
                terminal:
                  customerBoundary.terminal,
                currentConversationClosed:
                  customerBoundary.currentConversationClosed,
                proactiveContactSuppressed:
                  customerBoundary.proactiveContactSuppressed,
                outboundAutomationSuppressed:
                  customerBoundary.outboundAutomationSuppressed,
                fingerprint:
                  customerBoundary.fingerprint,
                sourceReference:
                  customerBoundary.sourceReference,
                observedAt:
                  customerBoundary.observedAt,
                rationale:
                  customerBoundary.rationale,
              },
              occurredAt: now,
            },
          })
      }

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
              version: 1,
              parentRecommendationId: null,
              supersededBy: null,
              opportunityId:
                journey.id,
              recommendationSnapshot: {
                title:
                  intelligence.nextBestAction.title,
                explanation:
                  intelligence.explanation,
                source:
                  intelligence.nextBestAction.source,
                suggestedNextStep:
                  intelligence.commercialStrategy.suggestedNextStep,
                suggestedQuestion:
                  intelligence.commercialStrategy.suggestedQuestion,
                preparedReply,
              },
              analysisSnapshot: {
                intent: analysis.intent,
                stage: analysis.stage,
                label: analysis.label,
                summary: analysis.summary,
                recommendedAction:
                  analysis.recommendedAction,
                context:
                  analysis.context ?? null,
                intentConfidence:
                  analysis.intentConfidence ?? null,
                reasonForRejectionConfidence:
                  analysis.reasonForRejectionConfidence ?? null,
                customerBoundary,
              },
              customerBoundary,
              decisionContext: {
                approachType,
                assetCategory,
                desiredCredit:
                  journey.lead
                    ? Number(
                        journey.lead.desiredCreditValue,
                      )
                    : null,
                targetTimelineMonths:
                  journey.lead?.desiredTermMonths ?? null,
                operationalActionId:
                  runtimeDecision.nextBestActions[0]?.id ??
                  journey.nextBestActions[0]?.id ??
                  null,
              },
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
              evidence: {
                status:
                  evidence.decisionContext.status,
                confidence:
                  evidence.decisionContext.confidence,
                outcome:
                  evidence.decisionContext.outcome,
                sensitivity:
                  evidence.decisionContext.sensitivity,
                claimIds:
                  evidence.claims.map(
                    (claim) => claim.id,
                  ),
                conflictCount:
                  evidence.decisionContext.conflicts.length,
                humanConfirmationRequired:
                  evidence.decisionContext
                    .humanConfirmationRequired,
                humanConfirmed:
                  contextDecision === "CONFIRM_CONTEXT" ||
                  contextDecision === "CONFIRM_EVIDENCE",
              },
              decisionEngine: {
                evidenceStatus:
                  runtimeDecision.evidenceContext
                    ?.status ?? null,
                recommendationCount:
                  runtimeDecision.nextBestActions.length,
                warningCount:
                  runtimeDecision.warnings.length,
              },
              safetyCheck: {
                status: safetyCheck.status,
                issueCodes:
                  safetyCheck.issues.map(
                    (issue) => issue.code,
                  ),
                safeToPresent:
                  safetyCheck.safeToPresent,
              },
              ...(
                contextDecision === "CONFIRM_CONTEXT" ||
                contextDecision === "CONFIRM_EVIDENCE"
                  ? {
                      learningFeedback: {
                        type:
                          "R2_EVIDENCE_HUMAN_CORRECTION",
                        reviewStatus:
                          "PENDING_HUMAN_REVIEW",
                        automaticModelUpdateApplied:
                          false,
                        claimIds:
                          evidence.claims.map(
                            (claim) => claim.id,
                          ),
                      },
                    }
                  : {}
              ),
              generatedAt:
                intelligence.observability
                  .generatedAt,
            },
            occurredAt: now,
          },
        })
      },
    )
  } catch (error) {
    if (error instanceof R2EvidenceConcurrencyError) {
      return json(
        {
          error:
            "A oportunidade recebeu outra atualização. Recarregue o contexto antes de confirmar.",
        },
        409,
      )
    }

    throw error
  }

  return json({
    reconciliation,
    analysis,
    reply: preparedReply,
    intelligence,
    evidence:
      evidence.decisionContext,
    safetyCheck,
    customerBoundary,
    humanReview:
      evidence.decisionContext
        .humanConfirmationRequired
        ? {
            title:
              "Informação conflitante",
            reason:
              evidence.decisionContext
                .conflicts[0] ??
              "Existe uma informação sensível que precisa de confirmação.",
            confirmationAlreadyRequested:
              evidence.assessments.some(
                (assessment) =>
                  assessment
                    .confirmationAlreadyRequested,
              ),
            instruction:
              "Confirme qual informação está atualizada antes de usá-la na estratégia.",
          }
        : null,
    memorySaved: true,
  })
}
