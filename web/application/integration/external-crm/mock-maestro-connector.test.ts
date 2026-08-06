import {
  describe,
  expect,
  it,
} from "vitest"

import {
  MockMaestroConnector,
} from "./mock-maestro-connector"

describe(
  "MockMaestroConnector",
  () => {
    it(
      "declara leitura sem escrita e sem acesso ao Maestro real",
      async () => {
        const connector =
          new MockMaestroConnector()

        const health =
          await connector.getHealth()

        expect(
          connector.capabilities.writes,
        ).toBe(
          false,
        )

        expect(health).toMatchObject({
          providerId:
            "MOCK_MAESTRO",
          status:
            "AVAILABLE",
          readOnly:
            true,
        })

        expect(
          health.diagnostics,
        ).toContain(
          "Nenhum acesso ao Maestro real foi realizado.",
        )
      },
    )

    it(
      "entrega lead e Check normalizados",
      async () => {
        const connector =
          new MockMaestroConnector(
            "NO_RESPONSE_CHECK_3",
          )

        const page =
          await connector.listLeads()

        const lead =
          page.items[0]

        const cadence =
          await connector.getLeadCadence(
            lead.externalLeadId,
          )

        expect(lead.trace).toMatchObject({
          sourceSystem:
            "maestro",
          dataOwner:
            "EXTERNAL_CRM",
        })

        expect(cadence).toMatchObject({
          currentCheck:
            3,
          totalChecks:
            5,
          plannedActions:
            7,
          completedActions:
            4,
          templateVersion:
            "official-v3",
        })
      },
    )

    it(
      "representa ações atrasadas sem alterar a cadência",
      async () => {
        const connector =
          new MockMaestroConnector(
            "OVERDUE_ACTIONS",
          )

        const page =
          await connector.listLeads()

        const cadence =
          await connector.getLeadCadence(
            page.items[0]
              .externalLeadId,
          )

        expect(
          cadence?.actions.some(
            (action) =>
              action.dueState ===
              "OVERDUE",
          ),
        ).toBe(
          true,
        )

        expect(
          cadence?.actions,
        ).toHaveLength(
          7,
        )
      },
    )

    it(
      "representa pausa por próximo passo sem inventar conversa",
      async () => {
        const connector =
          new MockMaestroConnector(
            "CADENCE_PAUSED_NEXT_ACTION",
          )

        const page =
          await connector.listLeads()

        const lead =
          page.items[0]

        const cadence =
          await connector.getLeadCadence(
            lead.externalLeadId,
          )

        expect(cadence).toMatchObject({
          status:
            "PAUSED",
          paused:
            true,
          pauseReason:
            "NEXT_ACTION_DEFINED",
        })

        expect(
          "latestCustomerMessage" in
            lead,
        ).toBe(
          false,
        )
      },
    )

    it(
      "representa reunião marcada como dado externo",
      async () => {
        const connector =
          new MockMaestroConnector(
            "MEETING_SCHEDULED",
          )

        const meetings =
          await connector.listMeetings()

        expect(meetings).toHaveLength(
          1,
        )

        expect(meetings[0]).toMatchObject({
          status:
            "SCHEDULED",
          trace: {
            sourceSystem:
              "maestro",
            dataOwner:
              "EXTERNAL_CRM",
          },
        })
      },
    )

    it(
      "devolve cópias para impedir mutação do cenário interno",
      async () => {
        const connector =
          new MockMaestroConnector()

        const firstPage =
          await connector.listLeads()

        firstPage.items[0].name =
          "Nome alterado fora do conector"

        const secondPage =
          await connector.listLeads()

        expect(
          secondPage.items[0].name,
        ).toBe(
          "Lead novo",
        )
      },
    )

    it(
      "valida cursor e limite",
      async () => {
        const connector =
          new MockMaestroConnector()

        await expect(
          connector.listLeads({
            cursor:
              "cursor-invalido",
          }),
        ).rejects.toThrow(
          "Cursor inválido",
        )

        await expect(
          connector.listLeads({
            limit:
              101,
          }),
        ).rejects.toThrow(
          "entre 1 e 100",
        )
      },
    )

    it(
      "retorna null para recurso inexistente",
      async () => {
        const connector =
          new MockMaestroConnector()

        await expect(
          connector.getLead(
            "lead-inexistente",
          ),
        ).resolves.toBeNull()

        await expect(
          connector.getMeeting(
            "meeting-inexistente",
          ),
        ).resolves.toBeNull()
      },
    )
  },
)
