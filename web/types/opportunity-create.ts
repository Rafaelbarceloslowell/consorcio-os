export type OpportunityCreateFormView = {
  clients: Array<{
    id: string
    name: string
  }>
}

export type OpportunityCreateActionValues = {
  clientId: string
  title: string
  consortiumType: string
  priority: string
  score: string
}

export type OpportunityCreateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values: OpportunityCreateActionValues
      fieldErrors?: {
        clientId?: string
        title?: string
        consortiumType?: string
        priority?: string
        score?: string
      }
    }
