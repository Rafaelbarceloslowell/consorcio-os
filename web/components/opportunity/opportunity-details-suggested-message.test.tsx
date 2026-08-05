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
  OpportunityDetailsView,
} from "@/types/opportunity-details"

import {
  OpportunityDetails,
} from "./opportunity-details"

const opportunity: OpportunityDetailsView = {
  id: "journey-1",
  workspaceId: "workspace-1",
  title: "Oportunidade real",
  originName: "Janaina Rodrigues",
  contactContext: {
    isReactivated: true,
    phone: "5541999999999",
    email: "janaina@example.com",
    sourceLabel:
      "Data Crazy · Inbound",
    importedAt:
      "2026-08-04T04:41:14.000Z",
    objective: "Comprar imóvel",
    currentSituation:
      "pesquisando opções",
    originalInformation: null,
  },
  suggestedMessage:
    "Olá, Janaina! Tudo bem?",
  consultantId: "consultant-1",
  consultantName: "Rafael",
  priority: "HIGH",
  score: 87,
  consortiumType: "real_estate",
  phaseId: "phase-1",
  phaseName: "Negociação",
  stateId: "state-1",
  stateName: "Contato inicial",
  outcome: null,
  status: "open",
  stateEnteredAt:
    "2026-08-04T04:41:14.000Z",
  lastInteractionAt: null,
  closedAt: null,
  version: 1,
  createdAt:
    "2026-08-04T04:41:14.000Z",
  updatedAt:
    "2026-08-04T04:41:14.000Z",
  timeline: [],
  origin: "lead",
  leadId: "lead-1",
  clientId: null,
}

describe(
  "OpportunityDetails Suggested Message",
  () => {
    it(
      "renderiza a mensagem depois do contexto aprovado",
      () => {
        render(
          <OpportunityDetails
            opportunity={opportunity}
          />,
        )

        expect(
          screen.getByTestId(
            "opportunity-contact-context",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(
            "opportunity-suggested-message",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("region", {
            name: "Mensagem sugerida pelo R2",
          }),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("textbox", {
            name: "Texto da mensagem",
          }),
        ).toHaveValue(
          "Olá, Janaina! Tudo bem?",
        )
      },
    )
  },
)
