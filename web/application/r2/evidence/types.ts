export type R2EvidenceSourceType =
  | "CUSTOMER_MESSAGE"
  | "CONSULTANT_INPUT"
  | "CRM"
  | "MEMORY"
  | "EXTERNAL_SYSTEM"
  | "DOCUMENT"
  | "OFFICIAL_SOURCE"
  | "R2_INFERENCE"
  | "SYSTEM_GENERATED"
  | "CALCULATION"

export type R2EvidenceConfidence =
  | "LOW"
  | "MEDIUM"
  | "HIGH"

export type R2EvidenceStatus =
  | "CONFIRMED"
  | "SUPPORTED"
  | "UNVERIFIED"
  | "CONFLICTING"
  | "UNKNOWN"

export type R2ReasoningOutcome =
  | "PASS"
  | "PASS_WITH_WARNING"
  | "NEED_MORE_EVIDENCE"
  | "HUMAN_CONFIRMATION_REQUIRED"
  | "BLOCKED"

export type R2DecisionSensitivity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"

export type R2EvidenceRelationship =
  | "CONFIRMS"
  | "SUPERSEDES"
  | "UPDATES"
  | "CONFLICTS_WITH"
  | "COEXISTS_WITH"

export type R2RecommendedHandling =
  | "USE_AS_CONTEXT"
  | "USE_WITH_CAUTION"
  | "ASK_CUSTOMER"
  | "ASK_CONSULTANT"
  | "CHECK_MEMORY"
  | "VERIFY_EXTERNAL_SOURCE"
  | "REQUIRE_HUMAN_REVIEW"
  | "DO_NOT_USE"

export type R2EvidenceClaimValue =
  | string
  | number
  | boolean

export type R2EvidenceProvenance =
  Readonly<{
    sourceType: R2EvidenceSourceType
    sourceReference: string
    actorId?: string | null
    receivedAt: string
    observedAt: string
    inferred: boolean
    calculated: boolean
  }>

export type R2EvidenceClaim =
  Readonly<{
    id: string
    opportunityId: string
    subject: string
    key: string
    statement: string
    value: R2EvidenceClaimValue
    normalizedValue: R2EvidenceClaimValue
    unit?: string | null
    sensitivity: R2DecisionSensitivity
    temporalCue:
      | "CURRENT"
      | "HISTORICAL"
      | "UNSPECIFIED"
    validFrom?: string | null
    provenance: R2EvidenceProvenance
    metadata?: Readonly<Record<string, unknown>>
  }>

export type R2EvidenceAssessment =
  Readonly<{
    claim: R2EvidenceClaim | null
    evidenceStatus: R2EvidenceStatus
    claimConfidence: R2EvidenceConfidence
    sourceReliability: R2EvidenceConfidence
    reasoningOutcome: R2ReasoningOutcome
    rationale: string
    sensitivity: R2DecisionSensitivity
    relationship: R2EvidenceRelationship | null
    relatedClaimIds: readonly string[]
    supportingEvidence: readonly string[]
    conflictingEvidence: readonly string[]
    recommendedHandling: R2RecommendedHandling
    humanConfirmationRequired: boolean
    confirmationAlreadyRequested: boolean
  }>

export type R2EvidenceDecisionContext =
  Readonly<{
    status: R2EvidenceStatus
    confidence: R2EvidenceConfidence
    outcome: R2ReasoningOutcome
    sensitivity: R2DecisionSensitivity
    warnings: readonly string[]
    conflicts: readonly string[]
    humanConfirmationRequired: boolean
    assessments: readonly R2EvidenceAssessment[]
  }>

export type R2EvidenceMemoryClaim =
  R2EvidenceClaim &
  Readonly<{
    evidenceStatus: R2EvidenceStatus
    claimConfidence: R2EvidenceConfidence
    sourceReliability: R2EvidenceConfidence
    relationship: R2EvidenceRelationship | null
    relatedClaimIds: readonly string[]
    recordedAt: string
    confirmedByHuman: boolean
  }>

export type R2EvidenceMemory =
  Readonly<{
    schemaVersion: "1.0"
    claims: readonly R2EvidenceMemoryClaim[]
    currentClaimByKey: Readonly<Record<string, string>>
    confirmationRequests: Readonly<Record<string, string>>
    resolvedConfirmations: Readonly<Record<string, string>>
  }>

export type R2DecisionSafetyStatus =
  | "SAFE"
  | "SAFE_WITH_WARNING"
  | "REVISE"
  | "HUMAN_REVIEW_REQUIRED"
  | "BLOCK"

export type R2DecisionSafetyIssueCode =
  | "UNSUPPORTED_CERTAINTY"
  | "GUARANTEE_INFLATION"
  | "EVIDENCE_LEAP"
  | "KNOWN_CONFLICT"
  | "UNSUPPORTED_FINANCIAL_CLAIM"
  | "CONTEMPLATION_PROMISE"
  | "AUTOMATION_AUTHORITY"
  | "CUSTOMER_BOUNDARY_VIOLATION"
  | "REPEATED_REJECTION_IGNORED"
  | "DO_NOT_CONTACT_VIOLATION"
  | "DECISION_INTERNAL_CONTRADICTION"
  | "CTA_AFTER_TERMINAL_REJECTION"
  | "QUESTION_AFTER_TERMINAL_REJECTION"
  | "OBJECTION_HANDLING_AFTER_REJECTION"

export type R2DecisionSafetyResult =
  Readonly<{
    status: R2DecisionSafetyStatus
    issues: readonly Readonly<{
      code: R2DecisionSafetyIssueCode
      rationale: string
    }>[]
    warnings: readonly string[]
    safeToPresent: boolean
    requiresHumanReview: boolean
  }>
