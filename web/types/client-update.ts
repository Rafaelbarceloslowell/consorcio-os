export type ClientUpdateActionValues = {
  type: string
  name: string
  companyName: string
  email: string
  phone: string
  phoneCountryCode: string
  document: string
  consultantId: string
  addressStreet: string
  addressNumber: string
  addressComplement: string
  addressNeighborhood: string
  addressCity: string
  addressState: string
  addressZipCode: string
}

export type ClientUpdateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values:
        ClientUpdateActionValues
    }

export type ClientUpdateFormView =
  ClientUpdateActionValues & {
    id: string
    consultants: Array<{
      id: string
      name: string
    }>
  }
