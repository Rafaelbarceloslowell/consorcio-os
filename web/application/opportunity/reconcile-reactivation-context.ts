import {
  analyzeManualWhatsAppMessage,
} from "./analyze-manual-whatsapp-message"

import type {
  ManualWhatsAppAnalysis,
  ManualWhatsAppCustomerResponseState,
} from "./analyze-manual-whatsapp-message"

export type ReactivationContextReconciliationStatus =
  | "CONSISTENT"
  | "INSUFFICIENT"
  | "CONFLICT"

export type ReactivationContextReconciliation =
  Readonly<{
    status:
      ReactivationContextReconciliationStatus
    reason: string
    savedContext: string | null
    currentObservation: string
    proposedContext: string
    effectiveContext: string | null
  }>

type ReconcileReactivationContextInput =
  Readonly<{
    savedContext:
      string | null | undefined
    currentObservation: string
    consultantConfirmed?: boolean
  }>

function normalizeOptional(
  value: string | null | undefined,
): string | null {
  const normalized =
    value?.trim()

  return normalized || null
}

function analyze(
  value: string | null,
): ManualWhatsAppAnalysis | null {
  if (!value) {
    return null
  }

  return analyzeManualWhatsAppMessage(
    value,
    {
      approachType:
        "reactivation",
    },
  )
}

function responseState(
  analysis:
    ManualWhatsAppAnalysis | null,
): ManualWhatsAppCustomerResponseState | null {
  if (!analysis) {
    return null
  }

  if (
    analysis.context
      ?.customerResponseState
  ) {
    return analysis.context
      .customerResponseState
  }

  if (
    analysis.intent ===
      "no_previous_response"
  ) {
    return "never_replied"
  }

  if (
    analysis.intent ===
      "stopped_replying"
  ) {
    return "stopped_replying"
  }

  return null
}

function hasUsableAnalysis(
  analysis:
    ManualWhatsAppAnalysis | null,
): boolean {
  return Boolean(
    analysis &&
    analysis.intent !==
      "needs_review",
  )
}

function combineContexts(
  savedContext: string,
  currentObservation: string,
): string {
  if (
    savedContext.localeCompare(
      currentObservation,
      "pt-BR",
      {
        sensitivity: "base",
      },
    ) === 0
  ) {
    return savedContext
  }

  return [
    savedContext,
    "",
    "Atualização do consultor:",
    currentObservation,
  ].join("\n")
}

function buildConflictDraft(
  savedContext: string,
  currentObservation: string,
): string {
  return [
    savedContext,
    "",
    "Observação mais recente:",
    currentObservation,
    "",
    "Correção do consultor:",
  ].join("\n")
}

