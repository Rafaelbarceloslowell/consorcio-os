import type {
  R2ExpressionChannel,
  R2EyeTarget,
  R2RuntimeState,
  R2Viseme,
} from "@/types/r2-full-character-runtime"

export const R2_EVENT_TYPES = [
  "lead.received", "lead.created", "lead.qualified", "lead.disqualified", "lead.no_response", "lead.replied", "lead.converted", "lead.action_required", "lead.at_risk",
  "client.created", "opportunity.created", "opportunity.updated", "opportunity.stage_changed", "opportunity.stagnant", "opportunity.at_risk", "opportunity.won", "opportunity.lost", "opportunity.note_added",
  "meeting.scheduled", "meeting.upcoming", "meeting.started", "meeting.completed", "meeting.cancelled", "meeting.summary_missing", "meeting.follow_up_pending",
  "proposal.prepared", "proposal.review_ready", "proposal.sent", "proposal.viewed", "proposal.accepted", "proposal.rejected", "proposal.expired",
  "sale.started", "sale.documentation_requested", "sale.documentation_received", "sale.payment_confirmed", "sale.awaiting_documentation", "sale.completed", "sale.cancelled", "sale.pending", "sale.celebration_ready",
  "task.created", "task.due_soon", "task.overdue", "task.completed", "automation.started", "automation.completed", "automation.failed", "workflow.blocked", "queue.failed", "integration.unavailable",
  "intelligence.analysis_started", "intelligence.analysis_completed", "intelligence.recommendation_ready", "intelligence.next_best_action_ready", "intelligence.confirmation_required", "intelligence.recommendation_accepted", "intelligence.recommendation_rejected", "intelligence.insufficient_context", "intelligence.provider_error",
  "runtime.speaking_requested", "runtime.neutral_requested",
] as const

export type R2EventType =
  (typeof R2_EVENT_TYPES)[number]

export type R2EventSource =
  | "commercial_event"
  | "automation_trigger"
  | "dashboard"
  | "user"
  | "system"
  | "integration"
  | "intelligence_provider"

export type R2EntityType =
  | "lead"
  | "client"
  | "opportunity"
  | "meeting"
  | "proposal"
  | "sale"
  | "task"
  | "automation"
  | "workflow"
  | "integration"
  | "recommendation"
  | "system"

export type R2Urgency =
  | "background"
  | "normal"
  | "attention"
  | "high"
  | "critical"
  | "celebration"

export const R2_PRIORITIES = [
  "BACKGROUND",
  "NORMAL",
  "ATTENTION",
  "CELEBRATION",
  "HIGH",
  "CRITICAL",
] as const

export type R2Priority =
  (typeof R2_PRIORITIES)[number]

export type R2InterruptionPolicy =
  | "NEVER"
  | "HIGHER_PRIORITY"
  | "ALERT_OR_CRITICAL"
  | "ALWAYS"

export type R2EventMetadata = Readonly<{
  schema?: string
  traceId?: string
  sourceVersion?: string
  tags?: readonly string[]
}>

export type R2DomainEvent = Readonly<{
  eventId: string
  eventType: R2EventType
  occurredAt: string
  workspaceId: string
  actorId: string | null
  userId: string | null
  entityType: R2EntityType
  entityId: string | null
  correlationId: string | null
  causationId: string | null
  source: R2EventSource
  payload: Readonly<Record<string, unknown>>
  metadata: R2EventMetadata
  urgency: R2Urgency
  expiresAt: string | null
  schemaVersion: 1
}>

export type R2EventContext = Readonly<{
  workspaceId: string
  userId: string | null
  currentRuntimeState: R2RuntimeState
  lastStableRuntimeState: R2RuntimeState
  resolvedAt: string
  availableInformation: readonly string[]
  missingInformation: readonly string[]
  entitySnapshot: Readonly<Record<string, unknown>>
}>

export type R2IntelligenceOperation =
  | "summarize_context"
  | "classify_urgency"
  | "generate_recommendation"
  | "choose_next_best_action"
  | "prepare_short_message"
  | "explain_decision"

export type R2IntelligenceRequest = Readonly<{
  requestId: string
  operation: R2IntelligenceOperation
  event: R2DomainEvent
  context: R2EventContext
}>

export type R2Recommendation = Readonly<{
  recommendationType: string
  title: string
  summary: string
  rationale: string
  confidence: number
  urgency: R2Urgency
  suggestedActions: readonly Readonly<{
    actionId: string
    label: string
    requiresConfirmation: boolean
  }>[]
  missingInformation: readonly string[]
  expiresAt: string | null
}>

export type R2PresentationHints = Readonly<{
  runtimeState: R2RuntimeState
  expression?: R2ExpressionChannel
  expressionIntensity?: number
  viseme?: R2Viseme
  speakingIntensity?: number
  eyeTarget?: R2EyeTarget
  durationMs: number
  minimumDisplayMs: number
  transitionMs: number
  interruptionPolicy: R2InterruptionPolicy
  fallbackState: R2RuntimeState
}>

export type R2IntelligenceResult = Readonly<{
  result: "REACT" | "IGNORE" | "REQUEST_CONTEXT"
  recommendation: R2Recommendation | null
  confidence: number
  urgency: R2Urgency
  reasons: readonly R2DecisionReason[]
  missingInformation: readonly string[]
  presentationHints: R2PresentationHints | null
  expiresAt: string | null
}>

export interface R2IntelligencePort {
  readonly provider: string
  evaluate(
    request: R2IntelligenceRequest,
  ): Promise<R2IntelligenceResult>
}

