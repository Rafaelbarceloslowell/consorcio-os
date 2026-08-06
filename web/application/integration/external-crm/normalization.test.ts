import {
  describe,
  expect,
  it,
} from "vitest"

import {
  normalizeExternalContactAction,
  normalizeExternalContactActionStatus,
  normalizeExternalContactChannel,
  normalizeExternalContactPeriod,
} from "./normalization"

describe(
  "normalização de CRM externo",
  () => {
    it(
      "normaliza canais sem depender do nome interno do provedor",
      () => {
        expect(
          normalizeExternalContactChannel(
            "whatsapp",
          ),
        ).toBe(
          "WHATSAPP",
        )

        expect(
          normalizeExternalContactChannel(
            "ligação",
          ),
        ).toBe(
          "PHONE",
        )
      },
    )


    it(
      "normaliza termos acentuados e formas Unicode equivalentes",
      () => {
        expect(
          normalizeExternalContactChannel(
            "LIGAÇÃO",
          ),
        ).toBe(
          "PHONE",
        )

        expect(
          normalizeExternalContactChannel(
            "ligac\u0327a\u0303o",
          ),
        ).toBe(
          "PHONE",
        )

        expect(
          normalizeExternalContactPeriod(
            "manhã",
          ),
        ).toBe(
          "MORNING",
        )

        expect(
          normalizeExternalContactActionStatus(
            "concluído",
          ),
        ).toBe(
          "COMPLETED",
        )
      },
    )

    it(
      "normaliza noite para período universal de evening",
      () => {
        expect(
          normalizeExternalContactPeriod(
            "night",
          ),
        ).toBe(
          "EVENING",
        )
      },
    )

    it(
      "normaliza estados conhecidos e preserva desconhecidos",
      () => {
        expect(
          normalizeExternalContactActionStatus(
            "completed",
          ),
        ).toBe(
          "COMPLETED",
        )

        expect(
          normalizeExternalContactActionStatus(
            "novo_estado_do_provedor",
          ),
        ).toBe(
          "UNKNOWN",
        )
      },
    )

    it(
      "preserva rastreabilidade sem expor payload arbitrário",
      () => {
        const action =
          normalizeExternalContactAction({
            sourceSystem:
              "maestro",
            sourceRecordId:
              "action-1",
            sourceCode:
              "morning_whatsapp",
            sourceUpdatedAt:
              "2026-08-05T13:00:00.000Z",
            synchronizedAt:
              "2026-08-05T13:01:00.000Z",
            contractVersion:
              "1.0",
            externalActionId:
              "action-1",
            externalActionCode:
              "morning_whatsapp",
            label:
              "WhatsApp da manhã",
            rawType:
              "contact_attempt",
            rawChannel:
              "whatsapp",
            rawPeriod:
              "morning",
            rawStatus:
              "completed",
            rawDueState:
              "overdue",
            position:
              2,
            scheduledFor:
              "2026-08-05T13:00:00.000Z",
            completedAt:
              "2026-08-05T13:00:00.000Z",
            resultCode:
              "NO_ANSWER",
          })

        expect(action).toMatchObject({
          externalActionId:
            "action-1",
          type:
            "CONTACT_ATTEMPT",
          channel:
            "WHATSAPP",
          period:
            "MORNING",
          status:
            "COMPLETED",
          dueState:
            "COMPLETED",
          trace: {
            sourceSystem:
              "maestro",
            sourceRecordId:
              "action-1",
            sourceCode:
              "morning_whatsapp",
            contractVersion:
              "1.0",
            dataOwner:
              "EXTERNAL_CRM",
          },
        })

        expect(
          "payload" in action,
        ).toBe(
          false,
        )
      },
    )
  },
)
