export type ExternalCrmMode =
  | "INTEGRATED"
  | "STANDALONE"

export type ExternalCrmDataOwner =
  | "EXTERNAL_CRM"
  | "GORILLAOS"
  | "SHARED"

export type ExternalCrmHealthStatus =
  | "AVAILABLE"
  | "DEGRADED"
  | "DISABLED"
  | "UNAVAILABLE"

export type ExternalConsultantRole =
  | "CONSULTANT"
  | "MANAGER"
  | "MASTER"
  | "ADMINISTRATIVE"
  | "OTHER"

export type ExternalConsultantStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "UNKNOWN"

export type ExternalCadenceStatus =
  | "NOT_STARTED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "UNKNOWN"

export type ExternalContactActionType =
  | "CONTACT_ATTEMPT"
  | "FOLLOW_UP"
  | "MEETING"
  | "OTHER"

export type ExternalContactChannel =
  | "WHATSAPP"
  | "PHONE"
  | "EMAIL"
  | "MEETING"
  | "INTERNAL"
  | "OTHER"

export type ExternalContactPeriod =
  | "MORNING"
  | "AFTERNOON"
  | "EVENING"
  | "ANYTIME"
  | "UNKNOWN"

export type ExternalContactActionStatus =
  | "PENDING"
  | "READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "SKIPPED"
  | "UNKNOWN"

export type ExternalActionDueState =
  | "NOT_DUE"
  | "DUE"
  | "OVERDUE"
  | "COMPLETED"
  | "UNKNOWN"

export type ExternalMeetingStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "UNKNOWN"

export type ExternalCrmTrace = {
  sourceSystem: string
  sourceRecordId: string
  sourceCode: string | null
  sourceUpdatedAt: string
  synchronizedAt: string
  contractVersion: string
  dataOwner: ExternalCrmDataOwner
}

export type ExternalCrmHealth = {
  providerId: string
  status: ExternalCrmHealthStatus
  contractVersion: string
  readOnly: boolean
  checkedAt: string
  diagnostics: string[]
}

export type ExternalConsultant = {
  externalConsultantId: string
  organizationId: string
  name: string
  role: ExternalConsultantRole
  status: ExternalConsultantStatus
  teamId: string | null
  eligibleForLeadDistribution: boolean
  updatedAt: string
  trace: ExternalCrmTrace
}

export type ExternalLead = {
  externalLeadId: string
  organizationId: string
  ownerConsultantId: string | null
  assignedConsultantId: string | null
  name: string
  phone: string | null
  email: string | null
  source: string | null
  stage: string | null
  status: string | null
  receivedAt: string | null
  nextActionAt: string | null
  convertedAt: string | null
  archivedAt: string | null
  updatedAt: string
  trace: ExternalCrmTrace
}

export type ExternalContactAction = {
  externalActionId: string
  externalActionCode: string | null
  label: string
  type: ExternalContactActionType
  channel: ExternalContactChannel
  period: ExternalContactPeriod
  position: number
  status: ExternalContactActionStatus
  dueState: ExternalActionDueState
  scheduledFor: string | null
  completedAt: string | null
  completedByConsultantId: string | null
  resultCode: string | null
  trace: ExternalCrmTrace
}

export type ExternalCadence = {
  externalLeadId: string
  organizationId: string
  status: ExternalCadenceStatus
  currentCheck: number | null
  totalChecks: number | null
  templateVersion: string | null
  timezone: string | null
  paused: boolean
  pauseReason: string | null
  startedAt: string | null
  updatedAt: string
  plannedActions: number
  completedActions: number
  nextActionId: string | null
  actions: ExternalContactAction[]
  trace: ExternalCrmTrace
}

export type ExternalTimelineEvent = {
  externalEventId: string
  externalLeadId: string
  organizationId: string
  eventType: string
  occurredAt: string
  actorConsultantId: string | null
  summary: string | null
  trace: ExternalCrmTrace
}

export type ExternalMeeting = {
  externalMeetingId: string
  externalLeadId: string
  organizationId: string
  responsibleConsultantId: string | null
  title: string
  status: ExternalMeetingStatus
  scheduledFor: string
  completedAt: string | null
  updatedAt: string
  trace: ExternalCrmTrace
}

export type ExternalLeadListInput = {
  cursor?: string | null
  limit?: number
  updatedSince?: string | null
  assignedConsultantId?: string | null
  status?: string | null
  stage?: string | null
  source?: string | null
}

export type ExternalLeadPage = {
  items: ExternalLead[]
  nextCursor: string | null
  hasMore: boolean
  synchronizedAt: string
}

export type ExternalMeetingListInput = {
  externalLeadId?: string | null
  responsibleConsultantId?: string | null
  status?: ExternalMeetingStatus | null
}

export type ExternalCrmConnectorCapabilities = {
  healthRead: boolean
  consultantsRead: boolean
  leadsRead: boolean
  cadenceRead: boolean
  timelineRead: boolean
  meetingsRead: boolean
  writes: boolean
}
