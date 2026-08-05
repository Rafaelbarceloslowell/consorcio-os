import type {
  R2ActivePresentation,
  R2DecisionReason,
  R2DomainEvent,
  R2EventContext,
  R2ExecutionReceipt,
  R2FailureRecord,
  R2IntelligencePort,
  R2InterruptionRecord,
  R2ObservabilityEntry,
  R2ObservabilitySink,
  R2OrchestrationDecision,
  R2OrchestrationDecisionType,
  R2OrchestrationState,
  R2Priority,
  R2QueuedPresentation,
  R2RuntimeCommand,
} from "@/types/r2-intelligence-orchestration"
import type {
  R2RuntimeState,
} from "@/types/r2-full-character-runtime"
import {
  createR2PresentationPlan,
  createR2RuntimeCommand,
  priorityRank,
} from "./r2-presentation-planner"

export type R2OrchestratorConfig = Readonly<{
  workspaceId: string
  intelligence: R2IntelligencePort
  observability?: R2ObservabilitySink
  now?: () => Date
  queueLimit?: number
  processedEventTtlMs?: number
  defaultCooldownMs?: number
  cooldownMsByEventType?: Readonly<Record<string, number>>
  debounceMs?: number
  historyLimit?: number
}>

const NOOP_OBSERVABILITY: R2ObservabilitySink = {
  record: () => undefined,
}

const STABLE_STATES = new Set<R2RuntimeState>([
  "idle",
  "working",
  "listening",
  "thinking",
])

