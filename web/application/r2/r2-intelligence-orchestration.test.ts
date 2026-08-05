/// <reference types="vitest/globals" />

import type { CommercialEvent, CommercialEventType } from "@/types/domain"
import type {
  R2DomainEvent,
  R2EventContext,
  R2IntelligencePort,
  R2RuntimeCommand,
  R2Urgency,
} from "@/types/r2-intelligence-orchestration"
import { R2_EVENT_TYPES } from "@/types/r2-intelligence-orchestration"
import runtimeMapping from "../../blender/r2-rig/R2_EVENT_TO_RUNTIME_MAPPING.json"
import {
  normalizeCommercialEvent,
  normalizeDashboardBriefing,
  resolveR2EventContext,
} from "./normalize-r2-event"
import { R2DeterministicIntelligence } from "./r2-deterministic-intelligence"
import { R2InMemoryObservabilitySink, R2Orchestrator } from "./r2-orchestrator"

const NOW = "2026-08-01T15:00:00.000Z"

function commercial(type: CommercialEventType, id = `event-${type}`): CommercialEvent {
  return {
    id,
    workspaceId: "workspace-a",
    journeyId: "journey-1",
    type,
    actorType: "SYSTEM",
    actorId: "actor-1",
    payload: {},
    occurredAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

function event(
  eventType: R2DomainEvent["eventType"],
  id: string,
  urgency: R2Urgency = "normal",
  overrides: Partial<R2DomainEvent> = {},
): R2DomainEvent {
  return {
    eventId: id,
    eventType,
    occurredAt: NOW,
    workspaceId: "workspace-a",
    actorId: "system",
    userId: "user-1",
    entityType: "system",
    entityId: "entity-1",
    correlationId: id,
    causationId: null,
    source: "system",
    payload: {},
    metadata: {},
    urgency,
    expiresAt: null,
    schemaVersion: 1,
    ...overrides,
  }
}

function context(
  source: R2DomainEvent,
  lastStableRuntimeState: R2EventContext["lastStableRuntimeState"] = "idle",
): R2EventContext {
  return resolveR2EventContext(source, {
    workspaceId: source.workspaceId,
    userId: "user-1",
    lastStableRuntimeState,
    now: new Date(NOW),
  })
}

describe("R2 canonical event and intelligence contracts", () => {
  it("normalizes every existing commercial event type exactly", () => {
    const mapping: Record<CommercialEventType, R2DomainEvent["eventType"]> = {
      LEAD_CREATED: "lead.created", OPPORTUNITY_CREATED: "opportunity.created", LEAD_REPLIED: "lead.replied",
      MEETING_SCHEDULED: "meeting.scheduled", MEETING_COMPLETED: "meeting.completed",
      PROPOSAL_SENT: "proposal.sent", PROPOSAL_ACCEPTED: "proposal.accepted",
      DOCUMENT_REQUESTED: "sale.documentation_requested", DOCUMENT_RECEIVED: "sale.documentation_received",
      PAYMENT_CONFIRMED: "sale.payment_confirmed", SALE_COMPLETED: "sale.completed",
      STATE_CHANGED: "opportunity.stage_changed", NOTE_ADDED: "opportunity.note_added",
      TASK_CREATED: "task.created", TASK_COMPLETED: "task.completed",
    }
    for (const [source, canonical] of Object.entries(mapping)) {
      expect(normalizeCommercialEvent(commercial(source as CommercialEventType)).eventType).toBe(canonical)
    }
  })

  it("requires workspace scope and rejects context leakage", () => {
    expect(() => normalizeCommercialEvent({ ...commercial("LEAD_CREATED"), workspaceId: " " })).toThrow(/workspaceId/)
    const canonical = normalizeCommercialEvent(commercial("LEAD_CREATED"))
    expect(() => resolveR2EventContext(canonical, { workspaceId: "workspace-b" })).toThrow(/workspace/)
    expect(() => resolveR2EventContext({ ...canonical, userId: "user-a" }, {
      workspaceId: "workspace-a", userId: "user-b",
    })).toThrow(/user context/)
  })

  it("normalizes the real dashboard briefing with resolved workspace and stable identity", () => {
    const input = {
      workspaceId: "workspace-a",
      userId: "user-1",
      briefing: {
        greeting: "OlÃ¡",
        analysis: "Fato confirmado",
        recommendation: "Revisar a aÃ§Ã£o",
        reason: "Prioridade calculada",
        confidence: "high" as const,
        generatedAt: NOW,
      },
    }
    expect(normalizeDashboardBriefing(input)).toMatchObject({
      eventId: `dashboard-briefing:workspace-a:user-1:${NOW}`,
      eventType: "intelligence.recommendation_ready",
      workspaceId: "workspace-a",
      source: "dashboard",
    })
  })

  it.each([
    ["lead.created", "normal", "working"],
    ["opportunity.stage_changed", "normal", "thinking"],
    ["intelligence.recommendation_ready", "attention", "awaiting_action"],
    ["meeting.upcoming", "high", "alert"],
    ["sale.completed", "celebration", "celebrating_sale"],
    ["automation.failed", "critical", "error_attention"],
    // R2_EVENT_REACTION_COMPLETION_V1_TESTS_START
    ["automation.completed", "normal", "idle"],
    ["intelligence.analysis_completed", "normal", "idle"],
    ["intelligence.insufficient_context", "attention", "awaiting_action"],
    ["intelligence.recommendation_accepted", "normal", "working"],
    ["intelligence.recommendation_rejected", "normal", "thinking"],
    ["lead.converted", "normal", "working"],
    ["lead.disqualified", "normal", "idle"],
    ["lead.no_response", "attention", "awaiting_action"],
    ["lead.qualified", "normal", "thinking"],
    ["meeting.cancelled", "attention", "awaiting_action"],
    ["meeting.follow_up_pending", "attention", "awaiting_action"],
    ["meeting.started", "normal", "listening"],
    ["opportunity.created", "normal", "working"],
    ["opportunity.lost", "high", "alert"],
    ["opportunity.note_added", "normal", "listening"],
    ["opportunity.updated", "normal", "thinking"],
    ["opportunity.won", "normal", "working"],
    ["proposal.expired", "high", "alert"],
    ["proposal.prepared", "normal", "working"],
    ["proposal.rejected", "high", "alert"],
    ["proposal.review_ready", "attention", "awaiting_action"],
    ["proposal.viewed", "normal", "listening"],
    ["sale.awaiting_documentation", "attention", "awaiting_action"],
    ["sale.cancelled", "high", "alert"],
    ["sale.documentation_received", "normal", "working"],
    ["sale.payment_confirmed", "normal", "working"],
    ["sale.pending", "attention", "awaiting_action"],
    ["sale.started", "normal", "working"],
    ["task.completed", "normal", "idle"],
    ["automation.started", "normal", "working"],
    ["integration.unavailable", "critical", "error_attention"],
    ["intelligence.analysis_started", "normal", "thinking"],
    ["intelligence.confirmation_required", "attention", "awaiting_action"],
    ["intelligence.next_best_action_ready", "attention", "awaiting_action"],
    ["intelligence.provider_error", "critical", "error_attention"],
    ["lead.action_required", "attention", "awaiting_action"],
    ["lead.at_risk", "high", "alert"],
    ["lead.received", "normal", "working"],
    ["meeting.summary_missing", "attention", "awaiting_action"],
    ["opportunity.at_risk", "high", "alert"],
    ["opportunity.stagnant", "attention", "awaiting_action"],
    ["queue.failed", "critical", "error_attention"],
    ["sale.celebration_ready", "celebration", "celebrating_sale"],
    ["task.due_soon", "attention", "awaiting_action"],
    ["task.overdue", "high", "alert"],
    ["workflow.blocked", "critical", "error_attention"],
    // R2_EVENT_REACTION_COMPLETION_V1_TESTS_END
    ["runtime.speaking_requested", "normal", "speaking"],
  ] as const)("maps %s through the selected vertical flow", async (type, urgency, expectedState) => {
    const source = event(type, `vertical-${type}`, urgency)
    const result = await new R2DeterministicIntelligence().evaluate({
      requestId: `request-${type}`,
      operation: "generate_recommendation",
      event: source,
      context: context(source),
    })
    expect(result.result).toBe("REACT")
    expect(result.presentationHints?.runtimeState).toBe(expectedState)
  })

  it("defines a deterministic result for every canonical event", async () => {
    const intelligence = new R2DeterministicIntelligence()
    for (const type of R2_EVENT_TYPES) {
      const source = event(type, `coverage-${type}`)
      const result = await intelligence.evaluate({
        requestId: `coverage-${type}`,
        operation: "generate_recommendation",
        event: source,
        context: context(source),
      })
      expect(["REACT", "IGNORE", "REQUEST_CONTEXT"]).toContain(result.result)
    }
  })

  it("keeps the published event-to-runtime mapping exhaustive and duplicate-free", () => {
    expect(R2_EVENT_TYPES).toHaveLength(62)
    expect(new Set(R2_EVENT_TYPES).size).toBe(R2_EVENT_TYPES.length)
    expect(Object.keys(runtimeMapping.events).sort()).toEqual([...R2_EVENT_TYPES].sort())
  })
})

describe("R2 deterministic orchestrator", () => {
  function fixture(options: { queueLimit?: number; intelligence?: R2IntelligencePort } = {}) {
    let nowMs = new Date(NOW).getTime()
    const observability = new R2InMemoryObservabilitySink()
    const orchestrator = new R2Orchestrator({
      workspaceId: "workspace-a",
      intelligence: options.intelligence ?? new R2DeterministicIntelligence(),
      observability,
      now: () => new Date(nowMs),
      queueLimit: options.queueLimit,
      defaultCooldownMs: 1000,
      debounceMs: 250,
    })
    return {
      orchestrator,
      observability,
      add(ms: number) { nowMs += ms },
      current() { return new Date(nowMs) },
    }
  }

  it("executes idle to working and preserves exact command workspace", async () => {
    const test = fixture()
    const source = event("lead.created", "lead-1")
    const decision = await test.orchestrator.dispatch(source, context(source))
    expect(decision).toMatchObject({ decision: "EXECUTE", runtimeState: "working", workspaceId: "workspace-a" })
    expect(decision.command?.workspaceId).toBe("workspace-a")
  })

  it("interrupts celebration with alert and speaking with critical error", async () => {
    const first = fixture()
    const sale = event("sale.completed", "sale-1", "celebration")
    expect((await first.orchestrator.dispatch(sale, context(sale))).runtimeState).toBe("celebrating_sale")
    const meeting = event("meeting.upcoming", "meeting-1", "high")
    expect(await first.orchestrator.dispatch(meeting, context(meeting))).toMatchObject({
      decision: "INTERRUPT", interruptedEventId: "sale-1", runtimeState: "alert",
    })

    const second = fixture()
    const speaking = event("runtime.speaking_requested", "speech-1")
    await second.orchestrator.dispatch(speaking, context(speaking))
    const failure = event("automation.failed", "failure-1", "critical")
    expect(await second.orchestrator.dispatch(failure, context(failure))).toMatchObject({
      decision: "INTERRUPT", runtimeState: "error_attention",
    })
  })

  it("executes the required working to thinking to awaiting_action to alert progression", async () => {
    const test = fixture()
    const transitions = [
      event("lead.created", "progress-working"),
      event("opportunity.stage_changed", "progress-thinking"),
      event("intelligence.recommendation_ready", "progress-awaiting", "attention"),
      event("meeting.upcoming", "progress-alert", "high"),
    ] as const
    const expected = ["working", "thinking", "awaiting_action", "alert"]
    for (let index = 0; index < transitions.length; index += 1) {
      const source = transitions[index]
      const decision = await test.orchestrator.dispatch(source, context(source))
      expect(decision.runtimeState).toBe(expected[index])
      if (decision.runtimeState === "awaiting_action") {
        expect(decision.command?.requiresConfirmation).toBe(true)
      }
      if (index < transitions.length - 1) {
        test.add(decision.command?.durationMs ?? 0)
        test.orchestrator.advance(test.current())
      }
    }
    expect(test.orchestrator.getState().current?.command.requiresConfirmation).toBe(false)
  })

  it("rejects a mismatched user context inside the same workspace", async () => {
    const test = fixture()
    const source = event("lead.created", "user-isolation", "normal", { userId: "user-a" })
    const mismatchedContext = { ...context({ ...source, userId: null }), userId: "user-b" }
    expect(await test.orchestrator.dispatch(source, mismatchedContext)).toMatchObject({
      decision: "REJECT", reason: "USER_MISMATCH",
    })
  })

  it("does not allow celebration or normal work to interrupt a critical error", async () => {
    const test = fixture()
    const critical = event("automation.failed", "critical-active", "critical")
    await test.orchestrator.dispatch(critical, context(critical))
    test.add(9000)
    const celebration = event("sale.completed", "late-celebration", "celebration")
    expect((await test.orchestrator.dispatch(celebration, context(celebration))).decision).toBe("QUEUE")
    expect(test.orchestrator.getState().current?.event.eventId).toBe("critical-active")
  })

  it("falls back after alert completion and executes queued work by priority", async () => {
    const test = fixture()
    const alert = event("meeting.upcoming", "alert-1", "high")
    await test.orchestrator.dispatch(alert, context(alert, "listening"))
    const task = event("task.created", "task-1")
    expect((await test.orchestrator.dispatch(task, context(task))).decision).toBe("QUEUE")
    test.add(7000)
    const queued = test.orchestrator.advance(test.current())
    expect(queued).toMatchObject({ decision: "EXECUTE", runtimeState: "working" })
    test.add(4000)
    expect(test.orchestrator.advance(test.current())).toMatchObject({
      decision: "FALLBACK", runtimeState: "idle",
    })
  })

  it("enforces duplicate, expiry, workspace, debounce and cooldown gates", async () => {
    const test = fixture()
    const base = event("lead.created", "gate-1")
    await test.orchestrator.dispatch(base, context(base))
    expect((await test.orchestrator.dispatch(base, context(base))).reason).toBe("EVENT_DUPLICATE")

    const expired = event("task.created", "expired-1", "normal", { expiresAt: "2026-08-01T14:59:59.000Z" })
    expect((await test.orchestrator.dispatch(expired, context(expired))).reason).toBe("EVENT_EXPIRED")

    const foreign = event("task.created", "foreign-1", "normal", { workspaceId: "workspace-b" })
    expect((await test.orchestrator.dispatch(foreign, { ...context(foreign), workspaceId: "workspace-b" })).reason).toBe("WORKSPACE_MISMATCH")

    test.add(100)
    const debounced = event("lead.created", "gate-2", "normal", { correlationId: base.correlationId })
    expect((await test.orchestrator.dispatch(debounced, context(debounced))).reason).toBe("DEBOUNCED")

    test.add(300)
    const cooldown = event("lead.created", "gate-3", "normal", { correlationId: "other" })
    expect((await test.orchestrator.dispatch(cooldown, context(cooldown))).reason).toBe("COOLDOWN_ACTIVE")
  })

  it("discards equal-priority work when the bounded queue is full", async () => {
    const test = fixture({ queueLimit: 1 })
    const active = event("lead.created", "active")
    await test.orchestrator.dispatch(active, context(active))
    const firstQueued = event("task.created", "queued-1")
    expect((await test.orchestrator.dispatch(firstQueued, context(firstQueued))).decision).toBe("QUEUE")
    const overflow = event("proposal.sent", "queued-2")
    expect(await test.orchestrator.dispatch(overflow, context(overflow))).toMatchObject({
      decision: "DISCARD", reason: "QUEUE_FULL",
    })
  })

  it("uses a safe fallback and records observability when intelligence fails", async () => {
    const failing: R2IntelligencePort = {
      provider: "failing-test",
      evaluate: async () => { throw new Error("offline") },
    }
    const test = fixture({ intelligence: failing })
    const source = event("lead.created", "failure")
    const decision = await test.orchestrator.dispatch(source, context(source))
    expect(decision).toMatchObject({ decision: "FAIL", reason: "INTELLIGENCE_FAILURE", runtimeState: "error_attention" })
    expect(test.orchestrator.getState().failures).toHaveLength(1)
    expect(test.observability.snapshot().at(-1)).toMatchObject({ fallbackUsed: true, errorCode: "INTELLIGENCE_FAILED" })
  })

  it("records workspace-scoped execution receipts", async () => {
    const test = fixture()
    const source = event("runtime.neutral_requested", "neutral-1")
    const decision = await test.orchestrator.dispatch(source, context(source))
    const command = decision.command as R2RuntimeCommand
    expect(command.runtimeState).toBe("neutral")
    expect(command.requiresConfirmation).toBe(false)
    expect(test.orchestrator.recordExecutionReceipt({
      receiptId: "receipt-1", commandId: command.commandId, eventId: command.eventId,
      workspaceId: "workspace-a", status: "APPLIED", runtimeState: command.runtimeState,
      startedAt: NOW, completedAt: null, durationMs: null, interruptedBy: null,
      fallbackUsed: false, errorCode: null,
    })).toBe(true)
    expect(test.orchestrator.getState().receipts).toHaveLength(1)
  })
})
