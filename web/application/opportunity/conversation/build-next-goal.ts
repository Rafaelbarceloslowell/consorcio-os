import type {
  ConversationApproachType,
  ConversationGoal,
  ConversationStage,
} from "./conversation-stage"

export type BuildNextGoalInput = {
  approachType: ConversationApproachType
  stage: ConversationStage
}

export type BuildNextGoalOutput = {
  goal: ConversationGoal
  label: string
  explanation: string
}

export function buildNextGoal({
  approachType,
  stage,
}: BuildNextGoalInput): BuildNextGoalOutput {
  switch (stage) {
    case "opening":
      return {
        goal:
          approachType ===
          "reactivation"
            ? "understand_timing"
            : "get_first_response",
        label:
          approachType ===
          "reactivation"
            ? "Atualizar o momento do cliente"
            : "Gerar a primeira resposta",
        explanation:
          approachType ===
          "reactivation"
            ? "Descobrir se o projeto continua ativo ou se os planos mudaram."
            : "Criar abertura para iniciar a descoberta sem antecipar proposta ou preço.",
      }

    case "rapport":
      return {
        goal:
          "understand_interest_area",
        label:
          "Criar conexão e identificar o interesse",
        explanation:
          "Entender o tipo de objetivo antes de aprofundar a conversa.",
      }

    case "discovery":
      return {
        goal:
          "understand_project_purpose",
        label:
          "Entender a finalidade do projeto",
        explanation:
          "Descobrir se o cliente quer morar, investir, construir, trocar ou realizar outro objetivo.",
      }

    case "qualification":
      return {
        goal:
          "understand_budget",
        label:
          "Entender capacidade e faixa de investimento",
        explanation:
          "Confirmar valor desejado, prazo e parcela confortável antes de apresentar uma condição.",
      }

    case "diagnosis":
      return {
        goal:
          "understand_timing",
        label:
          "Entender urgência e prazo",
        explanation:
          "Descobrir quando o cliente pretende realizar o projeto e o que pode impedir o avanço.",
      }

    case "strategy":
      return {
        goal:
          "present_strategy",
        label:
          "Apresentar a estratégia adequada",
        explanation:
          "Conectar o diagnóstico do cliente com uma solução de consórcio coerente.",
      }

    case "meeting":
      return {
        goal:
          "schedule_meeting",
        label:
          "Confirmar a conversa",
        explanation:
          "Definir dia, horário e formato do próximo contato.",
      }

    case "follow_up":
      return {
        goal:
          "confirm_follow_up",
        label:
          "Retomar o próximo passo",
        explanation:
          "Reabrir a conversa com contexto e uma ação clara.",
      }

    case "closing":
      return {
        goal:
          "close_next_step",
        label:
          "Formalizar o próximo passo",
        explanation:
          "Conduzir o cliente para uma decisão, proposta ou reunião.",
      }
  }
}