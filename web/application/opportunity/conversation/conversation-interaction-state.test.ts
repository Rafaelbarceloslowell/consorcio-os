import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildConversationInteractionState,
  resolveConversationInteractionState,
} from "./conversation-interaction-state"

describe("conversation interaction state", () => {
  it("normaliza somente o falso inbound histórico comprovado pela provenance", () => {
    expect(resolveConversationInteractionState({
      structuredFacts: {},
      factProvenance: {
        lastIncomingMessage:
          "manual_context",
      },
      lastIncomingMessage:
        "Cliente nunca respondeu",
    })).toMatchObject({
      lastIncomingMessage: null,
      historicalNormalizationApplied: true,
      interaction: {
        sourceType:
          "CONSULTANT_CONTEXT",
        customerHasReplied: false,
        responseStatus:
          "NEVER_RESPONDED",
        consultantContext:
          "Cliente nunca respondeu",
      },
    })
  })

  it("não inventa a origem de texto histórico ambíguo", () => {
    expect(resolveConversationInteractionState({
      structuredFacts: {},
      factProvenance: {},
      lastIncomingMessage:
        "Cliente nunca respondeu",
    })).toMatchObject({
      lastIncomingMessage:
        "Cliente nunca respondeu",
      historicalNormalizationApplied: false,
    })
  })

  it("não cria evento para contexto vazio", () => {
    const existing =
      resolveConversationInteractionState({})

    expect(buildConversationInteractionState({
      sourceType:
        "CONSULTANT_CONTEXT",
      text: "",
      observedAt:
        new Date("2026-08-15T12:00:00.000Z"),
      existing:
        existing.interaction,
      existingLastIncomingMessage:
        existing.lastIncomingMessage,
      explicitlyNeverResponded: false,
    })).toMatchObject({
      lastIncomingMessage: null,
      interaction: {
        customerHasReplied: false,
        responseStatus: "UNKNOWN",
        consultantContext: null,
      },
    })
  })
})
