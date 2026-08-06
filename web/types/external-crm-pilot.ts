export type ExternalCrmPilotScenarioId =
  | "NEW_LEAD_CHECK_1"
  | "NO_RESPONSE_CHECK_3"
  | "OVERDUE_ACTIONS"
  | "CADENCE_PAUSED_NEXT_ACTION"
  | "MEETING_SCHEDULED"
  | "CADENCE_COMPLETED"
  | "REACTIVATION_POSITIVE_RESPONSE"

export type ExternalCrmPilotActionView = {
  id: string
  label: string
  channel:
    | "WHATSAPP"
    | "PHONE"
    | "EMAIL"
    | "MEETING"
    | "INTERNAL"
    | "OTHER"
  period:
    | "MORNING"
    | "AFTERNOON"
    | "EVENING"
    | "ANYTIME"
    | "UNKNOWN"
  status:
    | "PENDING"
    | "READY"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "SKIPPED"
    | "UNKNOWN"
  dueState:
    | "NOT_DUE"
    | "DUE"
    | "OVERDUE"
    | "COMPLETED"
    | "UNKNOWN"
  scheduledFor: string | null
}

export type ExternalCrmPilotView = {
  providerId: string
  providerLabel: string
  contractVersion: string
  scenarioId: ExternalCrmPilotScenarioId
  simulation: true
  readOnly: true
  healthStatus:
    | "AVAILABLE"
    | "DEGRADED"
    | "DISABLED"
    | "UNAVAILABLE"
  synchronizedAt: string
  lead: {
    id: string
    name: string
    source: string | null
    stage: string | null
    status: string | null
    nextActionAt: string | null
  }
  cadence: {
    status:
      | "NOT_STARTED"
      | "ACTIVE"
      | "PAUSED"
      | "COMPLETED"
      | "CANCELLED"
      | "UNKNOWN"
    currentCheck: number | null
    totalChecks: number | null
    plannedActions: number
    completedActions: number
    overdueActions: number
    dueActions: number
    paused: boolean
    pauseReason: string | null
    pauseReasonLabel: string | null
    templateVersion: string | null
    timezone: string | null
  } | null
  nextAction: ExternalCrmPilotActionView | null
  meeting: {
    id: string
    title: string
    status:
      | "SCHEDULED"
      | "CONFIRMED"
      | "COMPLETED"
      | "CANCELLED"
      | "NO_SHOW"
      | "UNKNOWN"
    scheduledFor: string
  } | null
  latestTimelineSummary: string | null
  reactivation: {
    positiveResponseHandled: true
    sequenceStopped: true
    serviceState:
      "ACTIVE_CONVERSATION"
    checksBlocked: true
    resumeRequiresNewNoResponse: true
    resumeRequiresMaestroAuthorization: true
  } | null
  r2: {
    headline: string
    analysis: string
    recommendation: string
    reason: string
  }
}