export type R2DecisionReason =
  | "EVENT_ACCEPTED"
  | "EVENT_DUPLICATE"
  | "EVENT_EXPIRED"
  | "WORKSPACE_MISMATCH"
  | "USER_MISMATCH"
  | "COOLDOWN_ACTIVE"
  | "DEBOUNCED"
  | "LOWER_PRIORITY"
  | "QUEUE_FULL"
  | "INTERRUPTED_CURRENT"
  | "QUEUED_FOR_LATER"
  | "NO_REACTION_REQUIRED"
  | "INSUFFICIENT_CONTEXT"
  | "INTELLIGENCE_FAILURE"
  | "RUNTIME_FAILURE"
  | "FALLBACK_APPLIED"
  | "PRESENTATION_COMPLETED"
  | "CONFIRMATION_REQUIRED"

export type R2PresentationPlan = Readonly<{
  planId: string
  eventId: string
  workspaceId: string
  runtimeState: R2RuntimeState
  expression?: R2ExpressionChannel
  expressionIntensity?: number
  viseme?: R2Viseme
  speakingIntensity?: number
  eyeTarget?: R2EyeTarget
  durationMs: number
  minimumDisplayMs: number
  transitionMs: number
  interruptibility: R2InterruptionPolicy
  priority: R2Priority
  message: string | null
  actionLabel: string | null
  actionId: string | null
  expiresAt: string | null
  fallbackState: R2RuntimeState
  requiresConfirmation: boolean
}>

export type R2RuntimeCommand = Readonly<{
  commandId: string
  eventId: string
  workspaceId: string
  runtimeState: R2RuntimeState
  expression?: R2ExpressionChannel
  expressionIntensity?: number
  viseme?: R2Viseme
  speakingIntensity?: number
  eyeTarget?: R2EyeTarget
  durationMs: number
  minimumDisplayMs: number
  transitionMs: number
  priority: R2Priority
  message: string | null
  actionLabel: string | null
  actionId: string | null
  expiresAt: string | null
  fallbackState: R2RuntimeState
  requiresConfirmation: boolean
}>

export type R2OrchestrationDecisionType =
  | "EXECUTE"
  | "INTERRUPT"
  | "QUEUE"
  | "DISCARD"
  | "REJECT"
  | "IGNORE"
  | "FALLBACK"
  | "FAIL"

export type R2OrchestrationDecision = Readonly<{
  decisionId: string
  decision: R2OrchestrationDecisionType
  eventId: string
  eventType: R2EventType
  workspaceId: string
  reason: R2DecisionReason
  priority: R2Priority
  runtimeState: R2RuntimeState | null
  command: R2RuntimeCommand | null
  interruptedEventId: string | null
  discardedReason: string | null
  decidedAt: string
}>

export type R2ExecutionReceipt = Readonly<{
  receiptId: string
  commandId: string
  eventId: string
  workspaceId: string
  status: "APPLIED" | "COMPLETED" | "INTERRUPTED" | "FAILED" | "SKIPPED"
  runtimeState: R2RuntimeState
  startedAt: string
  completedAt: string | null
  durationMs: number | null
  interruptedBy: string | null
  fallbackUsed: boolean
  errorCode: string | null
}>

export type R2OrchestrationErrorCode =
  | "INVALID_EVENT"
  | "WORKSPACE_MISMATCH"
  | "USER_MISMATCH"
  | "INTELLIGENCE_FAILED"
  | "INVALID_PRESENTATION"
  | "RUNTIME_DISPOSED"
  | "RUNTIME_COMMAND_FAILED"

export class R2OrchestrationError extends Error {
  constructor(
    readonly code: R2OrchestrationErrorCode,
    message: string,
    readonly recoverable: boolean,
  ) {
    super(message)
    this.name = "R2OrchestrationError"
  }
}

export type R2QueuedPresentation = Readonly<{
  event: R2DomainEvent
  plan: R2PresentationPlan
  command: R2RuntimeCommand
  queuedAt: string
}>

export type R2ActivePresentation = Readonly<{
  event: R2DomainEvent
  plan: R2PresentationPlan
  command: R2RuntimeCommand
  startedAt: string
  minimumUntil: string
  completesAt: string
}>

export type R2InterruptionRecord = Readonly<{
  interruptedEventId: string
  interruptedByEventId: string
  occurredAt: string
  fromState: R2RuntimeState
  toState: R2RuntimeState
}>

export type R2FailureRecord = Readonly<{
  eventId: string
  commandId: string | null
  errorCode: R2OrchestrationErrorCode
  occurredAt: string
}>

export type R2OrchestrationState = Readonly<{
  workspaceId: string
  current: R2ActivePresentation | null
  queue: readonly R2QueuedPresentation[]
  lastStableState: R2RuntimeState
  processedEventIds: readonly string[]
  cooldowns: Readonly<Record<string, string>>
  interruptions: readonly R2InterruptionRecord[]
  receipts: readonly R2ExecutionReceipt[]
  failures: readonly R2FailureRecord[]
}>

export type R2ObservabilityEntry = Readonly<{
  eventId: string
  eventType: R2EventType
  decision: R2OrchestrationDecisionType
  reason: R2DecisionReason
  priority: R2Priority
  runtimeState: R2RuntimeState | null
  startedAt: string
  completedAt: string | null
  durationMs: number | null
  interruptedBy: string | null
  discardedReason: string | null
  fallbackUsed: boolean
  errorCode: string | null
}>

export interface R2ObservabilitySink {
  record(entry: R2ObservabilityEntry): void
}
