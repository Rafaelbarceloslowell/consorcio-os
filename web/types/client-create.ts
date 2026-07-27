export type ClientCreateFormView = {
  consultants: Array<{
    id: string
    name: string
  }>
}

export type ClientCreateActionValues = {
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

export type ClientCreateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values: ClientCreateActionValues
      fieldErrors?: {
        type?: string
        name?: string
        companyName?: string
        email?: string
        phone?: string
        phoneCountryCode?: string
        document?: string
        consultantId?: string
        addressStreet?: string
        addressNumber?: string
        addressComplement?: string
        addressNeighborhood?: string
        addressCity?: string
        addressState?: string
        addressZipCode?: string
      }
    }
