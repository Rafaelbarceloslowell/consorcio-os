import type {
  OpportunityBriefingView,
  OpportunityContactContextView,
  OpportunitySuggestedQuestionView,
} from "@/types/opportunity-details"

export type BuildOpportunityBriefingInput = {
  contactName: string
  contactContext:
    | OpportunityContactContextView
    | null
    | undefined
  suggestedQuestions:
    | OpportunitySuggestedQuestionView[]
    | null
    | undefined
}

function normalizeRequiredText(
  value: string,
  fallback: string,
): string {
  const normalized = value
    .replace(/\s+/gu, " ")
    .trim()

  return normalized || fallback
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value
    ?.replace(/\s+/gu, " ")
    .trim()
    .replace(/[.!?;:]+$/gu, "")
    .trim()

  return normalized || null
}

function normalizeQuestionText(
  value: string | null | undefined,
): string | null {
  const normalized = value
    ?.replace(/\s+/gu, " ")
    .trim()
    .replace(/[.!?;:]+$/gu, "")
    .trim()

  return normalized
    ? `${normalized}?`
    : null
}

function lowercaseInitial(
  value: string,
): string {
  if (!value) {
    return value
  }

  return `${value[0].toLocaleLowerCase("pt-BR")}${value.slice(1)}`
}

function ensureTerminalPunctuation(
  value: string,
): string {
  return /[.!?]$/u.test(value)
    ? value
    : `${value}.`
}

export function buildOpportunityBriefing({
  contactName,
  contactContext,
  suggestedQuestions,
}: BuildOpportunityBriefingInput): OpportunityBriefingView | null {
  if (!contactContext) {
    return null
  }

  const normalizedName = normalizeRequiredText(
    contactName,
    "Contato não identificado",
  )
  const sourceLabel = normalizeRequiredText(
    contactContext.sourceLabel,
    "origem não identificada",
  )
  const objective = normalizeOptionalText(
    contactContext.objective,
  )
  const currentSituation = normalizeOptionalText(
    contactContext.currentSituation,
  )
  const situationQuestion = normalizeQuestionText(
    suggestedQuestions?.find(
      (item) => item.kind === "situation",
    )?.question,
  )

  const summary = contactContext.isReactivated
    ? objective
      ? `${normalizedName} é um lead reativado de ${sourceLabel}, com objetivo registrado de ${lowercaseInitial(objective)}.`
      : `${normalizedName} é um lead reativado de ${sourceLabel}; o objetivo precisa ser confirmado antes de qualquer proposta.`
    : objective
      ? `${normalizedName} está em atendimento, com objetivo registrado de ${lowercaseInitial(objective)}.`
      : `${normalizedName} está em atendimento; o objetivo principal ainda precisa ser confirmado.`

  const attentionPoint = currentSituation
    ? `Situação atual registrada: ${ensureTerminalPunctuation(currentSituation)}`
    : contactContext.isReactivated
      ? "Não há situação atual registrada; confirme o que mudou desde o último atendimento."
      : "Não há situação atual registrada; valide o momento do contato antes de aprofundar a oferta."

  const conversationFocus = objective
    ? `Entender prioridade, prazo e segurança necessários para avançar em ${lowercaseInitial(objective)}.`
    : "Entender a prioridade real, o prazo esperado e o critério de decisão do contato."

  const recommendedNextStep = situationQuestion
    ? `Comece por: ${situationQuestion}`
    : "Comece validando o momento atual e avance uma pergunta por vez antes de apresentar condições."

  return {
    summary,
    attentionPoint,
    conversationFocus,
    recommendedNextStep,
  }
}
