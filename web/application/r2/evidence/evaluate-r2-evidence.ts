import type {
  R2DecisionSensitivity,
  R2EvidenceAssessment,
  R2EvidenceClaim,
  R2EvidenceConfidence,
  R2EvidenceDecisionContext,
  R2EvidenceMemory,
  R2EvidenceMemoryClaim,
  R2EvidenceSourceType,
} from "./types"

export type EvaluateR2EvidenceInput =
  Readonly<{
    claim: R2EvidenceClaim | null
    memory?: R2EvidenceMemory | null
    humanConfirmed?: boolean
  }>

const SENSITIVITY_RANK: Readonly<Record<R2DecisionSensitivity, number>> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
}

const OUTCOME_RANK = {
  PASS: 0,
  PASS_WITH_WARNING: 1,
  NEED_MORE_EVIDENCE: 2,
  HUMAN_CONFIRMATION_REQUIRED: 3,
  BLOCKED: 4,
} as const

const STATUS_RANK = {
  CONFIRMED: 0,
  SUPPORTED: 1,
  UNVERIFIED: 2,
  UNKNOWN: 3,
  CONFLICTING: 4,
} as const

const CONFIDENCE_RANK = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
} as const

function sourceReliability(
  sourceType: R2EvidenceSourceType,
): R2EvidenceConfidence {
  switch (sourceType) {
    case "OFFICIAL_SOURCE":
    case "DOCUMENT":
    case "EXTERNAL_SYSTEM":
    case "CRM":
    case "CALCULATION":
    case "CUSTOMER_MESSAGE":
      return "HIGH"

    case "CONSULTANT_INPUT":
    case "MEMORY":
    case "SYSTEM_GENERATED":
      return "MEDIUM"

    case "R2_INFERENCE":
      return "LOW"
  }
}

function currentClaim(
  memory: R2EvidenceMemory | null | undefined,
  key: string,
): R2EvidenceMemoryClaim | null {
  const claimId = memory?.currentClaimByKey[key]

  if (!claimId) {
    return null
  }

  return memory?.claims.find(
    (claim) => claim.id === claimId,
  ) ?? null
}

function sameValue(
  first: R2EvidenceClaim,
  second: R2EvidenceClaim,
): boolean {
  return first.normalizedValue === second.normalizedValue &&
    first.unit === second.unit
}

function wasConfirmationRequested(
  memory: R2EvidenceMemory | null | undefined,
  key: string,
): boolean {
  return Boolean(
    memory?.confirmationRequests[key] &&
    !memory.resolvedConfirmations[key],
  )
}

function unknownAssessment(): R2EvidenceAssessment {
  return {
    claim: null,
    evidenceStatus: "UNKNOWN",
    claimConfidence: "LOW",
    sourceReliability: "LOW",
    reasoningOutcome: "NEED_MORE_EVIDENCE",
    rationale: "Não existe afirmação ou evidência utilizável para este dado.",
    sensitivity: "MEDIUM",
    relationship: null,
    relatedClaimIds: [],
    supportingEvidence: [],
    conflictingEvidence: [],
    recommendedHandling: "ASK_CUSTOMER",
    humanConfirmationRequired: false,
    confirmationAlreadyRequested: false,
  }
}

