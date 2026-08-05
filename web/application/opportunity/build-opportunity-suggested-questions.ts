import type {
  OpportunityContactContextView,
  OpportunitySuggestedQuestionView,
} from "@/types/opportunity-details"

export type BuildOpportunitySuggestedQuestionsInput = {
  contactContext:
    | OpportunityContactContextView
    | null
    | undefined
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value
    ?.replace(/\s+/gu, " ")
    .trim()
    .replace(/[.!?;:]+$/gu, "")
    .trim()

  return normalized
    ? normalized
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

export function buildOpportunitySuggestedQuestions({
  contactContext,
}: BuildOpportunitySuggestedQuestionsInput): OpportunitySuggestedQuestionView[] | null {
  if (!contactContext) {
    return null
  }

  const objective = normalizeOptionalText(
    contactContext.objective,
  )
  const currentSituation = normalizeOptionalText(
    contactContext.currentSituation,
  )

  const situationQuestion =
    contactContext.isReactivated
      ? "O que mudou no seu planejamento desde o último atendimento?"
      : "Como está seu planejamento hoje em relação a esse projeto?"

  const problemQuestion = currentSituation
    ? `No último registro, sua situação era "${currentSituation}". O que está impedindo você de avançar hoje?`
    : "Qual é hoje o principal obstáculo para avançar com esse projeto?"

  const implicationQuestion = objective
    ? `Se o objetivo de ${lowercaseInitial(objective)} continuar parado nos próximos meses, qual impacto isso terá para você?`
    : "Se esse projeto continuar parado nos próximos meses, qual impacto isso terá para você?"

  return [
    {
      kind: "situation",
      label: "Situação",
      question: situationQuestion,
    },
    {
      kind: "problem",
      label: "Problema",
      question: problemQuestion,
    },
    {
      kind: "implication",
      label: "Implicação",
      question: implicationQuestion,
    },
    {
      kind: "need_payoff",
      label: "Próximo passo",
      question: "O que precisaria acontecer para você se sentir seguro em avançar para o próximo passo?",
    },
  ]
}
