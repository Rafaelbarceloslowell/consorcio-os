export type EntityId = string

export type PersonType =
  | "individual"
  | "company"

export type ConsortiumType =
  | "real_estate"
  | "vehicle"
  | "heavy_vehicle"
  | "services"
  | "other"

export type Address = {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export type Timestamps = {
  createdAt: string
  updatedAt: string
}