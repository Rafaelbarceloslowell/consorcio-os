import {
  describe,
  expect,
  it,
} from "vitest"

import {
  checkR2DecisionSafety,
} from "./check-r2-decision-safety"

import {
  processR2Evidence,
} from "./process-r2-evidence"

import {
  analyzeR2CustomerBoundary,
} from "@/application/r2/boundary"

function supportedBid() {
  return processR2Evidence({
    opportunityId: "opportunity-1",
    subject: "Cliente",
    text: "Tenho R$ 100 mil para lance.",
    sourceType: "CUSTOMER_MESSAGE",
    sourceReference: "message-1",
    observedAt: new Date("2026-08-15T12:00:00.000Z"),
  }).decisionContext
}

describe("checkR2DecisionSafety", () => {
  it("bloqueia pergunta, CTA e objection handling após rejeição terminal", () => {
    const result = checkR2DecisionSafety({
      decisionText:
        "Entendo. Qual o motivo? Vamos avançar mais uma vez?",
      evidence: supportedBid(),
      customerBoundary:
        analyzeR2CustomerBoundary({
          opportunityId: "opportunity-1",
          message:
            "Já falei que não quero, que merda.",
        }),
      decisionConsistency: {
        intent: "not_interested",
        objective:
          "Entender o motivo da objeção.",
        technique:
          "objection_handling",
        callToAction:
          "Confirmar a reunião.",
        question: "Qual o motivo?",
      },
    })

    expect(result.status).toBe("BLOCK")
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "OBJECTION_HANDLING_AFTER_REJECTION",
        "CTA_AFTER_TERMINAL_REJECTION",
        "QUESTION_AFTER_TERMINAL_REJECTION",
        "DECISION_INTERNAL_CONTRADICTION",
        "CUSTOMER_BOUNDARY_VIOLATION",
      ]),
    )
  })

  it("permite somente encerramento breve sem pergunta", () => {
    const result = checkR2DecisionSafety({
      decisionText:
        "Entendido. Desculpe pela insistência. Vou encerrar o contato por aqui.",
      evidence: supportedBid(),
      customerBoundary:
        analyzeR2CustomerBoundary({
          opportunityId: "opportunity-1",
          message: "Não tenho interesse.",
        }),
      decisionConsistency: {
        intent: "not_interested",
        objective:
          "Encerrar a conversa atual respeitosamente.",
        technique: "none",
        callToAction: "Nenhum CTA comercial.",
        question: null,
      },
    })

    expect(result).toMatchObject({
      status: "SAFE",
      safeToPresent: true,
    })
  })

  it("aceita linguagem proporcional à evidência suportada", () => {
    expect(checkR2DecisionSafety({
      decisionText:
        "Com R$ 100 mil disponíveis para lance, podemos analisar estratégias que aumentem sua competitividade.",
      evidence: supportedBid(),
    })).toMatchObject({
      status: "SAFE",
      safeToPresent: true,
    })
  })

  it("bloqueia promessa de contemplação", () => {
    const result = checkR2DecisionSafety({
      decisionText: "Com R$ 100 mil você será contemplado.",
      evidence: supportedBid(),
    })

    expect(result).toMatchObject({
      status: "BLOCK",
      safeToPresent: false,
    })
    expect(result.issues.map((issue) => issue.code)).toContain(
      "CONTEMPLATION_PROMISE",
    )
  })

  it("revisa certeza que excede evidência não confirmada", () => {
    const result = checkR2DecisionSafety({
      decisionText: "Está confirmado sem dúvida que há R$ 100 mil.",
      evidence: supportedBid(),
    })

    expect(result.status).toBe("REVISE")
    expect(result.issues.map((issue) => issue.code)).toContain(
      "UNSUPPORTED_CERTAINTY",
    )
  })

  it("revisa taxa, prazo ou valor financeiro sem sustentação", () => {
    const result = checkR2DecisionSafety({
      decisionText: "A taxa será de 12% e o prazo de 60 meses.",
      evidence: supportedBid(),
    })

    expect(result.status).toBe("REVISE")
    expect(result.issues.map((issue) => issue.code)).toContain(
      "UNSUPPORTED_FINANCIAL_CLAIM",
    )
  })

  it("exige humano quando uma decisão ignora conflito conhecido", () => {
    const old = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Tenho R$ 50 mil para lance.",
      sourceType: "CUSTOMER_MESSAGE",
      sourceReference: "message-old",
    })
    const current = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "Ele tem R$ 200 mil para lance.",
      sourceType: "CONSULTANT_INPUT",
      sourceReference: "message-new",
      structuredFacts: old.structuredFacts,
    })
    const result = checkR2DecisionSafety({
      decisionText: "Vamos usar R$ 200 mil na estratégia.",
      evidence: current.decisionContext,
    })

    expect(result.status).toBe("HUMAN_REVIEW_REQUIRED")
    expect(result.issues.map((issue) => issue.code)).toContain(
      "KNOWN_CONFLICT",
    )
  })

  it("bloqueia automação sem autoridade", () => {
    expect(checkR2DecisionSafety({
      decisionText: "Enviar proposta.",
      evidence: supportedBid(),
      actionKind: "AUTOMATION",
      automationAuthorized: false,
    })).toMatchObject({
      status: "BLOCK",
      safeToPresent: false,
    })
  })
})
