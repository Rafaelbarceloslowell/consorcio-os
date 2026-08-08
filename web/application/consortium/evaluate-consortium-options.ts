import type {
  Consortium,
  ConsortiumType,
} from "@/types/domain"

export type ConsortiumCustomerProfile =
  Readonly<{
    assetCategory?:
      ConsortiumType | null
    desiredCredit?: number | null
    comfortableInstallment?:
      number | null
    targetTimelineMonths?:
      number | null
    ownBidCapital?: number | null
    embeddedBidPreference?:
      boolean | null
    investmentGoal?: string | null
    firstProperty?: boolean | null
    vehicleValue?: number | null
    additionalConstraints?:
      readonly string[]
  }>

export type ConsortiumEligibility =
  | "ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "UNKNOWN"

export type ConsortiumFitBand =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "NOT_APPLICABLE"

export type ConsortiumSourceFreshness =
  | "CURRENT"
  | "STALE"
  | "UNVERIFIED"

export type ConsortiumCandidateEvaluation =
  Readonly<{
    candidateId: string
    administratorId: string
    productId: string
    eligibility:
      ConsortiumEligibility
    fitScore: number | null
    fitBand: ConsortiumFitBand
    reasons: readonly string[]
    constraints: readonly string[]
    missingData: readonly string[]
    ruleWarnings: readonly string[]
    sourceFreshness:
      ConsortiumSourceFreshness
    ruleVersion: number
    suggestedCommercialAngle:
      string | null
  }>

export type ConsortiumIntelligenceResult =
  Readonly<{
    status:
      | "NO_CATALOG"
      | "INSUFFICIENT_DATA"
      | "NO_VERIFIED_OPTIONS"
      | "NO_ELIGIBLE_OPTIONS"
      | "OPTIONS_AVAILABLE"
    candidates:
      readonly ConsortiumCandidateEvaluation[]
    topOptions:
      readonly ConsortiumCandidateEvaluation[]
    missingData: readonly string[]
    warnings: readonly string[]
    explanation: string
  }>

function finitePositive(
  value: number | null | undefined,
): value is number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
}

function resolveFreshness(
  candidate: Consortium,
  now: Date,
): ConsortiumSourceFreshness {
  if (
    candidate.ruleStatus ===
      "stale" ||
    (
      candidate.effectiveUntil &&
      new Date(
        candidate.effectiveUntil,
      ).getTime() < now.getTime()
    )
  ) {
    return "STALE"
  }

  if (
    candidate.ruleStatus !==
      "verified" ||
    !candidate.ruleSource ||
    !candidate.verifiedAt ||
    (
      candidate.effectiveFrom &&
      new Date(
        candidate.effectiveFrom,
      ).getTime() > now.getTime()
    )
  ) {
    return "UNVERIFIED"
  }

  return "CURRENT"
}

function fitBand(
  score: number | null,
): ConsortiumFitBand {
  if (score === null) {
    return "NOT_APPLICABLE"
  }

  if (score >= 80) {
    return "HIGH"
  }

  if (score >= 60) {
    return "MEDIUM"
  }

  return "LOW"
}

function unique(
  values: readonly string[],
): readonly string[] {
  return [...new Set(values)]
}

