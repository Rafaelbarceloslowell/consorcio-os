import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricsGrid } from "@/components/dashboard/metrics-grid"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { OpportunityList } from "@/components/dashboard/opportunity-list"

import { formatCurrency } from "@/lib/formatters"
import type { DashboardData } from "@/types/dashboard"

type DashboardContentProps = Pick<
  DashboardData,
  | "user"
  | "summary"
  | "metrics"
  | "tasks"
  | "opportunities"
  | "intelligence"
  | "gorilaR2"
>

export function DashboardContent({
  user,
  summary,
  metrics,
  tasks,
  opportunities = [],
  intelligence,
  gorilaR2,
}: DashboardContentProps) {
  const criticalCount =
    intelligence?.criticalCount ??
    tasks.filter((task) => task.priority === "high").length

  const importantCount =
    intelligence?.importantCount ??
    tasks.filter((task) => task.priority === "medium").length

  const monitoringCount =
    intelligence?.monitoringCount ??
    tasks.filter((task) => task.priority === "low").length

  const nextAction =
    gorilaR2?.nextAction?.title ??
    intelligence?.nextAction ??
    tasks[0]?.title ??
    "Revisar o pipeline comercial"

  const confidenceLabel = {
    high: "Alta confiança",
    medium: "Confiança média",
    low: "Baixa confiança",
  }[gorilaR2?.confidence ?? "medium"]

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-7 px-4 py-4 sm:px-6 sm:py-6 lg:gap-8 lg:px-8 lg:py-8 2xl:px-10">
        <DashboardHeader
          user={user}
          summary={summary}
          priorityCount={criticalCount}
          gorilaR2={gorilaR2}
        />

        <MetricsGrid metrics={metrics} />


        <section
          aria-label="Próximas tarefas"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.5fr)]"
        >
          <UpcomingTasks tasks={tasks} />

          <aside
            aria-labelledby="r2-operational-title"
            className="gorila-material relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#15191F]/88 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-2px_1px_rgba(0,0,0,0.26),0_4px_6px_rgba(0,0,0,0.24),0_22px_48px_rgba(0,0,0,0.23)] backdrop-blur-xl sm:p-6"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-[#2F8F5B]/[0.09] blur-3xl"
            />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
                    Inteligência operacional
                  </p>

                  <h2
                    id="r2-operational-title"
                    className="mt-2 text-lg font-semibold tracking-[-0.035em] text-[#F5F7FA]"
                  >
                    {gorilaR2?.greeting ?? "R2 em atividade"}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#697384]">
                    {confidenceLabel}
                  </span>

                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#3FB980] opacity-30" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-[#3FB980]" />
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#96A0AF]">
                {gorilaR2?.analysis ??
                  "O copiloto organizou seu dia por urgência e potencial de avanço."}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-[#E16A6A]/15 bg-[#E16A6A]/[0.055] p-3">
                  <span className="block text-xl font-semibold tracking-[-0.05em] text-[#E98A8A]">
                    {criticalCount}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#E98A8A]/75">
                    Crítico
                  </span>
                </div>

                <div className="rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.07] p-3">
                  <span className="block text-xl font-semibold tracking-[-0.05em] text-[#43A972]">
                    {importantCount}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#43A972]/75">
                    Importante
                  </span>
                </div>

                <div className="rounded-2xl border border-white/[0.055] bg-black/[0.12] p-3">
                  <span className="block text-xl font-semibold tracking-[-0.05em] text-[#D6DBE3]">
                    {monitoringCount}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#697384]">
                    Acompanhar
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.08] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#43A972]">
                  Recomendação
                </p>

                <p className="mt-2 text-sm font-medium leading-6 text-[#F5F7FA]">
                  {gorilaR2?.recommendation ?? `Comece por: ${nextAction}`}
                </p>

                {gorilaR2?.reason ? (
                  <p className="mt-2 text-xs leading-5 text-[#96A0AF]">
                    {gorilaR2.reason}
                  </p>
                ) : null}
              </div>

              <div className="mt-auto pt-4">
                <div className="rounded-2xl border border-white/[0.055] bg-black/[0.12] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#697384]">
                    Próxima ação
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-[#D6DBE3]">
                    {nextAction}
                  </p>

                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-[#697384]">
                    Maior potencial
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#D6DBE3]">
                    {intelligence?.topOpportunity
                      ? `${intelligence.topOpportunity.name} · ${formatCurrency(
                          intelligence.topOpportunity.value,
                        )} · score ${intelligence.topOpportunity.score}`
                      : `${formatCurrency(
                          intelligence?.pipelineValue ?? 0,
                        )} em oportunidades ativas`}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <OpportunityList opportunities={opportunities} />
      </div>
    </main>
  )
}

