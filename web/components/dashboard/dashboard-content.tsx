import {
  DashboardHeader,
} from "@/components/dashboard/dashboard-header"
import {
  IntelligenceRail,
} from "@/components/dashboard/intelligence-rail"
import {
  MetricsGrid,
} from "@/components/dashboard/metrics-grid"
import {
  OpportunityList,
} from "@/components/dashboard/opportunity-list"
import {
  PipelineOverview,
} from "@/components/dashboard/pipeline-overview"
import {
  UpcomingTasks,
} from "@/components/dashboard/upcoming-tasks"
import {
  R2DailyMission,
} from "@/components/dashboard/r2-daily-mission"
import type {
  DashboardData,
} from "@/types/dashboard"

type DashboardContentProps = Pick<
  DashboardData,
  | "workspaceId"
  | "user"
  | "summary"
  | "metrics"
  | "tasks"
  | "pipeline"
  | "opportunities"
  | "intelligence"
  | "gorilaR2"
  | "gorilaR2Behavior"
>

export function DashboardContent({
  workspaceId,
  user,
  summary,
  metrics,
  tasks,
  pipeline,
  opportunities = [],
  intelligence,
  gorilaR2,
  gorilaR2Behavior,
}: DashboardContentProps) {
  const criticalCount = intelligence?.criticalCount ??
    tasks.filter((task) => task.priority === "high").length
  const importantCount = intelligence?.importantCount ??
    tasks.filter((task) => task.priority === "medium").length
  const monitoringCount = intelligence?.monitoringCount ??
    tasks.filter((task) => task.priority === "low").length

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid w-full max-w-[1640px] gap-5 px-4 py-4 sm:px-5 sm:py-5 min-[1400px]:grid-cols-[minmax(0,1fr)_310px] 2xl:px-7">
        <div className="min-w-0 space-y-5">
          <DashboardHeader
            workspaceId={workspaceId}
            user={user}
            summary={summary}
            priorityCount={criticalCount}
            gorilaR2={gorilaR2}
            behavior={gorilaR2Behavior}
          />

          <R2DailyMission />

          <MetricsGrid
            metrics={metrics}
            pipelineValue={intelligence?.pipelineValue}
          />

          <section
            aria-label="Execução e pipeline"
            className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          >
            <UpcomingTasks tasks={tasks} />
            <PipelineOverview pipeline={pipeline} />
          </section>

          <OpportunityList opportunities={opportunities} />
        </div>

        <IntelligenceRail
          opportunities={opportunities}
          criticalCount={criticalCount}
          importantCount={importantCount}
          monitoringCount={monitoringCount}
        />
      </div>
    </main>
  )
}