export function reconcileReactivationContext({
  savedContext,
  currentObservation,
  consultantConfirmed = false,
}: ReconcileReactivationContextInput):
  ReactivationContextReconciliation {
  const normalizedSaved =
    normalizeOptional(
      savedContext,
    )

  const normalizedCurrent =
    normalizeOptional(
      currentObservation,
    ) ?? ""

  if (consultantConfirmed) {
    return {
      status:
        normalizedCurrent
          ? "CONSISTENT"
          : "INSUFFICIENT",
      reason:
        normalizedCurrent
          ? "Contexto confirmado pelo consultor. A confirmação humana tem prioridade sobre interpretações automáticas anteriores."
          : "O contexto confirmado ficou vazio.",
      savedContext:
        normalizedSaved,
      currentObservation:
        normalizedCurrent,
      proposedContext:
        normalizedCurrent,
      effectiveContext:
        normalizedCurrent || null,
    }
  }

  const savedAnalysis =
    analyze(
      normalizedSaved,
    )

  const currentAnalysis =
    analyze(
      normalizedCurrent,
    )

  if (!normalizedSaved) {
    if (
      !hasUsableAnalysis(
        currentAnalysis,
      )
    ) {
      return {
        status:
          "INSUFFICIENT",
        reason:
          "O R2 ainda não possui contexto comercial suficiente para preparar uma reativação segura.",
        savedContext:
          null,
        currentObservation:
          normalizedCurrent,
        proposedContext:
          normalizedCurrent,
        effectiveContext:
          null,
      }
    }

    return {
      status:
        "CONSISTENT",
      reason:
        "Não existe contexto anterior conflitante.",
      savedContext:
        null,
      currentObservation:
        normalizedCurrent,
      proposedContext:
        normalizedCurrent,
      effectiveContext:
        normalizedCurrent,
    }
  }

  if (!normalizedCurrent) {
    if (
      hasUsableAnalysis(
        savedAnalysis,
      )
    ) {
      return {
        status:
          "CONSISTENT",
        reason:
          "O contexto previamente informado continua sendo a referência comercial.",
        savedContext:
          normalizedSaved,
        currentObservation:
          "",
        proposedContext:
          normalizedSaved,
        effectiveContext:
          normalizedSaved,
      }
    }

    return {
      status:
        "INSUFFICIENT",
      reason:
        "O contexto salvo também não possui informação suficiente para uma recomendação segura.",
      savedContext:
        normalizedSaved,
      currentObservation:
        "",
      proposedContext:
        normalizedSaved,
      effectiveContext:
        null,
    }
  }

  const savedResponseState =
    responseState(
      savedAnalysis,
    )

  const currentResponseState =
    responseState(
      currentAnalysis,
    )

  if (
    savedResponseState &&
    currentResponseState &&
    savedResponseState !==
      currentResponseState
  ) {
    return {
      status:
        "CONFLICT",
      reason:
        savedResponseState ===
          "stopped_replying"
          ? "O histórico indica que já houve conversa ou apresentação comercial, mas a nova observação pode ser interpretada como se o cliente nunca tivesse respondido. Confirme o histórico antes de o R2 sugerir qualquer mensagem."
          : "O histórico indica que o cliente nunca respondeu, mas a nova observação parece indicar uma conversa anterior. Confirme o histórico antes de o R2 continuar.",
      savedContext:
        normalizedSaved,
      currentObservation:
        normalizedCurrent,
      proposedContext:
        buildConflictDraft(
          normalizedSaved,
          normalizedCurrent,
        ),
      effectiveContext:
        null,
    }
  }

  if (
    savedAnalysis?.context
      ?.previousConsultantAction &&
    currentAnalysis?.intent ===
      "no_previous_response"
  ) {
    return {
      status:
        "CONFLICT",
      reason:
        "Existe uma ação comercial anterior registrada, mas a nova observação foi interpretada como primeira tentativa sem conversa. Confirme qual leitura está correta.",
      savedContext:
        normalizedSaved,
      currentObservation:
        normalizedCurrent,
      proposedContext:
        buildConflictDraft(
          normalizedSaved,
          normalizedCurrent,
        ),
      effectiveContext:
        null,
    }
  }

  if (
    !hasUsableAnalysis(
      currentAnalysis,
    ) &&
    hasUsableAnalysis(
      savedAnalysis,
    )
  ) {
    const effectiveContext =
      combineContexts(
        normalizedSaved,
        normalizedCurrent,
      )

    return {
      status:
        "CONSISTENT",
      reason:
        "A nova observação isolada não invalida os fatos comerciais já conhecidos.",
      savedContext:
        normalizedSaved,
      currentObservation:
        normalizedCurrent,
      proposedContext:
        effectiveContext,
      effectiveContext,
    }
  }

  const effectiveContext =
    combineContexts(
      normalizedSaved,
      normalizedCurrent,
    )

  return {
    status:
      "CONSISTENT",
    reason:
      "A nova observação é compatível com o contexto comercial já conhecido.",
    savedContext:
      normalizedSaved,
    currentObservation:
      normalizedCurrent,
    proposedContext:
      effectiveContext,
    effectiveContext,
  }
}
