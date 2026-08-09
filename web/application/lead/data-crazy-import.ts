export const DATA_CRAZY_LEGACY_MARKER =
  "[IMPORTAÇÃO DATA CRAZY — LEAD REATIVADO]"

export const DATA_CRAZY_PENDING_MARKER =
  "[IMPORTAÇÃO DATA CRAZY — TRIAGEM PENDENTE]"

const INTERNAL_EMAIL_SUFFIX =
  "@sem-email.gorila.local"

export type DataCrazySourceRow = Readonly<{
  id: string
  workspaceId: string
  name: string
  email: string
  phone: string
  document: string | null
  companyName: string | null
  source: string
  status: string
  consortiumType: string
  desiredCreditValue: string
  desiredTermMonths: number
  score: number
  notes: string | null
  sourceCreatedAt: Date
  pipelineStageName: string
}>

export type ExistingContact = Readonly<{
  workspaceId: string
  email: string
  phone: string
  notes?: string | null
}>

export type DataCrazyImportCandidate = Readonly<{
  sourceLeadId: string
  dataCrazyId: string
  name: string
  email: string
  normalizedEmail: string | null
  phone: string
  normalizedPhone: string
  document: string | null
  companyName: string | null
  consortiumType: string
  desiredCreditValue: string
  desiredTermMonths: number
  score: number
  notes: string
  sourceCreatedAt: Date
  approachType: null
  createJourney: false
}>

export type DataCrazyImportReview = Readonly<{
  sourceLeadId: string
  reason: string
}>

export type DataCrazyImportPlan = Readonly<{
  sourceRows: number
  wouldCreate: readonly DataCrazyImportCandidate[]
  wouldSkipDuplicate: readonly DataCrazyImportReview[]
  wouldRequireReview: readonly DataCrazyImportReview[]
  invalidRows: readonly DataCrazyImportReview[]
  untriagedRows: number
}>

