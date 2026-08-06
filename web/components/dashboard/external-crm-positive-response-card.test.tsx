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

describe(
  "ExternalCrmPilotCard resposta positiva",
  () => {
    it(
      "mostra atendimento ativo e não oferece retorno automático aos Checks",
      async () => {
        const view =
          await buildExternalCrmPilotView({
            connector:
              new MockMaestroConnector(
                "REACTIVATION_POSITIVE_RESPONSE",
              ),
            scenarioId:
              "REACTIVATION_POSITIVE_RESPONSE",
          })

        render(
          <ExternalCrmPilotCard
            view={view}
          />,
        )

        expect(
          screen.getByText(
            "Atendimento ativo após reativação",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Reativação encerrada.",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Nenhuma ação de Check será retomada automaticamente/,
          ),
        ).toBeInTheDocument()
        expect(
          screen.queryByText(
            /ligação da manhã/i,
          ),
        ).not.toBeInTheDocument()
      },
    )
  },
)
