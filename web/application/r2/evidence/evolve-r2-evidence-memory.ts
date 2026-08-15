import type {
  R2EvidenceAssessment,
  R2EvidenceDecisionContext,
  R2EvidenceMemory,
  R2EvidenceMemoryClaim,
} from "./types"

import {
  buildR2EvidenceDecisionContext,
} from "./evaluate-r2-evidence"

const EMPTY_MEMORY: R2EvidenceMemory = {
  schemaVersion: "1.0",
  claims: [],
  currentClaimByKey: {},
  confirmationRequests: {},
  resolvedConfirmations: {},
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function readR2EvidenceMemory(
  structuredFacts: unknown,
): R2EvidenceMemory {
  if (!isRecord(structuredFacts)) {
    return EMPTY_MEMORY
  }

  const candidate = structuredFacts.r2Evidence

  if (
    !isRecord(candidate) ||
    candidate.schemaVersion !== "1.0" ||
    !Array.isArray(candidate.claims) ||
    !isRecord(candidate.currentClaimByKey) ||
    !isRecord(candidate.confirmationRequests) ||
    !isRecord(candidate.resolvedConfirmations)
  ) {
    return EMPTY_MEMORY
  }

  return candidate as R2EvidenceMemory
}

export function buildR2EvidenceContextFromMemory(
  structuredFacts: unknown,
): R2EvidenceDecisionContext {
  const memory = readR2EvidenceMemory(
    structuredFacts,
  )
  const assessments: readonly R2EvidenceAssessment[] =
    memory.claims.map((claim) => ({
      claim,
      evidenceStatus: claim.evidenceStatus,
      claimConfidence: claim.claimConfidence,
      sourceReliability: claim.sourceReliability,
      reasoningOutcome:
        claim.evidenceStatus === "CONFLICTING"
          ? claim.sensitivity === "HIGH" ||
              claim.sensitivity === "CRITICAL"
            ? "HUMAN_CONFIRMATION_REQUIRED"
            : "NEED_MORE_EVIDENCE"
          : claim.evidenceStatus === "UNVERIFIED"
            ? "NEED_MORE_EVIDENCE"
            : "PASS",
      rationale:
        "Contexto reconstruído da memória de evidências preservada.",
      sensitivity: claim.sensitivity,
      relationship: claim.relationship,
      relatedClaimIds: claim.relatedClaimIds,
      supportingEvidence: [
        claim.provenance.sourceReference,
      ],
      conflictingEvidence:
        claim.evidenceStatus === "CONFLICTING"
          ? claim.relatedClaimIds
          : [],
      recommendedHandling:
        claim.evidenceStatus === "CONFLICTING"
          ? "REQUIRE_HUMAN_REVIEW"
          : claim.evidenceStatus === "UNVERIFIED"
            ? "USE_WITH_CAUTION"
            : "USE_AS_CONTEXT",
      humanConfirmationRequired:
        claim.evidenceStatus === "CONFLICTING" &&
        (
          claim.sensitivity === "HIGH" ||
          claim.sensitivity === "CRITICAL"
        ),
      confirmationAlreadyRequested:
        Boolean(memory.confirmationRequests[claim.key]),
    }))

  return buildR2EvidenceDecisionContext(
    assessments,
  )
}

export function evolveR2EvidenceMemory({
  memory,
  assessments,
  recordedAt = new Date(),
  humanConfirmed = false,
}: Readonly<{
  memory: R2EvidenceMemory
  assessments: readonly R2EvidenceAssessment[]
  recordedAt?: Date
  humanConfirmed?: boolean
}>): R2EvidenceMemory {
  const claims = [...memory.claims]
  const currentClaimByKey = { ...memory.currentClaimByKey }
  const confirmationRequests = { ...memory.confirmationRequests }
  const resolvedConfirmations = { ...memory.resolvedConfirmations }
  const recordedAtIso = recordedAt.toISOString()

  for (const assessment of assessments) {
    const claim = assessment.claim

    if (!claim) continue

    const existingIndex = claims.findIndex(
      (existing) => existing.id === claim.id,
    )
    const stored: R2EvidenceMemoryClaim = {
        ...claim,
        evidenceStatus: assessment.evidenceStatus,
        claimConfidence: assessment.claimConfidence,
        sourceReliability: assessment.sourceReliability,
        relationship: assessment.relationship,
        relatedClaimIds: assessment.relatedClaimIds,
        recordedAt: recordedAtIso,
        confirmedByHuman: humanConfirmed,
    }

    if (existingIndex === -1) {
      claims.push(stored)
    } else if (humanConfirmed) {
      claims[existingIndex] = stored
    }

    if (assessment.humanConfirmationRequired) {
      confirmationRequests[claim.key] ??= recordedAtIso
    }

    if (humanConfirmed) {
      resolvedConfirmations[claim.key] = recordedAtIso
    }

    const canBecomeCurrent =
      assessment.evidenceStatus !== "CONFLICTING" &&
      assessment.evidenceStatus !== "UNKNOWN" &&
      assessment.evidenceStatus !== "UNVERIFIED" &&
      assessment.relationship !== "COEXISTS_WITH"

    if (canBecomeCurrent) {
      currentClaimByKey[claim.key] = claim.id
    }
  }

  return {
    schemaVersion: "1.0",
    claims,
    currentClaimByKey,
    confirmationRequests,
    resolvedConfirmations,
  }
}

export function writeR2EvidenceMemory(
  structuredFacts: unknown,
  memory: R2EvidenceMemory,
): Readonly<Record<string, unknown>> {
  return {
    ...(isRecord(structuredFacts) ? structuredFacts : {}),
    r2Evidence: memory,
  }
}

export function buildR2FactProvenance(
  current: unknown,
  memory: R2EvidenceMemory,
): Readonly<Record<string, unknown>> {
  const previous = isRecord(current) ? current : {}
  const evidenceProvenance = Object.fromEntries(
    memory.claims.map(
      (claim) => [
        claim.id,
        {
          key: claim.key,
          provenance: claim.provenance,
          status: claim.evidenceStatus,
          relationship: claim.relationship,
          relatedClaimIds: claim.relatedClaimIds,
        },
      ],
    ),
  )

  return {
    ...previous,
    r2Evidence: evidenceProvenance,
  }
}