export function evaluateR2Evidence({
  claim,
  memory,
  humanConfirmed = false,
}: EvaluateR2EvidenceInput): R2EvidenceAssessment {
  if (!claim) {
    return unknownAssessment()
  }

  const reliability = sourceReliability(
    claim.provenance.sourceType,
  )
  const previous = currentClaim(memory, claim.key)
  const alreadyRequested = wasConfirmationRequested(
    memory,
    claim.key,
  )
  const relatedClaimIds = previous ? [previous.id] : []

  if (previous && sameValue(previous, claim)) {
    return {
      claim,
      evidenceStatus:
        previous.evidenceStatus === "CONFIRMED" ||
        claim.provenance.sourceType === "OFFICIAL_SOURCE"
          ? "CONFIRMED"
          : "SUPPORTED",
      claimConfidence: "HIGH",
      sourceReliability: reliability,
      reasoningOutcome: "PASS",
      rationale: "A nova evidência confirma o valor atualmente conhecido.",
      sensitivity: claim.sensitivity,
      relationship: "CONFIRMS",
      relatedClaimIds,
      supportingEvidence: relatedClaimIds,
      conflictingEvidence: [],
      recommendedHandling: "USE_AS_CONTEXT",
      humanConfirmationRequired: false,
      confirmationAlreadyRequested: alreadyRequested,
    }
  }

  if (previous && !sameValue(previous, claim)) {
    const previousTime = new Date(
      previous.provenance.observedAt,
    ).getTime()
    const currentTime = new Date(
      claim.provenance.observedAt,
    ).getTime()
    const isLegitimateUpdate = humanConfirmed ||
      (
        claim.temporalCue === "CURRENT" &&
        currentTime >= previousTime
      )

    if (isLegitimateUpdate) {
      return {
        claim,
        evidenceStatus:
          claim.provenance.sourceType === "OFFICIAL_SOURCE"
            ? "CONFIRMED"
            : "SUPPORTED",
        claimConfidence: humanConfirmed ? "HIGH" : reliability,
        sourceReliability: reliability,
        reasoningOutcome:
          claim.sensitivity === "CRITICAL" && !humanConfirmed
            ? "PASS_WITH_WARNING"
            : "PASS",
        rationale: humanConfirmed
          ? "O consultor confirmou que a nova informação atualiza o valor anterior; o histórico foi preservado."
          : "A linguagem temporal e a data mais recente indicam atualização, não contradição no mesmo período.",
        sensitivity: claim.sensitivity,
        relationship: humanConfirmed ? "SUPERSEDES" : "UPDATES",
        relatedClaimIds,
        supportingEvidence: [],
        conflictingEvidence: [],
        recommendedHandling:
          claim.sensitivity === "CRITICAL" && !humanConfirmed
            ? "USE_WITH_CAUTION"
            : "USE_AS_CONTEXT",
        humanConfirmationRequired: false,
        confirmationAlreadyRequested: alreadyRequested,
      }
    }

    if (claim.temporalCue === "HISTORICAL") {
      return {
        claim,
        evidenceStatus: "SUPPORTED",
        claimConfidence: reliability,
        sourceReliability: reliability,
        reasoningOutcome: "PASS_WITH_WARNING",
        rationale: "A afirmação descreve outro período e pode coexistir com o valor atual.",
        sensitivity: claim.sensitivity,
        relationship: "COEXISTS_WITH",
        relatedClaimIds,
        supportingEvidence: [],
        conflictingEvidence: [],
        recommendedHandling: "USE_WITH_CAUTION",
        humanConfirmationRequired: false,
        confirmationAlreadyRequested: alreadyRequested,
      }
    }

    const sensitive = SENSITIVITY_RANK[claim.sensitivity] >=
      SENSITIVITY_RANK.HIGH

    return {
      claim,
      evidenceStatus: "CONFLICTING",
      claimConfidence: "LOW",
      sourceReliability: reliability,
      reasoningOutcome: sensitive
        ? "HUMAN_CONFIRMATION_REQUIRED"
        : "NEED_MORE_EVIDENCE",
      rationale: "O novo valor difere do valor conhecido sem evidência temporal suficiente para tratá-lo como atualização.",
      sensitivity: claim.sensitivity,
      relationship: "CONFLICTS_WITH",
      relatedClaimIds,
      supportingEvidence: [],
      conflictingEvidence: relatedClaimIds,
      recommendedHandling: sensitive
        ? "REQUIRE_HUMAN_REVIEW"
        : "ASK_CONSULTANT",
      humanConfirmationRequired: sensitive,
      confirmationAlreadyRequested: alreadyRequested,
    }
  }

  if (claim.provenance.sourceType === "R2_INFERENCE") {
    const critical = claim.sensitivity === "CRITICAL"

    return {
      claim,
      evidenceStatus: "UNVERIFIED",
      claimConfidence: "LOW",
      sourceReliability: "LOW",
      reasoningOutcome:
        critical
          ? "BLOCKED"
          : claim.sensitivity === "LOW"
          ? "PASS_WITH_WARNING"
          : "NEED_MORE_EVIDENCE",
      rationale: "A afirmação é uma inferência do R2 e não foi promovida a fato.",
      sensitivity: claim.sensitivity,
      relationship: null,
      relatedClaimIds: [],
      supportingEvidence: [],
      conflictingEvidence: [],
      recommendedHandling:
        critical
          ? "DO_NOT_USE"
          : claim.sensitivity === "LOW"
          ? "USE_WITH_CAUTION"
          : "ASK_CUSTOMER",
      humanConfirmationRequired: false,
      confirmationAlreadyRequested: alreadyRequested,
    }
  }

  if (
    claim.provenance.sourceType === "OFFICIAL_SOURCE" ||
    claim.provenance.sourceType === "DOCUMENT"
  ) {
    return {
      claim,
      evidenceStatus: "CONFIRMED",
      claimConfidence: "HIGH",
      sourceReliability: "HIGH",
      reasoningOutcome: "PASS",
      rationale: "A afirmação está apoiada por uma fonte documental ou oficial identificada.",
      sensitivity: claim.sensitivity,
      relationship: null,
      relatedClaimIds: [],
      supportingEvidence: [claim.provenance.sourceReference],
      conflictingEvidence: [],
      recommendedHandling: "USE_AS_CONTEXT",
      humanConfirmationRequired: false,
      confirmationAlreadyRequested: alreadyRequested,
    }
  }

  const customerStatement =
    claim.provenance.sourceType === "CUSTOMER_MESSAGE"
  const confidence: R2EvidenceConfidence = customerStatement
    ? "HIGH"
    : reliability

  return {
    claim,
    evidenceStatus: "SUPPORTED",
    claimConfidence: confidence,
    sourceReliability: reliability,
    reasoningOutcome:
      claim.sensitivity === "CRITICAL"
        ? "PASS_WITH_WARNING"
        : "PASS",
    rationale: customerStatement
      ? "A mensagem sustenta que o cliente declarou esta informação; isso não equivale a comprovação externa."
      : "A afirmação possui origem identificada e pode ser usada proporcionalmente à sua sensibilidade.",
    sensitivity: claim.sensitivity,
    relationship: null,
    relatedClaimIds: [],
    supportingEvidence: [claim.provenance.sourceReference],
    conflictingEvidence: [],
    recommendedHandling:
      claim.sensitivity === "CRITICAL"
        ? "USE_WITH_CAUTION"
        : "USE_AS_CONTEXT",
    humanConfirmationRequired: false,
    confirmationAlreadyRequested: alreadyRequested,
  }
}

