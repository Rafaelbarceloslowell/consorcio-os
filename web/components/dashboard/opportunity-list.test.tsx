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

import type {
  MissionControlOpportunityView,
} from "@/types/dashboard"

import {
  OpportunityList,
} from "./opportunity-list"

function createOpportunity(
  id = "journey-1",
  title = "Consórcio imobiliário",
  score = 88,
  status: "open" | "closed" = "open",
  lastInteractionAt:
    string | null =
      "2026-07-26T15:00:00.000Z",
  outcome:
    MissionControlOpportunityView["outcome"] =
      null,
): MissionControlOpportunityView {
  return {
    id,
    title,
    origin: "client",
    originName: "Marina Costa",
    consultantName: "Rafael",
    priority: "HIGH",
    score,
    phaseName: "Negociação",
    stateName: "Proposta enviada",
    consortiumType:
      "real_estate",
    lastInteractionAt,
    updatedAt:
      "2026-07-26T18:00:00.000Z",
    status,
    outcome,
  }
}

describe(
  "OpportunityList",
  () => {
    it(
      "renderiza os dados operacionais da oportunidade",
      () => {
        render(
          <OpportunityList
            opportunities={[
              createOpportunity(),
            ]}
          />,
        )

        expect(
          screen.getByText(
            "Consórcio imobiliário",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Marina Costa · Rafael/,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Imóvel · Alta · score 88/,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Negociação · Proposta enviada/,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText("Aberta"),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Última interação:/,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Atualizada em/,
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "renderiza encerramento e fallback sem interação",
      () => {
        render(
          <OpportunityList
            opportunities={[
              createOpportunity(
                "journey-closed",
                undefined,
                undefined,
                "closed",
                null,
              ),
            ]}
          />,
        )

        expect(
          screen.getByText(
            "Encerrada",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Sem interação registrada",
          ),
        ).toBeInTheDocument()
      },
    )

    it.each([
      {
        status: "open",
        outcome: null,
        label: "Aberta",
      },
      {
        status: "closed",
        outcome: null,
        label: "Encerrada",
      },
      {
        status: "closed",
        outcome: "WON",
        label:
          "Venda concluída",
      },
      {
        status: "closed",
        outcome:
          "LOST_TO_COMPETITOR",
        label:
          "Perdida para concorrente",
      },
      {
        status: "closed",
        outcome:
          "NO_FINANCIAL_CAPACITY",
        label:
          "Sem capacidade financeira",
      },
      {
        status: "closed",
        outcome: "NO_RESPONSE",
        label: "Sem resposta",
      },
      {
        status: "closed",
        outcome: "POSTPONED",
        label: "Adiada",
      },
      {
        status: "closed",
        outcome:
          "PRODUCT_NOT_SUITABLE",
        label:
          "Produto inadequado",
      },
      {
        status: "closed",
        outcome: "TRUST_CONCERN",
        label:
          "Questão de confiança",
      },
      {
        status: "closed",
        outcome: "CLIENT_WITHDREW",
        label: "Cliente desistiu",
      },
      {
        status: "closed",
        outcome:
          "CANCELLED_BY_CONSULTANT",
        label:
          "Cancelada pelo consultor",
      },
      {
        status: "closed",
        outcome: "OTHER",
        label: "Outro motivo",
      },
    ] as const)(
      "apresenta o status como $label",
      ({
        status,
        outcome,
        label,
      }) => {
        render(
          <OpportunityList
            opportunities={[
              createOpportunity(
                undefined,
                undefined,
                undefined,
                status,
                undefined,
                outcome,
              ),
            ]}
          />,
        )

        expect(
          screen.getByText(label),
        ).toBeInTheDocument()
      },
    )

    it(
      "preserva a ordem recebida",
      () => {
        render(
          <OpportunityList
            opportunities={[
              createOpportunity(
                "journey-z",
                "Terceira",
                10,
              ),
              createOpportunity(
                "journey-a",
                "Primeira",
                100,
              ),
              createOpportunity(
                "journey-m",
                "Segunda",
                50,
              ),
            ]}
          />,
        )

        const items =
          screen.getAllByRole(
            "listitem",
          )

        expect(
          items.map(
            (item) =>
              item.querySelector("h3")
                ?.textContent,
          ),
        ).toEqual([
          "Terceira",
          "Primeira",
          "Segunda",
        ])
      },
    )

    it(
      "renderiza estado vazio",
      () => {
        render(
          <OpportunityList
            opportunities={[]}
          />,
        )

        expect(
          screen.getByText(
            "Nenhuma oportunidade encontrada.",
          ),
        ).toBeInTheDocument()
      },
    )
  },
)