export function normalizeDataCrazyPhone(
  value: string,
): string | null {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, "")

  if (digits.length < 10 || digits.length > 15) {
    return null
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

export function normalizeDataCrazyEmail(
  value: string,
): string | null {
  const normalized = value.trim().toLocaleLowerCase("pt-BR")

  if (
    !normalized ||
    normalized.endsWith(INTERNAL_EMAIL_SUFFIX) ||
    !/^\S+@\S+\.\S+$/.test(normalized)
  ) {
    return null
  }

  return normalized
}

export function extractDataCrazyId(
  notes: string | null | undefined,
): string | null {
  const match = notes?.match(
    /^Data Crazy ID:\s*(.+)$/im,
  )

  return match?.[1]?.trim() || null
}

export function isDataCrazyLead(
  notes: string | null,
  pipelineStageName: string,
): boolean {
  return Boolean(
    notes?.includes("[IMPORTAÇÃO DATA CRAZY") ||
    pipelineStageName === "Reativação Data Crazy" ||
    pipelineStageName === "Backlog Data Crazy",
  )
}

function isKnownFixture(row: DataCrazySourceRow): boolean {
  const name = row.name.trim().toLocaleLowerCase("pt-BR")
  const email = row.email.trim().toLocaleLowerCase("pt-BR")

  return (
    name === "janaina rodrigues" ||
    /^(lead[-\s]?\d+|staging\b|qa\b|teste\b)/i.test(name) ||
    email.endsWith("@example.com")
  )
}

function pendingNotes(
  notes: string | null,
): string {
  const original = notes?.trim() ?? ""
  const normalized = original.replace(
    DATA_CRAZY_LEGACY_MARKER,
    DATA_CRAZY_PENDING_MARKER,
  )

  if (normalized.includes(DATA_CRAZY_PENDING_MARKER)) {
    return normalized
  }

  return [
    DATA_CRAZY_PENDING_MARKER,
    normalized,
  ].filter(Boolean).join("\n")
}

export function buildDataCrazyImportPlan(input: Readonly<{
  sourceRows: readonly DataCrazySourceRow[]
  targetWorkspaceId: string
  existingContacts: readonly ExistingContact[]
}>): DataCrazyImportPlan {
  const phoneOwners = new Map<string, string>()
  const emailOwners = new Map<string, string>()
  const sourceIds = new Set<string>()

  for (const contact of input.existingContacts) {
    if (contact.workspaceId !== input.targetWorkspaceId) continue

    const phone = normalizeDataCrazyPhone(contact.phone)
    const email = normalizeDataCrazyEmail(contact.email)
    const sourceId = extractDataCrazyId(contact.notes)

    if (phone) phoneOwners.set(phone, "target")
    if (email) emailOwners.set(email, "target")
    if (sourceId) sourceIds.add(sourceId)
  }

  const wouldCreate: DataCrazyImportCandidate[] = []
  const wouldSkipDuplicate: DataCrazyImportReview[] = []
  const wouldRequireReview: DataCrazyImportReview[] = []
  const invalidRows: DataCrazyImportReview[] = []

  for (const row of input.sourceRows) {
    if (!isDataCrazyLead(row.notes, row.pipelineStageName)) {
      invalidRows.push({
        sourceLeadId: row.id,
        reason: "Registro sem proveniência Data Crazy comprovada.",
      })
      continue
    }

    if (isKnownFixture(row)) {
      invalidRows.push({
        sourceLeadId: row.id,
        reason: "Fixture ou contato sintético conhecido.",
      })
      continue
    }

    const dataCrazyId = extractDataCrazyId(row.notes)
    const normalizedPhone = normalizeDataCrazyPhone(row.phone)
    const normalizedEmail = normalizeDataCrazyEmail(row.email)

    if (!dataCrazyId || !row.name.trim()) {
      invalidRows.push({
        sourceLeadId: row.id,
        reason: "Nome ou Data Crazy ID ausente/inválido.",
      })
      continue
    }

    if (!normalizedPhone) {
      wouldRequireReview.push({
        sourceLeadId: row.id,
        reason: "Telefone sem DDI/DDD suficiente para normalização segura.",
      })
      continue
    }

    if (sourceIds.has(dataCrazyId)) {
      wouldSkipDuplicate.push({
        sourceLeadId: row.id,
        reason: "Data Crazy ID já importado.",
      })
      continue
    }

    const phoneOwner = phoneOwners.get(normalizedPhone)
    const emailOwner = normalizedEmail
      ? emailOwners.get(normalizedEmail)
      : null

    if (phoneOwner || emailOwner) {
      const sameSourceRow =
        phoneOwner === row.id || emailOwner === row.id

      ;(sameSourceRow
        ? wouldSkipDuplicate
        : wouldRequireReview).push({
        sourceLeadId: row.id,
        reason: phoneOwner
          ? "Telefone já existente no workspace de destino."
          : "E-mail já existente no workspace de destino.",
      })
      continue
    }

    phoneOwners.set(normalizedPhone, row.id)
    if (normalizedEmail) emailOwners.set(normalizedEmail, row.id)
    sourceIds.add(dataCrazyId)

    wouldCreate.push({
      sourceLeadId: row.id,
      dataCrazyId,
      name: row.name.trim(),
      email: normalizedEmail ??
        `datacrazy-${dataCrazyId.replace(/[^a-z0-9]/gi, "-")}@sem-email.gorila.local`,
      normalizedEmail,
      phone: normalizedPhone,
      normalizedPhone,
      document: row.document,
      companyName: row.companyName,
      consortiumType: row.consortiumType,
      desiredCreditValue: row.desiredCreditValue,
      desiredTermMonths: row.desiredTermMonths,
      score: row.score,
      notes: pendingNotes(row.notes),
      sourceCreatedAt: row.sourceCreatedAt,
      approachType: null,
      createJourney: false,
    })
  }

  return {
    sourceRows: input.sourceRows.length,
    wouldCreate,
    wouldSkipDuplicate,
    wouldRequireReview,
    invalidRows,
    untriagedRows: wouldCreate.length,
  }
}
