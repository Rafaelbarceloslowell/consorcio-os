import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildOpportunitySuggestedMessage,
} from "./build-opportunity-suggested-message"

const reactivationContext = {
  approachType:
    "reactivation" as const,
  isReactivated: true,
  phone: "5541999999999",
  email: "janaina@example.com",
  sourceLabel:
    "Lead - Janaina Rodrigues",
  importedAt:
    "2026-08-04T04:41:14.000Z",
  objective:
    "Comprar imóvel",
  currentSituation:
    "Pesquisando opções.",
  originalInformation: null,
}

describe(
  "buildOpportunitySuggestedMessage",
  () => {
    it(
      "gera uma retomada humana usando o objetivo conhecido",
      () => {
        expect(
          buildOpportunitySuggestedMessage({
            contactName:
              "Janaina Rodrigues",
            consultantName:
              "Rafael Barcelos",
            contactContext:
              reactivationContext,
          }),
        ).toBe(
          "Olá, Janaina! Tudo bem? Aqui é o Rafael. Passei pelo seu cadastro hoje e vi seu interesse em comprar imóvel. Queria entender como esse projeto evoluiu. Você conseguiu avançar ou ainda está estudando as possibilidades?",
        )
      },
    )

    it(
      "gera abertura Seals para novo atendimento sem usar histórico",
      () => {
        expect(
          buildOpportunitySuggestedMessage({
            contactName:
              "Marina Costa",
            consultantName:
              "Rafael Barcelos",
            contactContext: {
              ...reactivationContext,
              approachType:
                "new",
              isReactivated:
                false,
            },
          }),
        ).toBe(
          "Olá, Marina! Tudo bem? Meu nome é Rafael Barcelos. Sou consultor especialista em planejamento patrimonial e investimentos por meio do consórcio. Vi que você demonstrou interesse em conhecer melhor essa alternativa e queria entender um pouco do seu projeto. Hoje você pensa mais em imóvel, veículo ou investimento?",
        )
      },
    )

    it(
      "usa uma retomada neutra quando o objetivo ainda não foi registrado",
      () => {
        expect(
          buildOpportunitySuggestedMessage({
            contactName:
              "Lead não identificado",
            consultantName:
              "Consultor não identificado",
            contactContext: {
              ...reactivationContext,
              objective: null,
              currentSituation: null,
            },
          }),
        ).toBe(
          "Olá! Tudo bem? Aqui é o Rafael. Passei pelo seu cadastro hoje e quis retomar seu interesse. Queria entender como esse projeto evoluiu. Você conseguiu avançar ou ainda está estudando as possibilidades?",
        )
      },
    )

    it(
      "não fabrica conversa anterior ao reativar um contato que nunca respondeu",
      () => {
        const message =
          buildOpportunitySuggestedMessage({
            contactName:
              "Janaina Rodrigues",
            consultantName:
              "Rafael Barcelos",
            contactContext:
              reactivationContext,
          })

        expect(message).not.toContain(
          "nossa conversa",
        )
        expect(message).not.toContain(
          "conversamos",
        )
      },
    )

    it(
      "não usa situação interna na primeira mensagem de reativação",
      () => {
        const message =
          buildOpportunitySuggestedMessage({
            contactName:
              "Janaina",
            consultantName:
              "Rafael",
            contactContext: {
              ...reactivationContext,
              objective: null,
              currentSituation:
                "Aguardando reorganização financeira!",
            },
          })

        expect(message).not.toContain(
          "Aguardando reorganização financeira",
        )

        expect(message).not.toContain(
          "último registro",
        )
      },
    )

    it(
      "não gera mensagem sem classificação do atendimento",
      () => {
        expect(
          buildOpportunitySuggestedMessage({
            contactName:
              "Janaina",
            consultantName:
              "Rafael",
            contactContext: {
              ...reactivationContext,
              approachType: null,
            },
          }),
        ).toBeNull()
      },
    )

    it(
      "não gera mensagem sem contexto de contato",
      () => {
        expect(
          buildOpportunitySuggestedMessage({
            contactName:
              "Janaina",
            consultantName:
              "Rafael",
            contactContext:
              null,
          }),
        ).toBeNull()
      },
    )
  },
)
