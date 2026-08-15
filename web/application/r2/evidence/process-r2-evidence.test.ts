import {
  describe,
  expect,
  it,
} from "vitest"

import {
  processR2Evidence,
} from "./process-r2-evidence"

describe("processR2Evidence application flow", () => {
  it("faz conflito, confirmação humana e evolução temporal sem apagar histórico", () => {
    const original = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Tenho R$ 80 mil para lance.",
      sourceType: "CUSTOMER_MESSAGE",
      sourceReference: "customer-message-1",
      observedAt: new Date("2026-01-10T12:00:00.000Z"),
    })
    const conflict = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Consultor: ele tem R$ 200 mil para lance.",
      sourceType: "CONSULTANT_INPUT",
      sourceReference: "consultant-message-1",
      structuredFacts: original.structuredFacts,
      factProvenance: original.factProvenance,
      observedAt: new Date("2026-08-15T12:00:00.000Z"),
    })

    expect(conflict.decisionContext).toMatchObject({
      status: "CONFLICTING",
      outcome: "HUMAN_CONFIRMATION_REQUIRED",
    })
    expect(conflict.memory.currentClaimByKey.available_bid).toBe(
      original.claims[0]?.id,
    )
    expect(conflict.memory.claims).toHaveLength(2)

    const retry = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Consultor: ele tem R$ 200 mil para lance.",
      sourceType: "CONSULTANT_INPUT",
      sourceReference: "consultant-message-1",
      structuredFacts: conflict.structuredFacts,
      factProvenance: conflict.factProvenance,
      observedAt: new Date("2026-08-15T12:05:00.000Z"),
    })

    expect(retry.memory.claims).toHaveLength(2)
    expect(
      retry.assessments[0]?.confirmationAlreadyRequested,
    ).toBe(true)

    const correction = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Os R$ 80 mil eram antigos. Hoje são R$ 200 mil para lance.",
      sourceType: "CONSULTANT_INPUT",
      sourceReference: "human-confirmation-1",
      actorId: "consultant-1",
      structuredFacts: retry.structuredFacts,
      factProvenance: retry.factProvenance,
      observedAt: new Date("2026-08-15T12:10:00.000Z"),
      humanConfirmed: true,
    })

    expect(correction.decisionContext).toMatchObject({
      status: "SUPPORTED",
      outcome: "PASS",
      humanConfirmationRequired: false,
    })
    expect(correction.assessments[0]).toMatchObject({
      relationship: "SUPERSEDES",
      claimConfidence: "HIGH",
    })
    expect(correction.memory.claims).toHaveLength(3)
    expect(correction.memory.currentClaimByKey.available_bid).toBe(
      correction.claims[0]?.id,
    )
    expect(correction.memory.resolvedConfirmations.available_bid).toBe(
      "2026-08-15T12:10:00.000Z",
    )
    expect(
      Object.keys(
        correction.factProvenance.r2Evidence as Record<string, unknown>,
      ),
    ).toHaveLength(3)
  })

  it("trata mudança de objetivo como atualização legítima", () => {
    const oldState = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Estou buscando um imóvel no valor de R$ 300 mil.",
      sourceType: "CUSTOMER_MESSAGE",
      sourceReference: "message-old",
      observedAt: new Date("2025-01-01T12:00:00.000Z"),
    })
    const newState = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Agora estou olhando um imóvel de R$ 500 mil.",
      sourceType: "CUSTOMER_MESSAGE",
      sourceReference: "message-new",
      structuredFacts: oldState.structuredFacts,
      observedAt: new Date("2026-08-15T12:00:00.000Z"),
    })

    expect(newState.assessments[0]).toMatchObject({
      evidenceStatus: "SUPPORTED",
      reasoningOutcome: "PASS",
      relationship: "UPDATES",
    })
    expect(newState.memory.claims).toHaveLength(2)
  })
})
