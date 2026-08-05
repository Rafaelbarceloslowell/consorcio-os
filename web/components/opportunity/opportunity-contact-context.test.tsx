// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
} from "vitest"

import {
  OpportunityContactContext,
} from "./opportunity-contact-context"

describe(
  "OpportunityContactContext",
  () => {
    it(
      "mostra somente o contexto de contato sem mensagem sugerida",
      () => {
        render(
          <OpportunityContactContext
            contactContext={{
              isReactivated: true,
              phone: "5541999999999",
              email:
                "janaina@example.com",
              sourceLabel:
                "Data Crazy · Inbound",
              importedAt:
                "2026-08-04T04:41:14.000Z",
              objective:
                "Comprar imóvel",
              currentSituation:
                "pesquisando opções",
              originalInformation:
                "Origem original preservada.",
            }}
          />,
        )

        expect(
          screen.getByText(
            "Data Crazy · Inbound",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Lead reativado",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "5541999999999",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "janaina@example.com",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Comprar imóvel",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "pesquisando opções",
          ),
        ).toBeInTheDocument()
        expect(
          screen.queryByRole("textbox"),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText(
            /mensagem sugerida/i,
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText(
            /perguntas comerciais/i,
          ),
        ).not.toBeInTheDocument()
      },
    )
  },
)
