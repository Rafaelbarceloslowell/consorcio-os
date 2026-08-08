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
  DashboardHeader,
} from "./dashboard-header"

vi.mock(
  "@/components/dashboard/gorila-r2-avatar-3d",
  () => ({
    GorilaR2Avatar3D: () => (
      <div data-testid="r2-avatar" />
    ),
  }),
)

vi.mock(
  "@/components/dashboard/r2-pilot-actions",
  () => ({
    R2PilotActions: () => (
      <div data-testid="r2-pilot-actions" />
    ),
  }),
)

vi.mock(
  "@/components/dashboard/r2-pending-action-controls",
  () => ({
    R2PendingActionControls: () => (
      <div data-testid="r2-pending-action-controls" />
    ),
  }),
)

vi.mock(
  "@/components/search/global-search",
  () => ({
    GlobalSearch: () => null,
  }),
)

describe(
  "DashboardHeader R2 Pilot Loop",
  () => {
    it(
      "mostra mensagem e decisões ao lado da imagem estática",
      () => {
        render(
          <DashboardHeader
            workspaceId="workspace-1"
            user={{
              id: "consultant-1",
              name: "Rafael",
            }}
            summary="Resumo comercial"
            gorilaR2={{
              greeting:
                "Boa noite, Rafael",
              analysis:
                "O cliente aguarda retorno há 48 horas.",
              recommendation:
                "Retome o contato com Marina.",
              reason:
                "Esta é a oportunidade com maior urgência.",
              confidence: "high",
              generatedAt:
                "2026-08-03T23:00:00.000Z",
              pilotAction: {
                recommendationId:
                  "recommendation-1",
                journeyId:
                  "journey-1",
                journeyTitle:
                  "Oportunidade Marina",
                opportunityHref:
                  "/opportunities/journey-1",
                actionType:
                  "SEND_MESSAGE",
                title:
                  "Retomar contato",
                description: null,
                reason:
                  "O cliente aguarda retorno.",
                priority: "HIGH",
                confidence: 0.92,
              },
            }}
          />,
        )

        expect(
          screen.getByTestId("r2-avatar"),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("heading", {
            name: "Oportunidade Marina",
          }),
        ).toBeInTheDocument()
        expect(
          screen.getByText("Retomar contato"),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Esta é a oportunidade com maior urgência.",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(
            "r2-pilot-actions",
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "mantém a ação aceita ao lado da imagem até a conclusão",
      () => {
        render(
          <DashboardHeader
            workspaceId="workspace-1"
            user={{
              id: "consultant-1",
              name: "Rafael",
            }}
            summary="Resumo comercial"
            gorilaR2={{
              greeting:
                "Ação em andamento. Vamos concluir o próximo passo.",
              analysis:
                "Entre em contato e registre o resultado.",
              recommendation:
                "Retomar contato com Rosecleia",
              reason:
                "A ação aceita permanece em foco.",
              confidence: "high",
              generatedAt:
                "2026-08-04T00:34:35.923Z",
              pendingAction: {
                actionId:
                  "action-1",
                journeyId:
                  "journey-1",
                journeyTitle:
                  "Oportunidade Rosecleia",
                opportunityHref:
                  "/opportunities/journey-1",
                actionType:
                  "SEND_MESSAGE",
                status:
                  "PENDING",
                title:
                  "Retomar contato com Rosecleia",
                description:
                  "Entre em contato e registre o resultado.",
                scheduledFor:
                  "2026-08-04T00:34:35.923Z",
              },
            }}
          />,
        )

        expect(
          screen.getByText(
            "Retomar contato com Rosecleia",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByTestId(
            "r2-pending-action-controls",
          ),
        ).toBeInTheDocument()

        expect(
          screen.queryByTestId(
            "r2-pilot-actions",
          ),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "não mostra decisões sem recomendação real aberta",
      () => {
        render(
          <DashboardHeader
            workspaceId="workspace-1"
            user={{
              id: "consultant-1",
              name: "Rafael",
            }}
            summary="Resumo comercial"
          />,
        )

        expect(
          screen.queryByTestId(
            "r2-pilot-actions",
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(
            "r2-pending-action-controls",
          ),
        ).not.toBeInTheDocument()
      },
    )
  },
)
