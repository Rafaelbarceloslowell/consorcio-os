import { describe, expect, it } from "vitest"
import { buildNarrativeMemory, mergeStructuredMemory, type StructuredCommercialMemory } from "./commercial-memory"

const current: StructuredCommercialMemory = {
  desiredCredit: {
    value: 250000,
    provenance: "consultant_confirmed",
    observedAt: "2026-08-01T10:00:00.000Z",
    history: [],
  },
}

describe("commercial memory", () => {
  it("adiciona fato estruturado confirmado com provenance", () => {
    const result = mergeStructuredMemory({}, [{
      key: "targetTimeline",
      value: "6 meses",
      provenance: "manual_context",
      observedAt: "2026-08-02T10:00:00.000Z",
      unambiguous: true,
    }])

    expect(result.memory.targetTimeline.provenance).toBe("manual_context")
  })

  it("atualiza fato claramente corrigido e preserva histórico", () => {
    const result = mergeStructuredMemory(current, [{
      key: "desiredCredit",
      value: 350000,
      provenance: "manual_context",
      observedAt: "2026-08-02T10:00:00.000Z",
      unambiguous: true,
    }])

    expect(result.memory.desiredCredit.value).toBe(350000)
    expect(result.memory.desiredCredit.history[0].value).toBe(250000)
  })

  it("não sobrescreve conflito ambíguo", () => {
    const result = mergeStructuredMemory(current, [{
      key: "desiredCredit",
      value: 350000,
      provenance: "manual_context",
      observedAt: "2026-08-02T10:00:00.000Z",
      unambiguous: false,
    }])

    expect(result.memory.desiredCredit.value).toBe(250000)
    expect(result.conflicts).toHaveLength(1)
  })

  it("não trata inferência de sistema como fato novo", () => {
    const result = mergeStructuredMemory({}, [{
      key: "decisionMaker",
      value: "cliente",
      provenance: "system_event",
      observedAt: "2026-08-02T10:00:00.000Z",
      unambiguous: true,
    }])

    expect(result.memory.decisionMaker).toBeUndefined()
  })

  it("produz narrativa curta com compromisso e próximo objetivo", () => {
    const narrative = buildNarrativeMemory({
      currentStage: "qualificação",
      lastEvent: "cliente confirmou crédito",
      commitment: "retorno amanhã às 10h",
      nextObjective: "validar parcela confortável",
    })

    expect(narrative).toMatch(/retorno amanhã às 10h/)
    expect(narrative).toMatch(/validar parcela confortável/)
  })
})
