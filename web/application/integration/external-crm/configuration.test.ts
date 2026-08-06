import {
  describe,
  expect,
  it,
} from "vitest"

import {
  resolveExternalCrmIntegrationConfiguration,
} from "./configuration"

describe(
  "resolveExternalCrmIntegrationConfiguration",
  () => {
    it(
      "usa modo standalone seguro por padrão",
      () => {
        expect(
          resolveExternalCrmIntegrationConfiguration(
            {},
          ),
        ).toEqual({
          mode:
            "STANDALONE",
          enabled:
            false,
          providerId:
            null,
          readOnly:
            true,
        })
      },
    )

    it(
      "habilita modo integrado somente leitura",
      () => {
        expect(
          resolveExternalCrmIntegrationConfiguration({
            GORILLAOS_CRM_MODE:
              "integrated",
            GORILLAOS_EXTERNAL_CRM_ENABLED:
              "true",
            GORILLAOS_EXTERNAL_CRM_PROVIDER:
              "MOCK_MAESTRO",
            GORILLAOS_EXTERNAL_CRM_READ_ONLY:
              "true",
          }),
        ).toEqual({
          mode:
            "INTEGRATED",
          enabled:
            true,
          providerId:
            "MOCK_MAESTRO",
          readOnly:
            true,
        })
      },
    )

    it(
      "bloqueia modo integrado desabilitado",
      () => {
        expect(
          () =>
            resolveExternalCrmIntegrationConfiguration({
              GORILLAOS_CRM_MODE:
                "INTEGRATED",
              GORILLAOS_EXTERNAL_CRM_PROVIDER:
                "MOCK_MAESTRO",
            }),
        ).toThrow(
          "exige GORILLAOS_EXTERNAL_CRM_ENABLED=true",
        )
      },
    )

    it(
      "bloqueia modo integrado sem provedor",
      () => {
        expect(
          () =>
            resolveExternalCrmIntegrationConfiguration({
              GORILLAOS_CRM_MODE:
                "INTEGRATED",
              GORILLAOS_EXTERNAL_CRM_ENABLED:
                "true",
            }),
        ).toThrow(
          "exige GORILLAOS_EXTERNAL_CRM_PROVIDER",
        )
      },
    )

    it(
      "bloqueia escrita na versão um",
      () => {
        expect(
          () =>
            resolveExternalCrmIntegrationConfiguration({
              GORILLAOS_EXTERNAL_CRM_READ_ONLY:
                "false",
            }),
        ).toThrow(
          "permite somente leitura",
        )
      },
    )

    it(
      "bloqueia configuração externa no modo standalone",
      () => {
        expect(
          () =>
            resolveExternalCrmIntegrationConfiguration({
              GORILLAOS_CRM_MODE:
                "STANDALONE",
              GORILLAOS_EXTERNAL_CRM_ENABLED:
                "true",
              GORILLAOS_EXTERNAL_CRM_PROVIDER:
                "MOCK_MAESTRO",
            }),
        ).toThrow(
          "não pode habilitar ou selecionar um CRM externo",
        )
      },
    )
  },
)
