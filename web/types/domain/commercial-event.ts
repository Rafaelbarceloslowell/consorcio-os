import type { EntityId, Timestamps } from "./common"
import type { CommercialActorType } from "./commercial-actor"

export type CommercialEventType =
  | "LEAD_CREATED"
  | "OPPORTUNITY_CREATED"
  | "LEAD_REPLIED"
  | "MEETING_SCHEDULED"
  | "MEETING_COMPLETED"
  | "PROPOSAL_SENT"
  | "PROPOSAL_ACCEPTED"
  | "DOCUMENT_REQUESTED"
  | "DOCUMENT_RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "SALE_COMPLETED"
  | "STATE_CHANGED"
  | "NOTE_ADDED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"

export type CommercialEvent = {
  /** Identificador único do evento */
  id: EntityId

  /** Workspace proprietário do evento */
  workspaceId: EntityId

  /** Jornada comercial à qual o evento pertence */
  journeyId: EntityId

  /** Tipo do fato comercial registrado */
  type: CommercialEventType

  /** Tipo de ator responsável pelo evento */
  actorType: CommercialActorType

  /** Identificador do ator, quando existir */
  actorId: EntityId | null

  /**
   * Dados adicionais específicos do evento.
   *
   * Quando não houver dados adicionais, deve ser um objeto vazio.
   */
  payload: Record<string, unknown>

  /**
   * Momento real em que o fato aconteceu.
   *
   * Pode ser anterior ao createdAt quando o evento for
   * registrado posteriormente por uma integração.
   */
  occurredAt: string
} & Timestamps
