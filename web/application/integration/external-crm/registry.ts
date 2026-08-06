import type {
  ExternalCrmConnector,
} from "./connector"

function normalizeProviderId(
  providerId: string,
): string {
  const normalizedProviderId =
    providerId.trim()

  if (!normalizedProviderId) {
    throw new Error(
      "O identificador do provedor de CRM externo é obrigatório.",
    )
  }

  return normalizedProviderId
}

export class ExternalCrmConnectorRegistry {
  private readonly connectors =
    new Map<
      string,
      ExternalCrmConnector
    >()

  constructor(
    connectors: ExternalCrmConnector[] = [],
  ) {
    for (
      const connector of
      connectors
    ) {
      this.register(
        connector,
      )
    }
  }

  register(
    connector: ExternalCrmConnector,
  ): void {
    const providerId =
      normalizeProviderId(
        connector.providerId,
      )

    if (
      this.connectors.has(
        providerId,
      )
    ) {
      throw new Error(
        `O conector "${providerId}" já está registrado.`,
      )
    }

    this.connectors.set(
      providerId,
      connector,
    )
  }

  get(
    providerId: string,
  ): ExternalCrmConnector | null {
    return (
      this.connectors.get(
        normalizeProviderId(
          providerId,
        ),
      ) ?? null
    )
  }

  require(
    providerId: string,
  ): ExternalCrmConnector {
    const connector =
      this.get(
        providerId,
      )

    if (connector === null) {
      throw new Error(
        `Nenhum conector foi registrado para o provedor "${providerId.trim()}".`,
      )
    }

    return connector
  }

  listProviderIds(): string[] {
    return [
      ...this.connectors.keys(),
    ].sort()
  }
}
