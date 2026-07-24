import type {
    CommercialActionType,
    CommercialJourney,
    EntityId,
    NextBestAction,
    NextBestActionPriority,
    Timestamps,
  } from "@/types/domain"
  
  export type CommercialStrategyType =
    | "INITIAL_CONTACT"
    | "QUALIFICATION"
    | "NURTURE"
    | "MEETING_CONVERSION"
    | "NEGOTIATION"
    | "RECOVERY"
    | "CLOSING"
    | "POST_SALE"
    | "RETENTION"
  
  export type CommercialStrategyStatus =
    | "PLANNED"
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
  
  export type CommercialStrategySource =
    | "RULE_ENGINE"
    | "AI"
    | "SYSTEM"
    | "CONSULTANT"
  
  export type StrategyStepStatus =
    | "PENDING"
    | "READY"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "SKIPPED"
    | "FAILED"
    | "CANCELLED"
  
  export type StrategyStepChannel =
    | "WHATSAPP"
    | "PHONE"
    | "EMAIL"
    | "MEETING"
    | "INTERNAL"
    | "AUTOMATION"
    | "OTHER"
  
  export type StrategyStep = {
    id: EntityId
  
    strategyId: EntityId
  
    position: number
  
    title: string
  
    description?: string
  
    actionType: CommercialActionType
  
    channel: StrategyStepChannel
  
    status: StrategyStepStatus
  
    priority: NextBestActionPriority
  
    waitBeforeMinutes: number
  
    scheduledFor: string | null
  
    startedAt: string | null
  
    completedAt: string | null
  
    failedAt: string | null
  
    failureReason: string | null
  
    sourceRecommendationId: EntityId | null
  
    payload: Record<string, unknown>
  }
  
  export type CommercialStrategy = {
    id: EntityId
  
    workspaceId: EntityId
  
    journeyId: EntityId
  
    type: CommercialStrategyType
  
    status: CommercialStrategyStatus
  
    source: CommercialStrategySource
  
    title: string
  
    objective: string
  
    reason: string
  
    priority: NextBestActionPriority
  
    confidence: number
  
    steps: StrategyStep[]
  
    maxAttempts: number
  
    currentAttempt: number
  
    currentStepPosition: number | null
  
    stopOnResponse: boolean
  
    stopOnJourneyClosed: boolean
  
    expiresAt: string | null
  
    startedAt: string | null
  
    pausedAt: string | null
  
    completedAt: string | null
  
    cancelledAt: string | null
  } & Timestamps
  
  export type StrategyDefinition = {
    type: CommercialStrategyType
  
    title: string
  
    objective: string
  
    description: string
  
    defaultPriority: NextBestActionPriority
  
    defaultConfidence: number
  
    maxAttempts: number
  
    stopOnResponse: boolean
  
    stopOnJourneyClosed: boolean
  }
  
  export type StrategyEngineInput = {
    journey: CommercialJourney
  
    recommendations: NextBestAction[]
  
    now: Date
  }
  
  export type StrategyEngineOutput = {
    strategy: CommercialStrategy | null
  
    diagnostics: string[]
  
    warnings: string[]
  }