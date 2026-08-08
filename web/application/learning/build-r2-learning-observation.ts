import {
  R2_COMMERCIAL_TECHNIQUE_LIBRARY,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  R2CommercialTechniqueId,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

export const R2_LEARNING_OUTCOMES = [
  "NO_RESPONSE",
  "POSITIVE_RESPONSE",
  "NEGATIVE_RESPONSE",
  "FOLLOW_UP_SCHEDULED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "SALE_COMPLETED",
  "LOST",
  "OTHER",
] as const

export type R2LearningOutcome =
  typeof R2_LEARNING_OUTCOMES[number]

export type R2LearningSignal =
  | "NO_RESPONSE"
  | "POSITIVE"
  | "NEGATIVE"
  | "NEUTRAL"
  | "UNKNOWN"

export type R2LearningReviewStatus =
  "PENDING_HUMAN_REVIEW"

export type BuildR2LearningObservationInput =
  Readonly<{
    opportunityId: string
    consultantId: string
    contactName: string
    sourceIncomingMessage?:
      | string
      | null
    originalSuggestion: string
    finalSentMessage: string
    customerResponse?:
      | string
      | null
    outcome: R2LearningOutcome
    approachType?: string | null
    assetCategory?: string | null
    leadCategory?: string | null
    recommendedPrimaryTechnique?:
      R2CommercialTechniqueId | null
    recommendedSupportingTechniques?:
      readonly R2CommercialTechniqueId[]
    recommendedClosingTechnique?:
      R2CommercialTechniqueId | null
    intent?: string | null
    stage?: string | null
    goal?: string | null
    notes?: string | null
    recordedAt?: Date
  }>

export type R2LearningObservation =
  Readonly<{
    schemaVersion: "1.0"
    opportunityId: string
    consultantId: string
    contactName: string
    sourceIncomingMessage: string | null
    originalSuggestion: string
    finalSentMessage: string
    customerResponse: string | null
    outcome: R2LearningOutcome
    approachType: string | null
    assetCategory: string | null
    leadCategory: string | null
    recommendedPrimaryTechnique:
      R2CommercialTechniqueId | null
    recommendedSupportingTechniques:
      readonly R2CommercialTechniqueId[]
    recommendedClosingTechnique:
      R2CommercialTechniqueId | null
    signal: R2LearningSignal
    consultantEdited: boolean
    customerResponded: boolean
    intent: string | null
    stage: string | null
    goal: string | null
    notes: string | null
    reviewStatus:
      R2LearningReviewStatus
    humanReviewRequired: true
    automaticModelUpdateApplied: false
    recordedAt: string
  }>

function normalizeRequiredText(
  value: string,
  field: string,
  maxLength: number,
): string {
  const normalized =
    value
      .replace(/\r\n?/gu, "\n")
      .trim()

  if (!normalized) {
    throw new Error(
      `${field} é obrigatório.`,
    )
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new Error(
      `${field} deve ter no máximo ${maxLength} caracteres.`,
    )
  }

  return normalized
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined,
  field: string,
  maxLength: number,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const normalized =
    value
      .replace(/\r\n?/gu, "\n")
      .trim()

  if (!normalized) {
    return null
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new Error(
      `${field} deve ter no máximo ${maxLength} caracteres.`,
    )
  }

  return normalized
}

function normalizeForComparison(
  value: string,
): string {
  return value
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim()
}

function isLearningOutcome(
  value: string,
): value is R2LearningOutcome {
  return (
    R2_LEARNING_OUTCOMES as
      readonly string[]
  ).includes(value)
}

const R2_TECHNIQUE_IDS =
  new Set<R2CommercialTechniqueId>(
    R2_COMMERCIAL_TECHNIQUE_LIBRARY.map(
      (technique) =>
        technique.id,
    ),
  )

function normalizeTechnique(
  value:
    | R2CommercialTechniqueId
    | null
    | undefined,
  field: string,
): R2CommercialTechniqueId | null {
  if (value === null || value === undefined) {
    return null
  }

  if (!R2_TECHNIQUE_IDS.has(value)) {
    throw new Error(
      `${field} contém uma técnica comercial inválida.`,
    )
  }

  return value
}

function normalizeTechniques(
  values:
    readonly R2CommercialTechniqueId[] |
    undefined,
): readonly R2CommercialTechniqueId[] {
  if (!values) {
    return []
  }

  return [
    ...new Set(
      values.map(
        (value) => {
          const technique =
            normalizeTechnique(
              value,
              "Técnicas de apoio",
            )

          if (!technique) {
            throw new Error(
              "Técnicas de apoio contêm um valor vazio.",
            )
          }

          return technique
        },
      ),
    ),
  ]
}

function mapSignal(
  outcome: R2LearningOutcome,
): R2LearningSignal {
  switch (outcome) {
    case "NO_RESPONSE":
      return "NO_RESPONSE"

    case "POSITIVE_RESPONSE":
    case "MEETING_SCHEDULED":
    case "PROPOSAL_SENT":
    case "SALE_COMPLETED":
      return "POSITIVE"

    case "NEGATIVE_RESPONSE":
    case "LOST":
      return "NEGATIVE"

    case "FOLLOW_UP_SCHEDULED":
      return "NEUTRAL"

    case "OTHER":
      return "UNKNOWN"
  }
}

export function buildR2LearningObservation(
  input:
    BuildR2LearningObservationInput,
): R2LearningObservation {
  const opportunityId =
    normalizeRequiredText(
      input.opportunityId,
      "opportunityId",
      200,
    )

  const consultantId =
    normalizeRequiredText(
      input.consultantId,
      "consultantId",
      200,
    )

  const contactName =
    normalizeRequiredText(
      input.contactName,
      "Nome do contato",
      200,
    )

  const sourceIncomingMessage =
    normalizeOptionalText(
      input.sourceIncomingMessage,
      "Contexto recebido",
      5000,
    )

  const originalSuggestion =
    normalizeRequiredText(
      input.originalSuggestion,
      "Sugestão original do R2",
      5000,
    )

  const finalSentMessage =
    normalizeRequiredText(
      input.finalSentMessage,
      "Mensagem realmente enviada",
      5000,
    )

  if (
    !isLearningOutcome(
      input.outcome,
    )
  ) {
    throw new Error(
      "Resultado comercial inválido.",
    )
  }

  const customerResponse =
    normalizeOptionalText(
      input.customerResponse,
      "Resposta do cliente",
      5000,
    )

  const customerResponded =
    input.outcome !==
    "NO_RESPONSE"

  if (
    customerResponded &&
    customerResponse === null
  ) {
    throw new Error(
      "Informe a resposta do cliente para este resultado.",
    )
  }

  if (
    !customerResponded &&
    customerResponse !== null
  ) {
    throw new Error(
      "O resultado sem resposta não pode conter uma resposta do cliente.",
    )
  }

  const intent =
    normalizeOptionalText(
      input.intent,
      "Intenção",
      100,
    )

  const stage =
    normalizeOptionalText(
      input.stage,
      "Estágio",
      100,
    )

  const goal =
    normalizeOptionalText(
      input.goal,
      "Objetivo",
      100,
    )

  const notes =
    normalizeOptionalText(
      input.notes,
      "Observações",
      2000,
    )

  const approachType =
    normalizeOptionalText(
      input.approachType,
      "Tipo de abordagem",
      100,
    )

  const assetCategory =
    normalizeOptionalText(
      input.assetCategory,
      "Categoria do bem",
      100,
    )

  const leadCategory =
    normalizeOptionalText(
      input.leadCategory,
      "Categoria do lead",
      100,
    )

  const recommendedPrimaryTechnique =
    normalizeTechnique(
      input.recommendedPrimaryTechnique,
      "Técnica principal",
    )

  const recommendedSupportingTechniques =
    normalizeTechniques(
      input.recommendedSupportingTechniques,
    )

  const recommendedClosingTechnique =
    normalizeTechnique(
      input.recommendedClosingTechnique,
      "Técnica de fechamento",
    )

  if (
    input.outcome === "LOST" &&
    notes === null
  ) {
    throw new Error(
      "Informe o motivo da perda.",
    )
  }

  const recordedAt =
    input.recordedAt ??
    new Date()

  if (
    Number.isNaN(
      recordedAt.getTime(),
    )
  ) {
    throw new Error(
      "Data do registro inválida.",
    )
  }

  return {
    schemaVersion:
      "1.0",
    opportunityId,
    consultantId,
    contactName,
    sourceIncomingMessage,
    originalSuggestion,
    finalSentMessage,
    customerResponse,
    outcome:
      input.outcome,
    approachType,
    assetCategory,
    leadCategory,
    recommendedPrimaryTechnique,
    recommendedSupportingTechniques,
    recommendedClosingTechnique,
    signal:
      mapSignal(
        input.outcome,
      ),
    consultantEdited:
      normalizeForComparison(
        originalSuggestion,
      ) !==
      normalizeForComparison(
        finalSentMessage,
      ),
    customerResponded,
    intent,
    stage,
    goal,
    notes,
    reviewStatus:
      "PENDING_HUMAN_REVIEW",
    humanReviewRequired:
      true,
    automaticModelUpdateApplied:
      false,
    recordedAt:
      recordedAt.toISOString(),
  }
}
