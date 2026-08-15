import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildR2EvidenceDecisionContext,
  evaluateR2Evidence,
} from "./evaluate-r2-evidence"

import {
  evolveR2EvidenceMemory,
  readR2EvidenceMemory,
  writeR2EvidenceMemory,
} from "./evolve-r2-evidence-memory"

import type {
  R2DecisionSensitivity,
  R2EvidenceClaim,
  R2EvidenceSourceType,
} from "./types"

function claim({
  id = "claim-new",
  key = "available_bid",
  value = 100_000,
  sourceType = "CUSTOMER_MESSAGE",
  sensitivity = "HIGH",
  observedAt = "2026-08-15T12:00:00.000Z",
  temporalCue = "UNSPECIFIED",
}: {
  id?: string
  key?: string
  value?: string | number | boolean
  sourceType?: R2EvidenceSourceType
  sensitivity?: R2DecisionSensitivity
  observedAt?: string
  temporalCue?: R2EvidenceClaim["temporalCue"]
} = {}): R2EvidenceClaim {
  return {
    id,
    opportunityId: "opportunity-1",
    subject: "Cliente",
    key,
    statement: "Afirmação operacional.",
    value,
    normalizedValue: value,
    unit: typeof value === "number" ? "BRL" : null,
    sensitivity,
    temporalCue,
    validFrom: temporalCue === "CURRENT" ? observedAt : null,
    provenance: {
      sourceType,
      sourceReference: "message-1",
      actorId: null,
      receivedAt: observedAt,
      observedAt,
      inferred: sourceType === "R2_INFERENCE",
      calculated: sourceType === "CALCULATION",
    },
  }
}

function memoryWith(
  previousClaim: R2EvidenceClaim,
) {
  const assessment = evaluateR2Evidence({
    claim: previousClaim,
  })

  return evolveR2EvidenceMemory({
    memory: readR2EvidenceMemory({}),
    assessments: [assessment],
    recordedAt: new Date(previousClaim.provenance.observedAt),
  })
}

describe("evaluateR2Evidence", () => {
  it("separa confiabilidade da fonte e confiança do claim do cliente", () => {
    const result = evaluateR2Evidence({ claim: claim() })

    expect(result).toMatchObject({
      evidenceStatus: "SUPPORTED",
      sourceReliability: "HIGH",
      claimConfidence: "HIGH",
      reasoningOutcome: "PASS",
    })
    expect(result.rationale).toContain("declarou")
    expect(result.rationale).toContain("não equivale")
  })

  it("confirma fonte oficial/documental", () => {
    const result = evaluateR2Evidence({
      claim: claim({ sourceType: "OFFICIAL_SOURCE" }),
    })

    expect(result).toMatchObject({
      evidenceStatus: "CONFIRMED",
      claimConfidence: "HIGH",
      sourceReliability: "HIGH",
      reasoningOutcome: "PASS",
    })
  })

  it("mantém inferência do R2 não verificada", () => {
    const result = evaluateR2Evidence({
      claim: claim({
        sourceType: "R2_INFERENCE",
        sensitivity: "LOW",
      }),
    })

    expect(result).toMatchObject({
      evidenceStatus: "UNVERIFIED",
      sourceReliability: "LOW",
      claimConfidence: "LOW",
      reasoningOutcome: "PASS_WITH_WARNING",
    })
  })

  it("pede mais evidência para inferência de impacto médio", () => {
    expect(evaluateR2Evidence({
      claim: claim({
        sourceType: "R2_INFERENCE",
        sensitivity: "MEDIUM",
      }),
    }).reasoningOutcome).toBe("NEED_MORE_EVIDENCE")
  })

  it("bloqueia inferência crítica", () => {
    expect(evaluateR2Evidence({
      claim: claim({
        sourceType: "R2_INFERENCE",
        sensitivity: "CRITICAL",
      }),
    })).toMatchObject({
      reasoningOutcome: "BLOCKED",
      recommendedHandling: "DO_NOT_USE",
    })
  })

  it("representa ausência real como UNKNOWN sem inventar renda", () => {
    expect(evaluateR2Evidence({ claim: null })).toMatchObject({
      evidenceStatus: "UNKNOWN",
      claimConfidence: "LOW",
      reasoningOutcome: "NEED_MORE_EVIDENCE",
    })
  })

  it("classifica evidência concordante como confirmação", () => {
    const previous = claim({
      id: "claim-old",
      observedAt: "2026-01-01T12:00:00.000Z",
    })
    const result = evaluateR2Evidence({
      claim: claim(),
      memory: memoryWith(previous),
    })

    expect(result).toMatchObject({
      evidenceStatus: "SUPPORTED",
      relationship: "CONFIRMS",
      reasoningOutcome: "PASS",
    })
    expect(result.supportingEvidence).toContain("claim-old")
  })

  it("diferencia atualização temporal de contradição", () => {
    const previous = claim({
      id: "income-2024",
      key: "monthly_income",
      value: 4_000,
      observedAt: "2024-06-01T12:00:00.000Z",
    })
    const result = evaluateR2Evidence({
      claim: claim({
        id: "income-2026",
        key: "monthly_income",
        value: 18_000,
        temporalCue: "CURRENT",
      }),
      memory: memoryWith(previous),
    })

    expect(result).toMatchObject({
      evidenceStatus: "SUPPORTED",
      relationship: "UPDATES",
      reasoningOutcome: "PASS",
    })
  })

  it("detecta conflito sensível entre cliente e consultor", () => {
    const previous = claim({
      id: "customer-50k",
      value: 50_000,
      observedAt: "2026-08-14T12:00:00.000Z",
    })
    const result = evaluateR2Evidence({
      claim: claim({
        id: "consultant-200k",
        value: 200_000,
        sourceType: "CONSULTANT_INPUT",
      }),
      memory: memoryWith(previous),
    })

    expect(result).toMatchObject({
      evidenceStatus: "CONFLICTING",
      sourceReliability: "MEDIUM",
      claimConfidence: "LOW",
      reasoningOutcome: "HUMAN_CONFIRMATION_REQUIRED",
      relationship: "CONFLICTS_WITH",
    })
  })

  it("mantém conflito de baixo impacto como pedido de evidência", () => {
    const previous = claim({
      key: "preferred_channel",
      value: "WhatsApp",
      sensitivity: "LOW",
    })
    const result = evaluateR2Evidence({
      claim: claim({
        key: "preferred_channel",
        value: "Telefone",
        sensitivity: "LOW",
      }),
      memory: memoryWith(previous),
    })

    expect(result).toMatchObject({
      evidenceStatus: "CONFLICTING",
      reasoningOutcome: "NEED_MORE_EVIDENCE",
    })
  })

  it("registra supersessão quando o humano confirma a correção", () => {
    const previous = claim({ id: "old-claim", value: 80_000 })
    const result = evaluateR2Evidence({
      claim: claim({
        id: "new-claim",
        value: 200_000,
        sourceType: "CONSULTANT_INPUT",
      }),
      memory: memoryWith(previous),
      humanConfirmed: true,
    })

    expect(result).toMatchObject({
      evidenceStatus: "SUPPORTED",
      relationship: "SUPERSEDES",
      reasoningOutcome: "PASS",
    })
  })

  it("agrega conflito, warnings, confiança e sensibilidade para o Decision Engine", () => {
    const conflicting = evaluateR2Evidence({
      claim: claim({ value: 200_000 }),
      memory: memoryWith(claim({ id: "old", value: 50_000 })),
    })
    const context = buildR2EvidenceDecisionContext([conflicting])

    expect(context).toMatchObject({
      status: "CONFLICTING",
      confidence: "LOW",
      outcome: "HUMAN_CONFIRMATION_REQUIRED",
      sensitivity: "HIGH",
      humanConfirmationRequired: true,
    })
    expect(context.conflicts).toHaveLength(1)
  })
})

