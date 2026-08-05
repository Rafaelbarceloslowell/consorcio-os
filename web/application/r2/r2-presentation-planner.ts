import type {
  R2DomainEvent,
  R2IntelligenceResult,
  R2PresentationPlan,
  R2Priority,
  R2RuntimeCommand,
  R2Urgency,
} from "@/types/r2-intelligence-orchestration"
import {
  R2OrchestrationError,
} from "@/types/r2-intelligence-orchestration"

const PRIORITY_BY_URGENCY: Readonly<Record<R2Urgency, R2Priority>> = {
  background: "BACKGROUND",
  normal: "NORMAL",
  attention: "ATTENTION",
  celebration: "CELEBRATION",
  high: "HIGH",
  critical: "CRITICAL",
}

function finiteRange(
  value: number | undefined,
  minimum: number,
  maximum: number,
  field: string,
) {
  if (value === undefined) return undefined
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new R2OrchestrationError(
      "INVALID_PRESENTATION",
      `${field} is outside the supported range.`,
      true,
    )
  }
  return value
}

export function createR2PresentationPlan(
  event: R2DomainEvent,
  intelligence: R2IntelligenceResult,
): R2PresentationPlan | null {
  if (intelligence.result !== "REACT") return null
  const hints = intelligence.presentationHints
  if (!hints || !intelligence.recommendation) {
    throw new R2OrchestrationError(
      "INVALID_PRESENTATION",
      "A reactive intelligence result requires structured presentation hints and recommendation.",
      true,
    )
  }

  finiteRange(hints.expressionIntensity, 0, 1, "expressionIntensity")
  finiteRange(hints.speakingIntensity, 0, 1, "speakingIntensity")
  finiteRange(hints.durationMs, 0, 120_000, "durationMs")
  finiteRange(hints.minimumDisplayMs, 0, hints.durationMs, "minimumDisplayMs")
  finiteRange(hints.transitionMs, 0, 10_000, "transitionMs")

  const action = intelligence.recommendation.suggestedActions[0]
  return {
    planId: `${event.eventId}:plan:v1`,
    eventId: event.eventId,
    workspaceId: event.workspaceId,
    runtimeState: hints.runtimeState,
    expression: hints.expression,
    expressionIntensity: hints.expressionIntensity,
    viseme: hints.viseme,
    speakingIntensity: hints.speakingIntensity,
    eyeTarget: hints.eyeTarget,
    durationMs: hints.durationMs,
    minimumDisplayMs: hints.minimumDisplayMs,
    transitionMs: hints.transitionMs,
    interruptibility: hints.interruptionPolicy,
    priority: PRIORITY_BY_URGENCY[intelligence.urgency],
    message: intelligence.recommendation.summary,
    actionLabel: action?.label ?? null,
    actionId: action?.actionId ?? null,
    expiresAt: intelligence.expiresAt,
    fallbackState: hints.fallbackState,
    requiresConfirmation: action?.requiresConfirmation ?? false,
  }
}

export function createR2RuntimeCommand(
  plan: R2PresentationPlan,
): R2RuntimeCommand {
  return {
    commandId: `${plan.eventId}:command:v1`,
    eventId: plan.eventId,
    workspaceId: plan.workspaceId,
    runtimeState: plan.runtimeState,
    expression: plan.expression,
    expressionIntensity: plan.expressionIntensity,
    viseme: plan.viseme,
    speakingIntensity: plan.speakingIntensity,
    eyeTarget: plan.eyeTarget,
    durationMs: plan.durationMs,
    minimumDisplayMs: plan.minimumDisplayMs,
    transitionMs: plan.transitionMs,
    priority: plan.priority,
    message: plan.message,
    actionLabel: plan.actionLabel,
    actionId: plan.actionId,
    expiresAt: plan.expiresAt,
    fallbackState: plan.fallbackState,
    requiresConfirmation: plan.requiresConfirmation,
  }
}

export function priorityRank(priority: R2Priority) {
  return {
    BACKGROUND: 0,
    NORMAL: 1,
    ATTENTION: 2,
    CELEBRATION: 3,
    HIGH: 4,
    CRITICAL: 5,
  }[priority]
}
