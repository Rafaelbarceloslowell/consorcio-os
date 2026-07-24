import type { Address, EntityId, PersonType, Timestamps } from "./common"

export type ClientStatus = "active" | "inactive" | "blocked"

export type Client = {
  id: EntityId
  type: PersonType
  name: string
  email: string
  phone: string
  document: string
  birthDate?: string
  companyName?: string
  tradeName?: string
  stateRegistration?: string
  address: Address
  consultantId: EntityId
  leadId?: EntityId
  status: ClientStatus
  tags: string[]
  notes?: string
} & Timestamps
