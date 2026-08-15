import {
  R2_COMMERCIAL_TECHNIQUE_LIBRARY,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  R2CommercialTechniqueId,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  CommercialEvent,
} from "@/types/domain"

import type {
  R2LearningOutcome,
} from "./build-r2-learning-observation"

export const MIN_OBSERVATIONS_FOR_ADAPTATION =
  10

export const MAX_LEARNING_ADJUSTMENT =
  0.2

export type R2LearningContext = Readonly<{
  approachType?: string | null
  stage?: string | null
  intent?: string | null
  assetCategory?: string | null
  leadCategory?: string | null
}>

export type R2LearningEvidenceStatus =
  | "NO_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "APPLIED"
  | "GUARDRAIL_BLOCKED"

export type R2LearningConfidence =
  | "INSUFFICIENT_DATA"
  | "MEDIUM"
  | "HIGH"

export type R2LearningEvidence = Readonly<{
  techniqueId: R2CommercialTechniqueId
  status: R2LearningEvidenceStatus
  confidence: R2LearningConfidence
  observationCount: number
  automaticOutcomeCount: number
  consultantFeedbackCandidateCount: number
  outcomeSummary:
    Readonly<Partial<Record<R2LearningOutcome, number>>>
  smoothedPerformance: number
  sampleConfidence: number
  contextSimilarity: number
  learningAdjustment: number
  explanation: string
}>

type NormalizedLearningObservation = Readonly<{
  eventId: string
  workspaceId: string
  journeyId: string
  consultantId: string | null
  techniqueId: R2CommercialTechniqueId
  context: R2LearningContext
  outcome: R2LearningOutcome
  occurredAt: number
}>

const OUTCOME_WEIGHT:
  Readonly<Record<R2LearningOutcome, number>> = {
    NO_RESPONSE: -0.45,
    POSITIVE_RESPONSE: 0.25,
    NEGATIVE_RESPONSE: -0.55,
    FOLLOW_UP_SCHEDULED: 0.15,
    MEETING_SCHEDULED: 0.5,
    PROPOSAL_SENT: 0.7,
    SALE_COMPLETED: 1,
    LOST: -1,
    OTHER: 0,
  }

const AUTOMATIC_OUTCOME_BY_EVENT:
  Readonly<Partial<Record<CommercialEvent["type"], R2LearningOutcome>>> = {
    MEETING_SCHEDULED:
      "MEETING_SCHEDULED",
    MEETING_COMPLETED:
      "MEETING_SCHEDULED",
    PROPOSAL_SENT:
      "PROPOSAL_SENT",
    PROPOSAL_ACCEPTED:
      "PROPOSAL_SENT",
    SALE_COMPLETED:
      "SALE_COMPLETED",
  }

const OUTCOME_PRIORITY:
  Readonly<Record<R2LearningOutcome, number>> = {
    NO_RESPONSE: 1,
    NEGATIVE_RESPONSE: 2,
    OTHER: 3,
    FOLLOW_UP_SCHEDULED: 4,
    POSITIVE_RESPONSE: 5,
    MEETING_SCHEDULED: 6,
    PROPOSAL_SENT: 7,
    LOST: 8,
    SALE_COMPLETED: 9,
  }

const TECHNIQUE_IDS =
  new Set<R2CommercialTechniqueId>(
    R2_COMMERCIAL_TECHNIQUE_LIBRARY.map(
      (technique) =>
        technique.id,
    ),
  )

function optionalText(
  value: unknown,
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null
}

function isTechniqueId(
  value: unknown,
): value is R2CommercialTechniqueId {
  return typeof value === "string" &&
    TECHNIQUE_IDS.has(
      value as R2CommercialTechniqueId,
    )
}

function isLearningOutcome(
  value: unknown,
): value is R2LearningOutcome {
  return typeof value === "string" &&
    value in OUTCOME_WEIGHT
}

function eventTime(
  event: CommercialEvent,
): number {
  const time =
    new Date(
      event.occurredAt,
    ).getTime()

  return Number.isFinite(time)
    ? time
    : 0
}

