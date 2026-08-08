import {
  buildR2LearningEvidence,
  buildBestCommercialPatterns,
} from "@/application/learning/build-r2-learning-evidence"

import type {
  BestCommercialPattern,
  R2LearningContext,
  R2LearningEvidence,
} from "@/application/learning/build-r2-learning-evidence"

import {
  buildR2CommercialPlaybookRecommendation,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  R2CommercialPlaybookRecommendation,
  R2CommercialTechniqueId,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  ConversationApproachType,
} from "@/application/opportunity/conversation/conversation-stage"

import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  evaluateConsortiumOptions,
} from "@/application/consortium/evaluate-consortium-options"

import type {
  ConsortiumCustomerProfile,
  ConsortiumIntelligenceResult,
} from "@/application/consortium/evaluate-consortium-options"

import type {
  CommercialEvent,
  Consortium,
} from "@/types/domain"

export type R2IntelligenceConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INSUFFICIENT_DATA"

export type R2OperationalActionContext =
  Readonly<{
    id: string
    title: string
    reason: string
  }>

export type R2IntelligenceResult =
  Readonly<{
    recommendationId: string
    opportunityId: string
    workspaceId: string
    stage:
      ManualWhatsAppAnalysis["stage"]
    intent:
      ManualWhatsAppAnalysis["intent"]
    nextBestAction:
      R2OperationalActionContext & {
        source:
          | "DECISION_ENGINE"
          | "COMMERCIAL_ENGINE"
      }
    commercialStrategy:
      R2CommercialPlaybookRecommendation & {
        basePrimaryTechnique:
          R2CommercialTechniqueId
        effectivePrimaryTechnique:
          R2CommercialTechniqueId
      }
    consortiumRecommendation:
      ConsortiumIntelligenceResult
    learningEvidence:
      R2LearningEvidence
    bestPatternEvidence:
      readonly BestCommercialPattern[]
    learningApplied: boolean
    warnings: readonly string[]
    missingData: readonly string[]
    explanation: string
    confidence:
      R2IntelligenceConfidence
    observability: Readonly<{
      commercialTechniqueIds:
        readonly R2CommercialTechniqueId[]
      consortiumCandidateId:
        string | null
      learningEvidenceCount:
        number
      generatedAt: string
    }>
  }>

export type ResolveR2IntelligenceInput =
  Readonly<{
    recommendationId?: string
    workspaceId: string
    opportunityId: string
    approachType:
      ConversationApproachType
    analysis: ManualWhatsAppAnalysis
    profile:
      ConsortiumCustomerProfile
    candidates: readonly Consortium[]
    commercialEvents:
      readonly CommercialEvent[]
    operationalAction?:
      R2OperationalActionContext | null
    hasAuthorizedSocialProof?:
      boolean
    hasVerifiedConsequence?:
      boolean
    now?: Date
  }>

function unique<T>(
  values: readonly T[],
): readonly T[] {
  return [...new Set(values)]
}

function learningContext(
  input: ResolveR2IntelligenceInput,
): R2LearningContext {
  return {
    approachType:
      input.approachType,
    stage: input.analysis.stage,
    intent: input.analysis.intent,
    assetCategory:
      input.profile.assetCategory,
    leadCategory: null,
  }
}

function isGuardrailBlocked(
  techniqueId:
    R2CommercialTechniqueId,
  input: ResolveR2IntelligenceInput,
): boolean {
  return (
    techniqueId === "social_proof" &&
    !input.hasAuthorizedSocialProof
  ) ||
    (
      (
        techniqueId ===
          "ethical_fomo" ||
        techniqueId ===
          "cost_of_inaction"
      ) &&
      !input.hasVerifiedConsequence
    )
}

function rankCommercialTechniques({
  base,
  input,
}: {
  base:
    R2CommercialPlaybookRecommendation
  input:
    ResolveR2IntelligenceInput
}): Readonly<{
  effectivePrimaryTechnique:
    R2CommercialTechniqueId
  evidence:
    R2LearningEvidence
  allEvidence:
    readonly R2LearningEvidence[]
}> {
  const techniqueIds =
    unique([
      base.primaryTechnique,
      ...base.supportingTechniques,
    ])
  const context =
    learningContext(input)
  const allEvidence =
    techniqueIds.map(
      (techniqueId) =>
        buildR2LearningEvidence({
          workspaceId:
            input.workspaceId,
          techniqueId,
          context,
          events:
            input.commercialEvents,
          guardrailBlocked:
            isGuardrailBlocked(
              techniqueId,
              input,
            ),
        }),
    )

  const ranked =
    techniqueIds
      .map(
        (
          techniqueId,
          index,
        ) => {
          const evidence =
            allEvidence[index]
          const baseScore =
            index === 0
              ? 1
              : Math.max(
                  0.65,
                  0.84 -
                    index * 0.03,
                )

          return {
            techniqueId,
            evidence,
            score:
              isGuardrailBlocked(
                techniqueId,
                input,
              )
                ? -1
                : baseScore +
                  evidence
                    .learningAdjustment,
          }
        },
      )
      .sort(
        (first, second) =>
          second.score -
            first.score ||
          techniqueIds.indexOf(
            first.techniqueId,
          ) -
            techniqueIds.indexOf(
              second.techniqueId,
            ),
      )

  const selected =
    ranked[0]

  return {
    effectivePrimaryTechnique:
      selected.techniqueId,
    evidence: selected.evidence,
    allEvidence,
  }
}

