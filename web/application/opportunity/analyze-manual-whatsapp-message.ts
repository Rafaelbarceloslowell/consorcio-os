export type ManualWhatsAppIntent =
  | "callback_requested"
  | "not_interested"
  | "pricing_question"
  | "meeting_interest"
  | "interest_area"
  | "interested"
  | "no_previous_response"
  | "stopped_replying"
  | "needs_review"

export type ManualWhatsAppStage =
  | "opening"
  | "discovery"
  | "diagnosis"
  | "qualification"
  | "strategy"
  | "call_to_action"
  | "follow_up"

export type ManualWhatsAppCustomerResponseState =
  | "never_replied"
  | "stopped_replying"

export type ManualWhatsAppContext = {
  customerInterest: string | null
  previousConsultantAction: string | null
  customerResponseState:
    | ManualWhatsAppCustomerResponseState
    | null
  lastContactDate: string | null
  projectActiveConfirmed?: boolean
  projectTimingDeferred?: boolean
  projectTimingHint?:
    | "next_month"
    | "next_year"
    | null
}

export type ManualWhatsAppAnalysis = {
  intent: ManualWhatsAppIntent
  stage: ManualWhatsAppStage
  label: string
  summary: string
  recommendedAction: string
  context?: ManualWhatsAppContext
}

export type AnalyzeManualWhatsAppMessageOptions = {
  approachType?:
    | "new"
    | "reactivation"
    | null
}

