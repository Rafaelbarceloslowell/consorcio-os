// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  ProposalList,
} from "./proposal-list"

const action =
  vi.fn(async () => {})

describe("ProposalList", () => {
  it("oferece fechamento explícito para proposta aceita", () => {
    render(
      <ProposalList
        view={{
          proposals: [
            {
              id: "proposal-1",
              code:
                "GOS-2026-ABC123",
              contactName:
                "Rosecleia",
              consultantName:
                "Rafael Ramos",
              administratorName:
                "HS Consórcios",
              consortiumName:
                "Imóvel",
              creditValueLabel:
                "R$ 500.000,00",
              installmentValueLabel:
                "R$ 1.397,50",
              termMonths: 200,
              status:
                "ACCEPTED",
              statusLabel:
                "Aceita",
              validUntilLabel:
                "10/08/2026",
              createdAtLabel:
                "03/08/2026",
              rejectionReason:
                null,
              opportunityHref:
                "/opportunities/journey-1",
              clientId: null,
              convertedClientId:
                null,
              leadDocument:
                "12345678901",
              leadCompanyName:
                null,
              saleId: null,
            },
          ],
        }}
        sendAction={action}
        acceptAction={action}
        rejectAction={action}
        closeSaleAction={action}
      />,
    )

    expect(
      screen.getByText(
        /registre os dados da cota/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Fechar venda",
      ),
    ).toBeInTheDocument()
  })

  it("oferece envio para rascunho", () => {
    render(
      <ProposalList
        view={{
          proposals: [
            {
              id: "proposal-1",
              code:
                "GOS-2026-ABC123",
              contactName:
                "Rosecleia",
              consultantName:
                "Rafael Ramos",
              administratorName:
                "HS",
              consortiumName:
                "Imóvel",
              creditValueLabel:
                "R$ 500.000,00",
              installmentValueLabel:
                "R$ 1.397,50",
              termMonths: 200,
              status:
                "DRAFT",
              statusLabel:
                "Rascunho",
              validUntilLabel:
                "10/08/2026",
              createdAtLabel:
                "03/08/2026",
              rejectionReason:
                null,
              opportunityHref:
                null,
              clientId: null,
              convertedClientId:
                null,
              leadDocument: null,
              leadCompanyName:
                null,
              saleId: null,
            },
          ],
        }}
        sendAction={action}
        acceptAction={action}
        rejectAction={action}
        closeSaleAction={action}
      />,
    )

    expect(
      screen.getByRole("button", {
        name:
          "Marcar como enviada",
      }),
    ).toBeInTheDocument()
  })

  it("exibe estado vazio", () => {
    render(
      <ProposalList
        view={{
          proposals: [],
        }}
        sendAction={action}
        acceptAction={action}
        rejectAction={action}
        closeSaleAction={action}
      />,
    )

    expect(
      screen.getByText(
        "Ainda não existem propostas.",
      ),
    ).toBeInTheDocument()
  })
})
