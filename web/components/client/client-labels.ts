import type {
  ClientStatus,
  PersonType,
} from "@/types/domain"

export const CLIENT_PERSON_TYPE_LABELS:
  Record<PersonType, string> = {
    individual: "Pessoa física",
    company: "Pessoa jurídica",
  }

export const CLIENT_STATUS_LABELS:
  Record<ClientStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
    blocked: "Bloqueado",
  }
