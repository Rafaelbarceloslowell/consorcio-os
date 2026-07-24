import type {
    CommercialJourney,
    NextBestAction,
    WorkflowRule,
  } from "@/types/domain"
  
  import type {
    JourneyDiagnostics,
  } from "../diagnostics"
  
  import type {
    TimelineAnalysis,
  } from "../timeline"
  
  export type GenerateRecommendationsInput = {
    journey: CommercialJourney
    timelineAnalysis: TimelineAnalysis
    journeyDiagnostics: JourneyDiagnostics
    workflowRules: WorkflowRule[]
    now: Date
  }
  
  export type RecommendationResult = {
    nextBestActions: NextBestAction[]
    diagnostics: string[]
    warnings: string[]
  }
  
  export type RecommendationRuleContext = {
    daysSinceLastInteraction: number | null
    score: number
    isClosed: boolean
  }