import {
  describe,
  expect,
  it,
} from "vitest"

import {
  MockMaestroConnector,
} from "@/application/integration/external-crm"

import {
  buildExternalCrmPilotView,
  formatExternalCadencePauseReason,
} from "./build-external-crm-pilot-view"

async function buildScenario(
  scenarioId:
    | "NEW_LEAD_CHECK_1"
    | "NO_RESPONSE_CHECK_3"
    | "OVERDUE_ACTIONS"
    | "CADENCE_PAUSED_NEXT_ACTION"
    | "MEETING_SCHEDULED"
    | "CADENCE_COMPLETED",
) {
  return buildExternalCrmPilotView({
    connector:
      new MockMaestroConnector(
        scenarioId,
      ),
    scenarioId,
  })
}

describe(
  "buildExternalCrmPilotView",
  () => {
    it(
      "mostra o primeiro Check sem criar uma cadência paralela",
      async () => {
        const view =
          await buildScenario(
            "NEW_LEAD_CHECK_1",
          )

        expect(view).toMatchObject({
          providerId:
            "MOCK_MAESTRO",
          simulation:
            true,
          readOnly:
            true,
          cadence: {
            currentCheck:
              1,
            totalChecks:
              5,
            plannedActions:
              7,
            completedActions:
              0,
          },
        })

        expect(
          view.r2.reason,
        ).toContain(
          "Maestro controla o processo",
        )
      },
    )

    it(
      "expõe o Check 3 e a próxima ação oficial",
      async () => {
        const view =
          await buildScenario(
            "NO_RESPONSE_CHECK_3",
          )

        expect(view.cadence).toMatchObject({
          currentCheck:
            3,
          completedActions:
            4,
          plannedActions:
            7,
        })

        expect(
          view.nextAction?.label,
        ).toBe(
          "Segunda ligação da tarde",
        )
      },
    )

    it(
      "prioriza ações atrasadas informadas pelo Maestro",
      async () => {
        const view =
          await buildScenario(
            "OVERDUE_ACTIONS",
          )

        expect(
          view.cadence
            ?.overdueActions,
        ).toBe(
          5,
        )

        expect(
          view.r2.recommendation,
        ).toContain(
          "5 ações atrasadas",
        )
      },
    )

    it(
      "oculta tentativa de contato quando a cadência está pausada",
      async () => {
        const view =
          await buildScenario(
            "CADENCE_PAUSED_NEXT_ACTION",
          )

        expect(view.cadence).toMatchObject({
          status:
            "PAUSED",
          paused:
            true,
          pauseReason:
            "NEXT_ACTION_DEFINED",
          pauseReasonLabel:
            "Próximo passo definido",
        })

        expect(
          view.nextAction,
        ).toBeNull()
        expect(
          view.lead.nextActionAt,
        ).toBe(
          "2026-08-06T18:00:00.000Z",
        )
        expect(
          view.r2.analysis,
        ).toContain(
          "Próximo passo definido",
        )
        expect(
          view.r2.analysis,
        ).not.toContain(
          "NEXT_ACTION_DEFINED",
        )
      },
    )

    it(
      "prioriza reunião e oculta a ligação da cadência pausada",
      async () => {
        const view =
          await buildScenario(
            "MEETING_SCHEDULED",
          )

        expect(view.meeting).toMatchObject({
          title:
            "Conversa comercial",
          status:
            "SCHEDULED",
        })

        expect(
          view.nextAction,
        ).toBeNull()
        expect(
          view.r2.reason,
        ).toContain(
          "sem criar uma segunda agenda",
        )
      },
    )

    it(
      "mantém a decisão de reativação fora do mock quando a cadência termina",
      async () => {
        const view =
          await buildScenario(
            "CADENCE_COMPLETED",
          )

        expect(view.cadence).toMatchObject({
          status:
            "COMPLETED",
          currentCheck:
            5,
          completedActions:
            7,
        })

        expect(
          view.nextAction,
        ).toBeNull()

        expect(
          view.r2.recommendation,
        ).toContain(
          "aguardar a decisão oficial",
        )
      },
    )
  },
)

describe(
  "formatExternalCadencePauseReason",
  () => {
    it(
      "traduz códigos oficiais conhecidos",
      () => {
        expect(
          formatExternalCadencePauseReason(
            "NEXT_ACTION_DEFINED",
          ),
        ).toBe(
          "Próximo passo definido",
        )
      },
    )

    it(
      "humaniza código desconhecido sem exibir identificador cru",
      () => {
        expect(
          formatExternalCadencePauseReason(
            "CUSTOMER_TEMPORARILY_UNAVAILABLE",
          ),
        ).toBe(
          "Customer temporarily unavailable",
        )
      },
    )
  },
)
