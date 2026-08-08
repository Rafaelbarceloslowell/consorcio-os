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

  const name =
    normalized
      .split(" ")
      .filter(Boolean)
      .at(0) ??
    "Tudo bem"

  return (
    name.charAt(0)
      .toLocaleUpperCase("pt-BR") +
    name.slice(1)
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

    case "follow_up":
      return "follow_up"
  }
}

function buildStoppedReplyingReply(
  name: string,
  analysis: ManualWhatsAppAnalysis,
): string {
  const customerInterest =
    analysis.context?.customerInterest ??
    null
  const lastContactDate =
    analysis.context?.lastContactDate ??
    null

  if (
    customerInterest &&
    lastContactDate
  ) {
    return `Oi, ${name}, tudo bem? Quando conversamos em ${lastContactDate}, você estava buscando ${customerInterest}. Esse projeto ainda está de pé ou seus planos mudaram desde então?`
  }

  if (customerInterest) {
    return `Oi, ${name}, tudo bem? Na nossa última conversa, você estava buscando ${customerInterest}. Esse projeto ainda está de pé ou seus planos mudaram desde então?`
  }

  if (lastContactDate) {
    return `Oi, ${name}, tudo bem? Retomando nosso contato de ${lastContactDate}: seu projeto ainda está de pé ou seus planos mudaram desde então?`
  }

  return `Oi, ${name}, tudo bem? Retomando nosso último contato: seu projeto ainda está de pé ou seus planos mudaram desde então?`
}

function buildNoPreviousResponseReply(
  name: string,
  analysis: ManualWhatsAppAnalysis,
): string {
  const customerInterest =
    analysis.context?.customerInterest ??
    null

  if (customerInterest) {
    return `Oi, ${name}, tudo bem? Vi que você tinha interesse em ${customerInterest}, mas ainda não conseguimos conversar. Esse projeto continua nos seus planos?`
  }

  return `Oi, ${name}, tudo bem? Tentei falar com você há um tempo, mas ainda não conseguimos conversar. Hoje você está buscando imóvel, veículo ou quer entender o consórcio como investimento?`
}

function buildObjectionReply(
  name: string,
  analysis: ManualWhatsAppAnalysis,
): string {
  switch (analysis.objection?.id) {
    case "high_installment":
      return `Entendo, ${name}. Para ajustarmos sem forçar seu orçamento, qual faixa de parcela ficaria confortável hoje?`

    case "fee_concern":
      return `Faz sentido avaliar isso, ${name}. Qual comparação ou ponto da taxa mais pesa na sua decisão?`

    case "no_money_now":
      return `Entendo seu momento, ${name}. Em que período faria sentido retomarmos esse planejamento sem comprometer sua organização financeira?`

    case "no_bid":
      return `Entendo, ${name}. Você quer avaliar caminhos possíveis sem presumirmos lance nem prazo de contemplação?`

    case "needs_time_to_think":
      return `Claro, ${name}. Qual ponto você ainda precisa esclarecer para conseguir avaliar com segurança?`

    case "needs_other_decision_maker":
      return `Perfeito, ${name}. Qual informação precisa ficar clara para vocês tomarem essa decisão juntos?`

    case "contemplation_fear":
      return `Esse cuidado é importante, ${name}. Como não existe garantia de data de contemplação, qual prazo seu projeto consegue suportar?`

    case "prefers_financing":
      return `Entendo, ${name}. Qual critério faz o financiamento parecer mais adequado hoje: prazo, acesso imediato, entrada ou custo total?`

    case "no_urgency":
      return `Faz sentido planejar sem pressa, ${name}. Existe alguma data ou objetivo futuro que devemos usar como referência?`

    case "bad_previous_experience":
      return `Entendo sua cautela, ${name}. O que aconteceu naquela experiência e o que precisaria ser diferente agora?`

    case "trust_concern":
      return `Sua segurança vem primeiro, ${name}. Qual ponto do consórcio você gostaria de validar antes de continuar?`

    case "wants_to_wait":
      return `Tudo bem, ${name}. Quando seria um momento adequado para retomarmos sem te pressionar?`

    default:
      return `Entendo, ${name}. O que precisaria ficar claro para você se sentir seguro em relação ao próximo passo?`
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

  if (
    analysis.context
      ?.projectTimingDeferred
  ) {
    switch (
      analysis.context
        .projectTimingHint
    ) {
      case "next_year":
        return `Entendi, ${name}. Faz sentido organizar as contas primeiro. Como você acredita que a partir do ano que vem estará mais tranquilo, posso te chamar no começo do ano para vermos como está?`

      case "next_month":
        return `Entendi, ${name}. Faz sentido organizar as contas primeiro. Posso te chamar no próximo mês para vermos como está?`

      default:
        return `Entendi, ${name}. Faz sentido organizar as contas antes de avançar. Para eu acompanhar sem te pressionar, você imagina retomar isso em algumas semanas ou em alguns meses?`
    }
  }

  if (
    analysis.context
      ?.projectActiveConfirmed
  ) {
    return `Perfeito, ${name}. Que bom que o projeto continua de pé. Você já tem uma previsão de quando pretende realizá-lo?`
  }

  switch (analysis.intent) {
    case "no_previous_response":
      return buildNoPreviousResponseReply(
        name,
        analysis,
      )

    case "stopped_replying":
      return buildStoppedReplyingReply(
        name,
        analysis,
      )

    case "not_interested":
      return `Entendo, ${name}. Para eu respeitar seu momento e não insistir de forma errada, posso confirmar se mudou a prioridade ou se o consórcio deixou de fazer sentido para você?`

    case "callback_requested":
      return `Claro, ${name}. Qual dia e horário ficam melhores para eu retornar sem atrapalhar sua rotina?`

    case "meeting_interest":
      return `Perfeito, ${name}. Podemos fazer uma conversa rápida para eu entender melhor seu objetivo e te mostrar o caminho mais adequado. Qual horário funciona melhor?`

    case "pricing_question":
      return `Claro, ${name}. Para eu te passar uma condição que realmente faça sentido, posso confirmar qual valor você pretende alcançar e em quanto tempo quer realizar esse objetivo?`

    case "objection":
      return buildObjectionReply(
        name,
        analysis,
      )

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
