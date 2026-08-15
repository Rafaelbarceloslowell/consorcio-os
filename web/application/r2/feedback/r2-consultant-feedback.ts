import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

export const R2_CONSULTANT_FEEDBACK_ERROR_CATEGORIES = [
  "MISREAD_CONTEXT",
  "MISSED_MEMORY",
  "WRONG_FACT",
  "WRONG_COMMERCIAL_STRATEGY",
  "WRONG_NEXT_ACTION",
  "OUTDATED_INFORMATION",
  "BAD_RESPONSE",
  "UNSUPPORTED_ASSUMPTION",
  "PRODUCT_RULE_ERROR",
  "EVIDENCE_INTERPRETATION_ERROR",
  "CONSULTANT_PREFERENCE",
  "OTHER",
] as const

export type R2ConsultantFeedbackErrorCategory =
  typeof R2_CONSULTANT_FEEDBACK_ERROR_CATEGORIES[number]

export type R2ConsultantCorrectionType =
  | "FACT_CORRECTION"
  | "CONTEXT_CORRECTION"
  | "STRATEGY_CORRECTION"
  | "NEXT_ACTION_CORRECTION"
  | "RESPONSE_CORRECTION"
  | "PRODUCT_RULE_CORRECTION"
  | "CONSULTANT_PREFERENCE"
  | "OTHER"

export type R2ConsultantFeedbackAction =
  | "ACCEPT"
  | "DISAGREE"
  | "OUTCOME"

export type R2ConsultantCorrectionOutcome =
  | "WORKED"
  | "PARTIALLY_WORKED"
  | "DID_NOT_WORK"
  | "UNKNOWN"

export type R2ConsultantCorrectionContext =
  Readonly<{
    feedbackId: string
    originalRecommendationId: string
    errorCategory: R2ConsultantFeedbackErrorCategory
    correctionType: R2ConsultantCorrectionType
    disagreementReason: string
    correctPath: string
    affectsEvidence: boolean
    consultantReportsCustomerConfirmation: boolean
    scope: "CASE_CORRECTION"
    learningStatus: "LEARNING_CANDIDATE"
    reviewStatus: "PENDING_HUMAN_REVIEW"
    automaticGlobalModelUpdate: false
  }>

export type R2ConsultantFeedback =
  | Readonly<{
      action: "ACCEPT"
      recommendationId: string
      idempotencyKey: string
    }>
  | Readonly<{
      action: "DISAGREE"
      recommendationId: string
      idempotencyKey: string
      errorCategory: R2ConsultantFeedbackErrorCategory
      disagreementReason: string
      correctPath: string
    }>
  | Readonly<{
      action: "OUTCOME"
      recommendationId: string
      idempotencyKey: string
      feedbackId: string
      outcome: R2ConsultantCorrectionOutcome
    }>

const OUTCOMES = new Set<R2ConsultantCorrectionOutcome>([
  "WORKED",
  "PARTIALLY_WORKED",
  "DID_NOT_WORK",
  "UNKNOWN",
])

function requiredText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`${field} é obrigatório.`)
  }

  const normalized = value
    .replace(/\r\n?/gu, "\n")
    .trim()

  if (!normalized) {
    throw new Error(`${field} é obrigatório.`)
  }

  if (normalized.length > maxLength) {
    throw new Error(
      `${field} deve ter no máximo ${maxLength} caracteres.`,
    )
  }

  return normalized
}

function isErrorCategory(
  value: unknown,
): value is R2ConsultantFeedbackErrorCategory {
  return typeof value === "string" &&
    (
      R2_CONSULTANT_FEEDBACK_ERROR_CATEGORIES as
        readonly string[]
    ).includes(value)
}

export function parseR2ConsultantFeedback(
  value: unknown,
): R2ConsultantFeedback {
  if (typeof value !== "object" || value === null) {
    throw new Error("O feedback é obrigatório.")
  }

  const body = value as Record<string, unknown>
  const action = body.action
  const recommendationId = requiredText(
    body.recommendationId,
    "recommendationId",
    200,
  )
  const idempotencyKey = requiredText(
    body.idempotencyKey,
    "idempotencyKey",
    200,
  )

  if (!/^[a-zA-Z0-9._:-]+$/u.test(idempotencyKey)) {
    throw new Error("idempotencyKey possui formato inválido.")
  }

  if (action === "ACCEPT") {
    return {
      action,
      recommendationId,
      idempotencyKey,
    }
  }

  if (action === "DISAGREE") {
    if (!isErrorCategory(body.errorCategory)) {
      throw new Error("Tipo do erro é obrigatório.")
    }

    return {
      action,
      recommendationId,
      idempotencyKey,
      errorCategory: body.errorCategory,
      disagreementReason: requiredText(
        body.disagreementReason,
        "Onde o R2 errou",
        3000,
      ),
      correctPath: requiredText(
        body.correctPath,
        "Caminho correto",
        3000,
      ),
    }
  }

  if (action === "OUTCOME") {
    const outcome = body.outcome

    if (typeof outcome !== "string" || !OUTCOMES.has(
      outcome as R2ConsultantCorrectionOutcome,
    )) {
      throw new Error("Resultado da correção é inválido.")
    }

    return {
      action,
      recommendationId,
      idempotencyKey,
      feedbackId: requiredText(
        body.feedbackId,
        "feedbackId",
        200,
      ),
      outcome: outcome as R2ConsultantCorrectionOutcome,
    }
  }

  throw new Error("Ação de feedback inválida.")
}

