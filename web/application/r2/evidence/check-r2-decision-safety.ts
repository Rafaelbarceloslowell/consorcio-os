import type {
  R2DecisionSafetyIssueCode,
  R2DecisionSafetyResult,
  R2EvidenceDecisionContext,
} from "./types"

import type {
  R2CustomerBoundaryContext,
} from "@/application/r2/boundary"

export type CheckR2DecisionSafetyInput =
  Readonly<{
    decisionText: string | null
    evidence: R2EvidenceDecisionContext
    actionKind?: "RECOMMENDATION" | "AUTOMATION"
    automationAuthorized?: boolean
    customerBoundary?:
      R2CustomerBoundaryContext | null
    decisionConsistency?: Readonly<{
      signal?: string | null
      intent?: string | null
      objective?: string | null
      technique?: string | null
      callToAction?: string | null
      question?: string | null
      avoid?: readonly string[]
      customerHasReplied?: boolean | null
      responseStatus?:
        | "NEVER_RESPONDED"
        | "RESPONDED"
        | "UNKNOWN"
        | null
      lastIncomingMessage?: string | null
    }>
  }>

function normalize(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/gu, " ")
    .trim()
}

function supportedAmounts(
  evidence: R2EvidenceDecisionContext,
): readonly number[] {
  return evidence.assessments.flatMap(
    (assessment) => {
      const value = assessment.claim?.normalizedValue

      return typeof value === "number" &&
        assessment.evidenceStatus !== "CONFLICTING" &&
        assessment.evidenceStatus !== "UNKNOWN" &&
        assessment.evidenceStatus !== "UNVERIFIED"
        ? [value]
        : []
    },
  )
}

function mentionedCurrencyAmounts(
  text: string,
): readonly number[] {
  return [...text.matchAll(
    /r\$\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?\s*(mil|milhao|milhoes)?/gu,
  )].map((match) => {
    const raw = `${match[1]}${match[2] ? `,${match[2]}` : ""}`
      .replace(/\./gu, "")
      .replace(",", ".")
    const scale = match[3]
      ? match[3].startsWith("milhao") ? 1_000_000 : 1_000
      : 1

    return Number(raw) * scale
  })
}

