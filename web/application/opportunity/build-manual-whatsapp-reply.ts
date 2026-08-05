import type {
  ManualWhatsAppAnalysis,
  ManualWhatsAppStage,
} from "./analyze-manual-whatsapp-message"

import {
  buildNextGoal,
} from "./conversation/build-next-goal"

import type {
  ConversationStage,
} from "./conversation/conversation-stage"

export type BuildManualWhatsAppReplyInput = {
  contactName: string
  incomingMessage: string
  approachType?:
    | "new"
    | "reactivation"
    | null
  analysis:
    | ManualWhatsAppAnalysis
    | null
}

function firstName(
  value: string,
): string {
  const normalized =
    value
      .replace(/\s+/gu, " ")
      .trim()

  if (!normalized) {
    return "Tudo bem"
  }

  return (
    normalized
      .split(" ")
      .filter(Boolean)
      .at(0) ??
    "Tudo bem"
  )
}

function mapAnalysisStage(
  stage: ManualWhatsAppStage,
): ConversationStage {
  switch (stage) {
    case "opening":
      return "opening"

    case "discovery":
      return "discovery"

    case "diagnosis":
      return "diagnosis"

    case "qualification":
      return "qualification"

    case "strategy":
      return "strategy"

    case "call_to_action":
      return "meeting"
  }
}

export function buildManualWhatsAppReply({
  contactName,
  incomingMessage,
  approachType,
  analysis,
}: BuildManualWhatsAppReplyInput): string | null {
  if (
    !incomingMessage.trim() ||
    !analysis ||
    !approachType
  ) {
    return null
  }

  const name =
    firstName(contactName)

  const nextGoal =
    buildNextGoal({
      approachType,
      stage: mapAnalysisStage(
        analysis.stage,
      ),
    })

  switch (analysis.intent) {
    case "no_previous_response":
      return `Oi, ${name}, tudo bem? Tentei falar com você há um tempo, mas ainda não conseguimos conversar. Hoje você está buscando imóvel, veículo ou quer entender o consórcio como investimento?`

    case "not_interested":
      return `Entendo, ${name}. Para eu respeitar seu momento e não insistir de forma errada, posso confirmar se mudou a prioridade ou se o consórcio deixou de fazer sentido para você?`

    case "callback_requested":
      return `Claro, ${name}. Qual dia e horário ficam melhores para eu retornar sem atrapalhar sua rotina?`

    case "meeting_interest":
      return `Perfeito, ${name}. Podemos fazer uma conversa rápida para eu entender melhor seu objetivo e te mostrar o caminho mais adequado. Qual horário funciona melhor?`

    case "pricing_question":
      return `Claro, ${name}. Para eu te passar uma condição que realmente faça sentido, posso confirmar qual valor você pretende alcançar e em quanto tempo quer realizar esse objetivo?`

    case "interest_area":
    case "interested":
    case "needs_review":
      break
  }

  switch (nextGoal.goal) {
    case "get_first_response":
      return `Obrigado por me responder, ${name}. Só para eu entender melhor: hoje você está buscando imóvel, veículo ou uma alternativa de investimento?`

    case "understand_timing":
      return analysis.intent ===
        "interested"
        ? `Entendi, ${name}. Mudou alguma coisa desde a nossa última conversa ou o objetivo continua o mesmo?`
        : `Obrigado por me responder, ${name}. Só para eu me atualizar: esse projeto ainda está de pé ou seus planos mudaram desde a última vez?`

    case "understand_project_purpose":
      if (
        approachType ===
        "reactivation"
      ) {
        return analysis.intent ===
          "interested"
          ? `Entendi, ${name}. Mudou alguma coisa desde a nossa última conversa ou o objetivo continua o mesmo?`
          : `Entendi, ${name}. Esse objetivo continua igual ao da nossa última conversa ou alguma coisa mudou de lá para cá?`
      }

      return `Legal, ${name}. Esse imóvel seria para morar, investir ou você já tem algo específico em mente?`

    case "understand_interest_area":
      return `Ótimo, ${name}. Hoje você está pensando mais em imóvel, veículo ou usar o consórcio como estratégia de investimento?`

    case "understand_budget":
      return `Para eu montar algo coerente, ${name}, qual valor você pretende alcançar e qual faixa de parcela ficaria confortável hoje?`

    case "present_strategy":
      return `Com o que você me contou, ${name}, já consigo organizar uma estratégia mais adequada para esse projeto.`

    case "schedule_meeting":
      return `Perfeito, ${name}. Qual dia e horário funcionam melhor para conversarmos com calma?`

    case "confirm_follow_up":
      return `Oi, ${name}. Retomando nosso combinado: ainda faz sentido seguirmos com esse projeto agora?`

    case "close_next_step":
      return `Perfeito, ${name}. Podemos confirmar o próximo passo para eu deixar tudo organizado?`

    case "understand_objection":
      return `Entendi, ${name}. O que mais pesa na sua decisão hoje: prazo, parcela ou segurança da estratégia?`
  }
}
