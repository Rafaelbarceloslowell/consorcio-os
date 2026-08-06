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

const view: LeadListView = {
  summaryLabel: "1 lead",
  leads: [
    {
      id: "lead-1",
      name: "alex silva",
      email: "alex@example.com",
      phoneLabel: "(41) 99999-9999",
      companyName: null,
      sourceLabel: "Indicação",
      statusLabel: "Novo",
      classification: "ACTIVE",
      consortiumTypeLabel: "Imóvel",
      desiredCreditValueLabel:
        "R$ 500.000,00",
      desiredTermLabel: "200 meses",
      consultantName: "Rafael",
      pipelineStageName:
        "Em atendimento",
      score: 0,
      entryLabel: "Entrada",
      createdAtLabel: "06/08/2026",
      opportunityHref:
        "/opportunities/journey-1",
    },
  ],
}

describe("LeadList contact edit link", () => {
  it("permite editar o lead diretamente pela lista", () => {
    render(<LeadList view={view} />)

    expect(
      screen.getByRole("link", {
        name:
          "Editar dados de alex silva",
      }).getAttribute("href"),
    ).toBe("/leads/lead-1/edit")

    expect(
      screen.getByRole("link", {
        name:
          "Abrir oportunidade de alex silva",
      }),
    ).toBeDefined()
  })
})
