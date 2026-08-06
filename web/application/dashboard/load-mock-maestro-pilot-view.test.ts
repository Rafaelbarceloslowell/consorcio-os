import {
  describe,
  expect,
  it,
} from "vitest"

import {
  loadMockMaestroPilotView,
  resolveMockMaestroScenarioId,
} from "./load-mock-maestro-pilot-view"

describe(
  "resolveMockMaestroScenarioId",
  () => {
    it(
      "aceita cenário conhecido sem diferenciar maiúsculas",
      () => {
        expect(
          resolveMockMaestroScenarioId({
            scenario:
              "overdue_actions",
            nodeEnvironment:
              "development",
          }),
        ).toBe(
          "OVERDUE_ACTIONS",
        )
      },
    )

    it(
      "usa apenas o primeiro valor da URL",
      () => {
        expect(
          resolveMockMaestroScenarioId({
            scenario: [
              "MEETING_SCHEDULED",
              "OVERDUE_ACTIONS",
            ],
            nodeEnvironment:
              "test",
          }),
        ).toBe(
          "MEETING_SCHEDULED",
        )
      },
    )

    it(
      "ignora cenário desconhecido",
      () => {
        expect(
          resolveMockMaestroScenarioId({
            scenario:
              "UNKNOWN_SCENARIO",
            nodeEnvironment:
              "development",
          }),
        ).toBeNull()
      },
    )

    it(
      "bloqueia o mock em produção",
      () => {
        expect(
          resolveMockMaestroScenarioId({
            scenario:
              "OVERDUE_ACTIONS",
            nodeEnvironment:
              "production",
          }),
        ).toBeNull()
      },
    )
  },
)

describe(
  "loadMockMaestroPilotView",
  () => {
    it(
      "não carrega simulação sem parâmetro explícito",
      async () => {
        await expect(
          loadMockMaestroPilotView({
            scenario:
              undefined,
            nodeEnvironment:
              "development",
          }),
        ).resolves.toBeUndefined()
      },
    )

    it(
      "carrega a visão normalizada do cenário selecionado",
      async () => {
        const view =
          await loadMockMaestroPilotView({
            scenario:
              "NO_RESPONSE_CHECK_3",
            nodeEnvironment:
              "development",
          })

        expect(view).toMatchObject({
          scenarioId:
            "NO_RESPONSE_CHECK_3",
          providerId:
            "MOCK_MAESTRO",
          simulation:
            true,
          readOnly:
            true,
          cadence: {
            currentCheck:
              3,
          },
        })
      },
    )
  },
)
