import type {
  OpportunityContactContextView,
} from "@/types/opportunity-details"

type ContactOriginEntity = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  source?: string | null
  approachType?: "new" | "reactivation" | null
  createdAt?: string | null
}

export type BuildOpportunityContactContextInput = {
  origin: "lead" | "client"
  originEntity:
    | ContactOriginEntity
    | null
    | undefined
  opportunityTitle: string
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized =
    value?.trim()

  return normalized
    ? normalized
    : null
}

function normalizeForSearch(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/gu, " ")
    .trim()
}

function detectChannels(
  evidence: string,
): string {
  const normalized =
    normalizeForSearch(evidence)

  const hasInbound =
    /\binbound\b/u.test(normalized)

  const hasOutbound =
    /\boutbound\b/u.test(normalized)

  if (hasInbound && hasOutbound) {
    return "Inbound + Outbound"
  }

  if (hasInbound) {
    return "Inbound"
  }

  if (hasOutbound) {
    return "Outbound"
  }

  return "Origem n\u00e3o identificada"
}

function extractLabeledValue(
  notes: string | null,
  labels: string[],
): string | null {
  if (!notes) {
    return null
  }

  const normalizedLabels =
    labels.map(normalizeForSearch)

  for (const line of notes.split(/\r?\n/u)) {
    const match =
      line.match(
        /^\s*([^:=]+?)\s*[:=]\s*(.+?)\s*$/u,
      )

    if (!match) {
      continue
    }

    const label =
      normalizeForSearch(
        match[1] ?? "",
      )

    if (
      normalizedLabels.includes(label)
    ) {
      return normalizeOptionalText(
        match[2],
      )
    }
  }

  return null
}

function extractObjective(
  notes: string | null,
): string | null {
  return extractLabeledValue(
    notes,
    [
      "objetivo",
      "interesse",
      "finalidade",
      "credito desejado",
    ],
  )
}

function extractCurrentSituation(
  notes: string | null,
): string | null {
  return extractLabeledValue(
    notes,
    [
      "situacao atual",
      "momento atual",
      "cenario atual",
    ],
  )
}

function isDataCrazyImport(
  notes: string | null,
): boolean {
  return notes
    ? /\bdata crazy\b/iu.test(notes)
    : false
}

export function buildOpportunityContactContext({
  origin,
  originEntity,
  opportunityTitle,
}: BuildOpportunityContactContextInput): OpportunityContactContextView | null {
  void opportunityTitle

  if (!originEntity) {
    return null
  }

  const notes =
    normalizeOptionalText(
      originEntity.notes,
    )

  const approachType =
    origin === "lead"
      ? originEntity.approachType ??
        null
      : null

  const isReactivated =
    approachType ===
    "reactivation"

  const sourceLabel =
    isDataCrazyImport(notes)
      ? `Data Crazy \u00b7 ${detectChannels(
          notes ?? "",
        )}`
      : `${
          origin === "lead"
            ? "Lead"
            : "Cliente"
        } \u00b7 ${originEntity.name}`

  return {
    approachType,
    isReactivated,
    phone:
      normalizeOptionalText(
        originEntity.phone,
      ),
    email:
      normalizeOptionalText(
        originEntity.email,
      ),
    sourceLabel,
    importedAt:
      normalizeOptionalText(
        originEntity.createdAt,
      ),
    objective:
      extractObjective(notes),
    currentSituation:
      extractCurrentSituation(notes),
    originalInformation:
      notes,
  }
}