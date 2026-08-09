export type LeadListClassification =
  | "ACTIVE"
  | "REACTIVATED"
  | "UNTRIAGED"

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
  canTriage: boolean
}

export type LeadListView = {
  summaryLabel: string
  leads: LeadListItemView[]
  pagination: {
    page: number
    totalPages: number
    totalCount: number
    previousHref: string | null
    nextHref: string | null
  }
}