type RoleMessages = {
  customerMessages: string[]
  consultantMessages: string[]
  hasRoleLabels: boolean
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

function extractRoleMessages(
  value: string,
): RoleMessages {
  const customerMessages: string[] = []
  const consultantMessages: string[] = []
  let hasRoleLabels = false

  for (const line of value.split(/\r?\n/gu)) {
    const customerMatch =
      line.match(
        /^\s*(?:cliente|lead|contato)\s*:\s*(.+)$/iu,
      )

    if (customerMatch) {
      hasRoleLabels = true
      customerMessages.push(
        customerMatch[1].trim(),
      )
      continue
    }

    const consultantMatch =
      line.match(
        /^\s*(?:consultor|vendedor|eu|rafael)\s*:\s*(.+)$/iu,
      )

    if (consultantMatch) {
      hasRoleLabels = true
      consultantMessages.push(
        consultantMatch[1].trim(),
      )
    }
  }

  return {
    customerMessages,
    consultantMessages,
    hasRoleLabels,
  }
}

function extractLastContactDate(
  value: string,
): string | null {
  const matches =
    Array.from(
      value.matchAll(
        /\b([0-3]?\d)[./-]([01]?\d)[./-](\d{2}|\d{4})\b/gu,
      ),
    )

  const match =
    matches.at(-1)

  if (!match) {
    return null
  }

  const day =
    match[1].padStart(2, "0")
  const month =
    match[2].padStart(2, "0")
  const year =
    match[3].length === 2
      ? `20${match[3]}`
      : match[3]

  return `${day}/${month}/${year}`
}

function extractCustomerInterest(
  normalizedValue: string,
): string | null {
  const interests: Array<{
    fragments: readonly string[]
    label: string
  }> = [
    {
      fragments: [
        "corolla",
        "corola",
      ],
      label: "um Corolla",
    },
    {
      fragments: [
        "hilux",
      ],
      label: "uma Hilux",
    },
    {
      fragments: [
        "civic",
      ],
      label: "um Civic",
    },
    {
      fragments: [
        "onix",
      ],
      label: "um Onix",
    },
    {
      fragments: [
        "compass",
      ],
      label: "um Compass",
    },
    {
      fragments: [
        "renegade",
      ],
      label: "um Renegade",
    },
    {
      fragments: [
        "tracker",
      ],
      label: "um Tracker",
    },
    {
      fragments: [
        "creta",
      ],
      label: "um Creta",
    },
    {
      fragments: [
        "toro",
      ],
      label: "uma Toro",
    },
    {
      fragments: [
        "hb20",
      ],
      label: "um HB20",
    },
    {
      fragments: [
        "automovel",
      ],
      label: "um automóvel",
    },
    {
      fragments: [
        "veiculo",
      ],
      label: "um veículo",
    },
    {
      fragments: [
        "carro",
      ],
      label: "um carro",
    },
    {
      fragments: [
        "moto",
      ],
      label: "uma moto",
    },
    {
      fragments: [
        "caminhao",
      ],
      label: "um caminhão",
    },
    {
      fragments: [
        "apartamento",
      ],
      label: "um apartamento",
    },
    {
      fragments: [
        "casa",
      ],
      label: "uma casa",
    },
    {
      fragments: [
        "terreno",
      ],
      label: "um terreno",
    },
    {
      fragments: [
        "imovel",
      ],
      label: "um imóvel",
    },
  ]

  return (
    interests.find(
      ({ fragments }) =>
        containsAny(
          normalizedValue,
          fragments,
        ),
    )?.label ??
    null
  )
}

function extractConsultantAction(
  normalizedValue: string,
  consultantMessages: string[],
): string | null {
  const consultantText =
    normalizeForSignal(
      consultantMessages.join(" "),
    )

  const actionSource =
    consultantText ||
    normalizedValue

  if (
    containsAny(actionSource, [
      "tentei marcar uma reuniao",
      "tentei marca uma reuniao",
      "tentei agendar uma reuniao",
      "tentei agendar",
      "convidei para uma reuniao",
      "convidei pra uma reuniao",
      "propus uma reuniao",
      "marcar uma reuniao",
      "marca uma reuniao",
    ])
  ) {
    return "tentativa de agendar uma reunião"
  }

  if (
    containsAny(actionSource, [
      "enviei uma proposta",
      "mandei uma proposta",
      "apresentei uma proposta",
    ])
  ) {
    return "proposta enviada"
  }

  if (
    containsAny(actionSource, [
      "enviei os valores",
      "mandei os valores",
      "passei os valores",
      "enviei uma simulacao",
      "mandei uma simulacao",
    ])
  ) {
    return "condição ou simulação enviada"
  }

  return null
}

function buildStoppedReplyingAnalysis(
  normalizedValue: string,
  originalValue: string,
  consultantMessages: string[],
): ManualWhatsAppAnalysis {
  const customerInterest =
    extractCustomerInterest(
      normalizedValue,
    )
  const previousConsultantAction =
    extractConsultantAction(
      normalizedValue,
      consultantMessages,
    )
  const lastContactDate =
    extractLastContactDate(
      originalValue,
    )

  const summaryParts: string[] = []

  if (customerInterest) {
    summaryParts.push(
      `O cliente buscava ${customerInterest}.`,
    )
  }

  if (previousConsultantAction) {
    summaryParts.push(
      `O último movimento do consultor foi uma ${previousConsultantAction}.`,
    )
  }

  summaryParts.push(
    lastContactDate
      ? `O cliente não respondeu mais depois do contato de ${lastContactDate}.`
      : "O cliente não respondeu mais e a conversa ficou interrompida.",
  )

  return {
    intent:
      "stopped_replying",
    stage:
      "follow_up",
    label:
      "Conversa interrompida sem resposta",
    summary:
      summaryParts.join(" "),
    recommendedAction:
      customerInterest
        ? `Retome pelo interesse em ${customerInterest}, confirme se o projeto continua ativo e só depois proponha uma reunião.`
        : "Retome pelo último objetivo conhecido, confirme se o projeto continua ativo e só depois proponha uma reunião.",
    context: {
      customerInterest,
      previousConsultantAction,
      customerResponseState:
        "stopped_replying",
      lastContactDate,
    },
  }
}

function buildNoPreviousResponseAnalysis(
  normalizedValue: string,
  originalValue: string,
  consultantMessages: string[],
): ManualWhatsAppAnalysis {
  const customerInterest =
    extractCustomerInterest(
      normalizedValue,
    )
  const previousConsultantAction =
    extractConsultantAction(
      normalizedValue,
      consultantMessages,
    )
  const lastContactDate =
    extractLastContactDate(
      originalValue,
    )

  return {
    intent:
      "no_previous_response",
    stage:
      "opening",
    label:
      "Cliente ainda não respondeu",
    summary:
      customerInterest
        ? `O histórico informa interesse em ${customerInterest}, mas o cliente ainda não respondeu às tentativas de contato. Não existe uma conversa anterior para continuar.`
        : "O histórico informado mostra tentativas anteriores sem resposta do cliente. Não existe uma conversa anterior para continuar.",
    recommendedAction:
      customerInterest
        ? `Faça uma nova abertura curta usando o interesse em ${customerInterest}, sem fingir continuidade, e busque a primeira resposta.`
        : "Faça uma nova abertura curta, sem fingir continuidade, e busque a primeira resposta.",
    context: {
      customerInterest,
      previousConsultantAction,
      customerResponseState:
        "never_replied",
      lastContactDate,
    },
  }
}


function hasProjectRejection(
  normalizedCustomerMessage: string,
): boolean {
  return containsAny(
    normalizedCustomerMessage,
    [
      "nao quero continuar",
      "nao vou continuar",
      "nao continuo interessado",
      "nao continuo interessada",
      "nao esta mais nos meus planos",
      "nao esta mais nos nossos planos",
      "nao continua de pe",
      "desisti do projeto",
      "desisti do consorcio",
      "nao quero dar inicio",
      "nao pretendo dar inicio",
    ],
  )
}

function extractDeferredTimingHint(
  normalizedCustomerMessage: string,
): ManualWhatsAppContext[
  "projectTimingHint"
] {
  if (
    containsAny(
      normalizedCustomerMessage,
      [
        "ano que vem",
        "proximo ano",
      ],
    )
  ) {
    return "next_year"
  }

  if (
    containsAny(
      normalizedCustomerMessage,
      [
        "mes que vem",
        "proximo mes",
      ],
    )
  ) {
    return "next_month"
  }

  return null
}

function isProjectActiveWithDeferredTiming(
  normalizedCustomerMessage: string,
): boolean {
  if (
    hasProjectRejection(
      normalizedCustomerMessage,
    )
  ) {
    return false
  }

  const hasActiveProjectSignal =
    containsAny(
      normalizedCustomerMessage,
      [
        "planejamento do consorcio",
        "planejando o consorcio",
        "me planejando para o consorcio",
        "quero dar inicio",
        "vou dar inicio",
        "pretendo dar inicio",
        "quero comecar o consorcio",
        "vou comecar o consorcio",
        "pretendo comecar o consorcio",
        "quero seguir com o consorcio",
        "ainda quero fazer o consorcio",
      ],
    )

  const hasDeferredTimingSignal =
    containsAny(
      normalizedCustomerMessage,
      [
        "preciso me organizar",
        "so preciso me organizar",
        "me organizar com as contas",
        "organizar as contas",
        "organizar minhas contas",
        "o que eu tenho a pagar",
        "quando as coisas ficarem melhor",
        "quando as coisas vao ficar melhor",
        "quando melhorar",
        "assim que melhorar",
        "quando estiver mais tranquilo",
        "quando estiver mais tranquila",
        "mais pra frente",
        "ano que vem",
        "proximo ano",
        "mes que vem",
        "proximo mes",
      ],
    )

  return (
    hasActiveProjectSignal &&
    hasDeferredTimingSignal
  )
}

function isProjectActiveConfirmation(
  normalizedCustomerMessage: string,
): boolean {
  const comparableMessage =
    normalizedCustomerMessage
      .replace(
        /[^\p{L}\p{N}\s]/gu,
        " ",
      )
      .replace(/\s+/gu, " ")
      .trim()

  if (
    hasProjectRejection(
      comparableMessage,
    )
  ) {
    return false
  }

  if (
    [
      "sim continua",
      "continua sim",
      "sim esta de pe",
      "sim ainda esta de pe",
    ].includes(
      comparableMessage,
    )
  ) {
    return true
  }

  return containsAny(
    comparableMessage,
    [
      "meus planos continuam de pe",
      "meu plano continua de pe",
      "nossos planos continuam de pe",
      "o projeto continua de pe",
      "projeto continua de pe",
      "continua nos meus planos",
      "continua nos nossos planos",
      "ainda esta nos meus planos",
      "ainda esta nos nossos planos",
      "ainda quero seguir",
      "quero continuar com o projeto",
      "continuo interessado",
      "continuo interessada",
    ],
  )
}


function buildProjectActiveDeferredAnalysis(
  normalizedCustomerMessage: string,
): ManualWhatsAppAnalysis {
  return {
    intent:
      "interested",
    stage:
      "follow_up",
    label:
      "Projeto ativo com início adiado",
    summary:
      "O cliente mantém o projeto, mas precisa organizar as finanças antes de iniciar.",
    recommendedAction:
      "Reconheça o momento financeiro, não pergunte novamente se o projeto está de pé e combine um acompanhamento com permissão, sem pressionar.",
    context: {
      customerInterest:
        extractCustomerInterest(
          normalizedCustomerMessage,
        ),
      previousConsultantAction:
        null,
      customerResponseState:
        null,
      lastContactDate:
        null,
      projectActiveConfirmed:
        true,
      projectTimingDeferred:
        true,
      projectTimingHint:
        extractDeferredTimingHint(
          normalizedCustomerMessage,
        ),
    },
  }
}

function buildProjectActiveConfirmationAnalysis(
  normalizedCustomerMessage: string,
): ManualWhatsAppAnalysis {
  return {
    intent:
      "interested",
    stage:
      "diagnosis",
    label:
      "Projeto continua ativo",
    summary:
      "O cliente confirmou que o projeto continua ativo.",
    recommendedAction:
      "Reconheça a confirmação e avance para prazo, prioridade ou mudança de contexto sem perguntar novamente se o projeto está de pé.",
    context: {
      customerInterest:
        extractCustomerInterest(
          normalizedCustomerMessage,
        ),
      previousConsultantAction:
        null,
      customerResponseState:
        null,
      lastContactDate:
        null,
      projectActiveConfirmed:
        true,
    },
  }
}

export function analyzeManualWhatsAppMessage(
  incomingMessage: string,
  options: AnalyzeManualWhatsAppMessageOptions = {},
): ManualWhatsAppAnalysis | null {
  const normalizedFullMessage =
    normalizeForSignal(
      incomingMessage,
    )

  if (!normalizedFullMessage) {
    return null
  }

  const roleMessages =
    extractRoleMessages(
      incomingMessage,
    )

  const normalizedCustomerMessage =
    normalizeForSignal(
      roleMessages.customerMessages.join(" "),
    )

  const messageForCustomerSignals =
    roleMessages.hasRoleLabels
      ? normalizedCustomerMessage
      : normalizedFullMessage

  if (
    options.approachType ===
      "reactivation" &&
    containsAny(
      normalizedFullMessage,
      [
        "nao respondeu mais",
        "nao me respondeu mais",
        "ele nao respondeu mais",
        "ela nao respondeu mais",
        "parou de responder",
        "deixou de responder",
        "nao voltou a responder",
        "nao tive mais resposta",
        "sem resposta desde",
        "sumiu depois",
      ],
    )
  ) {
    return buildStoppedReplyingAnalysis(
      normalizedFullMessage,
      incomingMessage,
      roleMessages.consultantMessages,
    )
  }

  if (
    options.approachType ===
      "reactivation" &&
    !roleMessages.hasRoleLabels &&
    containsAny(
      normalizedFullMessage,
      [
        "cliente nunca me respondeu",
        "cliente nao me respondeu",
        "cliente nunca respondeu",
        "cliente nao respondeu",
        "ele nunca me respondeu",
        "ela nunca me respondeu",
        "nunca me respondeu",
        "nao me respondeu",
        "nunca recebi resposta",
        "nao recebi resposta",
        "nao tive resposta",
        "sem resposta do cliente",
      ],
    )
  ) {
    return buildNoPreviousResponseAnalysis(
      normalizedFullMessage,
      incomingMessage,
      roleMessages.consultantMessages,
    )
  }

  if (
    containsAny(
      messageForCustomerSignals,
      [
        "nao tenho interesse",
        "nao quero",
        "sem interesse",
        "nao faz sentido",
        "pare de mandar",
        "nao me chama",
      ],
    )
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
    containsAny(
      messageForCustomerSignals,
      [
        "me chama depois",
        "fala comigo depois",
        "retorna depois",
        "pode retornar",
        "mais tarde",
        "outro dia",
        "agora nao posso",
        "estou ocupado",
        "estou ocupada",
      ],
    )
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
    containsAny(
      messageForCustomerSignals,
      [
        "pode marcar",
        "vamos marcar",
        "marca uma reuniao",
        "podemos conversar",
        "pode me ligar",
        "vamos fazer uma reuniao",
        "qual horario",
      ],
    )
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
    containsAny(
      messageForCustomerSignals,
      [
        "qual valor",
        "quanto fica",
        "qual parcela",
        "valor da parcela",
        "preco",
        "taxa",
        "lance",
        "contemplacao",
      ],
    )
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
    options.approachType ===
      "reactivation" &&
    isProjectActiveWithDeferredTiming(
      messageForCustomerSignals,
    )
  ) {
    return buildProjectActiveDeferredAnalysis(
      messageForCustomerSignals,
    )
  }

  if (
    options.approachType ===
      "reactivation" &&
    isProjectActiveConfirmation(
      messageForCustomerSignals,
    )
  ) {
    return buildProjectActiveConfirmationAnalysis(
      messageForCustomerSignals,
    )
  }

  if (
    containsAny(
      messageForCustomerSignals,
      [
        "imovel",
        "apartamento",
        "casa",
        "terreno",
        "veiculo",
        "automovel",
        "carro",
        "moto",
        "caminhao",
        "investimento",
        "investir",
        "corolla",
        "corola",
      ],
    )
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
    containsAny(
      messageForCustomerSignals,
      [
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
      ],
    )
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
      roleMessages.hasRoleLabels
        ? "As falas do cliente não apresentam informação suficiente para avançar com segurança."
        : "A mensagem não apresenta informação suficiente para avançar com segurança.",
    recommendedAction:
      "Use uma pergunta curta e contextual para descobrir o momento atual do contato.",
  }
}
