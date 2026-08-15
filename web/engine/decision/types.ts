import type {
    NextBestAction,
  } from "@/types/domain"
  
  import type {
    EnrichedCommercialContext,
  } from "./context"
  
  import type {
    CommercialStrategy,
  } from "./strategy/types"

  import type {
    R2EvidenceDecisionContext,
  } from "@/application/r2/evidence/types"

  import type {
    R2CustomerBoundaryContext,
  } from "@/application/r2/boundary"
  
  export type DecisionEngineInput = {
    context: EnrichedCommercialContext

    evidenceContext?:
      R2EvidenceDecisionContext

    customerBoundaryContext?:
      R2CustomerBoundaryContext
  }
  
  export type DecisionEngineOutput = {
    nextBestActions: NextBestAction[]
  
    strategy: CommercialStrategy | null
  
    diagnostics: string[]
  
    warnings: string[]

    evidenceContext?:
      R2EvidenceDecisionContext

    customerBoundaryContext?:
      R2CustomerBoundaryContext
  }
