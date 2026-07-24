import type { EntityId, Timestamps } from "./common"

export type ProposalStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"

export type Proposal = {
  id: EntityId

  code: string

  clientId?: EntityId

  leadId?: EntityId

  consultantId: EntityId

  consortiumId: EntityId

  creditValue: number

  installmentValue: number

  termMonths: number

  administrationFeePercent: number

  reserveFundPercent: number

  status: ProposalStatus

  sentAt?: string

  validUntil: string

  acceptedAt?: string

  rejectedAt?: string

  rejectionReason?: string

  notes?: string
} & Timestamps