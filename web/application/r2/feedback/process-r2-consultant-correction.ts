import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  buildManualWhatsAppReply,
} from "@/application/opportunity/build-manual-whatsapp-reply"

import type {
  ConversationApproachType,
} from "@/application/opportunity/conversation/conversation-stage"

import {
  buildR2EvidenceContextFromMemory,
  checkR2DecisionSafety,
  processR2Evidence,
} from "@/application/r2/evidence"

import type {
  R2DecisionSafetyResult,
  R2EvidenceDecisionContext,
} from "@/application/r2/evidence"

import {
  resolveR2Intelligence,
} from "@/application/r2/resolve-r2-intelligence"

import type {
  ResolveR2IntelligenceInput,
  R2IntelligenceResult,
  R2OperationalActionContext,
} from "@/application/r2/resolve-r2-intelligence"

import type {
  CommercialEvent,
  Consortium,
} from "@/types/domain"

import type {
  R2CustomerBoundaryContext,
} from "@/application/r2/boundary"

import {
  applyR2ConsultantCorrectionToAnalysis,
} from "./r2-consultant-feedback"

import type {
  R2ConsultantCorrectionContext,
} from "./r2-consultant-feedback"

export type PreparedR2ConsultantCorrection = Readonly<{
  analysis: ManualWhatsAppAnalysis
  evidence: ReturnType<typeof processR2Evidence> | null
  evidenceContext: R2EvidenceDecisionContext
  proposedPathSafety: R2DecisionSafetyResult
  customerBoundary:
    R2CustomerBoundaryContext | null
}>

export type R2ConsultantCorrectionDecision = Readonly<{
  nextBestActions: readonly R2OperationalActionContext[]
  warnings: readonly string[]
  evidenceContext?: Readonly<{
    status: string
  }> | null
}>

export type RegeneratedR2ConsultantCorrection = Readonly<{
  analysis: ManualWhatsAppAnalysis
  evidence: ReturnType<typeof processR2Evidence> | null
  evidenceContext: R2EvidenceDecisionContext
  decision: R2ConsultantCorrectionDecision
  intelligence: R2IntelligenceResult
  reply: string | null
  safetyCheck: R2DecisionSafetyResult
}>

export function prepareR2ConsultantCorrection({
  opportunityId,
  subject,
  originalAnalysis,
  correction,
  consultantId,
  structuredFacts,
  factProvenance,
  now,
}: Readonly<{
  opportunityId: string
  subject: string
  originalAnalysis: ManualWhatsAppAnalysis
  correction: R2ConsultantCorrectionContext
  consultantId: string
  structuredFacts?: unknown
  factProvenance?: unknown
  now: Date
}>): PreparedR2ConsultantCorrection {
  const currentEvidence =
    buildR2EvidenceContextFromMemory(
      structuredFacts,
    )
  const evidence = correction.affectsEvidence
    ? processR2Evidence({
        opportunityId,
        subject,
        text: [
          correction.disagreementReason,
          correction.correctPath,
        ].join("\n"),
        sourceType: "CONSULTANT_INPUT",
        sourceReference:
          `consultant-feedback:${correction.feedbackId}`,
        actorId: consultantId,
        observedAt: now,
        receivedAt: now,
        structuredFacts,
        factProvenance,
        humanConfirmed: false,
      })
    : null
  const evidenceContext =
    evidence?.decisionContext ??
    currentEvidence

  return {
    analysis:
      applyR2ConsultantCorrectionToAnalysis(
        originalAnalysis,
        correction,
      ),
    evidence,
    evidenceContext,
    proposedPathSafety:
      checkR2DecisionSafety({
        decisionText: correction.correctPath,
        evidence: evidenceContext,
        customerBoundary:
          originalAnalysis.customerBoundary ?? null,
        decisionConsistency: {
          intent: originalAnalysis.intent,
          objective: correction.correctPath,
          technique:
            originalAnalysis.customerBoundary?.terminal
              ? "none"
              : null,
        },
      }),
    customerBoundary:
      originalAnalysis.customerBoundary ?? null,
  }
}

export async function regeneratePreparedR2ConsultantCorrection({
  prepared,
  correction,
  workspaceId,
  opportunityId,
  approachType,
  profile,
  candidates,
  commercialEvents,
  operationalAction,
  contactName,
  now,
  runDecisionEngine,
}: Readonly<{
  prepared: PreparedR2ConsultantCorrection
  correction: R2ConsultantCorrectionContext
  workspaceId: string
  opportunityId: string
  approachType: ConversationApproachType
  profile: ResolveR2IntelligenceInput["profile"]
  candidates: readonly Consortium[]
  commercialEvents: readonly CommercialEvent[]
  operationalAction?: R2OperationalActionContext | null
  contactName: string
  now: Date
  runDecisionEngine: (
    evidence: R2EvidenceDecisionContext,
  ) => Promise<R2ConsultantCorrectionDecision>
}>): Promise<RegeneratedR2ConsultantCorrection> {
  const decision = await runDecisionEngine(
    prepared.evidenceContext,
  )
  const intelligence = resolveR2Intelligence({
    workspaceId,
    opportunityId,
    approachType,
    analysis: prepared.analysis,
    profile,
    candidates,
    commercialEvents,
    operationalAction:
      decision.nextBestActions[0] ??
      operationalAction ??
      null,
    consultantCorrectionContext:
      correction,
    now,
  })
  const candidateReply =
    buildManualWhatsAppReply({
      contactName,
      incomingMessage:
        correction.correctPath,
      approachType,
      analysis: prepared.analysis,
    })
  const safetyCheck =
    checkR2DecisionSafety({
      decisionText: [
        intelligence.nextBestAction.title,
        intelligence.commercialStrategy.suggestedNextStep,
        intelligence.commercialStrategy.suggestedQuestion,
        candidateReply,
      ].filter(
        (value): value is string =>
          typeof value === "string" &&
          Boolean(value.trim()),
      ).join(" "),
      evidence:
        prepared.evidenceContext,
      customerBoundary:
        prepared.customerBoundary,
      decisionConsistency: {
        signal:
          prepared.customerBoundary?.signal,
        intent:
          intelligence.intent,
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

  return {
    analysis: prepared.analysis,
    evidence: prepared.evidence,
    evidenceContext:
      prepared.evidenceContext,
    decision,
    intelligence,
    reply: safetyCheck.safeToPresent
      ? candidateReply
      : null,
    safetyCheck,
  }
}