export function buildR2EvidenceDecisionContext(
  assessments: readonly R2EvidenceAssessment[],
): R2EvidenceDecisionContext {
  if (assessments.length === 0) {
    return {
      status: "UNKNOWN",
      confidence: "LOW",
      outcome: "PASS",
      sensitivity: "LOW",
      warnings: [],
      conflicts: [],
      humanConfirmationRequired: false,
      assessments: [],
    }
  }

  const effectiveAssessments = assessments
  const worstOutcome = [...effectiveAssessments].sort(
    (first, second) =>
      OUTCOME_RANK[second.reasoningOutcome] -
      OUTCOME_RANK[first.reasoningOutcome],
  )[0]
  const worstStatus = [...effectiveAssessments].sort(
    (first, second) =>
      STATUS_RANK[second.evidenceStatus] -
      STATUS_RANK[first.evidenceStatus],
  )[0]
  const lowestConfidence = [...effectiveAssessments].sort(
    (first, second) =>
      CONFIDENCE_RANK[second.claimConfidence] -
      CONFIDENCE_RANK[first.claimConfidence],
  )[0]
  const highestSensitivity = [...effectiveAssessments].sort(
    (first, second) =>
      SENSITIVITY_RANK[second.sensitivity] -
      SENSITIVITY_RANK[first.sensitivity],
  )[0]
  const warnings = effectiveAssessments
    .filter(
      (assessment) =>
        assessment.reasoningOutcome !== "PASS",
    )
    .map((assessment) => assessment.rationale)
  const conflicts = effectiveAssessments
    .filter(
      (assessment) =>
        assessment.evidenceStatus === "CONFLICTING",
    )
    .map((assessment) => assessment.rationale)

  return {
    status: worstStatus.evidenceStatus,
    confidence: lowestConfidence.claimConfidence,
    outcome: worstOutcome.reasoningOutcome,
    sensitivity: highestSensitivity.sensitivity,
    warnings: [...new Set(warnings)],
    conflicts: [...new Set(conflicts)],
    humanConfirmationRequired: effectiveAssessments.some(
      (assessment) => assessment.humanConfirmationRequired,
    ),
    assessments,
  }
}