export function correctionTypeFor(
  category: R2ConsultantFeedbackErrorCategory,
): R2ConsultantCorrectionType {
  switch (category) {
    case "WRONG_FACT":
    case "OUTDATED_INFORMATION":
    case "UNSUPPORTED_ASSUMPTION":
    case "EVIDENCE_INTERPRETATION_ERROR":
      return "FACT_CORRECTION"

    case "MISREAD_CONTEXT":
    case "MISSED_MEMORY":
      return "CONTEXT_CORRECTION"

    case "WRONG_COMMERCIAL_STRATEGY":
      return "STRATEGY_CORRECTION"

    case "WRONG_NEXT_ACTION":
      return "NEXT_ACTION_CORRECTION"

    case "BAD_RESPONSE":
      return "RESPONSE_CORRECTION"

    case "PRODUCT_RULE_ERROR":
      return "PRODUCT_RULE_CORRECTION"

    case "CONSULTANT_PREFERENCE":
      return "CONSULTANT_PREFERENCE"

    case "OTHER":
      return "OTHER"
  }
}

function reportsCustomerConfirmation(
  text: string,
): boolean {
  const normalized = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")

  return /\b(cliente|ele|ela)\b.{0,60}\b(confirmou|informou)\b/u.test(normalized) ||
    /\bconfirmou agora (?:por telefone|na conversa|no whatsapp)\b/u.test(normalized)
}

export function buildR2ConsultantCorrectionContext(
  feedback: Extract<R2ConsultantFeedback, { action: "DISAGREE" }>,
  feedbackId: string,
): R2ConsultantCorrectionContext {
  const correctionType = correctionTypeFor(
    feedback.errorCategory,
  )
  const combined = [
    feedback.disagreementReason,
    feedback.correctPath,
  ].join("\n")

  return {
    feedbackId,
    originalRecommendationId:
      feedback.recommendationId,
    errorCategory:
      feedback.errorCategory,
    correctionType,
    disagreementReason:
      feedback.disagreementReason,
    correctPath:
      feedback.correctPath,
    affectsEvidence:
      correctionType === "FACT_CORRECTION" ||
      correctionType === "CONTEXT_CORRECTION",
    consultantReportsCustomerConfirmation:
      reportsCustomerConfirmation(combined),
    scope: "CASE_CORRECTION",
    learningStatus: "LEARNING_CANDIDATE",
    reviewStatus: "PENDING_HUMAN_REVIEW",
    automaticGlobalModelUpdate: false,
  }
}

function normalizedDirection(
  context: R2ConsultantCorrectionContext,
): string {
  return context.correctPath
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
}

export function applyR2ConsultantCorrectionToAnalysis(
  analysis: ManualWhatsAppAnalysis,
  context: R2ConsultantCorrectionContext,
): ManualWhatsAppAnalysis {
  if (analysis.customerBoundary?.terminal) {
    return analysis
  }

  const direction = normalizedDirection(context)
  const wantsComparison =
    /\b(comparar|compare|opcoes|cenarios|estruturas|composicao)\b/u.test(direction)
  const wantsMeeting =
    /\b(reuniao|agendar|agenda|conduzir para reuniao)\b/u.test(direction)
  const wantsFollowUp =
    /\b(follow.?up|retomar|retorno|acompanhar)\b/u.test(direction)

  if (
    wantsComparison ||
    context.correctionType === "STRATEGY_CORRECTION" ||
    context.errorCategory === "MISSED_MEMORY"
  ) {
    return {
      ...analysis,
      intent: "interested",
      stage: "strategy",
      label: "Contexto corrigido pelo consultor",
      summary:
        "A qualificação já disponível deve ser reutilizada; o caso avançou para comparação e estratégia.",
      recommendedAction: wantsMeeting
        ? "Comparar cenários coerentes e conduzir para uma reunião de definição."
        : "Comparar cenários coerentes e recomendar o próximo passo sem repetir qualificação conhecida.",
    }
  }

  if (wantsMeeting) {
    return {
      ...analysis,
      intent: "meeting_interest",
      stage: "call_to_action",
      label: "Próximo passo corrigido",
      summary:
        "O contexto corrigido indica que o próximo passo é uma conversa de definição.",
      recommendedAction:
        "Propor uma reunião objetiva e confirmar disponibilidade.",
    }
  }

  if (wantsFollowUp) {
    return {
      ...analysis,
      stage: "follow_up",
      label: "Acompanhamento corrigido",
      summary:
        "A correção indica acompanhamento contextual, sem reiniciar a descoberta.",
      recommendedAction:
        "Retomar o combinado e confirmar se o projeto continua no momento adequado.",
    }
  }

  return {
    ...analysis,
    label: "Correção supervisionada",
    summary:
      context.correctionType === "FACT_CORRECTION"
        ? "Uma correção factual foi reavaliada pelo Evidence Layer antes da nova recomendação."
        : "O contexto do caso foi reavaliado sem transformar a opinião do consultor em regra global.",
  }
}

export function feedbackEventId(
  idempotencyKey: string,
): string {
  return `r2-feedback-${idempotencyKey}`
}

export function feedbackOutcomeEventId(
  idempotencyKey: string,
): string {
  return `r2-feedback-outcome-${idempotencyKey}`
}

export function feedbackRevisionEventId(
  idempotencyKey: string,
): string {
  return `r2-feedback-revision-${idempotencyKey}`
}

export function feedbackRegenerationFailureEventId(
  idempotencyKey: string,
): string {
  return `r2-feedback-failure-${idempotencyKey}`
}
