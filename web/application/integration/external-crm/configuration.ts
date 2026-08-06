import type {
  ExternalCrmMode,
} from "./types"

export const EXTERNAL_CRM_ENV_KEYS = {
  mode:
    "GORILLAOS_CRM_MODE",
  enabled:
    "GORILLAOS_EXTERNAL_CRM_ENABLED",
  provider:
    "GORILLAOS_EXTERNAL_CRM_PROVIDER",
  readOnly:
    "GORILLAOS_EXTERNAL_CRM_READ_ONLY",
} as const

export type ExternalCrmEnvironment = Record<
  string,
  string | undefined
>

export type ExternalCrmIntegrationConfiguration =
  | {
      mode: "STANDALONE"
      enabled: false
      providerId: null
      readOnly: true
    }
  | {
      mode: "INTEGRATED"
      enabled: true
      providerId: string
      readOnly: true
    }

function normalizeOptionalValue(
  value: string | undefined,
): string | null {
  const normalized =
    value?.trim() ?? ""

  return normalized
    ? normalized
    : null
}

function parseMode(
  value: string | undefined,
): ExternalCrmMode {
  const optionalValue =
    normalizeOptionalValue(
      value,
    )

  if (optionalValue === null) {
    return "STANDALONE"
  }

  const normalized =
    optionalValue.toUpperCase()

  if (
    normalized === "STANDALONE"
  ) {
    return "STANDALONE"
  }

  if (
    normalized === "INTEGRATED"
  ) {
    return "INTEGRATED"
  }

  throw new Error(
    `Modo de CRM inválido: "${value}". Use INTEGRATED ou STANDALONE.`,
  )
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
  key: string,
): boolean {
  const optionalValue =
    normalizeOptionalValue(
      value,
    )

  if (optionalValue === null) {
    return defaultValue
  }

  const normalized =
    optionalValue.toLowerCase()

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false
  }

  throw new Error(
    `Valor inválido para ${key}: "${value}". Use true ou false.`,
  )
}

export function resolveExternalCrmIntegrationConfiguration(
  environment: ExternalCrmEnvironment,
): ExternalCrmIntegrationConfiguration {
  const mode =
    parseMode(
      environment[
        EXTERNAL_CRM_ENV_KEYS.mode
      ],
    )

  const enabled =
    parseBoolean(
      environment[
        EXTERNAL_CRM_ENV_KEYS.enabled
      ],
      false,
      EXTERNAL_CRM_ENV_KEYS.enabled,
    )

  const providerId =
    normalizeOptionalValue(
      environment[
        EXTERNAL_CRM_ENV_KEYS.provider
      ],
    )

  const readOnly =
    parseBoolean(
      environment[
        EXTERNAL_CRM_ENV_KEYS.readOnly
      ],
      true,
      EXTERNAL_CRM_ENV_KEYS.readOnly,
    )

  if (!readOnly) {
    throw new Error(
      "A fundação External CRM Integration V1 permite somente leitura.",
    )
  }

  if (
    mode === "STANDALONE"
  ) {
    if (
      enabled ||
      providerId !== null
    ) {
      throw new Error(
        "O modo STANDALONE não pode habilitar ou selecionar um CRM externo.",
      )
    }

    return {
      mode,
      enabled: false,
      providerId: null,
      readOnly: true,
    }
  }

  if (!enabled) {
    throw new Error(
      "O modo INTEGRATED exige GORILLAOS_EXTERNAL_CRM_ENABLED=true.",
    )
  }

  if (providerId === null) {
    throw new Error(
      "O modo INTEGRATED exige GORILLAOS_EXTERNAL_CRM_PROVIDER.",
    )
  }

  return {
    mode,
    enabled: true,
    providerId,
    readOnly: true,
  }
}
