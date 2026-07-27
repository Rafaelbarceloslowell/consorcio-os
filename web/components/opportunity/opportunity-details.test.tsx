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

function createView(
  origin:
    "lead" | "client" = "client",
  status:
    "open" | "closed" = "open",
  outcome:
    OpportunityDetailsView["outcome"] =
      null,
): OpportunityDetailsView {
  const common:
    Omit<
      OpportunityDetailsView,
      "origin" | "leadId" | "clientId"
    > = {
    id: "journey-1",
    workspaceId: "workspace-1",
    title: "Oportunidade real",
    originName:
      origin === "lead"
        ? "Lead real"
        : "Cliente real",
    consultantId:
      "consultant-1",
    consultantName: "Rafael",
    priority: "HIGH",
    score: 87,
    consortiumType:
      "real_estate",
    phaseId: "phase-1",
    phaseName: "Negociação",
    stateId: "state-1",
    stateName:
      "Proposta enviada",
    outcome,
    status,
    stateEnteredAt:
      "2026-07-27T12:00:00.000Z",
    lastInteractionAt:
      "2026-07-27T13:00:00.000Z",
    closedAt:
      status === "closed"
        ? "2026-07-27T15:00:00.000Z"
        : null,
    version: 3,
    createdAt:
      "2026-07-26T12:00:00.000Z",
    updatedAt:
      "2026-07-27T14:00:00.000Z",
  }

  return origin === "lead"
    ? {
        ...common,
        origin: "lead",
        leadId: "lead-1",
        clientId: null,
      }
    : {
        ...common,
        origin: "client",
        leadId: null,
        clientId: "client-1",
      }
}

describe(
  "OpportunityDetails",
  () => {
    it.each([
      ["lead", "Lead · Lead real"],
      [
        "client",
        "Cliente · Cliente real",
      ],
    ] as const)(
      "renderiza origem %s e campos operacionais",
      (origin, originLabel) => {
        const { container } =
          render(
            <OpportunityDetails
              opportunity={createView(
                origin,
              )}
            />,
          )

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Oportunidade real",
            },
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            originLabel,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText("Rafael"),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Negociação",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Proposta enviada",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText("Alta"),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "26/07/2026, 09:00",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "27/07/2026, 09:00",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "27/07/2026, 10:00",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "27/07/2026, 11:00",
          ),
        ).toBeInTheDocument()
        expect(
          container.textContent,
        ).not.toContain(
          "[object Object]",
        )
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
    ] as const)(
      "renderiza status $label",
      ({
        status,
        outcome,
        label,
      }) => {
        render(
          <OpportunityDetails
            opportunity={createView(
              "client",
              status,
              outcome,
            )}
          />,
        )

        expect(
          screen.getAllByText(label)
            .length,
        ).toBeGreaterThan(0)

        if (status === "closed") {
          expect(
            screen.getByText(
              "27/07/2026, 12:00",
            ),
          ).toBeInTheDocument()
        }
      },
    )

    it(
      "renderiza fallbacks, datas e nenhuma ação de escrita",
      () => {
        const view = createView()
        view.originName =
          "Cliente não identificado"
        view.consultantName =
          "Consultor não identificado"
        view.phaseName =
          "Fase indisponível"
        view.stateName =
          "Estado indisponível"
        view.lastInteractionAt = null

        render(
          <OpportunityDetails
            opportunity={view}
          />,
        )

        expect(
          screen.getByText(
            /Cliente não identificado/,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Consultor não identificado",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Fase indisponível",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Estado indisponível",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getAllByText(
            "Não registrada",
          ).length,
        ).toBe(2)
        expect(
          screen.queryByRole(
            "button",
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText(
            /editar|excluir|alterar fase/i,
          ),
        ).not.toBeInTheDocument()
      },
    )
  },
)
