import type {
  ManualWhatsAppAnalysis,
} from "./analyze-manual-whatsapp-message"

import type {
  ConversationApproachType,
} from "./conversation/conversation-stage"

export type R2CommercialTechniqueId =
  | "seals_commercial_script"
  | "rapport"
  | "aida"
  | "spin"
  | "ethical_fomo"
  | "objection_handling"
  | "social_proof"
  | "value_building"
  | "price_anchoring"
  | "next_step_closing"
  | "diagnostic_selling"
  | "gap_selling"
  | "challenger_sale"
  | "sandler_selling"
  | "bant"
  | "gpct"
  | "storytelling"
  | "three_options"
  | "decision_maker_qualification"
  | "cost_of_inaction"
  | "consultative_closing"

export type R2CommercialTechniqueDefinition = {
  id: R2CommercialTechniqueId
  label: string
  purpose: string
  guardrail: string
}

export const R2_COMMERCIAL_TECHNIQUE_LIBRARY:
  readonly R2CommercialTechniqueDefinition[] = [
    {
      id: "seals_commercial_script",
      label: "Script Comercial da Seal’s",
      purpose:
        "Preservar a sequência, a linguagem e a estratégia comercial oficial da Seal’s.",
      guardrail:
        "É a base do motor. Nenhuma técnica externa pode descaracterizar o processo aprovado pela empresa.",
    },
    {
      id: "rapport",
      label: "Rapport",
      purpose:
        "Criar conexão por meio de linguagem, ritmo e contexto adequados ao cliente.",
      guardrail:
        "Não imitar artificialmente o cliente nem usar intimidade que ainda não existe.",
    },
    {
      id: "aida",
      label: "AIDA",
      purpose:
        "Organizar atenção, interesse, desejo e ação em aberturas, reativações e follow-ups.",
      guardrail:
        "A ação final deve ser simples e coerente com o estágio atual da conversa.",
    },
    {
      id: "spin",
      label: "SPIN Selling",
      purpose:
        "Investigar situação, problema, implicação e necessidade antes de apresentar solução.",
      guardrail:
        "Distribuir as perguntas naturalmente, sem transformar a conversa em interrogatório.",
    },
    {
      id: "ethical_fomo",
      label: "FOMO ético",
      purpose:
        "Mostrar consequências reais da demora quando elas estiverem confirmadas no contexto.",
      guardrail:
        "Nunca inventar prazo, promoção, escassez, contemplação ou urgência.",
    },
    {
      id: "objection_handling",
      label: "Tratamento de objeções",
      purpose:
        "Acolher, investigar, responder, confirmar e avançar após identificar a objeção real.",
      guardrail:
        "Não combater a objeção nem baixar preço antes de entender a trava verdadeira.",
    },
    {
      id: "social_proof",
      label: "Prova social",
      purpose:
        "Usar casos reais e semelhantes da Seal’s para reduzir insegurança.",
      guardrail:
        "Perguntar ao consultor, validar existência e autorização e nunca apresentar o caso como garantia.",
    },
    {
      id: "value_building",
      label: "Construção de valor",
      purpose:
        "Conectar o consórcio ao objetivo, ao patrimônio e ao resultado desejado pelo cliente.",
      guardrail:
        "Construir valor antes de prender a conversa apenas em parcela ou preço.",
    },
    {
      id: "price_anchoring",
      label: "Ancoragem de preço",
      purpose:
        "Dar referências honestas para o cliente comparar esforço, prazo e alternativas.",
      guardrail:
        "Expor taxas, reajustes, prazo e ausência de garantia de contemplação imediata.",
    },
    {
      id: "next_step_closing",
      label: "Fechamento de próximo passo",
      purpose:
        "Encerrar cada conversa relevante com uma ação clara, data, horário ou compromisso.",
      guardrail:
        "Não pressionar o cliente a assumir um passo maior do que a maturidade da conversa permite.",
    },
    {
      id: "diagnostic_selling",
      label: "Venda por diagnóstico",
      purpose:
        "Entender objetivo, prazo, capacidade, obstáculos e decisores antes da recomendação.",
      guardrail:
        "Não prescrever solução com informações insuficientes.",
    },
    {
      id: "gap_selling",
      label: "Gap Selling",
      purpose:
        "Evidenciar a distância entre o estado atual e o resultado desejado.",
      guardrail:
        "Não exagerar dor nem criar consequências que o cliente não confirmou.",
    },
    {
      id: "challenger_sale",
      label: "Challenger Sale",
      purpose:
        "Ensinar uma visão nova, personalizar a análise e conduzir a decisão com segurança.",
      guardrail:
        "Desafiar crenças, nunca diminuir ou constranger o cliente.",
    },
    {
      id: "sandler_selling",
      label: "Sandler Selling",
      purpose:
        "Criar acordos claros, qualificar compromisso e evitar perseguição comercial.",
      guardrail:
        "Manter transparência e permitir que ambas as partes concluam que a solução não serve.",
    },
    {
      id: "bant",
      label: "BANT",
      purpose:
        "Qualificar orçamento, autoridade, necessidade e prazo.",
      guardrail:
        "Usar como mapa interno, não como questionário rígido.",
    },
    {
      id: "gpct",
      label: "GPCT",
      purpose:
        "Entender objetivos, planos, desafios e prazo do cliente.",
      guardrail:
        "Priorizar perguntas conectadas ao que o cliente acabou de dizer.",
    },
    {
      id: "storytelling",
      label: "Storytelling",
      purpose:
        "Tornar a estratégia concreta por meio de histórias reais e semelhantes.",
      guardrail:
        "Nunca inventar cliente, resultado, contemplação, valor ou depoimento.",
    },
    {
      id: "three_options",
      label: "Técnica das três opções",
      purpose:
        "Apresentar caminhos conservador, equilibrado e acelerado com recomendação profissional.",
      guardrail:
        "Não criar opção-isca nem esconder diferença relevante entre os cenários.",
    },
    {
      id: "decision_maker_qualification",
      label: "Qualificação de decisores",
      purpose:
        "Identificar quem participa da decisão e incluir essa pessoa no momento certo.",
      guardrail:
        "Não desautorizar o contato atual nem usar o decisor como pressão.",
    },
    {
      id: "cost_of_inaction",
      label: "Custo da inércia",
      purpose:
        "Quantificar ou explicar o impacto real de continuar parado.",
      guardrail:
        "Usar somente dados e consequências confirmados.",
    },
    {
      id: "consultative_closing",
      label: "Fechamento consultivo",
      purpose:
        "Conduzir uma decisão segura e compatível com o diagnóstico realizado.",
      guardrail:
        "O objetivo é clareza e avanço, não pressão ou urgência artificial.",
    },
  ]

