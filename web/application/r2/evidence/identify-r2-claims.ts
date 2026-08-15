import type {
  R2DecisionSensitivity,
  R2EvidenceClaim,
  R2EvidenceClaimValue,
  R2EvidenceSourceType,
} from "./types"

export type IdentifyR2ClaimsInput =
  Readonly<{
    opportunityId: string
    subject: string
    text: string
    sourceType: R2EvidenceSourceType
    sourceReference: string
    actorId?: string | null
    observedAt?: Date
    receivedAt?: Date
  }>

type ClaimCandidate = Readonly<{
  key: string
  statement: string
  value: R2EvidenceClaimValue
  normalizedValue: R2EvidenceClaimValue
  sensitivity: R2DecisionSensitivity
  unit?: string | null
  inferred?: boolean
}>

function normalizeForSearch(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/gu, " ")
    .trim()
}

function stableHash(
  value: string,
): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

export function buildR2EvidenceSourceReference(
  opportunityId: string,
  text: string,
): string {
  return `manual-whatsapp:${stableHash(`${opportunityId}|${text.trim()}`)}`
}

function parseBrazilianAmount(
  rawValue: string,
  multiplier: string | undefined,
): number {
  const normalized = rawValue
    .replace(/\./gu, "")
    .replace(",", ".")
  const value = Number(normalized)
  const scale = multiplier
    ? multiplier.toLocaleLowerCase("pt-BR").startsWith("m")
      ? 1_000
      : 1_000_000
    : 1

  return Math.round(value * scale * 100) / 100
}

function findAmount(
  normalizedText: string,
): number | null {
  const matches = [
    ...normalizedText.matchAll(
      /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?\s*(mil|milhao|milhoes)?/gu,
    ),
  ]
  const match = /\b(hoje|agora|atualmente)\b/u.test(normalizedText)
    ? matches.at(-1)
    : matches[0]

  if (!match) {
    return null
  }

  return parseBrazilianAmount(
    `${match[1]}${match[2] ? `,${match[2]}` : ""}`,
    match[3],
  )
}

function currencyCandidate(
  normalizedText: string,
  key: string,
  statement: string,
  sensitivity: R2DecisionSensitivity,
): ClaimCandidate | null {
  const value = findAmount(normalizedText)

  if (value === null) {
    return null
  }

  return {
    key,
    statement,
    value,
    normalizedValue: value,
    sensitivity,
    unit: "BRL",
  }
}

function identifyCandidates(
  text: string,
): readonly ClaimCandidate[] {
  const normalized = normalizeForSearch(text)
  const candidates: ClaimCandidate[] = []

  if (/\b(lance|entrada)\b/u.test(normalized)) {
    const candidate = currencyCandidate(
      normalized,
      "available_bid",
      "Foi informado um valor disponível ou pretendido para lance/entrada.",
      "HIGH",
    )

    if (candidate) candidates.push(candidate)
  }

  if (/\b(renda|salario|ganho|ganhando)\b/u.test(normalized)) {
    const candidate = currencyCandidate(
      normalized,
      "monthly_income",
      "Foi informado um valor de renda mensal.",
      "HIGH",
    )

    if (candidate) candidates.push(candidate)
  }

  if (/\b(parcela|pagar por mes|por mes)\b/u.test(normalized)) {
    const candidate = currencyCandidate(
      normalized,
      "maximum_monthly_payment",
      "Foi informada uma faixa mensal declarada como confortável ou possível.",
      "HIGH",
    )

    if (candidate) candidates.push(candidate)
  }

  if (
    /\b(imovel|veiculo|carro|carta|credito|objetivo)\b/u.test(normalized) &&
    /\b(agora|olhando|buscando|valor|objetivo)\b/u.test(normalized)
  ) {
    const candidate = currencyCandidate(
      normalized,
      "desired_credit_value",
      "Foi informado um valor pretendido para o objetivo comercial.",
      "MEDIUM",
    )

    if (candidate) candidates.push(candidate)
  }

  if (/\bnunca (fiz|tive|participei de) consorcio\b/u.test(normalized)) {
    candidates.push({
      key: "has_prior_consortium_experience",
      statement: "A pessoa declarou nunca ter feito consórcio.",
      value: false,
      normalizedValue: false,
      sensitivity: "MEDIUM",
    })
  } else if (/\b(tenho|possuo|ja tive|tenho uma)\b.*\b(cota|consorcio)\b/u.test(normalized)) {
    candidates.push({
      key: "has_prior_consortium_experience",
      statement: "Foi declarada experiência ou cota de consórcio anterior.",
      value: true,
      normalizedValue: true,
      sensitivity: "MEDIUM",
    })
  }

  if (/\b(nunca respondeu|nao respondeu nenhuma vez)\b/u.test(normalized)) {
    candidates.push({
      key: "customer_never_replied",
      statement: "Foi informado que o cliente nunca respondeu.",
      value: true,
      normalizedValue: true,
      sensitivity: "LOW",
    })
  }

  if (/\b(vou|preciso) (falar|conversar) com (minha|meu) (esposa|marido|companheira|companheiro)\b/u.test(normalized)) {
    candidates.push({
      key: "possible_joint_decision_involvement",
      statement: "Pode existir outra pessoa envolvida na decisão.",
      value: true,
      normalizedValue: true,
      sensitivity: "LOW",
      inferred: true,
    })
  }

  return candidates
}

function temporalCue(
  text: string,
): R2EvidenceClaim["temporalCue"] {
  const normalized = normalizeForSearch(text)

  if (/\b(hoje|agora|atualmente|neste momento)\b/u.test(normalized)) {
    return "CURRENT"
  }

  if (/\b(antes|antigamente|em 20\d{2}|era|eram antigos?)\b/u.test(normalized)) {
    return "HISTORICAL"
  }

  return "UNSPECIFIED"
}

export function identifyR2Claims({
  opportunityId,
  subject,
  text,
  sourceType,
  sourceReference,
  actorId = null,
  observedAt = new Date(),
  receivedAt = observedAt,
}: IdentifyR2ClaimsInput): readonly R2EvidenceClaim[] {
  const normalizedText = text.trim()

  if (!normalizedText) {
    return []
  }

  const observedAtIso = observedAt.toISOString()
  const receivedAtIso = receivedAt.toISOString()
  const cue = temporalCue(normalizedText)

  return identifyCandidates(normalizedText).map(
    (candidate) => {
      const effectiveSourceType = candidate.inferred
        ? "R2_INFERENCE" as const
        : sourceType
      const identity = [
        opportunityId,
        candidate.key,
        String(candidate.normalizedValue),
        effectiveSourceType,
        sourceReference,
      ].join("|")

      return {
        id: `r2-claim-${stableHash(identity)}`,
        opportunityId,
        subject,
        key: candidate.key,
        statement: candidate.statement,
        value: candidate.value,
        normalizedValue: candidate.normalizedValue,
        unit: candidate.unit ?? null,
        sensitivity: candidate.sensitivity,
        temporalCue: cue,
        validFrom: cue === "CURRENT" ? observedAtIso : null,
        provenance: {
          sourceType: effectiveSourceType,
          sourceReference,
          actorId,
          receivedAt: receivedAtIso,
          observedAt: observedAtIso,
          inferred: Boolean(candidate.inferred),
          calculated: false,
        },
      }
    },
  )
}
