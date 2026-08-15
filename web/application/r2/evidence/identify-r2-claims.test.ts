import {
  describe,
  expect,
  it,
} from "vitest"

import {
  identifyR2Claims,
} from "./identify-r2-claims"

function identify(
  text: string,
) {
  return identifyR2Claims({
    opportunityId: "opportunity-1",
    subject: "Cliente",
    text,
    sourceType: "CUSTOMER_MESSAGE",
    sourceReference: "message-1",
    observedAt: new Date("2026-08-15T12:00:00.000Z"),
  })
}

describe("identifyR2Claims", () => {
  it.each([
    ["Tenho R$ 100 mil para dar de lance.", "available_bid", 100_000],
    ["Hoje ganho R$ 18.000.", "monthly_income", 18_000],
    ["Consigo pagar até uns R$ 1.500 por mês.", "maximum_monthly_payment", 1_500],
    ["Agora estou olhando um imóvel de R$ 500 mil.", "desired_credit_value", 500_000],
  ])("identifica claim financeiro: %s", (text, key, value) => {
    expect(identify(text)[0]).toMatchObject({
      key,
      normalizedValue: value,
    })
  })

  it("trata informação negativa como fato válido", () => {
    expect(identify("Nunca respondeu.")[0]).toMatchObject({
      key: "customer_never_replied",
      normalizedValue: true,
      sensitivity: "LOW",
    })
  })

  it("não cria fatos para vazio, null conceitual ou ausência", () => {
    expect(identify("  ")).toEqual([])
    expect(identify("Não tenho essa informação.")).toEqual([])
  })

  it("limita esposa a possível envolvimento e marca como inferência", () => {
    const result = identify("Vou conversar com minha esposa.")[0]

    expect(result).toMatchObject({
      key: "possible_joint_decision_involvement",
      statement: "Pode existir outra pessoa envolvida na decisão.",
      provenance: {
        sourceType: "R2_INFERENCE",
        inferred: true,
      },
    })
    expect(JSON.stringify(result)).not.toContain("responsável financeira")
  })

  it("preserva temporalidade explícita", () => {
    expect(identify("Hoje ganho R$ 18 mil.")[0]).toMatchObject({
      temporalCue: "CURRENT",
      validFrom: "2026-08-15T12:00:00.000Z",
    })
  })
})
