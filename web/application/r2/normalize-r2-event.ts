import type {
  CommercialEvent,
  CommercialEventType,
} from "@/types/domain"
import type {
  AutomationTrigger,
} from "@/engine/decision/automation/types"
import type {
  GorilaR2Briefing,
} from "@/types/dashboard"
import type {
  R2DomainEvent,
  R2EntityType,
  R2EventContext,
  R2EventType,
  R2Urgency,
} from "@/types/r2-intelligence-orchestration"
import type {
  R2RuntimeState,
} from "@/types/r2-full-character-runtime"
import {
  R2OrchestrationError,
} from "@/types/r2-intelligence-orchestration"

const COMMERCIAL_EVENT_MAP: Readonly<
  Record<CommercialEventType, R2EventType>
> = {
  LEAD_CREATED: "lead.created",
  OPPORTUNITY_CREATED: "opportunity.created",
  LEAD_REPLIED: "lead.replied",
  MEETING_SCHEDULED: "meeting.scheduled",
  MEETING_COMPLETED: "meeting.completed",
  PROPOSAL_SENT: "proposal.sent",
  PROPOSAL_ACCEPTED: "proposal.accepted",
  DOCUMENT_REQUESTED: "sale.documentation_requested",
  DOCUMENT_RECEIVED: "sale.documentation_received",
  PAYMENT_CONFIRMED: "sale.payment_confirmed",
  SALE_COMPLETED: "sale.completed",
  STATE_CHANGED: "opportunity.stage_changed",
  NOTE_ADDED: "opportunity.note_added",
  TASK_CREATED: "task.created",
  TASK_COMPLETED: "task.completed",
}

const ENTITY_BY_COMMERCIAL_EVENT: Readonly<
  Record<CommercialEventType, R2EntityType>
> = {
  LEAD_CREATED: "lead",
  OPPORTUNITY_CREATED: "opportunity",
  LEAD_REPLIED: "lead",
  MEETING_SCHEDULED: "meeting",
  MEETING_COMPLETED: "meeting",
  PROPOSAL_SENT: "proposal",
  PROPOSAL_ACCEPTED: "proposal",
  DOCUMENT_REQUESTED: "sale",
  DOCUMENT_RECEIVED: "sale",
  PAYMENT_CONFIRMED: "sale",
  SALE_COMPLETED: "sale",
  STATE_CHANGED: "opportunity",
  NOTE_ADDED: "opportunity",
  TASK_CREATED: "task",
  TASK_COMPLETED: "task",
}

const URGENCY_BY_COMMERCIAL_EVENT: Readonly<
  Record<CommercialEventType, R2Urgency>
> = {
  LEAD_CREATED: "normal",
  OPPORTUNITY_CREATED: "normal",
  LEAD_REPLIED: "normal",
  MEETING_SCHEDULED: "attention",
  MEETING_COMPLETED: "normal",
  PROPOSAL_SENT: "normal",
  PROPOSAL_ACCEPTED: "attention",
  DOCUMENT_REQUESTED: "attention",
  DOCUMENT_RECEIVED: "normal",
  PAYMENT_CONFIRMED: "normal",
  SALE_COMPLETED: "celebration",
  STATE_CHANGED: "normal",
  NOTE_ADDED: "background",
  TASK_CREATED: "normal",
  TASK_COMPLETED: "background",
}

function requiredText(
  value: string,
  field: string,
) {
  const normalized = value.trim()
  if (!normalized) {
    throw new R2OrchestrationError(
      "INVALID_EVENT",
      `${field} is required for an R2 event.`,
      false,
    )
  }
  return normalized
}

function validDate(
  value: string,
  field: string,
) {
  if (!Number.isFinite(new Date(value).getTime())) {
    throw new R2OrchestrationError(
      "INVALID_EVENT",
      `${field} must be a valid ISO date.`,
      false,
    )
  }
  return value
}

function payloadText(
  payload: Readonly<Record<string, unknown>>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return null
}

export type NormalizeCommercialEventOptions = Readonly<{
  userId?: string | null
  correlationId?: string | null
  causationId?: string | null
  expiresAt?: string | null
  urgency?: R2Urgency
}>

