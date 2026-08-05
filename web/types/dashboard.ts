import type {
  R2Behavior,
} from "@/components/dashboard/3d/r2-behavior"

import type {
  CommercialActionStatus,
  CommercialActionType,
  CommercialJourneyOutcome,
  NextBestActionPriority,
} from "@/types/domain"

export type User = {
  id: string
  name: string
  positionTitle?: string
}

export type DashboardMetrics = {
  newLeads: number
  meetingsToday: number
  monthlySales: number
  pendingTasks: number
}

export type Meeting = {
  id: string
  title: string
  time: string
  clientName: string
}

export type TaskPriority = "high" | "medium" | "low"

export type Task = {
  id: string
  title: string
  time: string
  priority: TaskPriority
}

export type PipelineStage = {
  id: string
  name: string
  count: number
  value: number
}

export type MissionControlOpportunityView = {
  id: string
  title: string
  origin: "lead" | "client"
  originName: string
  consultantName: string
  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "URGENT"
  score: number
  phaseName: string
  stateName: string
  consortiumType:
    | "real_estate"
    | "vehicle"
    | "heavy_vehicle"
    | "services"
    | "other"
  lastInteractionAt: string | null
  updatedAt: string
  status: "open" | "closed"
  outcome: CommercialJourneyOutcome | null
}

export type DashboardPriorityLevel =
  | "critical"
  | "important"
  | "monitoring"
  | "completed"

export type DashboardScheduledFollowUp = {
  taskId: string
  title: string
  contactName: string
  dueAt: string
  dateLabel: string
  time: string
}

export type DashboardIntelligence = {
  criticalCount: number
  importantCount: number
  monitoringCount: number
  reactivatedLeads?: number
  unpreparedMeetings: number
  staleOpportunities: number
  pipelineValue: number
  nextAction?: string
  scheduledFollowUp?: DashboardScheduledFollowUp
  topOpportunity?: {
    id: string
    name: string
    value: number
    score: number
  }
}

export type GorilaR2Confidence =
  | "high"
  | "medium"
  | "low"

export type GorilaR2PilotAction = {
  recommendationId: string
  journeyId: string
  journeyTitle: string
  opportunityHref: string
  actionType: CommercialActionType
  title: string
  description: string | null
  reason: string
  priority: NextBestActionPriority
  confidence: number
  requiresConversationContext?: boolean
}



export type GorilaR2PendingAction = {
  actionId: string
  journeyId: string
  journeyTitle: string
  opportunityHref: string
  actionType: CommercialActionType
  status: CommercialActionStatus
  title: string
  description: string | null
  scheduledFor: string | null
}

export type GorilaR2Briefing = {
  greeting: string
  analysis: string
  recommendation: string
  reason: string
  confidence: GorilaR2Confidence

  nextAction?: {
    title: string
    priority: TaskPriority
  }

  pilotAction?: GorilaR2PilotAction
  pendingAction?: GorilaR2PendingAction

  generatedAt: string
}

export type DashboardData = {
  workspaceId?: string
  user: User
  summary: string
  metrics: DashboardMetrics
  meetings: Meeting[]
  tasks: Task[]
  pipeline: PipelineStage[]
  opportunities?: MissionControlOpportunityView[]
  intelligence?: DashboardIntelligence
  gorilaR2?: GorilaR2Briefing
  gorilaR2Behavior?: R2Behavior
}
