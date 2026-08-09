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
  LeadListView,
} from "@/types/lead-list"

import {
  LeadList,
} from "./lead-list"

function createView(): LeadListView {
  return {
    summaryLabel:
      "1 lead em atendimento",
    leads: [
      {
        id: "lead-1",
        name: "Rosecleia Ramos",
        email: "rosecleia@example.com",
        phoneLabel:
          "+55 (41) 99999-9999",
        companyName: null,
        sourceLabel: "Indicação",
        statusLabel: "Em negociação",
        classification: "ACTIVE",
        consortiumTypeLabel: "Imóvel",
        desiredCreditValueLabel:
          "R$ 500.000,00",
        desiredTermLabel:
          "200 meses",
        consultantName: "Rafael Ramos",
        pipelineStageName:
          "Em atendimento",
        score: 100,
        entryLabel: "Entrada",
        createdAtLabel: "03/08/2026",
        opportunityHref:
          "/opportunities/journey-1",
        canTriage: false,
      },
    ],
    pagination: {
      page: 1,
      totalPages: 1,
      totalCount: 1,
      previousHref: null,
      nextHref: null,
    },
  }
}

describe("LeadList", () => {
  it("apresenta leads reais e abre a oportunidade vinculada", () => {
    render(
      <LeadList view={createView()} />,
    )

    expect(
      screen.getByRole("heading", {
        name: "Leads",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "1 lead em atendimento",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Rosecleia Ramos"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Em atendimento"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", {
        name:
          "Abrir oportunidade de Rosecleia Ramos",
      }),
    ).toHaveAttribute(
      "href",
      "/opportunities/journey-1",
    )
    expect(
      screen.getByRole("link", {
        name: "Novo lead",
      }),
    ).toHaveAttribute(
      "href",
      "/leads/new",
    )
  })

  it("apresenta reativados com os rótulos corretos", () => {
    const view = createView()
    view.summaryLabel =
      "1 lead reativado"
    view.leads[0] = {
      ...view.leads[0],
      statusLabel: "Reativado",
      classification: "REACTIVATED",
      sourceLabel:
        "Data Crazy · Inbound",
      desiredCreditValueLabel:
        "Não informado",
      desiredTermLabel:
        "Não informado",
      entryLabel: "Importado em",
    }

    render(<LeadList view={view} />)

    expect(
      screen.getByText(
        "1 lead reativado",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Reativado"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Data Crazy · Inbound",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Importado em",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        "Não informado",
      ),
    ).toHaveLength(2)
  })

  it("apresenta estado vazio com acesso ao primeiro cadastro", () => {
    render(
      <LeadList
        view={{
          summaryLabel:
            "0 leads em atendimento",
          leads: [],
          pagination: {
            page: 1,
            totalPages: 1,
            totalCount: 0,
            previousHref: null,
            nextHref: null,
          },
        }}
      />,
    )

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Ainda não existem leads cadastrados.",
    )
    expect(
      screen.getByRole("link", {
        name: "Cadastrar primeiro lead",
      }),
    ).toHaveAttribute(
      "href",
      "/leads/new",
    )
  })

  it("oferece classificação explícita para backlog não triado", () => {
    const view = createView()
    view.summaryLabel = "1 em triagem"
    view.leads[0] = {
      ...view.leads[0],
      classification: "UNTRIAGED",
      statusLabel: "Triagem pendente",
      canTriage: true,
      opportunityHref: null,
    }

    render(<LeadList view={view} />)

    expect(screen.getByRole("button", { name: "Novo" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reativação" })).toBeInTheDocument()
    expect(screen.queryByText("Nenhuma oportunidade aberta.")).not.toBeInTheDocument()
  })

  it("pagina sem renderizar toda a base", () => {
    const view = createView()
    view.pagination = {
      page: 2,
      totalPages: 13,
      totalCount: 309,
      previousHref: "/leads?page=1",
      nextHref: "/leads?page=3",
    }

    render(<LeadList view={view} />)

    expect(screen.getByText("Página 2 de 13")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/leads?page=3")
  })
})
