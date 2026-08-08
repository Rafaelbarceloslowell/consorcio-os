import {
  CalendarCheck,
  ChartNoAxesCombined,
  CircleDollarSign,
  ListTodo,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { formatCompactCurrency } from "@/lib/formatters"
import type { DashboardMetrics } from "@/types/dashboard"

type MetricsGridProps = {
  metrics: DashboardMetrics
  pipelineValue?: number
}

type MetricItem = {
  key: string
  title: string
  description: string
  value: string
  icon: LucideIcon
  iconClassName: string
  accentClassName: string
}

export function MetricsGrid({
  metrics,
  pipelineValue,
}: MetricsGridProps) {
  const items: MetricItem[] = [
    {
      key: "new-leads",
      title: "Novas oportunidades",
      description: "Quem entrou hoje e precisa do primeiro contato",
      value: String(metrics.newLeads),
      icon: UserPlus,
      iconClassName:
        "border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]",
      accentClassName:
        "from-[#43A972]/55 via-[#2F8F5B]/15 to-transparent",
    },
    {
      key: "meetings-today",
      title: "Compromissos hoje",
      description: "Conversas que exigem preparação hoje",
      value: String(metrics.meetingsToday),
      icon: CalendarCheck,
      iconClassName:
        "border-white/[0.08] bg-white/[0.04] text-[#D6DBE3]",
      accentClassName:
        "from-white/25 via-white/[0.06] to-transparent",
    },
    {
      key: "monthly-sales",
      title: "Produção no mês",
      description: "Quanto a operação já converteu neste mês",
      value: formatCompactCurrency(metrics.monthlySales),
      icon: CircleDollarSign,
      iconClassName:
        "border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]",
      accentClassName:
        "from-[#43A972]/55 via-[#2F8F5B]/15 to-transparent",
    },
    {
      key: "pending-tasks",
      title: "Ações pendentes",
      description: "O que ainda bloqueia avanço hoje",
      value: String(metrics.pendingTasks),
      icon: ListTodo,
      iconClassName:
        "border-white/[0.08] bg-white/[0.04] text-[#D6DBE3]",
      accentClassName:
        "from-white/25 via-white/[0.06] to-transparent",
    },
  ]

  if (pipelineValue !== undefined) {
    items.splice(3, 0, {
      key: "pipeline-value",
      title: "Pipeline ativo",
      description: "Volume potencial nas etapas comerciais",
      value: formatCompactCurrency(pipelineValue),
      icon: ChartNoAxesCombined,
      iconClassName:
        "border-[#8A7557]/25 bg-[#8A7557]/[0.10] text-[#A9906A]",
      accentClassName:
        "from-[#8A7557]/55 via-[#8A7557]/15 to-transparent",
    })
  }

  return (
    <section
      aria-labelledby="operation-overview-title"
      className="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
            Desempenho atual
          </p>

          <h2
            id="operation-overview-title"
            className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#F5F7FA]"
          >
            Visão da operação
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#96A0AF]">
            Os indicadores que podem exigir uma decisão sua hoje.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.055] bg-white/[0.025] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#697384]">
          <span className="size-1.5 rounded-full bg-[#3FB980]" />
          Atualizado agora
        </div>
      </div>

      <div className="gorilla-kpi-strip gorilla-panel grid overflow-hidden">
        {items.map((item) => (
          <StatCard
            key={item.key}
            title={item.title}
            description={item.description}
            value={item.value}
            icon={item.icon}
            iconClassName={item.iconClassName}
            accentClassName={item.accentClassName}
          />
        ))}
      </div>
    </section>
  )
}