function validTime(value: string | null) {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function milliseconds(
  value: number | undefined,
  fallback: number,
) {
  return Number.isFinite(value) && value! >= 0
    ? value!
    : fallback
}

export class R2Orchestrator {
  readonly workspaceId: string

  private readonly intelligence: R2IntelligencePort
  private readonly observability: R2ObservabilitySink
  private readonly clock: () => Date
  private readonly queueLimit: number
  private readonly processedEventTtlMs: number
  private readonly defaultCooldownMs: number
  private readonly cooldownMsByEventType: Readonly<Record<string, number>>
  private readonly debounceMs: number
  private readonly historyLimit: number

  private current: R2ActivePresentation | null = null
  private queue: R2QueuedPresentation[] = []
  private lastStableState: R2RuntimeState = "idle"
  private readonly processed = new Map<string, number>()
  private readonly cooldowns = new Map<string, number>()
  private readonly recentEventType = new Map<string, number>()
  private interruptions: R2InterruptionRecord[] = []
  private receipts: R2ExecutionReceipt[] = []
  private failures: R2FailureRecord[] = []
  private sequence = 0
  private dispatchTail: Promise<void> = Promise.resolve()
  private disposed = false

  constructor(config: R2OrchestratorConfig) {
    const workspaceId = config.workspaceId.trim()
    if (!workspaceId) throw new Error("R2 orchestrator workspaceId is required.")
    this.workspaceId = workspaceId
    this.intelligence = config.intelligence
    this.observability = config.observability ?? NOOP_OBSERVABILITY
    this.clock = config.now ?? (() => new Date())
    this.queueLimit = Math.max(1, Math.floor(config.queueLimit ?? 20))
    this.processedEventTtlMs = milliseconds(config.processedEventTtlMs, 5 * 60_000)
    this.defaultCooldownMs = milliseconds(config.defaultCooldownMs, 1_000)
    this.cooldownMsByEventType = { ...(config.cooldownMsByEventType ?? {}) }
    this.debounceMs = milliseconds(config.debounceMs, 250)
    this.historyLimit = Math.max(10, Math.floor(config.historyLimit ?? 100))
  }

  getState(): R2OrchestrationState {
    return {
      workspaceId: this.workspaceId,
      current: this.current,
      queue: [...this.queue],
      lastStableState: this.lastStableState,
      processedEventIds: [...this.processed.keys()],
      cooldowns: Object.fromEntries(
        [...this.cooldowns].map(([type, until]) => [type, new Date(until).toISOString()]),
      ),
      interruptions: [...this.interruptions],
      receipts: [...this.receipts],
      failures: [...this.failures],
    }
  }

  dispatch(
    event: R2DomainEvent,
    context: R2EventContext,
  ): Promise<R2OrchestrationDecision> {
    const task = this.dispatchTail.then(() => this.processEvent(event, context))
    this.dispatchTail = task.then(() => undefined, () => undefined)
    return task
  }

  private nextId(prefix: string) {
    this.sequence += 1
    return `${prefix}:${this.sequence}`
  }

  private cleanup(nowMs: number) {
    for (const [eventId, expires] of this.processed) {
      if (expires <= nowMs) this.processed.delete(eventId)
    }
    for (const [eventType, until] of this.cooldowns) {
      if (until <= nowMs) this.cooldowns.delete(eventType)
    }
  }

  private markProcessed(event: R2DomainEvent, nowMs: number) {
    this.processed.set(event.eventId, nowMs + this.processedEventTtlMs)
    this.recentEventType.set(
      `${event.eventType}:${event.correlationId ?? event.entityId ?? "global"}`,
      nowMs,
    )
  }

  private decision(
    input: Readonly<{
      type: R2OrchestrationDecisionType
      event: R2DomainEvent
      reason: R2DecisionReason
      priority: R2Priority
      runtimeState: R2RuntimeState | null
      command?: R2RuntimeCommand | null
      interruptedEventId?: string | null
      discardedReason?: string | null
      fallbackUsed?: boolean
      errorCode?: string | null
      now: Date
    }>,
  ): R2OrchestrationDecision {
    const result: R2OrchestrationDecision = {
      decisionId: this.nextId("r2-decision"),
      decision: input.type,
      eventId: input.event.eventId,
      eventType: input.event.eventType,
      workspaceId: input.event.workspaceId,
      reason: input.reason,
      priority: input.priority,
      runtimeState: input.runtimeState,
      command: input.command ?? null,
      interruptedEventId: input.interruptedEventId ?? null,
      discardedReason: input.discardedReason ?? null,
      decidedAt: input.now.toISOString(),
    }
    this.observability.record({
      eventId: result.eventId,
      eventType: result.eventType,
      decision: result.decision,
      reason: result.reason,
      priority: result.priority,
      runtimeState: result.runtimeState,
      startedAt: result.decidedAt,
      completedAt: null,
      durationMs: null,
      interruptedBy: null,
      discardedReason: result.discardedReason,
      fallbackUsed: input.fallbackUsed ?? result.decision === "FALLBACK",
      errorCode: input.errorCode ?? (result.decision === "FAIL" ? result.reason : null),
    })
    return result
  }

  private shouldDebounce(event: R2DomainEvent, nowMs: number) {
    const key = `${event.eventType}:${event.correlationId ?? event.entityId ?? "global"}`
    const previous = this.recentEventType.get(key)
    return previous !== undefined && nowMs - previous < this.debounceMs
  }

  private start(
    event: R2DomainEvent,
    plan: R2QueuedPresentation["plan"],
    command: R2RuntimeCommand,
    now: Date,
  ) {
    const startedMs = now.getTime()
    this.current = {
      event,
      plan,
      command,
      startedAt: now.toISOString(),
      minimumUntil: new Date(startedMs + plan.minimumDisplayMs).toISOString(),
      completesAt: new Date(startedMs + plan.durationMs).toISOString(),
    }
    if (STABLE_STATES.has(command.runtimeState) && priorityRank(command.priority) <= 1) {
      this.lastStableState = command.runtimeState
    }
    const cooldownMs = milliseconds(
      this.cooldownMsByEventType[event.eventType],
      this.defaultCooldownMs,
    )
    this.cooldowns.set(event.eventType, startedMs + cooldownMs)
  }

  private canInterrupt(
    incoming: R2RuntimeCommand,
    nowMs: number,
  ) {
    if (!this.current) return true
    const current = this.current
    const incomingRank = priorityRank(incoming.priority)
    const currentRank = priorityRank(current.command.priority)
    if (incoming.priority === "CRITICAL") return true
    if (current.command.priority === "CRITICAL") return false
    if (incoming.priority === "HIGH") return true
    if (nowMs < (validTime(current.minimumUntil) ?? Number.POSITIVE_INFINITY)) return false
    if (current.plan.interruptibility === "NEVER") return false
    if (current.plan.interruptibility === "ALERT_OR_CRITICAL") return incomingRank >= 4
    if (current.plan.interruptibility === "ALWAYS") return true
    return incomingRank > currentRank
  }

  private enqueue(
    item: R2QueuedPresentation,
    now: Date,
  ): R2OrchestrationDecision {
    const incomingRank = priorityRank(item.command.priority)
    if (this.queue.length >= this.queueLimit) {
      const lowestIndex = this.queue.reduce(
        (lowest, candidate, index, collection) =>
          priorityRank(candidate.command.priority) < priorityRank(collection[lowest].command.priority)
            ? index
            : lowest,
        0,
      )
      if (incomingRank <= priorityRank(this.queue[lowestIndex].command.priority)) {
        return this.decision({
          type: "DISCARD",
          event: item.event,
          reason: "QUEUE_FULL",
          priority: item.command.priority,
          runtimeState: item.command.runtimeState,
          discardedReason: "Queue limit reached and no lower-priority item was available.",
          now,
        })
      }
      this.queue.splice(lowestIndex, 1)
    }
    this.queue.push(item)
    this.queue.sort((first, second) =>
      priorityRank(second.command.priority) - priorityRank(first.command.priority) ||
      first.queuedAt.localeCompare(second.queuedAt),
    )
    return this.decision({
      type: "QUEUE",
      event: item.event,
      reason: "QUEUED_FOR_LATER",
      priority: item.command.priority,
      runtimeState: item.command.runtimeState,
      command: item.command,
      now,
    })
  }

  private async processEvent(
    event: R2DomainEvent,
    context: R2EventContext,
  ): Promise<R2OrchestrationDecision> {
    const now = this.clock()
    const nowMs = now.getTime()
    this.cleanup(nowMs)

    if (this.disposed) {
      return this.decision({ type: "REJECT", event, reason: "RUNTIME_FAILURE", priority: "CRITICAL", runtimeState: null, discardedReason: "Orchestrator disposed.", now })
    }
    if (!event.eventId.trim() || !event.workspaceId.trim()) {
      return this.decision({ type: "REJECT", event, reason: "NO_REACTION_REQUIRED", priority: "BACKGROUND", runtimeState: null, discardedReason: "Invalid canonical event.", now })
    }
    if (event.workspaceId !== this.workspaceId || context.workspaceId !== this.workspaceId) {
      return this.decision({ type: "REJECT", event, reason: "WORKSPACE_MISMATCH", priority: "CRITICAL", runtimeState: null, discardedReason: "Workspace isolation rejected the event.", now })
    }
    if (event.userId && context.userId && event.userId !== context.userId) {
      return this.decision({ type: "REJECT", event, reason: "USER_MISMATCH", priority: "CRITICAL", runtimeState: null, discardedReason: "User context isolation rejected the event.", now })
    }
    if (this.processed.has(event.eventId)) {
      return this.decision({ type: "DISCARD", event, reason: "EVENT_DUPLICATE", priority: "BACKGROUND", runtimeState: null, discardedReason: "eventId was already processed.", now })
    }
    const eventExpiry = validTime(event.expiresAt)
    if (eventExpiry !== null && eventExpiry <= nowMs) {
      this.markProcessed(event, nowMs)
      return this.decision({ type: "DISCARD", event, reason: "EVENT_EXPIRED", priority: "BACKGROUND", runtimeState: null, discardedReason: "Event expired before presentation.", now })
    }
    if (this.shouldDebounce(event, nowMs)) {
      this.markProcessed(event, nowMs)
      return this.decision({ type: "DISCARD", event, reason: "DEBOUNCED", priority: "BACKGROUND", runtimeState: null, discardedReason: "Equivalent correlated event arrived inside debounce window.", now })
    }

    let intelligence
    try {
      intelligence = await this.intelligence.evaluate({
        requestId: `${event.eventId}:intelligence:v1`,
        operation: "generate_recommendation",
        event,
        context,
      })
    } catch {
      this.markProcessed(event, nowMs)
      const command: R2RuntimeCommand = {
        commandId: `${event.eventId}:intelligence-fallback:v1`,
        eventId: event.eventId,
        workspaceId: event.workspaceId,
        runtimeState: "error_attention",
        expression: "BROW_FROWN",
        expressionIntensity: 0.35,
        durationMs: 6000,
        minimumDisplayMs: 1200,
        transitionMs: 120,
        priority: "HIGH",
        message: "A análise falhou; o modo determinístico seguro permanece ativo.",
        actionLabel: null,
        actionId: null,
        expiresAt: null,
        fallbackState: this.lastStableState,
        requiresConfirmation: false,
      }
      this.failures = this.limited([...this.failures, {
        eventId: event.eventId,
        commandId: command.commandId,
        errorCode: "INTELLIGENCE_FAILED",
        occurredAt: now.toISOString(),
      }])
      if (!this.current || this.canInterrupt(command, nowMs)) {
        if (this.current) {
          this.interruptions = this.limited([...this.interruptions, {
            interruptedEventId: this.current.event.eventId,
            interruptedByEventId: event.eventId,
            occurredAt: now.toISOString(),
            fromState: this.current.command.runtimeState,
            toState: command.runtimeState,
          }])
        }
        this.startFallbackEvent(event, command, now)
      }
      return this.decision({ type: "FAIL", event, reason: "INTELLIGENCE_FAILURE", priority: command.priority, runtimeState: command.runtimeState, command, fallbackUsed: true, errorCode: "INTELLIGENCE_FAILED", now })
    }

    const plan = createR2PresentationPlan(event, intelligence)
    this.markProcessed(event, nowMs)
    if (!plan) {
      return this.decision({ type: "IGNORE", event, reason: intelligence.result === "REQUEST_CONTEXT" ? "INSUFFICIENT_CONTEXT" : "NO_REACTION_REQUIRED", priority: "BACKGROUND", runtimeState: null, now })
    }
    const command = createR2RuntimeCommand(plan)
    const cooldownUntil = this.cooldowns.get(event.eventType)
    if (cooldownUntil !== undefined && cooldownUntil > nowMs && command.priority !== "CRITICAL") {
      return this.decision({ type: "DISCARD", event, reason: "COOLDOWN_ACTIVE", priority: command.priority, runtimeState: command.runtimeState, discardedReason: "Event type cooldown is active.", now })
    }

    if (!this.current) {
      this.start(event, plan, command, now)
      return this.decision({ type: "EXECUTE", event, reason: "EVENT_ACCEPTED", priority: command.priority, runtimeState: command.runtimeState, command, now })
    }
    if (this.canInterrupt(command, nowMs)) {
      const interrupted = this.current
      this.interruptions = this.limited([...this.interruptions, {
        interruptedEventId: interrupted.event.eventId,
        interruptedByEventId: event.eventId,
        occurredAt: now.toISOString(),
        fromState: interrupted.command.runtimeState,
        toState: command.runtimeState,
      }])
      this.start(event, plan, command, now)
      return this.decision({ type: "INTERRUPT", event, reason: "INTERRUPTED_CURRENT", priority: command.priority, runtimeState: command.runtimeState, command, interruptedEventId: interrupted.event.eventId, now })
    }
    return this.enqueue({ event, plan, command, queuedAt: now.toISOString() }, now)
  }

  private startFallbackEvent(
    event: R2DomainEvent,
    command: R2RuntimeCommand,
    now: Date,
  ) {
    this.current = {
      event,
      plan: {
        planId: `${event.eventId}:intelligence-fallback-plan:v1`,
        eventId: event.eventId,
        workspaceId: event.workspaceId,
        runtimeState: command.runtimeState,
        expression: command.expression,
        expressionIntensity: command.expressionIntensity,
        durationMs: command.durationMs,
        minimumDisplayMs: command.minimumDisplayMs,
        transitionMs: command.transitionMs,
        interruptibility: "ALERT_OR_CRITICAL",
        priority: command.priority,
        message: command.message,
        actionLabel: null,
        actionId: null,
        expiresAt: null,
        fallbackState: command.fallbackState,
        requiresConfirmation: false,
      },
      command,
      startedAt: now.toISOString(),
      minimumUntil: new Date(now.getTime() + command.minimumDisplayMs).toISOString(),
      completesAt: new Date(now.getTime() + command.durationMs).toISOString(),
    }
  }

  advance(now = this.clock()): R2OrchestrationDecision | null {
    if (this.disposed || !this.current) return null
    const current = this.current
    if ((validTime(current.completesAt) ?? Number.POSITIVE_INFINITY) > now.getTime()) return null
    this.current = null

    while (this.queue.length > 0) {
      const next = this.queue.shift()!
      const expiresAt = validTime(next.event.expiresAt ?? next.command.expiresAt)
      if (expiresAt !== null && expiresAt <= now.getTime()) continue
      this.start(next.event, next.plan, next.command, now)
      return this.decision({ type: "EXECUTE", event: next.event, reason: "EVENT_ACCEPTED", priority: next.command.priority, runtimeState: next.command.runtimeState, command: next.command, now })
    }

    const fallbackCommand: R2RuntimeCommand = {
      commandId: `${current.command.commandId}:fallback:${now.getTime()}`,
      eventId: current.event.eventId,
      workspaceId: this.workspaceId,
      runtimeState: current.command.fallbackState || this.lastStableState || "idle",
      durationMs: 0,
      minimumDisplayMs: 0,
      transitionMs: 250,
      priority: "BACKGROUND",
      message: null,
      actionLabel: null,
      actionId: null,
      expiresAt: null,
      fallbackState: "idle",
      requiresConfirmation: false,
    }
    return this.decision({ type: "FALLBACK", event: current.event, reason: "PRESENTATION_COMPLETED", priority: "BACKGROUND", runtimeState: fallbackCommand.runtimeState, command: fallbackCommand, now })
  }

  recordExecutionReceipt(receipt: R2ExecutionReceipt) {
    if (receipt.workspaceId !== this.workspaceId) return false
    this.receipts = this.limited([...this.receipts, receipt])
    if (receipt.status === "FAILED") {
      this.failures = this.limited([...this.failures, {
        eventId: receipt.eventId,
        commandId: receipt.commandId,
        errorCode: "RUNTIME_COMMAND_FAILED",
        occurredAt: receipt.completedAt ?? receipt.startedAt,
      }])
    }
    return true
  }

  private limited<T>(items: T[]) {
    return items.slice(-this.historyLimit)
  }

  dispose() {
    this.disposed = true
    this.current = null
    this.queue = []
    this.processed.clear()
    this.cooldowns.clear()
    this.recentEventType.clear()
  }
}

export class R2InMemoryObservabilitySink implements R2ObservabilitySink {
  private entries: R2ObservabilityEntry[] = []

  record(entry: R2ObservabilityEntry) {
    this.entries.push({ ...entry })
  }

  snapshot() {
    return this.entries.map((entry) => ({ ...entry }))
  }
}
