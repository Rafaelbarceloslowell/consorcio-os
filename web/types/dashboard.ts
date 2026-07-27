export type User = {
  id: string
  name: string
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
  outcome:
    CommercialJourneyOutcome | null
}

export type DashboardPriorityLevel =
  | "critical"
  | "important"
  | "monitoring"
  | "completed"

export type DashboardIntelligence = {
  criticalCount: number
  importantCount: number
  monitoringCount: number
  unpreparedMeetings: number
  staleOpportunities: number
  pipelineValue: number
  nextAction?: string
  topOpportunity?: {
    id: string
    name: string
    value: number
    score: number
  }
}

export type DashboardData = {
  user: User
  summary: string
  metrics: DashboardMetrics
  meetings: Meeting[]
  tasks: Task[]
  pipeline: PipelineStage[]
  opportunities?:
    MissionControlOpportunityView[]
  intelligence?: DashboardIntelligence
}
import type {
  CommercialJourneyOutcome,
} from "@/types/domain"
