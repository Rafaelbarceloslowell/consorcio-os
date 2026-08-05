import type {
  ClientStatus,
  EntityId,
  PersonType,
} from "@/types/domain"

export type ClientDetailsAddressView = {
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export type ClientDetailsView = {
  id: EntityId
  name: string
  type: PersonType
  email: string
  phone: string
  document: string
  birthDate: string | null
  companyName: string | null
  tradeName: string | null
  stateRegistration: string | null
  address: ClientDetailsAddressView
  consultantId: EntityId
  consultantName: string
  status: ClientStatus
  createdAt: string
  updatedAt: string
}
