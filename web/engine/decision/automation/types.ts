import type {
    CommercialAction,
    CommercialActionType,
    CommercialJourney,
    EntityId,
    NextBestActionPriority,
    Timestamps,
  } from "@/types/domain"
  
  import type {
    CommercialStrategy,
    StrategyStep,
    StrategyStepChannel,
  } from "../strategy/types"
  
  export type AutomationJobStatus =
    | "PENDING"
    | "READY"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "SKIPPED"
  
  export type AutomationJobSource =
    | "STRATEGY_STEP"
    | "WORKFLOW_RULE"
    | "SYSTEM"
    | "MANUAL"
  
  export type AutomationExecutionStatus =
    | "SUCCEEDED"
    | "FAILED"
    | "RETRY_SCHEDULED"
    | "SKIPPED"
    | "CANCELLED"
  
  export type AutomationTriggerType =
    | "SCHEDULED_TIME"
    | "COMMERCIAL_EVENT"
    | "JOURNEY_STATE_CHANGED"
    | "LEAD_RESPONDED"
    | "MANUAL"
    | "SYSTEM"
  
  export type AutomationJob = {
    id: EntityId
  
    workspaceId: EntityId
  
    journeyId: EntityId
  
    strategyId: EntityId | null
  
    strategyStepId: EntityId | null
  
    source: AutomationJobSource
  
    actionType: CommercialActionType
  
    channel: StrategyStepChannel
  
    title: string
  
    description?: string
  
    status: AutomationJobStatus
  
    priority: NextBestActionPriority
  
    scheduledFor: string
  
    availableAt: string
  
    startedAt: string | null
  
    completedAt: string | null
  
    failedAt: string | null
  
    cancelledAt: string | null
  
    attemptCount: number
  
    maxAttempts: number
  
    lastFailureReason: string | null
  
    payload: Record<string, unknown>
  
    createdActionId: EntityId | null
  } & Timestamps
  
  export type AutomationExecution = {
    id: EntityId
  
    automationJobId: EntityId
  
    workspaceId: EntityId
  
    journeyId: EntityId
  
    attempt: number
  
    status: AutomationExecutionStatus
  
    startedAt: string
  
    finishedAt: string
  
    failureReason: string | null
  
    createdActionId: EntityId | null
  
    output: Record<string, unknown>
  }
  
  export type AutomationQueue = {
    jobs: AutomationJob[]
  
    executions: AutomationExecution[]
  }
  
  export type CreateAutomationJobInput = {
    strategy: CommercialStrategy
  
    step: StrategyStep
  
    journey: CommercialJourney
  
    now: Date
  }
  
  export type EnqueueAutomationJobsInput = {
    queue: AutomationQueue
  
    jobs: AutomationJob[]
  }
  
  export type EnqueueAutomationJobsOutput = {
    queue: AutomationQueue
  
    enqueuedJobs: AutomationJob[]
  
    ignoredJobs: AutomationJob[]
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type GetReadyAutomationJobsInput = {
    queue: AutomationQueue
  
    now: Date
  
    limit?: number
  }
  
  export type CancelAutomationJobsInput = {
    queue: AutomationQueue
  
    journeyId: EntityId
  
    now: Date
  
    reason: string
  }
  
  export type CancelAutomationJobsOutput = {
    queue: AutomationQueue
  
    cancelledJobs: AutomationJob[]
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type ExecuteAutomationJobInput = {
    job: AutomationJob
  
    journey: CommercialJourney
  
    now: Date
  }
  
  export type AutomationActionFactoryInput = {
    job: AutomationJob
  
    journey: CommercialJourney
  
    now: Date
  }
  
  export type AutomationActionFactoryOutput = {
    action: CommercialAction | null
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type ExecuteAutomationJobOutput = {
    job: AutomationJob
  
    execution: AutomationExecution
  
    action: CommercialAction | null
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type ProcessAutomationQueueInput = {
    queue: AutomationQueue
  
    journeys: CommercialJourney[]
  
    now: Date
  
    limit?: number
  }
  
  export type ProcessAutomationQueueOutput = {
    queue: AutomationQueue
  
    processedJobs: AutomationJob[]
  
    createdActions: CommercialAction[]
  
    executions: AutomationExecution[]
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type AutomationTrigger = {
    id: EntityId
  
    workspaceId: EntityId
  
    journeyId: EntityId
  
    type: AutomationTriggerType
  
    occurredAt: string
  
    payload: Record<string, unknown>
  }
  
  export type HandleAutomationTriggerInput = {
    queue: AutomationQueue
  
    trigger: AutomationTrigger
  
    now: Date
  }
  
  export type HandleAutomationTriggerOutput = {
    queue: AutomationQueue
  
    affectedJobs: AutomationJob[]
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type AutomationEngineInput = {
    strategy: CommercialStrategy | null
  
    journey: CommercialJourney
  
    queue: AutomationQueue
  
    now: Date
  
    executionLimit?: number
  }
  
  export type AutomationEngineOutput = {
    strategy: CommercialStrategy | null
  
    queue: AutomationQueue
  
    scheduledJobs: AutomationJob[]
  
    processedJobs: AutomationJob[]
  
    createdActions: CommercialAction[]
  
    executions: AutomationExecution[]
  
    diagnostics: string[]
  
    warnings: string[]
  }