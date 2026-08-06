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

const opportunity:
  OpportunityDetailsView = {
  id:
    "journey-1",
  workspaceId:
    "workspace-1",
  title:
    "Oportunidade real",
  originName:
    "Cliente real",
  consultantId:
    "consultant-1",
  consultantName:
    "Rafael",
  priority:
    "HIGH",
  score:
    87,
  consortiumType:
    "real_estate",
  phaseId:
    "phase-1",
  phaseName:
    "Negociação",
  stateId:
    "state-1",
  stateName:
    "Proposta enviada",
  outcome:
    null,
  status:
    "open",
  stateEnteredAt:
    "2026-07-27T12:00:00.000Z",
  lastInteractionAt:
    null,
  closedAt:
    null,
  version:
    3,
  createdAt:
    "2026-07-26T12:00:00.000Z",
  updatedAt:
    "2026-07-27T14:00:00.000Z",
  timeline: [],
  origin:
    "client",
  leadId:
    null,
  clientId:
    "client-1",
}

describe(
  "OpportunityDetails learning link",
  () => {
    it(
      "abre o ciclo de aprendizado da mesma oportunidade sem carregar ações do servidor",
      () => {
        render(
          <OpportunityDetails
            opportunity={
              opportunity
            }
          />,
        )

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "Registrar aprendizado R2",
            },
          ).getAttribute(
            "href",
          ),
        ).toBe(
          "/opportunities/journey-1/learning",
        )
      },
    )
  },
)
