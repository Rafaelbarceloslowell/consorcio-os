export type ManualWhatsAppIntent =
  | "callback_requested"
  | "not_interested"
  | "pricing_question"
  | "meeting_interest"
  | "interest_area"
  | "interested"
  | "no_previous_response"
  | "needs_review"

export type ManualWhatsAppStage =
  | "opening"
  | "discovery"
  | "diagnosis"
  | "qualification"
  | "strategy"
  | "call_to_action"

export type ManualWhatsAppAnalysis = {
  intent: ManualWhatsAppIntent
  stage: ManualWhatsAppStage
  label: string
  summary: string
  recommendedAction: string
}

function normalizeForSignal(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(
      /\p{Diacritic}/gu,
      "",
    )
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/gu, " ")
    .trim()
}

function containsAny(
  value: string,
  fragments: readonly string[],
): boolean {
  return fragments.some(
    (fragment) =>
      value.includes(fragment),
  )
}

export function analyzeManualWhatsAppMessage(
  incomingMessage: string,
): ManualWhatsAppAnalysis | null {
  const message =
    normalizeForSignal(
      incomingMessage,
    )

  if (!message) {
    return null
  }

  if (
    containsAny(message, [
      "cliente nunca me respondeu",
      "cliente nao me respondeu",
      "cliente nunca respondeu",
      "cliente nao respondeu",
      "ele nunca me respondeu",
      "ela nunca me respondeu",
      "nunca recebi resposta",
      "nao recebi resposta",
      "nao tive resposta",
      "sem resposta do cliente",
    ])
  ) {
    return {
      intent:
        "no_previous_response",
      stage:
        "opening",
      label:
        "Cliente ainda não respondeu",
      summary:
        "O histórico informado mostra tentativas anteriores sem resposta do cliente. Não existe uma conversa anterior para continuar.",
      recommendedAction:
        "Faça uma nova abertura curta, sem fingir continuidade, e busque a primeira resposta.",
    }
  }

  if (
    containsAny(message, [
      "nao tenho interesse",
      "nao quero",
      "sem interesse",
      "nao faz sentido",
      "pare de mandar",
      "nao me chama",
    ])
  ) {
    return {
      intent:
        "not_interested",
      stage:
        "call_to_action",
      label:
        "Sem interesse declarado",
      summary:
        "O contato sinalizou que não deseja avançar neste momento.",
      recommendedAction:
        "Respeite a posição, confirme o motivo sem pressionar e encerre a conversa com educação.",
    }
  }

  if (
    containsAny(message, [
      "me chama depois",
      "fala comigo depois",
      "retorna depois",
      "pode retornar",
      "mais tarde",
      "outro dia",
      "agora nao posso",
      "estou ocupado",
      "estou ocupada",
    ])
  ) {
    return {
      intent:
        "callback_requested",
      stage:
        "call_to_action",
      label:
        "Retorno solicitado",
      summary:
        "O contato pediu que a conversa continue em outro momento.",
      recommendedAction:
        "Confirme um dia e horário específico antes de encerrar o contato.",
    }
  }

  if (
    containsAny(message, [
      "pode marcar",
      "vamos marcar",
      "marca uma reuniao",
      "podemos conversar",
      "pode me ligar",
      "vamos fazer uma reuniao",
      "qual horario",
    ])
  ) {
    return {
      intent:
        "meeting_interest",
      stage:
        "call_to_action",
      label:
        "Abertura para conversa",
      summary:
        "O contato demonstrou disponibilidade para ligação ou reunião.",
      recommendedAction:
        "Combine o horário e leve o briefing da oportunidade para a conversa.",
    }
  }

  if (
    containsAny(message, [
      "qual valor",
      "quanto fica",
      "qual parcela",
      "valor da parcela",
      "preco",
      "taxa",
      "lance",
      "contemplacao",
    ])
  ) {
    return {
      intent:
        "pricing_question",
      stage:
        "qualification",
      label:
        "Dúvida sobre condição",
      summary:
        "O contato pediu informação de valor, parcela, taxa, lance ou contemplação.",
      recommendedAction:
        "Confirme objetivo, valor desejado e prazo antes de apresentar uma condição.",
    }
  }

  if (
    containsAny(message, [
      "imovel",
      "apartamento",
      "casa",
      "terreno",
      "veiculo",
      "carro",
      "moto",
      "caminhao",
      "investimento",
      "investir",
    ])
  ) {
    return {
      intent:
        "interest_area",
      stage:
        "discovery",
      label:
        "Área de interesse identificada",
      summary:
        "O contato informou o tipo de objetivo que pretende realizar.",
      recommendedAction:
        "Aprofunde a finalidade do projeto com uma pergunta curta antes de falar de produto.",
    }
  }

  if (
    containsAny(message, [
      "tenho interesse",
      "quero saber",
      "me explica",
      "pode falar",
      "quero entender",
      "como funciona",
      "tenho uma duvida",
      "ainda estou estudando",
      "estou estudando",
      "estou pesquisando",
    ])
  ) {
    return {
      intent:
        "interested",
      stage:
        "discovery",
      label:
        "Interesse identificado",
      summary:
        "O contato abriu espaço para continuar a descoberta comercial.",
      recommendedAction:
        "Faça uma pergunta por vez e avance somente depois de entender a prioridade real.",
    }
  }

  return {
    intent:
      "needs_review",
    stage:
      "opening",
    label:
      "Contexto ainda incompleto",
    summary:
      "A mensagem não apresenta informação suficiente para avançar com segurança.",
    recommendedAction:
      "Use uma pergunta curta e contextual para descobrir o momento atual do contato.",
  }
}
