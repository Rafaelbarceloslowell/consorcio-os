import type {
  CommercialJourneyPriority,
} from "@/types/domain"

export type OpportunityUpdateFormView = {
  id: string
  title: string
  consultantId: string
  priority: CommercialJourneyPriority
  score: number
  consultants: Array<{
    id: string
    name: string
  }>
}

export type OpportunityUpdateActionValues = {
  title: string
  consultantId: string
  priority: string
  score: string
}

export type OpportunityUpdateActionState = {
  status: "idle"
  message: null
} | {
  status: "error"
  message: string
  values: OpportunityUpdateActionValues
  fieldErrors?: {
    title?: string
    consultantId?: string
    priority?: string
    score?: string
  }
}
