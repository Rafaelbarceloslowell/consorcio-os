import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildOpportunitySuggestedQuestions,
} from "./build-opportunity-suggested-questions"

const baseContext = {
  isReactivated: true,
  phone: "5541999999999",
  email: "janaina@example.com",
  sourceLabel: "Data Crazy · Inbound",
  importedAt: "2026-08-04T04:41:14.000Z",
  objective: "Comprar imóvel.",
  currentSituation: "Pesquisando   opções!",
  originalInformation: null,
}

describe(
  "buildOpportunitySuggestedQuestions",
  () => {
    it(
      "gera quatro perguntas SPIN para lead reativado",
      () => {
        expect(
          buildOpportunitySuggestedQuestions({
            contactContext: baseContext,
          }),
        ).toEqual([
          {
            kind: "situation",
            label: "Situação",
            question: "O que mudou no seu planejamento desde o último atendimento?",
          },
          {
            kind: "problem",
            label: "Problema",
            question: "No último registro, sua situação era \"Pesquisando opções\". O que está impedindo você de avançar hoje?",
          },
          {
            kind: "implication",
            label: "Implicação",
            question: "Se o objetivo de comprar imóvel continuar parado nos próximos meses, qual impacto isso terá para você?",
          },
          {
            kind: "need_payoff",
            label: "Próximo passo",
            question: "O que precisaria acontecer para você se sentir seguro em avançar para o próximo passo?",
          },
        ])
      },
    )

    it(
      "adapta a pergunta de situação para oportunidade não reativada",
      () => {
        const questions =
          buildOpportunitySuggestedQuestions({
            contactContext: {
              ...baseContext,
              isReactivated: false,
            },
          })

        expect(questions?.[0].question).toBe(
          "Como está seu planejamento hoje em relação a esse projeto?",
        )
      },
    )

    it(
      "usa pergunta genérica quando a situação atual não existe",
      () => {
        const questions =
          buildOpportunitySuggestedQuestions({
            contactContext: {
              ...baseContext,
              currentSituation: null,
            },
          })

        expect(questions?.[1].question).toBe(
          "Qual é hoje o principal obstáculo para avançar com esse projeto?",
        )
      },
    )

    it(
      "usa implicação genérica quando o objetivo não existe",
      () => {
        const questions =
          buildOpportunitySuggestedQuestions({
            contactContext: {
              ...baseContext,
              objective: null,
            },
          })

        expect(questions?.[2].question).toBe(
          "Se esse projeto continuar parado nos próximos meses, qual impacto isso terá para você?",
        )
      },
    )

    it(
      "normaliza espaços e pontuação terminal do contexto",
      () => {
        const questions =
          buildOpportunitySuggestedQuestions({
            contactContext: {
              ...baseContext,
              objective: "  Planejar   o primeiro imóvel!!!  ",
              currentSituation: "  aguardando   reorganização financeira... ",
            },
          })

        expect(questions?.[1].question).toContain(
          '"aguardando reorganização financeira"',
        )
        expect(questions?.[2].question).toContain(
          "objetivo de planejar o primeiro imóvel",
        )
      },
    )

    it(
      "não gera perguntas sem contexto de contato",
      () => {
        expect(
          buildOpportunitySuggestedQuestions({
            contactContext: null,
          }),
        ).toBeNull()
      },
    )
  },
)
