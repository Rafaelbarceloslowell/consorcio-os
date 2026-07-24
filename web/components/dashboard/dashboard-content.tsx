import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricsGrid } from "@/components/dashboard/metrics-grid"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import type { DashboardData } from "@/types/dashboard"

type DashboardContentProps = Pick<
  DashboardData,
  "user" | "summary" | "metrics" | "tasks"
>

export function DashboardContent({
  user,
  summary,
  metrics,
  tasks,
}: DashboardContentProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <DashboardHeader user={user} summary={summary} />

      <MetricsGrid metrics={metrics} />

      <section aria-label="Próximas tarefas">
        <UpcomingTasks tasks={tasks} />
      </section>
    </div>
  )
}
