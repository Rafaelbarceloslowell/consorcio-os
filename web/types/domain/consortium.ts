import type { ConsortiumType, EntityId, Timestamps } from "./common"

export type ConsortiumStatus = "forming" | "active" | "closed"

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
} & Timestamps
