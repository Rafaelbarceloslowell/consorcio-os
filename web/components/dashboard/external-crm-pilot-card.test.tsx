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

import {
  buildExternalCrmPilotView,
} from "@/application/dashboard/build-external-crm-pilot-view"

import {
  MockMaestroConnector,
} from "@/application/integration/external-crm"

import {
  ExternalCrmPilotCard,
} from "./external-crm-pilot-card"

async function renderScenario(
  scenarioId:
    | "OVERDUE_ACTIONS"
    | "CADENCE_PAUSED_NEXT_ACTION"
    | "MEETING_SCHEDULED"
    | "CADENCE_COMPLETED",
) {
  const view =
    await buildExternalCrmPilotView({
      connector:
        new MockMaestroConnector(
          scenarioId,
        ),
      scenarioId,
    })

  render(
    <ExternalCrmPilotCard
      view={view}
    />,
  )
}

describe(
  "ExternalCrmPilotCard",
  () => {
    it(
      "deixa explícito que o Maestro é simulado",
      async () => {
        await renderScenario(
          "OVERDUE_ACTIONS",
        )

        expect(
          screen.getByText(
            "Maestro simulado conectado ao R2",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Check 2 de 5",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "5 atrasadas",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Somente leitura",
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "mostra o próximo passo e oculta ligação quando a cadência está pausada",
      async () => {
        await renderScenario(
          "CADENCE_PAUSED_NEXT_ACTION",
        )

        expect(
          screen.getByText(
            "Próximo passo oficial do Maestro",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getAllByText(
            /Próximo passo definido/,
          ).length,
        ).toBeGreaterThan(
          0,
        )
        expect(
          screen.queryByText(
            "Segunda ligação da manhã",
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByText(
            /NEXT_ACTION_DEFINED/,
          ),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "mostra a reunião como compromisso oficial sem exibir ligação paralela",
      async () => {
        await renderScenario(
          "MEETING_SCHEDULED",
        )

        expect(
          screen.getByText(
            "Compromisso oficial do Maestro",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getAllByText(
            "Conversa comercial",
          ).length,
        ).toBeGreaterThan(
          0,
        )
        expect(
          screen.queryByText(
            "Primeira ligação da tarde",
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.getByText(
            /sem criar uma segunda agenda/,
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "bloqueia nova tentativa quando a cadência terminou",
      async () => {
        await renderScenario(
          "CADENCE_COMPLETED",
        )

        expect(
          screen.getByText(
            "Cadência concluída no Maestro",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Nenhuma nova tentativa está liberada.",
          ),
        ).toBeInTheDocument()
      },
    )
  },
)
