import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildLeadListPresentation,
} from "./build-lead-list-presentation"

function createLead(
  overrides: Partial<
    Parameters<
      typeof buildLeadListPresentation
    >[0][number]
  > = {},
) {
  return {
    id: "lead-1",
    name: "Lead Teste",
    email: "lead@example.com",
    phone: "5541998014184",
    companyName: null,
    source: "REFERRAL",
    status: "NEGOTIATING",
    consortiumType: "REAL_ESTATE",
    desiredCreditValue: 500000,
    desiredTermMonths: 200,
    score: 100,
    notes: null,
    createdAt: new Date(
      "2026-08-04T03:00:00.000Z",
    ),
    consultant: {
      name: "Rafael Ramos Barcelos",
    },
    pipelineStage: {
      name: "Em atendimento",
    },
    commercialJourneys: [
      {
        id: "journey-1",
      },
    ],
    ...overrides,
  }
}

describe("buildLeadListPresentation", () => {
  it("mantém a apresentação operacional de um lead comum", () => {
    const view =
      buildLeadListPresentation([
        createLead(),
      ])

    expect(view.summaryLabel).toBe(
      "1 lead em atendimento",
    )
    expect(view.leads[0]).toEqual(
      expect.objectContaining({
        classification: "ACTIVE",
        statusLabel: "Em negociação",
        sourceLabel: "Indicação",
        phoneLabel:
          "+55 (41) 99801-4184",
        consortiumTypeLabel:
          "Imóvel",
        desiredCreditValueLabel:
          "R$ 500.000,00",
        desiredTermLabel:
          "200 meses",
        entryLabel: "Entrada",
      }),
    )
  })

  it("apresenta o importado do Data Crazy como reativado sem inventar dados", () => {
    const view =
      buildLeadListPresentation([
        createLead({
          email:
            "datacrazy-1@sem-email.gorila.local",
          source: "OTHER",
          status: "CONTACTED",
          consortiumType: "OTHER",
          desiredCreditValue: 0,
          desiredTermMonths: 0,
          score: 0,
          notes: [
            "[IMPORTAÇÃO DATA CRAZY — LEAD REATIVADO]",
            "Funil principal: INBOUND",
            "Funis encontrados: INBOUND|OUTBOUND",
            "Objetivo: não informado",
          ].join("\n"),
          pipelineStage: {
            name:
              "Reativação Data Crazy",
          },
        }),
      ])

    expect(view.summaryLabel).toBe(
      "1 lead reativado",
    )
    expect(view.leads[0]).toEqual(
      expect.objectContaining({
        classification:
          "REACTIVATED",
        statusLabel: "Reativado",
        sourceLabel:
          "Data Crazy · Inbound + Outbound",
        email: "Não informado",
        consortiumTypeLabel:
          "Não informado",
        desiredCreditValueLabel:
          "Não informado",
        desiredTermLabel:
          "Não informado",
        entryLabel: "Importado em",
      }),
    )
  })

  it("usa o objetivo original e formata telefone de Portugal", () => {
    const view =
      buildLeadListPresentation([
        createLead({
          phone: "351916855779",
          notes: [
            "[IMPORTAÇÃO DATA CRAZY — LEAD REATIVADO]",
            "Funil principal: INBOUND",
            "Funis encontrados: INBOUND",
            "Objetivo: Comprar imóvel",
          ].join("\n"),
          pipelineStage: {
            name:
              "Reativação Data Crazy",
          },
        }),
      ])

    expect(view.leads[0]).toEqual(
      expect.objectContaining({
        phoneLabel:
          "+351 916 855 779",
        consortiumTypeLabel:
          "Comprar imóvel",
        sourceLabel:
          "Data Crazy · Inbound",
      }),
    )
  })

  it("resume listas mistas sem contar reativados como entrada nova", () => {
    const view =
      buildLeadListPresentation([
        createLead(),
        createLead({
          id: "lead-2",
          notes:
            "[IMPORTAÇÃO DATA CRAZY — LEAD REATIVADO]",
          pipelineStage: {
            name:
              "Reativação Data Crazy",
          },
        }),
      ])

    expect(view.summaryLabel).toBe(
      "1 reativado · 1 em atendimento",
    )
  })
})