export function normalizeCommercialEvent(
  event: CommercialEvent,
  options: NormalizeCommercialEventOptions = {},
): R2DomainEvent {
  const workspaceId = requiredText(event.workspaceId, "workspaceId")
  const eventId = requiredText(event.id, "eventId")
  const occurredAt = validDate(event.occurredAt, "occurredAt")
  const entityType = ENTITY_BY_COMMERCIAL_EVENT[event.type]
  const entityId = payloadText(event.payload, [
    `${entityType}Id`,
    "entityId",
  ]) ?? (entityType === "opportunity" ? event.journeyId : null)
  const expiresAt = options.expiresAt ?? payloadText(event.payload, ["expiresAt"])

  if (expiresAt) validDate(expiresAt, "expiresAt")

  return {
    eventId,
    eventType: COMMERCIAL_EVENT_MAP[event.type],
    occurredAt,
    workspaceId,
    actorId: event.actorId,
    userId: options.userId ?? null,
    entityType,
    entityId,
    correlationId: options.correlationId ?? payloadText(event.payload, ["correlationId"]),
    causationId: options.causationId ?? payloadText(event.payload, ["causationId"]),
    source: "commercial_event",
    payload: { ...event.payload, journeyId: event.journeyId },
    metadata: {
      schema: "gorillaos.commercial-event",
      sourceVersion: "1",
    },
    urgency: options.urgency ?? URGENCY_BY_COMMERCIAL_EVENT[event.type],
    expiresAt: expiresAt ?? null,
    schemaVersion: 1,
  }
}

export function normalizeAutomationTrigger(
  trigger: AutomationTrigger,
  eventType: R2EventType,
  options: Readonly<{
    urgency?: R2Urgency
    entityType?: R2EntityType
    expiresAt?: string | null
  }> = {},
): R2DomainEvent {
  const workspaceId = requiredText(trigger.workspaceId, "workspaceId")
  return {
    eventId: requiredText(trigger.id, "eventId"),
    eventType,
    occurredAt: validDate(trigger.occurredAt, "occurredAt"),
    workspaceId,
    actorId: null,
    userId: null,
    entityType: options.entityType ?? "automation",
    entityId: trigger.journeyId,
    correlationId: trigger.journeyId,
    causationId: null,
    source: "automation_trigger",
    payload: { ...trigger.payload, triggerType: trigger.type },
    metadata: {
      schema: "gorillaos.automation-trigger",
      sourceVersion: "1",
    },
    urgency: options.urgency ?? "normal",
    expiresAt: options.expiresAt ?? null,
    schemaVersion: 1,
  }
}

export function normalizeDashboardBriefing(
  input: Readonly<{
    workspaceId: string
    userId: string
    briefing: GorilaR2Briefing
  }>,
): R2DomainEvent {
  const workspaceId = requiredText(input.workspaceId, "workspaceId")
  const userId = requiredText(input.userId, "userId")
  const occurredAt = validDate(input.briefing.generatedAt, "generatedAt")
  const urgency: R2Urgency =
    input.briefing.confidence === "low"
      ? "high"
      : input.briefing.nextAction?.priority === "high"
        ? "attention"
        : "normal"

  return {
    eventId: `dashboard-briefing:${workspaceId}:${userId}:${occurredAt}`,
    eventType: "intelligence.recommendation_ready",
    occurredAt,
    workspaceId,
    actorId: "gorillaos-dashboard",
    userId,
    entityType: "recommendation",
    entityId: null,
    correlationId: `dashboard:${workspaceId}`,
    causationId: null,
    source: "dashboard",
    payload: {
      title: input.briefing.nextAction?.title ?? input.briefing.recommendation,
      summary: input.briefing.analysis,
      recommendation: input.briefing.recommendation,
      confidence: input.briefing.confidence,
    },
    metadata: {
      schema: "gorillaos.dashboard-briefing",
      sourceVersion: "1",
    },
    urgency,
    expiresAt: null,
    schemaVersion: 1,
  }
}

export function resolveR2EventContext(
  event: R2DomainEvent,
  input: Readonly<{
    workspaceId: string
    userId?: string | null
    currentRuntimeState?: R2RuntimeState
    lastStableRuntimeState?: R2RuntimeState
    availableInformation?: readonly string[]
    missingInformation?: readonly string[]
    entitySnapshot?: Readonly<Record<string, unknown>>
    now?: Date
  }>,
): R2EventContext {
  const workspaceId = requiredText(input.workspaceId, "workspaceId")
  if (event.workspaceId !== workspaceId) {
    throw new R2OrchestrationError(
      "WORKSPACE_MISMATCH",
      "The event does not belong to the resolved workspace.",
      false,
    )
  }
  if (event.userId && input.userId && event.userId !== input.userId) {
    throw new R2OrchestrationError(
      "USER_MISMATCH",
      "The event does not belong to the resolved user context.",
      false,
    )
  }

  return {
    workspaceId,
    userId: input.userId ?? event.userId,
    currentRuntimeState: input.currentRuntimeState ?? "idle",
    lastStableRuntimeState: input.lastStableRuntimeState ?? "idle",
    resolvedAt: (input.now ?? new Date()).toISOString(),
    availableInformation: [...(input.availableInformation ?? [])],
    missingInformation: [...(input.missingInformation ?? [])],
    entitySnapshot: { ...(input.entitySnapshot ?? {}) },
  }
}
