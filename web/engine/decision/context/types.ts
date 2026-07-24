import type {
    Client,
    CommercialAction,
    CommercialEvent,
    CommercialJourney,
    JourneyPhase,
    JourneyState,
    Lead,
    NextBestAction,
    WorkflowRule,
  } from "@/types/domain"
  
  export type CommercialContext = {
    now: Date
  
    journey: CommercialJourney
  
    lead: Lead | null
  
    client: Client | null
  
    phase: JourneyPhase | null
  
    state: JourneyState | null
  
    events: CommercialEvent[]
  
    workflowRules: WorkflowRule[]
  
    actions: CommercialAction[]
  
    recommendations: NextBestAction[]
  }
  
  export type BuildCommercialContextInput = {
    now: Date
  
    journey: CommercialJourney
  
    lead: Lead | null
  
    client: Client | null
  
    phase: JourneyPhase | null
  
    state: JourneyState | null
  
    events: CommercialEvent[]
  
    workflowRules: WorkflowRule[]
  
    actions: CommercialAction[]
  
    recommendations: NextBestAction[]
  }