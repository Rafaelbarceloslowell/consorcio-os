import type {
  SettingsIntegrationStatus,
} from "@/types/settings-operational"

type IntegrationEnvironment =
  Readonly<
    Record<
      string,
      string | undefined
    >
  >

function hasValue(
  value: string | undefined,
): boolean {
  return Boolean(
    value?.trim(),
  )
}

export function buildIntegrationStatuses(
  environment:
    IntegrationEnvironment,
): readonly SettingsIntegrationStatus[] {
  const maestroConfigured =
    hasValue(
      environment
        .MAESTRO_API_URL,
    ) &&
    (
      hasValue(
        environment
          .MAESTRO_API_TOKEN,
      ) ||
      hasValue(
        environment
          .MAESTRO_TOKEN,
      )
    )

  const whatsappConfigured =
    hasValue(
      environment
        .WHATSAPP_PHONE_NUMBER_ID,
    ) &&
    hasValue(
      environment
        .WHATSAPP_ACCESS_TOKEN,
    )

  return [
    {
      id: "maestro",
      name: "Maestro",
      status:
        maestroConfigured
          ? "CONFIGURED"
          : "NOT_CONFIGURED",
      statusLabel:
        maestroConfigured
          ? "Configurado"
          : "Não configurado",
      description:
        maestroConfigured
          ? "Credenciais básicas encontradas. A conexão real ainda deve ser validada por uma chamada autorizada."
          : "Aguardando URL e token oficiais fornecidos pela diretoria.",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      status:
        whatsappConfigured
          ? "CONFIGURED"
          : "NOT_CONFIGURED",
      statusLabel:
        whatsappConfigured
          ? "Configurado"
          : "Não configurado",
      description:
        whatsappConfigured
          ? "Credenciais básicas encontradas. O envio real depende da validação da conta e dos templates."
          : "Aguardando número oficial, conta Meta e token da API.",
    },
  ]
}