function normalizeObservation(
  event: CommercialEvent,
): NormalizedLearningObservation | null {
  if (
    event.type !== "NOTE_ADDED" ||
    event.payload.category !==
      "r2_learning_observation_recorded" ||
    !isTechniqueId(
      event.payload
        .recommendedPrimaryTechnique,
    ) ||
    !isLearningOutcome(
      event.payload.outcome,
    )
  ) {
    return null
  }

  return {
    eventId: event.id,
    workspaceId:
      event.workspaceId,
    journeyId:
      event.journeyId,
    consultantId:
      optionalText(
        event.payload.consultantId,
      ),
    techniqueId:
      event.payload
        .recommendedPrimaryTechnique,
    context: {
      approachType:
        optionalText(
          event.payload.approachType,
        ),
      stage:
        optionalText(
          event.payload.stage,
        ),
      intent:
        optionalText(
          event.payload.intent,
        ),
      assetCategory:
        optionalText(
          event.payload.assetCategory,
        ),
      leadCategory:
        optionalText(
          event.payload.leadCategory,
        ),
    },
    outcome:
      event.payload.outcome,
    occurredAt:
      eventTime(event),
  }
}

function isConsultantFeedbackCandidate(
  event: CommercialEvent,
  techniqueId: R2CommercialTechniqueId,
): boolean {
  if (
    event.type !== "NOTE_ADDED" ||
    event.payload.category !== "r2_consultant_feedback" ||
    event.payload.learningStatus !== "LEARNING_CANDIDATE" ||
    event.payload.automaticGlobalModelUpdate !== false
  ) {
    return false
  }

  const techniqueIds =
    event.payload.commercialTechniqueIds

  return Array.isArray(techniqueIds) &&
    techniqueIds.includes(techniqueId)
}

function matchesContext(
  observation:
    NormalizedLearningObservation,
  requested: R2LearningContext,
): boolean {
  const dimensions = [
    "approachType",
    "stage",
    "intent",
    "assetCategory",
    "leadCategory",
  ] as const

  return dimensions.every(
    (dimension) => {
      const expected =
        optionalText(
          requested[dimension],
        )

      return expected === null ||
        observation.context[
          dimension
        ] === expected
    },
  )
}

function automaticOutcome(
  event: CommercialEvent,
): R2LearningOutcome | null {
  const mapped =
    AUTOMATIC_OUTCOME_BY_EVENT[
      event.type
    ]

  if (mapped) {
    return mapped
  }

  if (
    event.type ===
      "STATE_CHANGED" &&
    event.payload.category ===
      "opportunity_lost"
  ) {
    return "LOST"
  }

  return null
}

function strongestOutcome(
  initial: R2LearningOutcome,
  automaticEvents:
    readonly CommercialEvent[],
): R2LearningOutcome {
  return automaticEvents.reduce(
    (current, event) => {
      const candidate =
        automaticOutcome(event)

      if (!candidate) {
        return current
      }

      return OUTCOME_PRIORITY[
        candidate
      ] >
        OUTCOME_PRIORITY[current]
        ? candidate
        : current
    },
    initial,
  )
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    max,
    Math.max(min, value),
  )
}

function round(
  value: number,
): number {
  return Math.round(value * 10000) /
    10000
}

export type BuildR2LearningEvidenceInput =
  Readonly<{
    workspaceId: string
    techniqueId:
      R2CommercialTechniqueId
    context: R2LearningContext
    events: readonly CommercialEvent[]
    guardrailBlocked?: boolean
  }>

