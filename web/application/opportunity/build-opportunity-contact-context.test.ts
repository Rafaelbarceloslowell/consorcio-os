import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildOpportunityContactContext,
} from "./build-opportunity-contact-context"

describe(
  "buildOpportunityContactContext",
  () => {
    it(
      "usa reativacao somente quando definida pelo consultor",
      () => {
        const notes = [
          "Objetivo: Comprar imovel",
          "Situacao atual: pesquisando opcoes",
        ].join("\n")

        const result =
          buildOpportunityContactContext({
            origin: "lead",
            opportunityTitle:
              "Atendimento Janaina",
            originEntity: {
              id: "lead-janaina",
              name: "Janaina Rodrigues",
              approachType:
                "reactivation",
              phone: "5541999999999",
              email:
                "janaina@example.com",
              createdAt:
                "2026-08-04T04:41:14.000Z",
              notes,
            },
          })

        expect(result).toEqual({
          approachType:
            "reactivation",
          isReactivated: true,
          phone: "5541999999999",
          email:
            "janaina@example.com",
          sourceLabel:
            "Lead · Janaina Rodrigues",
          importedAt:
            "2026-08-04T04:41:14.000Z",
          objective:
            "Comprar imovel",
          currentSituation:
            "pesquisando opcoes",
          originalInformation:
            notes,
        })
      },
    )

    it(
      "nao inventa dados ausentes",
      () => {
        const result =
          buildOpportunityContactContext({
            origin: "lead",
            opportunityTitle:
              "Atendimento Maria",
            originEntity: {
              id: "lead-maria",
              name: "Maria",
              approachType: null,
            },
          })

        expect(result).toEqual({
          approachType: null,
          isReactivated: false,
          phone: null,
          email: null,
          sourceLabel:
            "Lead · Maria",
          importedAt: null,
          objective: null,
          currentSituation: null,
          originalInformation: null,
        })
      },
    )
  },
)