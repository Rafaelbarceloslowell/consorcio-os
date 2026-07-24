import { getDashboardData } from "@/application/dashboard/get-dashboard-data"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function MissionControlPage() {
  const dashboardData = getDashboardData({
    now: new Date("2026-07-21T12:00:00.000Z"),
  })

  return <DashboardShell {...dashboardData} />
}