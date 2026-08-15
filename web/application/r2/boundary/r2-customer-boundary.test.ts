import {
  describe,
  expect,
  it,
} from "vitest"

import {
  analyzeR2CustomerBoundary,
  evolveR2CustomerBoundaryMemory,
  writeR2CustomerBoundaryMemory,
} from "./r2-customer-boundary"

function observe(
  message: string,
  structuredFacts?: unknown,
) {
  return analyzeR2CustomerBoundary({
    opportunityId: "opportunity-1",
    message,
    structuredFacts,
    observedAt: new Date("2026-08-15T12:00:00.000Z"),
  })
}

function remember(
  message: string,
  structuredFacts?: unknown,
) {
  const boundary = observe(message, structuredFacts)
  const memory = evolveR2CustomerBoundaryMemory({
    structuredFacts,
    boundary,
  })

  return {
    boundary,
    structuredFacts:
      writeR2CustomerBoundaryMemory(
        structuredFacts,
        memory,
      ),
  }
}

describe("R2 Customer Boundary", () => {
  it("eleva rejeições distintas e fecha imediatamente a conversa", () => {
    const first = remember("Não quero consórcio.")
    const second = remember(
      "Já disse que não tenho interesse.",
      first.structuredFacts,
    )
    const third = remember(
      "Já falei que não quero, que merda.",
      second.structuredFacts,
    )

    expect(first.boundary).toMatchObject({
      signal: "EXPLICIT_REJECTION",
      state: "REJECTION",
      explicitRejectionCount: 1,
      terminal: true,
      questionAllowed: false,
    })
    expect(second.boundary).toMatchObject({
      signal: "REPEATED_EXPLICIT_REJECTION",
      state: "REPEATED_REJECTION",
      explicitRejectionCount: 2,
    })
    expect(third.boundary).toMatchObject({
      signal: "HOSTILE_REJECTION",
      state: "STOP_CURRENT_CONVERSATION",
      explicitRejectionCount: 3,
      outboundAutomationSuppressed: true,
    })
  })

  it("deduplica a mesma observação pelo fingerprint", () => {
    const first = remember("Não tenho interesse.")
    const duplicate = observe(
      "Não tenho interesse.",
      first.structuredFacts,
    )

    expect(duplicate.explicitRejectionCount).toBe(1)
    expect(duplicate.isNewObservation).toBe(false)
  })

  it("trata pedido de não contato como boundary persistente", () => {
    const stopped = remember(
      "Não me mande mais mensagens.",
    )

    expect(stopped.boundary).toMatchObject({
      signal: "DO_NOT_CONTACT_REQUEST",
      state: "DO_NOT_CONTACT",
      proactiveContactSuppressed: true,
    })

    const reopened = observe(
      "Pensei melhor, quero ver uma simulação.",
      stopped.structuredFacts,
    )

    expect(reopened).toMatchObject({
      signal: "INBOUND_REOPENED",
      terminal: false,
      inboundReopened: true,
      proactiveContactSuppressed: true,
    })
  })

  it("distingue adiamento autorizado de rejeição", () => {
    expect(
      observe(
        "Agora não posso, pode me chamar amanhã.",
      ),
    ).toMatchObject({
      signal: "DELAY_WITH_PERMISSION",
      state: "CAUTIOUS",
      terminal: false,
      questionAllowed: true,
    })
  })

  it("reconhece cessação de contato e de insistência por significado", () => {
    for (const message of [
      "Não entre mais em contato.",
      "Não me chama.",
    ]) {
      expect(observe(message)).toMatchObject({
        signal: "DO_NOT_CONTACT_REQUEST",
        state: "DO_NOT_CONTACT",
      })
    }

    expect(observe("Para de insistir, porra.")).toMatchObject({
      signal: "HOSTILE_REJECTION",
      state: "STOP_CURRENT_CONVERSATION",
    })
  })

  it("respeita autorização posterior mesmo com não quero agora", () => {
    expect(
      observe(
        "Não quero agora, me chama amanhã.",
      ),
    ).toMatchObject({
      signal: "DELAY_WITH_PERMISSION",
      terminal: false,
    })
  })

  it.each([
    "n tenho interesse",
    "já falei q não quero",
    "naum quero mais",
  ])("reconhece português informal: %s", (message) => {
    expect(observe(message).terminal).toBe(true)
  })

  it("não confunde palavrão sobre preço com rejeição", () => {
    expect(
      observe("Essa taxa está uma merda de cara."),
    ).toMatchObject({
      signal: "OPEN",
      terminal: false,
    })
  })

  it("não fecha projeto que foi apenas adiado", () => {
    expect(
      observe(
        "Agora não quero iniciar, mas continuo com o projeto.",
      ),
    ).toMatchObject({
      signal: "OPEN",
      terminal: false,
    })
  })
})
