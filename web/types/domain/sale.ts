import type { EntityId, Timestamps } from "./common"

export type SaleStatus =
  | "pending_signature"
  | "active"
  | "cancelled"

export type QuotaStatus =
  | "not_contemplated"
  | "contemplated"
  | "paid_off"
  | "cancelled"

export type PaymentMethod =
  | "bank_slip"
  | "direct_debit"
  | "credit_card"
  | "pix"

export type Sale = {
  id: EntityId

  contractNumber: string

  proposalId: EntityId

  clientId: EntityId

  consultantId: EntityId

  consortiumId: EntityId

  groupNumber: string

  quotaNumber: number

  creditValue: number

  installmentValue: number

  termMonths: number

  administrationFeePercent: number

  reserveFundPercent: number

  commissionValue: number

  commissionPercent: number

  status: SaleStatus

  quotaStatus: QuotaStatus

  paymentMethod: PaymentMethod

  saleDate: string

  firstInstallmentDate: string

  contemplatedAt?: string

  paidOffAt?: string

  cancelledAt?: string

  cancellationReason?: string

  notes?: string
} & Timestamps