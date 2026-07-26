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
  intelligence?: DashboardIntelligence
}
