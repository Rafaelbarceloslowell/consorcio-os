export type ProposalListItem = {
  id: string
  code: string
  contactName: string
  consultantName: string
  administratorName: string
  consortiumName: string
  creditValueLabel: string
  installmentValueLabel: string
  termMonths: number
  status: string
  statusLabel: string
  validUntilLabel: string
  createdAtLabel: string
  rejectionReason: string | null
  opportunityHref: string | null
  clientId: string | null
}

export type ProposalListView = {
  proposals: ProposalListItem[]
}

export type ProposalCreateFormView = {
  leads: Array<{
    id: string
    name: string
    desiredCreditValue: string
    desiredTermMonths: number
  }>
  consortiums: Array<{
    id: string
    label: string
    defaultTermMonths: number
    administrationFeePercent: string
    reserveFundPercent: string
    minCreditValue: string
    maxCreditValue: string
  }>
}

export type ProposalCreateValues = {
  leadId: string
  consortiumId: string
  creditValue: string
  installmentValue: string
  termMonths: string
  administrationFeePercent: string
  reserveFundPercent: string
  validUntil: string
  notes: string
}

export type ProposalCreateFieldErrors = Partial<
  Record<
    keyof ProposalCreateValues,
    string
  >
>

export type ProposalCreateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values: ProposalCreateValues
      fieldErrors?: ProposalCreateFieldErrors
    }
