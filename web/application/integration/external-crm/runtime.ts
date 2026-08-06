import type {
  ExternalCrmConnector,
} from "./connector"

import type {
  ExternalCrmIntegrationConfiguration,
} from "./configuration"

import type {
  ExternalCrmConnectorRegistry,
} from "./registry"

export type ExternalCrmRuntime = {
  mode:
    ExternalCrmIntegrationConfiguration[
      "mode"
    ]
  enabled: boolean
  providerId: string | null
  connector: ExternalCrmConnector | null
  readOnly: true
}

export function resolveExternalCrmRuntime({
  configuration,
  registry,
}: {
  configuration:
    ExternalCrmIntegrationConfiguration
  registry:
    ExternalCrmConnectorRegistry
}): ExternalCrmRuntime {
  if (
    configuration.mode ===
    "STANDALONE"
  ) {
    return {
      mode:
        "STANDALONE",
      enabled:
        false,
      providerId:
        null,
      connector:
        null,
      readOnly:
        true,
    }
  }

  const connector =
    registry.require(
      configuration.providerId,
    )

  if (
    connector.capabilities.writes
  ) {
    throw new Error(
      `O conector "${connector.providerId}" declara escrita, mas a fundação V1 aceita somente leitura.`,
    )
  }

  return {
    mode:
      "INTEGRATED",
    enabled:
      true,
    providerId:
      connector.providerId,
    connector,
    readOnly:
      true,
  }
}
