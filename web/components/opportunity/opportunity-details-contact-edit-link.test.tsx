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

import type {
  OpportunityDetailsView,
} from "@/types/opportunity-details"

vi.mock(
  "./opportunity-approach-selector",
  () => ({
    OpportunityApproachSelector: () =>
      null,
  }),
)

import {
  OpportunityDetails,
} from "./opportunity-details"

const common = {
  id: "journey-1",
  workspaceId: "workspace-1",
  title: "Oportunidade real",
  originName: "alex silva",
  consultantId: "consultant-1",
  consultantName: "Rafael",
  priority: "HIGH" as const,
  score: 87,
  consortiumType:
    "real_estate" as const,
  phaseId: "phase-1",
  phaseName: "Negociação",
  stateId: "state-1",
  stateName: "Contato inicial",
  outcome: null,
  status: "open" as const,
  stateEnteredAt:
    "2026-07-27T12:00:00.000Z",
  lastInteractionAt: null,
  closedAt: null,
  version: 3,
  createdAt:
    "2026-07-26T12:00:00.000Z",
  updatedAt:
    "2026-07-27T14:00:00.000Z",
  timeline: [],
}

describe(
  "OpportunityDetails contact edit link",
  () => {
    it(
      "abre a edição do lead e retorna para a mesma oportunidade",
      () => {
        const opportunity:
          OpportunityDetailsView = {
          ...common,
          origin: "lead",
          leadId: "lead-1",
          clientId: null,
        }

        render(
          <OpportunityDetails
            opportunity={opportunity}
          />,
        )

        expect(
          screen.getByRole("link", {
            name:
              "Editar dados do contato",
          }).getAttribute("href"),
        ).toBe(
          "/leads/lead-1/edit?returnTo=%2Fopportunities%2Fjourney-1",
        )
      },
    )

    it(
      "reaproveita a edição completa já existente para clientes",
      () => {
        const opportunity:
          OpportunityDetailsView = {
          ...common,
          origin: "client",
          leadId: null,
          clientId: "client-1",
        }

        render(
          <OpportunityDetails
            opportunity={opportunity}
          />,
        )

        expect(
          screen.getByRole("link", {
            name:
              "Editar dados do contato",
          }).getAttribute("href"),
        ).toBe(
          "/clients/client-1/edit",
        )
      },
    )

    it(
      "preserva os acessos de aprendizado e edição da oportunidade",
      () => {
        const opportunity:
          OpportunityDetailsView = {
          ...common,
          origin: "client",
          leadId: null,
          clientId: "client-1",
        }

        render(
          <OpportunityDetails
            opportunity={opportunity}
          />,
        )

        expect(
          screen.getByRole("link", {
            name:
              "Registrar aprendizado R2",
          }),
        ).toBeDefined()
        expect(
          screen.getByRole("link", {
            name:
              "Editar oportunidade",
          }),
        ).toBeDefined()
      },
    )
  },
)