function evaluateCandidate({
  candidate,
  profile,
  now,
}: {
  candidate: Consortium
  profile: ConsortiumCustomerProfile
  now: Date
}): ConsortiumCandidateEvaluation {
  const reasons: string[] = []
  const constraints: string[] = []
  const missingData: string[] = []
  const ruleWarnings: string[] = []
  const sourceFreshness =
    resolveFreshness(
      candidate,
      now,
    )

  if (sourceFreshness === "STALE") {
    ruleWarnings.push(
      "STALE_RULE: esta regra precisa ser confirmada antes de ser usada na proposta.",
    )
  }

  if (sourceFreshness === "UNVERIFIED") {
    ruleWarnings.push(
      "UNVERIFIED_RULE: a origem e a vigência desta regra ainda não estão verificadas.",
    )
  }

  if (!profile.assetCategory) {
    missingData.push(
      "assetCategory",
    )
  }

  if (!finitePositive(
    profile.desiredCredit,
  )) {
    missingData.push(
      "desiredCredit",
    )
  }

  let eligibility:
    ConsortiumEligibility =
      "ELIGIBLE"

  if (sourceFreshness !== "CURRENT") {
    eligibility = "UNKNOWN"
  }

  if (candidate.status !== "active") {
    eligibility = "NOT_ELIGIBLE"
    constraints.push(
      "O produto não está ativo para novas propostas.",
    )
  }

  if (
    profile.assetCategory &&
    candidate.type !==
      profile.assetCategory
  ) {
    eligibility = "NOT_ELIGIBLE"
    constraints.push(
      "A categoria do produto não atende ao objetivo informado.",
    )
  }

  if (finitePositive(
    profile.desiredCredit,
  )) {
    if (
      profile.desiredCredit <
        candidate.minCreditValue ||
      profile.desiredCredit >
        candidate.maxCreditValue
    ) {
      eligibility = "NOT_ELIGIBLE"
      constraints.push(
        "Crédito desejado fora da faixa verificada do produto.",
      )
    } else {
      reasons.push(
        "Crédito desejado dentro da faixa verificada do produto.",
      )
    }
  } else if (
    eligibility === "ELIGIBLE"
  ) {
    eligibility = "UNKNOWN"
  }

  if (finitePositive(
    profile.comfortableInstallment,
  )) {
    if (
      finitePositive(
        candidate.minInstallmentValue,
      ) &&
      profile.comfortableInstallment <
        candidate.minInstallmentValue
    ) {
      eligibility = "NOT_ELIGIBLE"
      constraints.push(
        "Parcela confortável abaixo do mínimo verificado do produto.",
      )
    }

    if (
      finitePositive(
        candidate.maxInstallmentValue,
      ) &&
      profile.comfortableInstallment >
        candidate.maxInstallmentValue
    ) {
      eligibility = "NOT_ELIGIBLE"
      constraints.push(
        "Parcela confortável acima do máximo verificado do produto.",
      )
    }
  } else {
    missingData.push(
      "comfortableInstallment",
    )
  }

  if (
    profile.embeddedBidPreference ===
      true &&
    candidate.embeddedBidAllowed ===
      false
  ) {
    constraints.push(
      "O produto verificado não permite lance embutido.",
    )
  }

  if (
    profile.embeddedBidPreference !==
      null &&
    profile.embeddedBidPreference !==
      undefined &&
    candidate.embeddedBidAllowed ===
      undefined
  ) {
    missingData.push(
      "embeddedBidRule",
    )
  }

  if (!finitePositive(
    profile.targetTimelineMonths,
  )) {
    missingData.push(
      "targetTimeline",
    )
  }

  let score: number | null = null

  if (eligibility === "ELIGIBLE") {
    score = 50

    if (finitePositive(
      profile.desiredCredit,
    )) {
      const range =
        Math.max(
          1,
          candidate.maxCreditValue -
            candidate.minCreditValue,
        )
      const midpoint =
        (
          candidate.minCreditValue +
          candidate.maxCreditValue
        ) / 2
      const creditFit =
        1 -
        Math.min(
          1,
          Math.abs(
            profile.desiredCredit -
              midpoint,
          ) /
            range,
        )

      score += Math.round(
        creditFit * 25,
      )
    }

    if (finitePositive(
      profile.comfortableInstallment,
    )) {
      score += 15
      reasons.push(
        finitePositive(
          candidate.minInstallmentValue,
        ) ||
        finitePositive(
          candidate.maxInstallmentValue,
        )
          ? "Parcela confortável compatível com a restrição verificada."
          : "Parcela informada; o produto não possui restrição de parcela verificada.",
      )
    }

    if (finitePositive(
      profile.targetTimelineMonths,
    )) {
      const difference =
        Math.abs(
          profile.targetTimelineMonths -
            candidate.defaultTermMonths,
        )
      score += Math.max(
        0,
        10 -
          Math.round(
            difference / 12,
          ),
      )
    }

    score = Math.min(100, score)
  }

  return {
    candidateId: candidate.id,
    administratorId:
      candidate.administrator,
    productId: candidate.id,
    eligibility,
    fitScore: score,
    fitBand: fitBand(score),
    reasons,
    constraints,
    missingData:
      unique(missingData),
    ruleWarnings,
    sourceFreshness,
    ruleVersion:
      candidate.ruleVersion ?? 1,
    suggestedCommercialAngle:
      eligibility === "ELIGIBLE"
        ? "Apresente esta opção como alternativa verificada e explique os critérios de aderência sem prometer contemplação."
        : null,
  }
}

