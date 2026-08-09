import {
  getConsortiumTypeLabel,
  getLeadSourceLabel,
  getLeadStatusLabel,
} from "@/components/lead/lead-labels"
import { formatCurrency } from "@/lib/formatters"

import type {
  LeadListClassification,
  LeadListItemView,
  LeadListView,
} from "@/types/lead-list"

const DATA_CRAZY_STAGE_NAMES = new Set([
  "Reativação Data Crazy",
  "Backlog Data Crazy",
])

const dateFormatter =
  new Intl.DateTimeFormat("pt-BR")

type LeadListSourceRecord = {
  id: string
  name: string
  email: string
  phone: string
  companyName: string | null
  source: string
  status: string
  approachType: string | null
  consortiumType: string
  desiredCreditValue: unknown
  desiredTermMonths: number
  score: number
  notes: string | null
  createdAt: Date
  consultant: {
    name: string
  }
  pipelineStage: {
    name: string
  }
  commercialJourneys: Array<{
    id: string
  }>
}

type DataCrazyMetadata = {
  isDataCrazy: boolean
  funnelMemberships: string[]
  objective: string | null
}

export function buildLeadListPresentation(
  leads: LeadListSourceRecord[],
  options: Readonly<{
    page?: number
    pageSize?: number
    totalCount?: number
    untriagedCount?: number
    reactivatedCount?: number
  }> = {},
): LeadListView {
  const items = leads.map(
    buildLeadListItemPresentation,
  )

  const reactivatedCount = options.reactivatedCount ??
    items.filter(
      (lead) =>
        lead.classification ===
        "REACTIVATED",
    ).length

  const untriagedCount = options.untriagedCount ??
    items.filter((lead) => lead.classification === "UNTRIAGED").length
  const totalCount = options.totalCount ?? items.length
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.max(1, options.pageSize ?? Math.max(1, items.length))
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    summaryLabel: buildSummaryLabel(
      totalCount,
      reactivatedCount,
      untriagedCount,
    ),
    leads: items,
    pagination: {
      page,
      totalPages,
      totalCount,
      previousHref: page > 1 ? `/leads?page=${page - 1}` : null,
      nextHref: page < totalPages ? `/leads?page=${page + 1}` : null,
    },
  }
}

function buildLeadListItemPresentation(
  lead: LeadListSourceRecord,
): LeadListItemView {
  const openJourney =
    lead.commercialJourneys[0]

  const metadata =
    parseDataCrazyMetadata(
      lead.notes,
      lead.pipelineStage.name,
    )

  const classification:
    LeadListClassification =
      metadata.isDataCrazy && !lead.approachType
        ? "UNTRIAGED"
        : lead.approachType === "REACTIVATION"
        ? "REACTIVATED"
        : "ACTIVE"

  return {
    id: lead.id,
    name: lead.name,
    email: formatEmail(lead.email),
    phoneLabel: formatPhone(
      lead.phone,
    ),
    companyName: lead.companyName,
    sourceLabel:
      metadata.isDataCrazy
        ? buildDataCrazySourceLabel(
            metadata.funnelMemberships,
          )
        : getLeadSourceLabel(
            lead.source,
          ),
    statusLabel:
      classification === "UNTRIAGED"
        ? "Triagem pendente"
        : classification === "REACTIVATED"
          ? "Reativado"
        : getLeadStatusLabel(
            lead.status,
          ),
    classification,
    consortiumTypeLabel:
      metadata.isDataCrazy
        ? metadata.objective ??
          "Não informado"
        : getConsortiumTypeLabel(
            lead.consortiumType,
          ),
    desiredCreditValueLabel:
      formatDesiredCreditValue(
        lead.desiredCreditValue,
      ),
    desiredTermLabel:
      formatDesiredTerm(
        lead.desiredTermMonths,
      ),
    consultantName:
      lead.consultant.name,
    pipelineStageName:
      lead.pipelineStage.name,
    score: lead.score,
    entryLabel:
      metadata.isDataCrazy
        ? "Importado em"
        : "Entrada",
    createdAtLabel:
      dateFormatter.format(
        lead.createdAt,
      ),
    opportunityHref:
      openJourney
        ? `/opportunities/${encodeURIComponent(
            openJourney.id,
          )}`
        : null,
    canTriage:
      classification === "UNTRIAGED" && !openJourney,
  }
}

