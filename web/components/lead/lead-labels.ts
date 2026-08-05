export const LEAD_SOURCE_OPTIONS = [
  {
    value: "referral",
    label: "Indicação",
  },
  {
    value: "website",
    label: "Site",
  },
  {
    value: "social_media",
    label: "Redes sociais",
  },
  {
    value: "cold_call",
    label: "Prospecção ativa",
  },
  {
    value: "event",
    label: "Evento",
  },
  {
    value: "partner",
    label: "Parceiro",
  },
  {
    value: "walk_in",
    label: "Atendimento direto",
  },
  {
    value: "other",
    label: "Outro",
  },
] as const

export const CONSORTIUM_TYPE_OPTIONS = [
  {
    value: "real_estate",
    label: "Imóvel",
  },
  {
    value: "vehicle",
    label: "Veículo",
  },
  {
    value: "heavy_vehicle",
    label: "Veículo pesado",
  },
  {
    value: "services",
    label: "Serviços",
  },
  {
    value: "other",
    label: "Outro",
  },
] as const

const leadSourceLabels =
  new Map<string, string>(
    LEAD_SOURCE_OPTIONS.map(
    (option) => [
      option.value,
      option.label,
      ],
    ),
  )

const consortiumTypeLabels =
  new Map<string, string>(
    CONSORTIUM_TYPE_OPTIONS.map(
    (option) => [
      option.value,
      option.label,
      ],
    ),
  )

const leadStatusLabels =
  new Map<string, string>([
  ["new", "Novo"],
  ["contacted", "Contatado"],
  ["qualified", "Qualificado"],
  ["negotiating", "Em negociação"],
  ["converted", "Convertido em cliente"],
  ["lost", "Perdido"],
])

function normalizeEnumValue(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
}

export function getLeadSourceLabel(
  value: string,
): string {
  return (
    leadSourceLabels.get(
      normalizeEnumValue(value),
    ) ?? value
  )
}

export function getLeadStatusLabel(
  value: string,
): string {
  return (
    leadStatusLabels.get(
      normalizeEnumValue(value),
    ) ?? value
  )
}

export function getConsortiumTypeLabel(
  value: string,
): string {
  return (
    consortiumTypeLabels.get(
      normalizeEnumValue(value),
    ) ?? value
  )
}