export type EvaluateConsortiumOptionsInput =
  Readonly<{
    profile: ConsortiumCustomerProfile
    candidates: readonly Consortium[]
    now?: Date
  }>

export function evaluateConsortiumOptions({
  profile,
  candidates,
  now = new Date(),
}: EvaluateConsortiumOptionsInput): ConsortiumIntelligenceResult {
  const warnings = [
    "Nenhuma opção ou estratégia garante data de contemplação.",
    "Não há probabilidade de contemplação calculada sem histórico estatístico legítimo.",
  ]

  const globalMissingData =
    unique([
      ...(!profile.assetCategory
        ? ["assetCategory"]
        : []),
      ...(!finitePositive(
        profile.desiredCredit,
      )
        ? ["desiredCredit"]
        : []),
      ...(!finitePositive(
        profile.comfortableInstallment,
      )
        ? ["comfortableInstallment"]
        : []),
      ...(!finitePositive(
        profile.targetTimelineMonths,
      )
        ? ["targetTimeline"]
        : []),
    ])

  if (candidates.length === 0) {
    return {
      status: "NO_CATALOG",
      candidates: [],
      topOptions: [],
      missingData:
        globalMissingData,
      warnings,
      explanation:
        "Não existe catálogo disponível; nenhum produto específico pode ser recomendado.",
    }
  }

  const evaluations =
    candidates.map(
      (candidate) =>
        evaluateCandidate({
          candidate,
          profile,
          now,
        }),
    )

  const topOptions =
    evaluations
      .filter(
        (candidate) =>
          candidate.eligibility ===
          "ELIGIBLE",
      )
      .sort(
        (first, second) =>
          (
            second.fitScore ?? 0
          ) -
          (
            first.fitScore ?? 0
          ) ||
          first.candidateId.localeCompare(
            second.candidateId,
          ),
      )
      .slice(0, 3)

  const hasCurrentRule =
    evaluations.some(
      (candidate) =>
        candidate.sourceFreshness ===
        "CURRENT",
    )
  const status =
    globalMissingData.includes(
      "assetCategory",
    ) ||
    globalMissingData.includes(
      "desiredCredit",
    )
      ? "INSUFFICIENT_DATA"
      : !hasCurrentRule
        ? "NO_VERIFIED_OPTIONS"
        : topOptions.length === 0
          ? "NO_ELIGIBLE_OPTIONS"
          : "OPTIONS_AVAILABLE"

  const explanation =
    status === "OPTIONS_AVAILABLE"
      ? "Existem opções verificadas e elegíveis; o ranking interno considera somente dados disponíveis e regras vigentes."
      : status === "NO_VERIFIED_OPTIONS"
        ? "O catálogo não possui regra atual verificada para uma recomendação segura."
        : status === "NO_ELIGIBLE_OPTIONS"
          ? "Nenhuma opção verificada atende às regras duras conhecidas."
          : "Faltam dados essenciais do cliente antes de avaliar elegibilidade."

  return {
    status,
    candidates: evaluations,
    topOptions,
    missingData:
      globalMissingData,
    warnings,
    explanation,
  }
}
