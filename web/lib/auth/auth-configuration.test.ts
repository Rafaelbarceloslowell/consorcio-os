import {
  describe,
  expect,
  it,
} from "vitest"

import {
  getAuthConfigurationState,
  requiredAuthEnvironmentVariables,
} from "@/lib/auth/auth-configuration"

describe(
  "auth configuration",
  () => {
    it(
      "requires only the approved Google authentication variables",
      () => {
        expect(
          requiredAuthEnvironmentVariables,
        ).toEqual([
          "BETTER_AUTH_SECRET",
          "BETTER_AUTH_URL",
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
        ])
      },
    )

    it(
      "reports missing variables without reading secret values",
      () => {
        const state =
          getAuthConfigurationState({
            BETTER_AUTH_URL:
              "http://localhost:3000",
          })

        expect(state).toEqual({
          configured: false,
          missing: [
            "BETTER_AUTH_SECRET",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
          ],
        })
      },
    )

    it(
      "reports configured only when all values exist",
      () => {
        const state =
          getAuthConfigurationState({
            BETTER_AUTH_SECRET:
              "configured",
            BETTER_AUTH_URL:
              "http://localhost:3000",
            GOOGLE_CLIENT_ID:
              "configured",
            GOOGLE_CLIENT_SECRET:
              "configured",
          })

        expect(state).toEqual({
          configured: true,
          missing: [],
        })
      },
    )
  },
)
