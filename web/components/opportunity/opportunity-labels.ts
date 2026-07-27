import type {
  CommercialJourneyOutcome,
  CommercialJourneyPriority,
  ConsortiumType,
} from "@/types/domain"

export const OPPORTUNITY_PRIORITY_LABELS:
  Record<
    CommercialJourneyPriority,
    string
  > = {
    LOW: "Baixa",
    NORMAL: "Normal",
    HIGH: "Alta",
    URGENT: "Urgente",
  }

export const OPPORTUNITY_CONSORTIUM_LABELS:
  Record<ConsortiumType, string> = {
    real_estate: "Imóvel",
    vehicle: "Veículo",
    heavy_vehicle:
      "Veículo pesado",
    services: "Serviços",
    other: "Outro",
  }

export const OPPORTUNITY_OUTCOME_LABELS:
  Record<
    CommercialJourneyOutcome,
    string
  > = {
    WON: "Venda concluída",
    LOST_TO_COMPETITOR:
      "Perdida para concorrente",
    NO_FINANCIAL_CAPACITY:
      "Sem capacidade financeira",
    NO_RESPONSE: "Sem resposta",
    POSTPONED: "Adiada",
    PRODUCT_NOT_SUITABLE:
      "Produto inadequado",
    TRUST_CONCERN:
      "Questão de confiança",
    CLIENT_WITHDREW:
      "Cliente desistiu",
    CANCELLED_BY_CONSULTANT:
      "Cancelada pelo consultor",
    OTHER: "Outro motivo",
  }