export type R2SocialProofDirective = {
  shouldAskConsultant: boolean
  prompt: string | null
  rule: string
}

export type R2CommercialPlaybookRecommendation = {
  foundation: "seals_commercial_script"
  primaryTechnique: R2CommercialTechniqueId
  supportingTechniques:
    readonly R2CommercialTechniqueId[]
  closingTechnique: "next_step_closing"
  objective: string
  rationale: string
  consultantInstruction: string
  avoid: readonly string[]
  socialProof: R2SocialProofDirective
}

export type BuildR2CommercialPlaybookRecommendationInput = {
  approachType: ConversationApproachType
  analysis: ManualWhatsAppAnalysis
}

const SOCIAL_PROOF_RULE =
  "A prova social só pode ser usada depois que o consultor confirmar um caso real, semelhante e autorizado da Seal’s."

function buildSocialProofDirective(
  shouldAskConsultant: boolean,
): R2SocialProofDirective {
  return {
    shouldAskConsultant,
    prompt:
      shouldAskConsultant
        ? "Pergunte ao consultor: existe no histórico da Seal’s algum caso real, semelhante e autorizado que ajude este cliente, sem prometer o mesmo resultado?"
        : null,
    rule:
      SOCIAL_PROOF_RULE,
  }
}

function buildRecommendation({
  primaryTechnique,
  supportingTechniques,
  objective,
  rationale,
  consultantInstruction,
  avoid,
  shouldAskConsultantForSocialProof = false,
}: Omit<
  R2CommercialPlaybookRecommendation,
  | "foundation"
  | "closingTechnique"
  | "socialProof"
> & {
  shouldAskConsultantForSocialProof?: boolean
}): R2CommercialPlaybookRecommendation {
  return {
    foundation:
      "seals_commercial_script",
    primaryTechnique,
    supportingTechniques,
    closingTechnique:
      "next_step_closing",
    objective,
    rationale,
    consultantInstruction,
    avoid,
    socialProof:
      buildSocialProofDirective(
        shouldAskConsultantForSocialProof,
      ),
  }
}

export function formatR2CommercialTechnique(
  id: R2CommercialTechniqueId,
): string {
  return (
    R2_COMMERCIAL_TECHNIQUE_LIBRARY.find(
      (technique) =>
        technique.id === id,
    )?.label ??
    id
  )
}