function resolveConfidence({
  requiresRecentContext,
  consortium,
  learning,
}: {
  requiresRecentContext: boolean
  consortium:
    ConsortiumIntelligenceResult
  learning: R2LearningEvidence
}): R2IntelligenceConfidence {
  if (requiresRecentContext) {
    return "INSUFFICIENT_DATA"
  }

  if (
    consortium.status ===
      "OPTIONS_AVAILABLE" &&
    learning.confidence === "HIGH"
  ) {
    return "HIGH"
  }

  if (
    consortium.status ===
      "INSUFFICIENT_DATA" ||
    consortium.status ===
      "NO_VERIFIED_OPTIONS"
  ) {
    return "LOW"
  }

  return "MEDIUM"
}

export function resolveR2Intelligence(
  input: ResolveR2IntelligenceInput,
): R2IntelligenceResult {
  if (
    !input.workspaceId.trim() ||
    !input.opportunityId.trim()
  ) {
    throw new Error(
      "Workspace e oportunidade são obrigatórios para o R2 Intelligence.",
    )
  }

  const now = input.now ?? new Date()
  const baseCommercial =
    buildR2CommercialPlaybookRecommendation({
      approachType:
        input.approachType,
      analysis: input.analysis,
    })
  const ranked =
    rankCommercialTechniques({
      base: baseCommercial,
      input,
    })
  const commercialStrategy = {
    ...baseCommercial,
    primaryTechnique:
      ranked.effectivePrimaryTechnique,
    basePrimaryTechnique:
      baseCommercial.primaryTechnique,
    effectivePrimaryTechnique:
      ranked.effectivePrimaryTechnique,
  }
  const consortiumRecommendation =
    evaluateConsortiumOptions({
      profile: input.profile,
      candidates: input.candidates,
      now,
    })
  const bestPatternEvidence =
    buildBestCommercialPatterns({
      workspaceId:
        input.workspaceId,
      context:
        learningContext(input),
      events:
        input.commercialEvents,
    })

  const warnings =
    unique([
      ...commercialStrategy.riskWarnings,
      ...consortiumRecommendation.warnings,
      ...consortiumRecommendation.candidates
        .flatMap(
          (candidate) =>
            candidate.ruleWarnings,
        ),
      ...(ranked.allEvidence.some(
        (evidence) =>
          evidence.status ===
          "GUARDRAIL_BLOCKED",
      )
        ? [
            "Guardrail comercial prevaleceu sobre evidência histórica.",
          ]
        : []),
    ])
  const missingData =
    unique([
      ...consortiumRecommendation
        .missingData,
      ...(commercialStrategy
        .requiresRecentContext
        ? ["recentConversationContext"]
        : []),
    ])
  const operationalAction =
    input.operationalAction
  const nextBestAction =
    operationalAction
      ? {
          ...operationalAction,
          source:
            "DECISION_ENGINE" as const,
        }
      : {
          id:
            `commercial-${input.opportunityId}`,
          title:
            commercialStrategy
              .recommendedAction,
          reason:
            commercialStrategy
              .reasoningSummary,
          source:
            "COMMERCIAL_ENGINE" as const,
        }
  const learningApplied =
    ranked.evidence.status ===
      "APPLIED" &&
    ranked.evidence
      .learningAdjustment !== 0
  const selectedConsortium =
    consortiumRecommendation
      .topOptions[0] ?? null
  const confidence =
    resolveConfidence({
      requiresRecentContext:
        commercialStrategy
          .requiresRecentContext,
      consortium:
        consortiumRecommendation,
      learning:
        ranked.evidence,
    })
  const explanation =
    commercialStrategy
      .requiresRecentContext
      ? "Peça o contexto recente antes de agir. Nenhuma mensagem ou opção de produto foi preparada sem essa informação."
      : [
          nextBestAction.title,
          commercialStrategy
            .reasoningSummary,
          consortiumRecommendation
            .explanation,
          ranked.evidence.explanation,
        ].join(" ")

  return {
    recommendationId:
      input.recommendationId ??
      globalThis.crypto.randomUUID(),
    opportunityId:
      input.opportunityId,
    workspaceId:
      input.workspaceId,
    stage: input.analysis.stage,
    intent: input.analysis.intent,
    nextBestAction,
    commercialStrategy,
    consortiumRecommendation,
    learningEvidence:
      ranked.evidence,
    bestPatternEvidence,
    learningApplied,
    warnings,
    missingData,
    explanation,
    confidence,
    observability: {
      commercialTechniqueIds:
        unique([
          commercialStrategy
            .effectivePrimaryTechnique,
          ...commercialStrategy
            .supportingTechniques,
          commercialStrategy
            .closingTechnique,
        ]),
      consortiumCandidateId:
        selectedConsortium
          ?.candidateId ?? null,
      learningEvidenceCount:
        ranked.evidence
          .observationCount,
      generatedAt:
        now.toISOString(),
    },
  }
}
