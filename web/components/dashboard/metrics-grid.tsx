import {
  CalendarCheck,
  CircleDollarSign,
  ListTodo,
  UserPlus,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { formatCurrency } from "@/lib/formatters"
import type { DashboardMetrics } from "@/types/dashboard"

type MetricsGridProps = {
  metrics: DashboardMetrics
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const items = [
    {
      key: "new-leads",
      title: "Leads novos",
      value: String(metrics.newLeads),
      icon: UserPlus,
      iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      key: "meetings-today",
      title: "Reuniões hoje",
      value: String(metrics.meetingsToday),
      icon: CalendarCheck,
      iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      key: "monthly-sales",
      title: "Vendas no mês",
      value: formatCurrency(metrics.monthlySales),
      icon: CircleDollarSign,
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "pending-tasks",
      title: "Tarefas pendentes",
      value: String(metrics.pendingTasks),
      icon: ListTodo,
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <section
      aria-label="Indicadores da operação"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <StatCard
          key={item.key}
          title={item.title}
          value={item.value}
          icon={item.icon}
          iconClassName={item.iconClassName}
        />
      ))}
    </section>
  )
}