function parseDataCrazyMetadata(
  notes: string | null,
  pipelineStageName: string,
): DataCrazyMetadata {
  const normalizedNotes =
    notes?.trim() ?? ""

  const isDataCrazy =
    normalizedNotes.startsWith(
      "[IMPORTAÇÃO DATA CRAZY",
    ) ||
    DATA_CRAZY_STAGE_NAMES.has(pipelineStageName)

  if (!isDataCrazy) {
    return {
      isDataCrazy: false,
      funnelMemberships: [],
      objective: null,
    }
  }

  const funnelMemberships =
    readMetadataLine(
      normalizedNotes,
      "Funis encontrados",
    )
      ?.split("|")
      .map((funnel) =>
        funnel.trim().toUpperCase(),
      )
      .filter(Boolean) ?? []

  const primaryFunnel =
    readMetadataLine(
      normalizedNotes,
      "Funil principal",
    )
      ?.trim()
      .toUpperCase()

  const resolvedFunnels =
    funnelMemberships.length > 0
      ? funnelMemberships
      : primaryFunnel
        ? [primaryFunnel]
        : []

  const objective = normalizeImportedValue(
    readMetadataLine(
      normalizedNotes,
      "Objetivo",
    ),
  )

  return {
    isDataCrazy: true,
    funnelMemberships:
      Array.from(
        new Set(resolvedFunnels),
      ),
    objective,
  }
}

function readMetadataLine(
  notes: string,
  label: string,
): string | null {
  const prefix = `${label}:`

  const line = notes
    .split(/\r?\n/)
    .find((candidate) =>
      candidate.startsWith(prefix),
    )

  return line
    ? line.slice(prefix.length).trim()
    : null
}

function normalizeImportedValue(
  value: string | null,
): string | null {
  const normalized = value?.trim()

  if (
    !normalized ||
    normalized.toLocaleLowerCase(
      "pt-BR",
    ) === "não informado" ||
    normalized.toLocaleLowerCase(
      "pt-BR",
    ) === "não informada"
  ) {
    return null
  }

  return normalized
}

function buildDataCrazySourceLabel(
  funnelMemberships: string[],
): string {
  const labels = funnelMemberships
    .map((funnel) => {
      if (funnel === "INBOUND") {
        return "Inbound"
      }

      if (funnel === "OUTBOUND") {
        return "Outbound"
      }

      return funnel
    })
    .filter(Boolean)

  return labels.length > 0
    ? `Data Crazy · ${labels.join(
        " + ",
      )}`
    : "Data Crazy"
}

function formatEmail(
  email: string,
): string {
  return email.endsWith(
    "@sem-email.gorila.local",
  )
    ? "Não informado"
    : email
}

function formatDesiredCreditValue(
  value: unknown,
): string {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) &&
    numberValue > 0
    ? formatCurrency(numberValue)
    : "Não informado"
}

function formatDesiredTerm(
  months: number,
): string {
  return months > 0
    ? `${months} ${
        months === 1
          ? "mês"
          : "meses"
      }`
    : "Não informado"
}

function formatPhone(
  value: string,
): string {
  const digits = value.replace(
    /\D/g,
    "",
  )

  if (!digits) {
    return "Não informado"
  }

  if (
    digits.startsWith("55") &&
    (digits.length === 12 ||
      digits.length === 13)
  ) {
    const areaCode =
      digits.slice(2, 4)
    const localNumber =
      digits.slice(4)

    if (localNumber.length === 9) {
      return `+55 (${areaCode}) ${localNumber.slice(
        0,
        5,
      )}-${localNumber.slice(5)}`
    }

    return `+55 (${areaCode}) ${localNumber.slice(
      0,
      4,
    )}-${localNumber.slice(4)}`
  }

  if (
    digits.startsWith("351") &&
    digits.length === 12
  ) {
    return `+351 ${digits.slice(
      3,
      6,
    )} ${digits.slice(
      6,
      9,
    )} ${digits.slice(9)}`
  }

  if (
    digits.startsWith("1") &&
    digits.length === 11
  ) {
    return `+1 (${digits.slice(
      1,
      4,
    )}) ${digits.slice(
      4,
      7,
    )}-${digits.slice(7)}`
  }

  return value.trim().startsWith("+")
    ? value.trim()
    : `+${digits}`
}

function buildSummaryLabel(
  totalCount: number,
  reactivatedCount: number,
  untriagedCount: number,
): string {
  const activeCount = Math.max(
    0,
    totalCount - reactivatedCount - untriagedCount,
  )
  const labels: string[] = []

  if (untriagedCount > 0) {
    labels.push(`${untriagedCount} ${untriagedCount === 1 ? "lead em triagem" : "leads em triagem"}`)
  }

  if (reactivatedCount > 0) {
    labels.push(`${reactivatedCount} ${labels.length === 0 && activeCount === 0
      ? reactivatedCount === 1 ? "lead reativado" : "leads reativados"
      : reactivatedCount === 1 ? "reativado" : "reativados"
    }`)
  }

  if (activeCount > 0 || labels.length === 0) {
    labels.push(`${activeCount} ${labels.length === 0
      ? activeCount === 1 ? "lead em atendimento" : "leads em atendimento"
      : "em atendimento"
    }`)
  }

  return labels.join(" · ")
}
