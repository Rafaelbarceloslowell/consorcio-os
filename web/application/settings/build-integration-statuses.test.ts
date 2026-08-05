import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildIntegrationStatuses,
} from "./build-integration-statuses"

describe(
  "buildIntegrationStatuses",
  () => {
    it(
      "não inventa integração sem credenciais",
      () => {
        const statuses =
          buildIntegrationStatuses(
            {},
          )

        expect(statuses).toEqual([
          expect.objectContaining({
            id: "maestro",
            status:
              "NOT_CONFIGURED",
          }),
          expect.objectContaining({
            id: "whatsapp",
            status:
              "NOT_CONFIGURED",
          }),
        ])
      },
    )

    it(
      "reconhece somente conjuntos mínimos completos",
      () => {
        const statuses =
          buildIntegrationStatuses({
            MAESTRO_API_URL:
              "https://maestro.example",
            MAESTRO_API_TOKEN:
              "token",
            WHATSAPP_PHONE_NUMBER_ID:
              "phone-id",
            WHATSAPP_ACCESS_TOKEN:
              "access-token",
          })

        expect(
          statuses.every(
            (status) =>
              status.status ===
              "CONFIGURED",
          ),
        ).toBe(true)
      },
    )
  },
)