export function buildR2LearningEvidence({
  workspaceId,
  techniqueId,
  context,
  events,
  guardrailBlocked = false,
}: BuildR2LearningEvidenceInput): R2LearningEvidence {
  const normalizedWorkspaceId =
    workspaceId.trim()

  if (!normalizedWorkspaceId) {
    throw new Error(
      "workspaceId é obrigatório para agregar aprendizado.",
    )
  }

  const uniqueEvents =
    [
      ...new Map(
        events.map(
          (event) => [
            event.id,
            event,
          ],
        ),
      ).values(),
    ].filter(
      (event) =>
        event.workspaceId ===
        normalizedWorkspaceId,
    )

  const observations =
    uniqueEvents
      .map(normalizeObservation)
      .filter(
        (
          observation,
        ): observation is NormalizedLearningObservation =>
          observation !== null &&
          observation.techniqueId ===
            techniqueId &&
          matchesContext(
            observation,
            context,
          ),
      )

  const consultantFeedbackCandidateCount =
    uniqueEvents.filter(
      (event) =>
        isConsultantFeedbackCandidate(
          event,
          techniqueId,
        ),
    ).length

  const outcomeSummary:
    Partial<Record<R2LearningOutcome, number>> =
      {}

  let automaticOutcomeCount = 0
  let normalizedOutcomeSum = 0

  for (const observation of observations) {
    const relatedAutomaticEvents =
      uniqueEvents.filter(
        (event) =>
          event.journeyId ===
            observation.journeyId &&
          event.id !==
            observation.eventId &&
          eventTime(event) >=
            observation.occurredAt &&
          automaticOutcome(event) !==
            null,
      )

    automaticOutcomeCount +=
      relatedAutomaticEvents.length

    const outcome =
      strongestOutcome(
        observation.outcome,
        relatedAutomaticEvents,
      )

    outcomeSummary[outcome] =
      (outcomeSummary[outcome] ?? 0) +
      1

    normalizedOutcomeSum +=
      (OUTCOME_WEIGHT[outcome] + 1) /
      2
  }

  const observationCount =
    observations.length
  const sampleConfidence =
    round(
      Math.min(
        1,
        observationCount / 30,
      ),
    )

  const smoothedPerformance =
    round(
      (
        normalizedOutcomeSum + 2
      ) /
        (
          observationCount + 4
        ),
    )

  const enoughEvidence =
    observationCount >=
      MIN_OBSERVATIONS_FOR_ADAPTATION

  const rawAdjustment =
    (
      smoothedPerformance - 0.5
    ) *
    0.4 *
    sampleConfidence

  const learningAdjustment =
    enoughEvidence &&
    !guardrailBlocked
      ? round(
          clamp(
            rawAdjustment,
            -MAX_LEARNING_ADJUSTMENT,
            MAX_LEARNING_ADJUSTMENT,
          ),
        )
      : 0

  const status:
    R2LearningEvidenceStatus =
      guardrailBlocked
        ? "GUARDRAIL_BLOCKED"
        : observationCount === 0
          ? "NO_EVIDENCE"
          : enoughEvidence
            ? "APPLIED"
            : "INSUFFICIENT_EVIDENCE"

  const confidence:
    R2LearningConfidence =
      enoughEvidence
        ? observationCount >= 30
          ? "HIGH"
          : "MEDIUM"
        : "INSUFFICIENT_DATA"

  const baseExplanation =
    guardrailBlocked
      ? "O guardrail prevalece; evidência histórica não pode liberar comportamento inseguro."
      : enoughEvidence
        ? "Em atendimentos semelhantes, esta abordagem possui evidência interna suficiente para um ajuste conservador de ranking."
        : observationCount > 0
          ? "Existe um sinal interno, mas ainda sem evidência suficiente para alterar a recomendação-base."
          : "Não existem observações comparáveis para esta técnica e contexto."

  const explanation =
    consultantFeedbackCandidateCount > 0
      ? `${baseExplanation} Há ${consultantFeedbackCandidateCount} feedback(s) de consultor aguardando revisão; eles não alteram o ranking automaticamente.`
      : baseExplanation

  return {
    techniqueId,
    status,
    confidence,
    observationCount,
    automaticOutcomeCount,
    consultantFeedbackCandidateCount,
    outcomeSummary,
    smoothedPerformance,
    sampleConfidence,
    contextSimilarity:
      observationCount > 0
        ? 1
        : 0,
    learningAdjustment,
    explanation,
  }
}

export type BestCommercialPattern = Readonly<{
  techniqueId: R2CommercialTechniqueId
  score: number
  confidence: R2LearningConfidence
  observationCount: number
  outcomeSummary:
    R2LearningEvidence["outcomeSummary"]
  learningAdjustment: number
}>

export function buildBestCommercialPatterns(
  input: Omit<
    BuildR2LearningEvidenceInput,
    "techniqueId" | "guardrailBlocked"
  >,
): readonly BestCommercialPattern[] {
  return R2_COMMERCIAL_TECHNIQUE_LIBRARY
    .map(
      ({ id }) =>
        buildR2LearningEvidence({
          ...input,
          techniqueId: id,
        }),
    )
    .filter(
      (evidence) =>
        evidence.status ===
        "APPLIED",
    )
    .map(
      (evidence) => ({
        techniqueId:
          evidence.techniqueId,
        score:
          evidence.smoothedPerformance,
        confidence:
          evidence.confidence,
        observationCount:
          evidence.observationCount,
        outcomeSummary:
          evidence.outcomeSummary,
        learningAdjustment:
          evidence.learningAdjustment,
      }),
    )
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.observationCount -
          first.observationCount ||
        first.techniqueId.localeCompare(
          second.techniqueId,
        ),
    )
}
