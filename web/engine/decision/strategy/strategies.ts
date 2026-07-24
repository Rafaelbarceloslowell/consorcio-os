import type {
    CommercialStrategyType,
    StrategyDefinition,
  } from "./types"
  
  export const strategyDefinitions: Record<
    CommercialStrategyType,
    StrategyDefinition
  > = {
    INITIAL_CONTACT: {
      type: "INITIAL_CONTACT",
      title: "Primeiro contato",
      objective: "Iniciar a conversa e obter a primeira resposta do lead.",
      description:
        "Estratégia usada para abordar novos leads e validar se existe interesse real em continuar o atendimento.",
      defaultPriority: "HIGH",
      defaultConfidence: 0.9,
      maxAttempts: 4,
      stopOnResponse: true,
      stopOnJourneyClosed: true,
    },
  
    QUALIFICATION: {
      type: "QUALIFICATION",
      title: "Qualificação comercial",
      objective:
        "Entender o perfil, o objetivo, a capacidade financeira e o momento de compra do lead.",
      description:
        "Estratégia usada para reunir as informações necessárias antes de avançar para uma reunião ou proposta.",
      defaultPriority: "HIGH",
      defaultConfidence: 0.88,
      maxAttempts: 5,
      stopOnResponse: false,
      stopOnJourneyClosed: true,
    },
  
    NURTURE: {
      type: "NURTURE",
      title: "Nutrição do lead",
      objective:
        "Manter o relacionamento ativo até que o lead esteja pronto para avançar.",
      description:
        "Estratégia usada para leads com interesse, mas que ainda não estão no momento ideal de decisão.",
      defaultPriority: "NORMAL",
      defaultConfidence: 0.8,
      maxAttempts: 8,
      stopOnResponse: false,
      stopOnJourneyClosed: true,
    },
  
    MEETING_CONVERSION: {
      type: "MEETING_CONVERSION",
      title: "Conversão para reunião",
      objective:
        "Transformar o interesse do lead em uma reunião comercial agendada.",
      description:
        "Estratégia usada quando já existe interesse suficiente para apresentar uma solução de forma mais aprofundada.",
      defaultPriority: "HIGH",
      defaultConfidence: 0.87,
      maxAttempts: 4,
      stopOnResponse: false,
      stopOnJourneyClosed: true,
    },
  
    NEGOTIATION: {
      type: "NEGOTIATION",
      title: "Condução da negociação",
      objective:
        "Avançar a oportunidade comercial até uma decisão clara do lead.",
      description:
        "Estratégia usada após a apresentação da solução, quando existem dúvidas, objeções ou condições a alinhar.",
      defaultPriority: "HIGH",
      defaultConfidence: 0.86,
      maxAttempts: 6,
      stopOnResponse: false,
      stopOnJourneyClosed: true,
    },
  
    RECOVERY: {
      type: "RECOVERY",
      title: "Recuperação de oportunidade",
      objective:
        "Retomar uma oportunidade com potencial que perdeu ritmo ou ficou sem resposta.",
      description:
        "Estratégia usada para reativar leads ou negociações relevantes que ficaram inativos por um período.",
      defaultPriority: "HIGH",
      defaultConfidence: 0.9,
      maxAttempts: 4,
      stopOnResponse: true,
      stopOnJourneyClosed: true,
    },
  
    CLOSING: {
      type: "CLOSING",
      title: "Fechamento comercial",
      objective:
        "Conduzir a oportunidade até a confirmação da venda ou encerramento da negociação.",
      description:
        "Estratégia usada quando o lead já compreendeu a solução e está próximo de tomar a decisão final.",
      defaultPriority: "URGENT",
      defaultConfidence: 0.92,
      maxAttempts: 4,
      stopOnResponse: false,
      stopOnJourneyClosed: true,
    },
  
    POST_SALE: {
      type: "POST_SALE",
      title: "Pós-venda",
      objective:
        "Garantir uma transição segura entre a venda concluída e o início do relacionamento como cliente.",
      description:
        "Estratégia usada após a venda para orientar o cliente, confirmar próximos passos e reduzir insegurança.",
      defaultPriority: "HIGH",
      defaultConfidence: 0.95,
      maxAttempts: 6,
      stopOnResponse: false,
      stopOnJourneyClosed: false,
    },
  
    RETENTION: {
      type: "RETENTION",
      title: "Retenção do cliente",
      objective:
        "Reduzir o risco de cancelamento e preservar o relacionamento comercial.",
      description:
        "Estratégia usada quando existem sinais de insatisfação, dúvida, atraso, intenção de cancelamento ou perda de confiança.",
      defaultPriority: "URGENT",
      defaultConfidence: 0.93,
      maxAttempts: 5,
      stopOnResponse: false,
      stopOnJourneyClosed: false,
    },
  }
  
  export function getStrategyDefinition(
    strategyType: CommercialStrategyType,
  ): StrategyDefinition {
    return strategyDefinitions[strategyType]
  }
  
  export function listStrategyDefinitions(): StrategyDefinition[] {
    return Object.values(strategyDefinitions)
  }