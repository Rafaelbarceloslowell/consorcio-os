import type {
    AutomationExecution,
    AutomationJob,
    AutomationQueue,
  } from "@/engine/decision/automation"
  
  import type {
    CommercialStrategy,
  } from "@/engine/decision/strategy/types"
  
  export type SaveDecisionAutomationStateInput = {
    strategy: CommercialStrategy | null
  
    queue: AutomationQueue
  }
  
  export type SaveDecisionAutomationStateResult = {
    strategy: CommercialStrategy | null
  
    queue: AutomationQueue
  }
  
  export interface DecisionAutomationRepository {
    getStrategiesByJourneyId(
      journeyId: string,
    ): CommercialStrategy[]
  
    getStrategyById(
      strategyId: string,
    ): CommercialStrategy | undefined
  
    getActiveStrategyByJourneyId(
      journeyId: string,
    ): CommercialStrategy | undefined
  
    createStrategy(
      strategy: CommercialStrategy,
    ): CommercialStrategy
  
    updateStrategy(
      strategy: CommercialStrategy,
    ): CommercialStrategy
  
    getAutomationJobsByJourneyId(
      journeyId: string,
    ): AutomationJob[]
  
    getAutomationJobById(
      automationJobId: string,
    ): AutomationJob | undefined
  
    createAutomationJob(
      automationJob: AutomationJob,
    ): AutomationJob
  
    updateAutomationJob(
      automationJob: AutomationJob,
    ): AutomationJob
  
    getAutomationExecutionsByJourneyId(
      journeyId: string,
    ): AutomationExecution[]
  
    getAutomationExecutionById(
      automationExecutionId: string,
    ): AutomationExecution | undefined
  
    createAutomationExecution(
      automationExecution: AutomationExecution,
    ): AutomationExecution
  
    getAutomationQueueByJourneyId(
      journeyId: string,
    ): AutomationQueue
  
    saveDecisionAutomationState(
      input: SaveDecisionAutomationStateInput,
    ): SaveDecisionAutomationStateResult
  }