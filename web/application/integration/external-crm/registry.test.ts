import {
  describe,
  expect,
  it,
} from "vitest"

import {
  MockMaestroConnector,
} from "./mock-maestro-connector"

import {
  ExternalCrmConnectorRegistry,
} from "./registry"

describe(
  "ExternalCrmConnectorRegistry",
  () => {
    it(
      "registra e resolve conectores por provedor",
      () => {
        const connector =
          new MockMaestroConnector()

        const registry =
          new ExternalCrmConnectorRegistry([
            connector,
          ])

        expect(
          registry.require(
            "MOCK_MAESTRO",
          ),
        ).toBe(
          connector,
        )
      },
    )

    it(
      "lista provedores de forma determinística",
      () => {
        const registry =
          new ExternalCrmConnectorRegistry([
            new MockMaestroConnector(),
          ])

        expect(
          registry.listProviderIds(),
        ).toEqual([
          "MOCK_MAESTRO",
        ])
      },
    )

    it(
      "bloqueia provedor duplicado",
      () => {
        expect(
          () =>
            new ExternalCrmConnectorRegistry([
              new MockMaestroConnector(),
              new MockMaestroConnector(
                "NO_RESPONSE_CHECK_3",
              ),
            ]),
        ).toThrow(
          'O conector "MOCK_MAESTRO" já está registrado.',
        )
      },
    )

    it(
      "retorna null para provedor não registrado",
      () => {
        const registry =
          new ExternalCrmConnectorRegistry()

        expect(
          registry.get(
            "MAESTRO",
          ),
        ).toBeNull()
      },
    )

    it(
      "falha explicitamente quando o provedor é obrigatório",
      () => {
        const registry =
          new ExternalCrmConnectorRegistry()

        expect(
          () =>
            registry.require(
              "MAESTRO",
            ),
        ).toThrow(
          'Nenhum conector foi registrado para o provedor "MAESTRO".',
        )
      },
    )
  },
)
