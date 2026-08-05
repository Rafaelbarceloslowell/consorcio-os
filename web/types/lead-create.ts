export type LeadCreateFormView = {
  consultants: Array<{
    id: string
    name: string
  }>
}

export type LeadCreateActionValues = {
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
}

export type LeadCreateActionFieldErrors = Partial<
  Record<
    keyof LeadCreateActionValues,
    string
  >
>

export type LeadCreateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values: LeadCreateActionValues
      fieldErrors?: LeadCreateActionFieldErrors
    }