export function buildR2CommercialPlaybookRecommendation({
  approachType,
  analysis,
}: BuildR2CommercialPlaybookRecommendationInput): R2CommercialPlaybookRecommendation {
  if (
    analysis.context
      ?.projectTimingDeferred
  ) {
    return buildRecommendation({
      primaryTechnique:
        "rapport",
      supportingTechniques: [
        "spin",
        "gpct",
        "diagnostic_selling",
        "consultative_closing",
      ],
      objective:
        "Entender o horizonte de organização financeira e combinar acompanhamento com permissão.",
      rationale:
        "O cliente deixou claro que o projeto continua ativo, mas adiou o início para organizar as contas.",
      consultantInstruction:
        "Reconheça o momento, respeite o adiamento e faça uma única pergunta para combinar quando ou como retomar o contato.",
      avoid: [
        "Perguntar novamente se o projeto continua ativo.",
        "Tratar a organização financeira como falta de interesse.",
        "Pressionar por proposta, orçamento ou reunião.",
      ],
    })
  }

  if (
    analysis.context
      ?.projectActiveConfirmed
  ) {
    return buildRecommendation({
      primaryTechnique:
        "spin",
      supportingTechniques: [
        "rapport",
        "gpct",
        "diagnostic_selling",
      ],
      objective:
        "Entender prazo, prioridade e cenário atual sem repetir a confirmação do projeto.",
      rationale:
        "O cliente já confirmou que o projeto continua ativo; a próxima decisão deve aprofundar o momento de realização.",
      consultantInstruction:
        "Reconheça a confirmação e faça uma única pergunta sobre prazo ou prioridade antes de avançar para orçamento, proposta ou reunião.",
      avoid: [
        "Perguntar novamente se o projeto continua ativo.",
        "Ignorar a confirmação do cliente.",
        "Pular diretamente para proposta ou reunião.",
      ],
    })
  }

  if (
    analysis.stage ===
    "strategy"
  ) {
    return buildRecommendation({
      primaryTechnique:
        "gap_selling",
      supportingTechniques: [
        "challenger_sale",
        "value_building",
        "three_options",
        "storytelling",
        "social_proof",
        "decision_maker_qualification",
      ],
      objective:
        "Transformar o diagnóstico em uma estratégia clara e comparável.",
      rationale:
        "O cliente já avançou além da descoberta e precisa compreender caminhos, diferenças e recomendação profissional.",
      consultantInstruction:
        "Apresente cenários coerentes, recomende um deles e confirme o próximo passo sem transformar caso real em promessa.",
      avoid: [
        "Apresentar opções sem recomendação.",
        "Usar prova social não validada.",
        "Prometer contemplação ou resultado.",
      ],
      shouldAskConsultantForSocialProof:
        true,
    })
  }

  switch (analysis.intent) {
    case "no_previous_response":
      return buildRecommendation({
        primaryTechnique:
          "aida",
        supportingTechniques: [
          "rapport",
          "diagnostic_selling",
        ],
        objective:
          "Conseguir a primeira resposta sem fingir continuidade.",
        rationale:
          "O cliente nunca respondeu; portanto a abordagem precisa gerar abertura antes de diagnóstico, proposta ou reunião.",
        consultantInstruction:
          "Faça uma abertura curta, contextualize apenas o que é conhecido e termine com uma pergunta simples.",
        avoid: [
          "Fingir que já existiu conversa.",
          "Enviar tabela ou proposta.",
          "Pular direto para reunião.",
        ],
      })

    case "stopped_replying":
      return buildRecommendation({
        primaryTechnique:
          "rapport",
        supportingTechniques: [
          "aida",
          "ethical_fomo",
          "cost_of_inaction",
        ],
        objective:
          "Atualizar o momento do cliente e recuperar a conversa pelo último contexto real.",
        rationale:
          "Existe histórico, mas o cliente interrompeu a conversa; primeiro é necessário confirmar se o projeto continua ativo.",
        consultantInstruction:
          "Retome pelo objetivo conhecido. Use FOMO ético apenas se houver consequência real confirmada e só proponha reunião depois da resposta.",
        avoid: [
          "Mensagem genérica de reativação.",
          "Urgência inventada.",
          "Repetir a tentativa anterior sem atualizar o contexto.",
        ],
      })

    case "not_interested":
      return buildRecommendation({
        primaryTechnique:
          "objection_handling",
        supportingTechniques: [
          "rapport",
          "sandler_selling",
          "diagnostic_selling",
        ],
        objective:
          "Entender a razão real sem desrespeitar a decisão do cliente.",
        rationale:
          "A prioridade é acolher e esclarecer se mudou a necessidade, o momento ou a percepção de valor.",
        consultantInstruction:
          "Faça uma única pergunta respeitosa, aceite a resposta e encerre quando não houver abertura.",
        avoid: [
          "Pressionar.",
          "Usar FOMO.",
          "Discutir com a objeção.",
        ],
      })

    case "callback_requested":
      return buildRecommendation({
        primaryTechnique:
          "next_step_closing",
        supportingTechniques: [
          "rapport",
          "sandler_selling",
        ],
        objective:
          "Transformar o pedido de retorno em compromisso específico.",
        rationale:
          "O cliente pediu outro momento; o avanço correto é definir dia e horário antes de encerrar.",
        consultantInstruction:
          "Ofereça ou confirme um horário objetivo e registre o combinado.",
        avoid: [
          "Responder apenas que está à disposição.",
          "Retornar sem horário combinado.",
        ],
      })

    case "meeting_interest":
      return buildRecommendation({
        primaryTechnique:
          "consultative_closing",
        supportingTechniques: [
          "next_step_closing",
          "rapport",
          "decision_maker_qualification",
          "social_proof",
        ],
        objective:
          "Confirmar a reunião e preparar um briefing útil para o consultor.",
        rationale:
          "O cliente já demonstrou abertura; insistir em descoberta longa por mensagem pode atrasar o avanço.",
        consultantInstruction:
          "Defina horário e formato, confirme quem participa da decisão e consulte se existe prova social real para a preparação da reunião.",
        avoid: [
          "Continuar qualificando indefinidamente por mensagem.",
          "Usar caso da Seal’s sem confirmação.",
        ],
        shouldAskConsultantForSocialProof:
          true,
      })

    case "pricing_question":
      return buildRecommendation({
        primaryTechnique:
          "spin",
        supportingTechniques: [
          "diagnostic_selling",
          "value_building",
          "price_anchoring",
          "bant",
          "gpct",
          "social_proof",
        ],
        objective:
          "Descobrir objetivo, valor, prazo e capacidade antes de apresentar condição.",
        rationale:
          "A pergunta de preço ainda não oferece informações suficientes para uma recomendação responsável.",
        consultantInstruction:
          "Não envie parcela isolada. Faça perguntas curtas, construa valor e use ancoragem somente com comparação transparente.",
        avoid: [
          "Tabela extensa.",
          "Parcela sem contexto.",
          "Omitir taxa, reajuste ou prazo.",
          "Usar prova social sem validar com o consultor.",
        ],
        shouldAskConsultantForSocialProof:
          true,
      })

    case "interest_area":
      return buildRecommendation({
        primaryTechnique:
          "spin",
        supportingTechniques: [
          "rapport",
          "diagnostic_selling",
          "gpct",
          "gap_selling",
        ],
        objective:
          "Entender a finalidade e o momento do projeto.",
        rationale:
          "A área de interesse já apareceu, mas ainda falta saber por que, quando e para qual resultado o cliente quer avançar.",
        consultantInstruction:
          "Aprofunde uma informação por vez e conecte a próxima pergunta ao que o cliente acabou de dizer.",
        avoid: [
          "Apresentar produto cedo demais.",
          "Fazer várias perguntas na mesma mensagem.",
        ],
      })

    case "interested":
      return buildRecommendation({
        primaryTechnique:
          "rapport",
        supportingTechniques: [
          "spin",
          "aida",
          "diagnostic_selling",
          "value_building",
        ],
        objective:
          approachType ===
          "reactivation"
            ? "Atualizar o contexto e descobrir o que mudou."
            : "Transformar interesse inicial em diagnóstico comercial.",
        rationale:
          approachType ===
          "reactivation"
            ? "A resposta positiva não prova que o contexto antigo continua igual."
            : "O cliente abriu espaço para conversar, mas ainda não há base para uma proposta.",
        consultantInstruction:
          approachType ===
          "reactivation"
            ? "Confirme o objetivo atual antes de continuar o fluxo anterior."
            : "Faça uma pergunta curta sobre prioridade, finalidade ou momento.",
        avoid: [
          "Assumir necessidade.",
          "Antecipar proposta.",
        ],
      })

    case "needs_review":
      return buildRecommendation({
        primaryTechnique:
          "diagnostic_selling",
        supportingTechniques: [
          "rapport",
          "spin",
          "sandler_selling",
        ],
        objective:
          "Obter informação suficiente para classificar o momento comercial.",
        rationale:
          "O contexto atual não permite escolher uma estratégia segura.",
        consultantInstruction:
          "Use uma pergunta curta e contextual. Quando for reativação, peça as últimas mensagens ou um resumo antes de sugerir nova abordagem.",
        avoid: [
          "Inventar contexto.",
          "Mandar mensagem aleatória.",
          "Apresentar preço ou reunião sem base.",
        ],
      })
  }
}