describe("R2 evidence memory evolution", () => {
  it("preserva histórico, current state e provenance sem sobrescrever silenciosamente", () => {
    const oldClaim = claim({
      id: "target-300k",
      key: "desired_credit_value",
      value: 300_000,
      sensitivity: "MEDIUM",
      observedAt: "2025-01-01T12:00:00.000Z",
    })
    const initial = memoryWith(oldClaim)
    const newClaim = claim({
      id: "target-500k",
      key: "desired_credit_value",
      value: 500_000,
      sensitivity: "MEDIUM",
      temporalCue: "CURRENT",
    })
    const assessment = evaluateR2Evidence({
      claim: newClaim,
      memory: initial,
    })
    const evolved = evolveR2EvidenceMemory({
      memory: initial,
      assessments: [assessment],
    })

    expect(evolved.claims.map((item) => item.id)).toEqual([
      "target-300k",
      "target-500k",
    ])
    expect(evolved.currentClaimByKey.desired_credit_value).toBe(
      "target-500k",
    )
    expect(evolved.claims[1]?.relatedClaimIds).toContain("target-300k")
  })

  it("é idempotente e não duplica claim nem confirmação", () => {
    const initial = memoryWith(claim({ id: "old", value: 50_000 }))
    const conflictingClaim = claim({ id: "new", value: 200_000 })
    const assessment = evaluateR2Evidence({
      claim: conflictingClaim,
      memory: initial,
    })
    const once = evolveR2EvidenceMemory({
      memory: initial,
      assessments: [assessment],
      recordedAt: new Date("2026-08-15T12:00:00.000Z"),
    })
    const twice = evolveR2EvidenceMemory({
      memory: once,
      assessments: [evaluateR2Evidence({
        claim: conflictingClaim,
        memory: once,
      })],
      recordedAt: new Date("2026-08-16T12:00:00.000Z"),
    })

    expect(twice.claims).toHaveLength(2)
    expect(twice.confirmationRequests.available_bid).toBe(
      "2026-08-15T12:00:00.000Z",
    )
  })

  it("mantém compatibilidade com structuredFacts legado", () => {
    const legacy = { preferredChannel: "whatsapp" }
    const written = writeR2EvidenceMemory(
      legacy,
      readR2EvidenceMemory({}),
    )

    expect(written.preferredChannel).toBe("whatsapp")
    expect(written.r2Evidence).toBeDefined()
  })
})
