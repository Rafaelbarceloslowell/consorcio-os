export type LeadListClassification =
  | "ACTIVE"
  | "REACTIVATED"

export type LeadListItemView = {
  id: string
  name: string
  email: string
  phoneLabel: string
  companyName: string | null
  sourceLabel: string
  statusLabel: string
  classification: LeadListClassification
  consortiumTypeLabel: string
  desiredCreditValueLabel: string
  desiredTermLabel: string
  consultantName: string
  pipelineStageName: string
  score: number
  entryLabel: string
  createdAtLabel: string
  opportunityHref: string | null
}

export type LeadListView = {
  summaryLabel: string
  leads: LeadListItemView[]
}
