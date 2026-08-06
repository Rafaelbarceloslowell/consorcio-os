import {
  describe,
  expect,
  it,
} from "vitest"

import {
  MockMaestroConnector,
} from "./mock-maestro-connector"

describe(
  "MockMaestroConnector reativação positiva",
  () => {
    it(
      "representa resposta positiva com cadência pausada e sem nova ação de Check",
      async () => {
        const connector =
          new MockMaestroConnector(
            "REACTIVATION_POSITIVE_RESPONSE",
          )

        const page =
          await connector.listLeads()

        const lead =
          page.items[0]

        const [
          cadence,
          timeline,
        ] = await Promise.all([
          connector.getLeadCadence(
            lead.externalLeadId,
          ),
          connector.getLeadTimeline(
            lead.externalLeadId,
          ),
        ])

        expect(lead).toMatchObject({
          stage:
            "atendimento_ativo",
          status:
            "active",
        })

        expect(cadence).toMatchObject({
          status:
            "PAUSED",
          paused:
            true,
          pauseReason:
            "CUSTOMER_REPLIED",
          nextActionId:
            null,
        })

        expect(
          timeline.map(
            (event) =>
              event.eventType,
          ),
        ).toEqual([
          "CUSTOMER_REPLIED",
        ])
        expect(
          timeline[0]?.summary,
        ).toBe(
          "Cliente respondeu durante a reativação.",
        )
      },
    )
  },
)
