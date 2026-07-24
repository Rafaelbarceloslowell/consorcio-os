import type {
    CommercialActorType,
    CommercialEvent,
    CommercialEventType,
    CommercialJourney,
    EntityId,
    JourneyPhase,
    JourneyState,
    WorkflowRule,
    WorkflowRuleAction,
  } from "@/types/domain"
  
  export type WorkflowTransitionOrigin =
    | "MANUAL"
    | "RULE"
    | "SYSTEM"
    | "COMMERCIAL_EVENT"
  
  export type WorkflowValidationErrorCode =
    | "JOURNEY_NOT_IN_WORKSPACE"
    | "SOURCE_STATE_NOT_FOUND"
    | "TARGET_STATE_NOT_FOUND"
    | "SOURCE_PHASE_NOT_FOUND"
    | "TARGET_PHASE_NOT_FOUND"
    | "TARGET_STATE_INACTIVE"
    | "TARGET_PHASE_INACTIVE"
    | "SAME_STATE"
    | "JOURNEY_ALREADY_CLOSED"
    | "REOPEN_NOT_ALLOWED"
    | "WORKSPACE_MISMATCH"
    | "VERSION_CONFLICT"
  
  export type WorkflowValidationError = {
    code: WorkflowValidationErrorCode
  
    message: string
  }
  
  export type WorkflowTransitionContext = {
    journey: CommercialJourney
  
    phases: JourneyPhase[]
  
    states: JourneyState[]
  
    rules: WorkflowRule[]
  
    targetStateId: EntityId
  
    origin: WorkflowTransitionOrigin
  
    actorType: CommercialActorType
  
    actorId: EntityId | null
  
    now: Date
  
    eventType?: CommercialEventType
  
    payload?: Record<string, unknown>
  
    expectedVersion?: number
  }
  
  export type ValidateWorkflowTransitionInput =
    WorkflowTransitionContext
  
  export type ValidateWorkflowTransitionOutput = {
    allowed: boolean
  
    sourceState: JourneyState | null
  
    targetState: JourneyState | null
  
    sourcePhase: JourneyPhase | null
  
    targetPhase: JourneyPhase | null
  
    matchedRules: WorkflowRule[]
  
    errors: WorkflowValidationError[]
  
    warnings: string[]
  
    diagnostics: string[]
  }
  
  export type CreateStateChangedEventInput = {
    journey: CommercialJourney
  
    sourceState: JourneyState
  
    targetState: JourneyState
  
    sourcePhase: JourneyPhase
  
    targetPhase: JourneyPhase
  
    actorType: CommercialActorType
  
    actorId: EntityId | null
  
    origin: WorkflowTransitionOrigin
  
    now: Date
  
    payload?: Record<string, unknown>
  }
  
  export type ExecuteWorkflowTransitionInput = {
    validation: ValidateWorkflowTransitionOutput
  
    journey: CommercialJourney
  
    actorType: CommercialActorType
  
    actorId: EntityId | null
  
    origin: WorkflowTransitionOrigin
  
    now: Date
  
    payload?: Record<string, unknown>
  }
  
  export type ExecuteWorkflowTransitionOutput = {
    journey: CommercialJourney
  
    previousJourney: CommercialJourney
  
    event: CommercialEvent | null
  
    matchedRules: WorkflowRule[]
  
    requestedActions: WorkflowRuleAction[]
  
    changed: boolean
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type EvaluateWorkflowRulesInput = {
    journey: CommercialJourney
  
    sourceState: JourneyState
  
    targetState: JourneyState
  
    eventType?: CommercialEventType
  
    rules: WorkflowRule[]
  
    payload: Record<string, unknown>
  }
  
  export type EvaluateWorkflowRulesOutput = {
    matchedRules: WorkflowRule[]
  
    actions: WorkflowRuleAction[]
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  export type WorkflowEngineInput =
    WorkflowTransitionContext
  
  export type WorkflowEngineOutput = {
    journey: CommercialJourney
  
    previousJourney: CommercialJourney
  
    event: CommercialEvent | null
  
    validation: ValidateWorkflowTransitionOutput
  
    matchedRules: WorkflowRule[]
  
    requestedActions: WorkflowRuleAction[]
  
    changed: boolean
  
    diagnostics: string[]
  
    warnings: string[]
  }