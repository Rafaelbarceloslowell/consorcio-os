import type {
    NextBestAction,
  } from "@/types/domain"
  
  import type {
    EnrichedCommercialContext,
  } from "./context"
  
  import type {
    CommercialStrategy,
  } from "./strategy/types"
  
  export type DecisionEngineInput = {
    context: EnrichedCommercialContext
  }
  
  export type DecisionEngineOutput = {
    nextBestActions: NextBestAction[]
  
    strategy: CommercialStrategy | null
  
    diagnostics: string[]
  
    warnings: string[]
  }