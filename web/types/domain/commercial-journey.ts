import type {
    ConsortiumType,
    EntityId,
    Timestamps,
  } from "./common"
  
  export type CommercialJourneyPriority =
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "URGENT"
  
  export type CommercialJourneyOutcome =
    | "WON"
    | "LOST_TO_COMPETITOR"
    | "NO_FINANCIAL_CAPACITY"
    | "NO_RESPONSE"
    | "POSTPONED"
    | "PRODUCT_NOT_SUITABLE"
    | "TRUST_CONCERN"
    | "CLIENT_WITHDREW"
    | "CANCELLED_BY_CONSULTANT"
    | "OTHER"
  
  /**
   * Representa uma oportunidade comercial.
   *
   * Não é o Lead.
   * Não é o Cliente.
   * Não é a Venda.
   *
   * É a jornada comercial completa de uma intenção de compra.
   */
  export type CommercialJourney = {
    /** Identificador único da jornada */
    id: EntityId
  
    /** Workspace proprietário da jornada */
    workspaceId: EntityId
  
    /** Lead que originou esta oportunidade, quando aplicável */
    leadId: EntityId | null
  
    /**
     * Cliente que originou ou foi vinculado à oportunidade.
     *
     * Ao menos leadId ou clientId deve estar preenchido.
     */
    clientId: EntityId | null
  
    /** Consultor responsável */
    consultantId: EntityId
  
    /** Nome amigável da oportunidade */
    title: string
  
    /** Tipo de consórcio */
    consortiumType: ConsortiumType
  
    /** Fase atual da jornada */
    currentPhaseId: EntityId
  
    /** Estado atual da jornada */
    currentStateId: EntityId
  
    /** Prioridade comercial */
    priority: CommercialJourneyPriority
  
    /**
     * Score da oportunidade.
     * Deve variar entre 0 e 100.
     */
    score: number
  
    /**
     * Resultado final da jornada.
     * Enquanto estiver em andamento permanece null.
     */
    outcome: CommercialJourneyOutcome | null
  
    /** Momento em que entrou no estado atual */
    stateEnteredAt: string
  
    /** Última interação registrada */
    lastInteractionAt: string | null
  
    /** Data de encerramento */
    closedAt: string | null
  
    /**
     * Controle de concorrência otimista.
     * Incrementado a cada alteração relevante.
     */
    version: number
  } & Timestamps