export function checkR2DecisionSafety({
  decisionText,
  evidence,
  actionKind = "RECOMMENDATION",
  automationAuthorized = false,
  customerBoundary = null,
  decisionConsistency,
}: CheckR2DecisionSafetyInput): R2DecisionSafetyResult {
  const normalized = normalize(decisionText ?? "")
  const issues: Array<{
    code: R2DecisionSafetyIssueCode
    rationale: string
  }> = []
  const addIssue = (
    code: R2DecisionSafetyIssueCode,
    rationale: string,
  ): void => {
    if (!issues.some((issue) => issue.code === code)) {
      issues.push({ code, rationale })
    }
  }

  const customerHasNotReplied =
    decisionConsistency
      ?.customerHasReplied === false ||
    decisionConsistency
      ?.responseStatus ===
        "NEVER_RESPONDED"
  const acknowledgesInbound =
    /\b(?:obrigad[oa]\s+(?:por\s+)?(?:me\s+)?(?:responder|pelo retorno|pela resposta)|obrigad[oa]\s+(?:pelo\s+)?retorno|que bom que (?:voce )?respondeu|vi sua mensagem|pelo que (?:voce )?respondeu)\b/u
      .test(normalized)
  const interactionStateContradiction =
    (
      decisionConsistency
        ?.responseStatus ===
        "NEVER_RESPONDED" &&
      (
        decisionConsistency
          .customerHasReplied === true ||
        Boolean(
          decisionConsistency
            .lastIncomingMessage
            ?.trim(),
        )
      )
    ) ||
    (
      decisionConsistency
        ?.responseStatus ===
        "RESPONDED" &&
      decisionConsistency
        .customerHasReplied === false
    )

  if (interactionStateContradiction) {
    addIssue(
      "INTERACTION_STATE_CONTRADICTION",
      "O estado de resposta, o indicador de inbound e a última mensagem recebida são incompatíveis entre si.",
    )
  }

  if (
    customerHasNotReplied &&
    acknowledgesInbound
  ) {
    addIssue(
      "FALSE_INBOUND_ACKNOWLEDGEMENT",
      "A decisão reconhece uma resposta do cliente, mas o estado de interação informa que nenhum inbound ocorreu.",
    )
  }

  if (customerBoundary?.terminal) {
    const technique = normalize(
      decisionConsistency?.technique ?? "",
    )
    const objective = normalize(
      decisionConsistency?.objective ?? "",
    )
    const callToAction = normalize(
      decisionConsistency?.callToAction ?? "",
    )
    const question =
      decisionConsistency?.question?.trim() ?? ""
    const avoid = normalize(
      decisionConsistency?.avoid?.join(" ") ?? "",
    )
    const acknowledgesClosure =
      /\b(desculpe pela insistencia|nao vou insistir|vou encerrar|encerrar o contato)\b/u.test(normalized)
    const continuedPressure =
      /\b(pression(?:ar|e|ando)?|insist(?:ir|a|indo|encia)?|tente mais uma vez|ultima chance|posso confirmar|qual o motivo|por que voce|vamos avancar|aproveite)\b/u.test(normalized) &&
      !acknowledgesClosure

    if (technique === "objection_handling") {
      addIssue(
        "OBJECTION_HANDLING_AFTER_REJECTION",
        "Tratamento de objeção não pode superar uma rejeição terminal do cliente.",
      )
    }

    if (
      callToAction &&
      !/\b(nenhum cta|sem cta|encerrar)\b/u.test(callToAction)
    ) {
      addIssue(
        "CTA_AFTER_TERMINAL_REJECTION",
        "A decisão contém CTA depois de a conversa ter sido encerrada pelo cliente.",
      )
    }

    if (question || /\?/u.test(decisionText ?? "")) {
      addIssue(
        "QUESTION_AFTER_TERMINAL_REJECTION",
        "A decisão faz nova pergunta depois de uma rejeição terminal.",
      )
    }

    if (
      /\b(entender|descobrir|investigar)\b.{0,35}\b(motivo|razao|objecao)\b/u.test(objective) ||
      (
        decisionConsistency?.intent === "not_interested" &&
        technique !== "none"
      )
    ) {
      addIssue(
        "DECISION_INTERNAL_CONTRADICTION",
        "Intent, objetivo e técnica são incompatíveis com a boundary fechada.",
      )
    }

    if (
      customerBoundary.explicitRejectionCount > 1 &&
      (
        technique !== "none" ||
        continuedPressure
      )
    ) {
      addIssue(
        "REPEATED_REJECTION_IGNORED",
        "A decisão ignora um padrão de rejeição explícita repetida.",
      )
    }

    if (
      customerBoundary.state === "DO_NOT_CONTACT" &&
      (
        actionKind === "AUTOMATION" ||
        question ||
        continuedPressure
      )
    ) {
      addIssue(
        "DO_NOT_CONTACT_VIOLATION",
        "A ação tenta manter contato depois de um pedido explícito para cessar mensagens.",
      )
    }

    if (
      continuedPressure ||
      (
        avoid.includes("pressionar") &&
        /\b(pression(?:ar|e|ando)?|insist(?:ir|a|indo|encia)?)\b/u.test(normalized) &&
        !acknowledgesClosure
      )
    ) {
      addIssue(
        "CUSTOMER_BOUNDARY_VIOLATION",
        "A formulação tenta continuar a venda depois de uma fronteira explícita do cliente.",
      )
    }
  }

  if (
    /\b(sera|vai ser|esta) contemplad[oa]\b/u.test(normalized) ||
    /\bcontemplacao garantida\b/u.test(normalized)
  ) {
    issues.push({
      code: "CONTEMPLATION_PROMISE",
      rationale: "A decisão promete contemplação, resultado que não pode ser garantido pelas evidências disponíveis.",
    })
  }

  if (/\b(garantido|garantia|certeza|sem risco)\b/u.test(normalized)) {
    issues.push({
      code: "GUARANTEE_INFLATION",
      rationale: "A recomendação converte possibilidade ou estimativa em garantia.",
    })
  }

  const hasUnconfirmedEvidence = evidence.assessments.some(
    (assessment) =>
      assessment.evidenceStatus !== "CONFIRMED" &&
      assessment.evidenceStatus !== "UNKNOWN",
  )

  if (
    hasUnconfirmedEvidence &&
    /\b(comprovado|confirmado|definitivamente|sem duvida)\b/u.test(normalized)
  ) {
    issues.push({
      code: "UNSUPPORTED_CERTAINTY",
      rationale: "A decisão apresenta como certa uma informação que não está confirmada.",
    })
  }

  if (evidence.status === "CONFLICTING" && normalized) {
    issues.push({
      code: "KNOWN_CONFLICT",
      rationale: "A decisão usa contexto enquanto existe conflito relevante ainda não resolvido.",
    })
  }

  const knownAmounts = supportedAmounts(evidence)
  const unknownFinancialAmount = mentionedCurrencyAmounts(normalized).some(
    (amount) => !knownAmounts.some(
      (known) => Math.abs(known - amount) < 0.01,
    ),
  )
  const unsupportedRateOrTerm =
    /\b\d+(?:[,.]\d+)?\s*%\b/u.test(normalized) ||
    /\b\d+\s*(?:mes|meses)\b/u.test(normalized)

  if (unknownFinancialAmount || unsupportedRateOrTerm) {
    issues.push({
      code: "UNSUPPORTED_FINANCIAL_CLAIM",
      rationale: "A decisão introduz valor, taxa ou prazo que não aparece nas evidências avaliadas.",
    })
  }

  if (
    evidence.outcome === "BLOCKED" ||
    (
      evidence.outcome === "NEED_MORE_EVIDENCE" &&
      /\b(recomendo|ideal|melhor opcao|deve)\b/u.test(normalized)
    )
  ) {
    issues.push({
      code: "EVIDENCE_LEAP",
      rationale: "A recomendação vai além do que as evidências atuais permitem concluir.",
    })
  }

  if (actionKind === "AUTOMATION" && !automationAuthorized) {
    issues.push({
      code: "AUTOMATION_AUTHORITY",
      rationale: "A ação automática excede a autoridade concedida ao R2.",
    })
  }

  const codes = new Set(issues.map((issue) => issue.code))
  const status = codes.has("CONTEMPLATION_PROMISE") ||
    codes.has("AUTOMATION_AUTHORITY") ||
    codes.has("CUSTOMER_BOUNDARY_VIOLATION") ||
    codes.has("REPEATED_REJECTION_IGNORED") ||
    codes.has("DO_NOT_CONTACT_VIOLATION") ||
    codes.has("DECISION_INTERNAL_CONTRADICTION") ||
    codes.has("CTA_AFTER_TERMINAL_REJECTION") ||
    codes.has("QUESTION_AFTER_TERMINAL_REJECTION") ||
    codes.has("OBJECTION_HANDLING_AFTER_REJECTION")
    ? "BLOCK" as const
    : codes.has("KNOWN_CONFLICT") ||
        evidence.humanConfirmationRequired
      ? "HUMAN_REVIEW_REQUIRED" as const
      : issues.length > 0
        ? "REVISE" as const
        : evidence.warnings.length > 0
          ? "SAFE_WITH_WARNING" as const
          : "SAFE" as const

  return {
    status,
    issues,
    warnings: [
      ...evidence.warnings,
      ...issues.map((issue) => issue.rationale),
    ],
    safeToPresent: status === "SAFE" || status === "SAFE_WITH_WARNING",
    requiresHumanReview: status === "HUMAN_REVIEW_REQUIRED",
  }
}
