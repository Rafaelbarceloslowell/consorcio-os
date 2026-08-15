import {
  buildR2EvidenceDecisionContext,
  evaluateR2Evidence,
} from "./evaluate-r2-evidence"

import {
  buildR2FactProvenance,
  evolveR2EvidenceMemory,
  readR2EvidenceMemory,
  writeR2EvidenceMemory,
} from "./evolve-r2-evidence-memory"

import {
  identifyR2Claims,
} from "./identify-r2-claims"

import type {
  R2EvidenceSourceType,
} from "./types"

export type ProcessR2EvidenceInput =
  Readonly<{
    opportunityId: string
    subject: string
    text: string
    sourceType: R2EvidenceSourceType
    sourceReference: string
    actorId?: string | null
    observedAt?: Date
    receivedAt?: Date
    structuredFacts?: unknown
    factProvenance?: unknown
    humanConfirmed?: boolean
  }>

export function processR2Evidence(
  input: ProcessR2EvidenceInput,
) {
  const memory = readR2EvidenceMemory(
    input.structuredFacts,
  )
  const claims = identifyR2Claims({
    opportunityId: input.opportunityId,
    subject: input.subject,
    text: input.text,
    sourceType: input.sourceType,
    sourceReference: input.sourceReference,
    actorId: input.actorId,
    observedAt: input.observedAt,
    receivedAt: input.receivedAt,
  })
  const assessments = claims.map(
    (claim) => evaluateR2Evidence({
      claim,
      memory,
      humanConfirmed: input.humanConfirmed,
    }),
  )
  const decisionContext = buildR2EvidenceDecisionContext(
    assessments,
  )
  const nextMemory = evolveR2EvidenceMemory({
    memory,
    assessments,
    recordedAt: input.receivedAt ?? input.observedAt,
    humanConfirmed: input.humanConfirmed,
  })

  return {
    claims,
    assessments,
    decisionContext,
    memory: nextMemory,
    structuredFacts: writeR2EvidenceMemory(
      input.structuredFacts,
      nextMemory,
    ),
    factProvenance: buildR2FactProvenance(
      input.factProvenance,
      nextMemory,
    ),
  } as const
}
