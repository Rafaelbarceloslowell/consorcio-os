import type { ConsortiumType, EntityId, Timestamps } from "./common"

export type ConsortiumStatus = "forming" | "active" | "closed"

export type ConsortiumRuleStatus =
  | "verified"
  | "stale"
  | "unverified"

export type ConsortiumRuleSource =
  | "manual_verified"
  | "official_document"
  | "official_api"
  | "operator_verified"

export type Consortium = {
  id: EntityId
  name: string
  administrator: string
  type: ConsortiumType
  groupNumber: string
  minCreditValue: number
  maxCreditValue: number
  defaultTermMonths: number
  administrationFeePercent: number
  reserveFundPercent: number
  totalQuotas: number
  availableQuotas: number
  status: ConsortiumStatus
  description?: string
  ruleStatus?: ConsortiumRuleStatus
  ruleSource?: ConsortiumRuleSource
  sourceReference?: string
  verifiedAt?: string
  effectiveFrom?: string
  effectiveUntil?: string
  ruleVersion?: number
  minInstallmentValue?: number
  maxInstallmentValue?: number
  embeddedBidAllowed?: boolean
} & Timestamps
