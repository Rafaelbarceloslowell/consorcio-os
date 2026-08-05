import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildOpportunityBriefing,
} from "./build-opportunity-briefing"

const context = {
  isReactivated: true,
  phone: "5541999999999",
  email: "janaina@example.com",
  sourceLabel: "Data Crazy · Inbound",
  importedAt: "2026-08-04T04:41:14.000Z",
  objective: "Comprar imóvel",
  currentSituation: "pesquisando opções",
  originalInformation: null,
}

const questions = [
  {
    kind: "situation" as const,
    label: "Situação",
    question: "O que mudou no seu planejamento desde o último atendimento?",
  },
]

describe(
  "buildOpportunityBriefing",
  () => {
    it(
      "não cria briefing sem contexto aprovado",
      () => {
        expect(
          buildOpportunityBriefing({
            contactName: "Janaina",
            contactContext: null,
            suggestedQuestions: questions,
          }),
        ).toBeNull()
      },
    )

    it(
      "resume lead reativado com origem e objetivo",
      () => {
        expect(
          buildOpportunityBriefing({
            contactName: "Janaina Rodrigues",
            contactContext: context,
            suggestedQuestions: questions,
          })?.summary,
        ).toBe(
          "Janaina Rodrigues é um lead reativado de Data Crazy · Inbound, com objetivo registrado de comprar imóvel.",
        )
      },
    )

    it(
      "transforma a situação atual em ponto de atenção",
      () => {
        expect(
          buildOpportunityBriefing({
            contactName: "Janaina Rodrigues",
            contactContext: context,
            suggestedQuestions: questions,
          })?.attentionPoint,
        ).toBe(
          "Situação atual registrada: pesquisando opções.",
        )
      },
    )

    it(
      "usa fallback explícito quando objetivo e situação estão ausentes",
      () => {
        const result = buildOpportunityBriefing({
          contactName: "Janaina Rodrigues",
          contactContext: {
            ...context,
            objective: null,
            currentSituation: null,
          },
          suggestedQuestions: null,
        })

        expect(result).toEqual({
          summary: "Janaina Rodrigues é um lead reativado de Data Crazy · Inbound; o objetivo precisa ser confirmado antes de qualquer proposta.",
          attentionPoint: "Não há situação atual registrada; confirme o que mudou desde o último atendimento.",
          conversationFocus: "Entender a prioridade real, o prazo esperado e o critério de decisão do contato.",
          recommendedNextStep: "Comece validando o momento atual e avance uma pergunta por vez antes de apresentar condições.",
        })
      },
    )

    it(
      "usa a pergunta de Situação como próximo movimento",
      () => {
        expect(
          buildOpportunityBriefing({
            contactName: "Janaina Rodrigues",
            contactContext: context,
            suggestedQuestions: questions,
          })?.recommendedNextStep,
        ).toBe(
          "Comece por: O que mudou no seu planejamento desde o último atendimento?",
        )
      },
    )

    it(
      "normaliza espaços e pontuação do conteúdo recebido",
      () => {
        const result = buildOpportunityBriefing({
          contactName: "  Janaina   Rodrigues  ",
          contactContext: {
            ...context,
            sourceLabel: "  Data Crazy · Inbound  ",
            objective: "  Comprar   imóvel!!!  ",
            currentSituation: "  pesquisando   opções...  ",
          },
          suggestedQuestions: [
            {
              ...questions[0],
              question: "  O que mudou no planejamento???  ",
            },
          ],
        })

        expect(result).toEqual({
          summary: "Janaina Rodrigues é um lead reativado de Data Crazy · Inbound, com objetivo registrado de comprar imóvel.",
          attentionPoint: "Situação atual registrada: pesquisando opções.",
          conversationFocus: "Entender prioridade, prazo e segurança necessários para avançar em comprar imóvel.",
          recommendedNextStep: "Comece por: O que mudou no planejamento?",
        })
      },
    )
  },
)
