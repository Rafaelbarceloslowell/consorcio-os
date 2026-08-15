import {
  describe,
  expect,
  it,
} from "vitest"

import {
  applyR2ConsultantCorrectionToAnalysis,
  buildR2ConsultantCorrectionContext,
  correctionTypeFor,
  feedbackEventId,
  feedbackOutcomeEventId,
  feedbackRevisionEventId,
  parseR2ConsultantFeedback,
} from "./r2-consultant-feedback"

import type {
  R2ConsultantFeedbackErrorCategory,
} from "./r2-consultant-feedback"

const analysis = {
  intent: "pricing_question" as const,
  stage: "qualification" as const,
  label: "Pergunta de valor",
  summary: "O cliente perguntou sobre a parcela.",
  recommendedAction: "Confirmar capacidade mensal.",
}

function disagreement(
  errorCategory: R2ConsultantFeedbackErrorCategory =
    "WRONG_COMMERCIAL_STRATEGY",
) {
  const parsed = parseR2ConsultantFeedback({
    action: "DISAGREE",
    recommendationId: "recommendation-a",
    idempotencyKey: "feedback-key-1",
    errorCategory,
    disagreementReason:
      "A capacidade mensal já foi informada.",
    correctPath:
      "Compare as opções e conduza para reunião.",
  })

  if (parsed.action !== "DISAGREE") {
    throw new Error("disagreement required")
  }

  return parsed
}

describe("R2 consultant feedback contracts", () => {
  it("valida aceitação, discordância e resultado posterior", () => {
    expect(parseR2ConsultantFeedback({
      action: "ACCEPT",
      recommendationId: "recommendation-a",
      idempotencyKey: "accept-1",
    })).toEqual({
      action: "ACCEPT",
      recommendationId: "recommendation-a",
      idempotencyKey: "accept-1",
    })

    expect(disagreement()).toMatchObject({
      errorCategory: "WRONG_COMMERCIAL_STRATEGY",
      disagreementReason:
        "A capacidade mensal já foi informada.",
      correctPath:
        "Compare as opções e conduza para reunião.",
    })

    expect(parseR2ConsultantFeedback({
      action: "OUTCOME",
      recommendationId: "recommendation-b",
      idempotencyKey: "outcome-1",
      feedbackId: "feedback-1",
      outcome: "PARTIALLY_WORKED",
    })).toMatchObject({
      action: "OUTCOME",
      outcome: "PARTIALLY_WORKED",
    })
  })

  it("rejeita campos vazios, categoria inválida e payload excessivo", () => {
    expect(() => parseR2ConsultantFeedback({
      action: "DISAGREE",
      recommendationId: "recommendation-a",
      idempotencyKey: "feedback-1",
      errorCategory: "OTHER",
      disagreementReason: " ",
      correctPath: "Faça diferente.",
    })).toThrow("Onde o R2 errou")

    expect(() => parseR2ConsultantFeedback({
      action: "DISAGREE",
      recommendationId: "recommendation-a",
      idempotencyKey: "feedback-1",
      errorCategory: "INVALID",
      disagreementReason: "Errou.",
      correctPath: "Faça diferente.",
    })).toThrow("Tipo do erro")

    expect(() => parseR2ConsultantFeedback({
      action: "DISAGREE",
      recommendationId: "recommendation-a",
      idempotencyKey: "feedback-1",
      errorCategory: "OTHER",
      disagreementReason: "x".repeat(3001),
      correctPath: "Faça diferente.",
    })).toThrow("3000")
  })

  it.each([
    ["WRONG_FACT", "FACT_CORRECTION"],
    ["MISREAD_CONTEXT", "CONTEXT_CORRECTION"],
    ["WRONG_COMMERCIAL_STRATEGY", "STRATEGY_CORRECTION"],
    ["WRONG_NEXT_ACTION", "NEXT_ACTION_CORRECTION"],
    ["BAD_RESPONSE", "RESPONSE_CORRECTION"],
    ["PRODUCT_RULE_ERROR", "PRODUCT_RULE_CORRECTION"],
    ["CONSULTANT_PREFERENCE", "CONSULTANT_PREFERENCE"],
  ] as const)(
    "classifica %s sem promover a regra global",
    (category, expected) => {
      const context = buildR2ConsultantCorrectionContext(
        disagreement(category),
        "feedback-1",
      )

      expect(correctionTypeFor(category)).toBe(expected)
      expect(context).toMatchObject({
        correctionType: expected,
        scope: "CASE_CORRECTION",
        learningStatus: "LEARNING_CANDIDATE",
        reviewStatus: "PENDING_HUMAN_REVIEW",
        automaticGlobalModelUpdate: false,
      })
    },
  )

  it("não trata estratégia ou preferência como fato", () => {
    expect(buildR2ConsultantCorrectionContext(
      disagreement("WRONG_COMMERCIAL_STRATEGY"),
      "feedback-1",
    ).affectsEvidence).toBe(false)

    expect(buildR2ConsultantCorrectionContext(
      disagreement("CONSULTANT_PREFERENCE"),
      "feedback-2",
    ).affectsEvidence).toBe(false)

    expect(buildR2ConsultantCorrectionContext(
      disagreement("WRONG_FACT"),
      "feedback-3",
    ).affectsEvidence).toBe(true)
  })

  it("reconhece relato de confirmação sem convertê-lo em verdade global", () => {
    const feedback = parseR2ConsultantFeedback({
      action: "DISAGREE",
      recommendationId: "recommendation-a",
      idempotencyKey: "fact-1",
      errorCategory: "WRONG_FACT",
      disagreementReason:
        "Ele me confirmou agora por telefone que o lance é R$80 mil.",
      correctPath:
        "Reavalie com o valor atual informado.",
    })

    if (feedback.action !== "DISAGREE") {
      throw new Error("disagreement required")
    }

    expect(buildR2ConsultantCorrectionContext(
      feedback,
      "feedback-fact",
    )).toMatchObject({
      consultantReportsCustomerConfirmation: true,
      affectsEvidence: true,
      automaticGlobalModelUpdate: false,
    })
  })

  it("avança o caso para estratégia sem repetir qualificação conhecida", () => {
    const corrected =
      applyR2ConsultantCorrectionToAnalysis(
        analysis,
        buildR2ConsultantCorrectionContext(
          disagreement("MISSED_MEMORY"),
          "feedback-1",
        ),
      )

    expect(corrected.stage).toBe("strategy")
    expect(corrected.recommendedAction).toContain("Comparar")
    expect(corrected.recommendedAction).not.toContain("capacidade mensal")
  })

  it("gera identificadores determinísticos para retry idempotente", () => {
    expect(feedbackEventId("same-key")).toBe(
      feedbackEventId("same-key"),
    )
    expect(feedbackRevisionEventId("same-key")).toBe(
      "r2-feedback-revision-same-key",
    )
    expect(feedbackOutcomeEventId("same-key")).toBe(
      "r2-feedback-outcome-same-key",
    )
  })
})
