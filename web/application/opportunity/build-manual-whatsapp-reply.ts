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
    case "not_interested":
      return `Entendo, ${name}. Para eu respeitar seu momento e n\u00e3o insistir de forma errada, posso confirmar se mudou a prioridade ou se o cons\u00f3rcio deixou de fazer sentido para voc\u00ea?`

    case "callback_requested":
      return `Claro, ${name}. Qual dia e hor\u00e1rio ficam melhores para eu retornar sem atrapalhar sua rotina?`

    case "meeting_interest":
      return `Perfeito, ${name}. Podemos fazer uma conversa r\u00e1pida para eu entender melhor seu objetivo e te mostrar o caminho mais adequado. Qual hor\u00e1rio funciona melhor?`

    case "pricing_question":
      return `Claro, ${name}. Para eu te passar uma condi\u00e7\u00e3o que realmente fa\u00e7a sentido, posso confirmar qual valor voc\u00ea pretende alcan\u00e7ar e em quanto tempo quer realizar esse objetivo?`

    case "interest_area":
    case "interested":
    case "needs_review":
      break
  }

  switch (nextGoal.goal) {
    case "get_first_response":
      return `Obrigado por me responder, ${name}. S\u00f3 para eu entender melhor: hoje voc\u00ea est\u00e1 buscando im\u00f3vel, ve\u00edculo ou uma alternativa de investimento?`

    case "understand_timing":
      return analysis.intent ===
        "interested"
        ? `Entendi, ${name}. Mudou alguma coisa desde a nossa \u00faltima conversa ou o objetivo continua o mesmo?`
        : `Obrigado por me responder, ${name}. S\u00f3 para eu me atualizar: esse projeto ainda est\u00e1 de p\u00e9 ou seus planos mudaram desde a \u00faltima vez?`

    case "understand_project_purpose":
      if (
        approachType ===
        "reactivation"
      ) {
        return analysis.intent ===
          "interested"
          ? `Entendi, ${name}. Mudou alguma coisa desde a nossa \u00faltima conversa ou o objetivo continua o mesmo?`
          : `Entendi, ${name}. Esse objetivo continua igual ao da nossa \u00faltima conversa ou alguma coisa mudou de l\u00e1 para c\u00e1?`
      }

      return `Legal, ${name}. Esse im\u00f3vel seria para morar, investir ou voc\u00ea j\u00e1 tem algo espec\u00edfico em mente?`

    case "understand_interest_area":
      return `\u00d3timo, ${name}. Hoje voc\u00ea est\u00e1 pensando mais em im\u00f3vel, ve\u00edculo ou usar o cons\u00f3rcio como estrat\u00e9gia de investimento?`

    case "understand_budget":
      return `Para eu montar algo coerente, ${name}, qual valor voc\u00ea pretende alcan\u00e7ar e qual faixa de parcela ficaria confort\u00e1vel hoje?`

    case "present_strategy":
      return `Com o que voc\u00ea me contou, ${name}, j\u00e1 consigo organizar uma estrat\u00e9gia mais adequada para esse projeto.`

    case "schedule_meeting":
      return `Perfeito, ${name}. Qual dia e hor\u00e1rio funcionam melhor para conversarmos com calma?`

    case "confirm_follow_up":
      return `Oi, ${name}. Retomando nosso combinado: ainda faz sentido seguirmos com esse projeto agora?`

    case "close_next_step":
      return `Perfeito, ${name}. Podemos confirmar o pr\u00f3ximo passo para eu deixar tudo organizado?`

    case "understand_objection":
      return `Entendi, ${name}. O que mais pesa na sua decis\u00e3o hoje: prazo, parcela ou seguran\u00e7a da estrat\u00e9gia?`
  }
}