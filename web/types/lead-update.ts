export type LeadUpdateActionValues = {
  name: string
  email: string
  phoneCountryCode: string
  phone: string
  document: string
  companyName: string
  source: string
  consortiumType: string
  desiredCreditValue: string
  desiredTermMonths: string
  consultantId: string
  notes: string
  returnTo: string
}

export type LeadUpdateActionFieldErrors = Partial<
  Record<
    keyof Omit<
      LeadUpdateActionValues,
      "returnTo"
    >,
    string
  >
>

export type LeadUpdateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values: LeadUpdateActionValues
      fieldErrors?:
        LeadUpdateActionFieldErrors
    }

export type LeadUpdateFormView =
  LeadUpdateActionValues & {
    id: string
    consultants: Array<{
      id: string
      name: string
    }>
  }
