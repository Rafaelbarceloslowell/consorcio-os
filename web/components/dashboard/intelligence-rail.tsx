import {
  Activity,
  Clock3,
  Radar,
} from "lucide-react"
import Link from "next/link"

import {
  MarketPulse,
} from "@/components/finance/market-pulse"
import type {
  MissionControlOpportunityView,
} from "@/types/dashboard"
import { formatRelativeTime } from "@/lib/formatters"

export function IntelligenceRail({
  opportunities,
  criticalCount,
  importantCount,
  monitoringCount,
}: Readonly<{
  opportunities: MissionControlOpportunityView[]
  criticalCount: number
  importantCount: number
  monitoringCount: number
}>) {
  const recent = [...opportunities]
    .sort((first, second) => (
      new Date(second.updatedAt).getTime() -
      new Date(first.updatedAt).getTime()
    ))
    .slice(0, 4)

  return (
    <aside
      aria-label="Inteligência comercial"
      className="space-y-4 xl:sticky xl:top-[100px] xl:self-start"
    >
      <MarketPulse compact />

      <section className="gorilla-panel overflow-hidden">
        <header className="flex items-center gap-3 border-b border-[var(--gorila-line)] px-5 py-4">
          <Activity className="size-4 text-[var(--gorila-bronze)]" strokeWidth={1.7} />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--gorila-text-muted)]">
              Operação
            </p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--gorila-text)]">
              Atividade recente
            </h2>
          </div>
        </header>

        {recent.length === 0 ? (
          <p className="px-5 py-6 text-xs leading-5 text-[var(--gorila-text-muted)]">
            Nenhuma movimentação recente registrada.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--gorila-line)] px-5">
            {recent.map((opportunity) => (
              <li key={opportunity.id} className="py-3.5">
                <Link
                  href={`/opportunities/${encodeURIComponent(opportunity.id)}`}
                  className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
                >
                  <span className="block truncate text-xs font-medium text-[var(--gorila-text-soft)] group-hover:text-[var(--gorila-text)]">
                    {opportunity.originName}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-3 text-[10px] text-[var(--gorila-text-muted)]">
                    <span className="truncate">{opportunity.phaseName} · {opportunity.stateName}</span>
                    <span className="shrink-0">{formatRelativeTime(opportunity.updatedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="gorilla-panel p-5">
        <div className="flex items-center gap-3">
          <Radar className="size-4 text-[var(--gorila-green-bright)]" strokeWidth={1.7} />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--gorila-text-muted)]">
              Performance
            </p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--gorila-text)]">
              Ritmo operacional
            </h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["Críticas", criticalCount],
            ["Importantes", importantCount],
            ["Monitorar", monitoringCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[var(--gorila-line)] bg-black/10 px-2 py-3 text-center">
              <span className="block text-lg font-semibold text-[var(--gorila-text)]">{value}</span>
              <span className="mt-1 block text-[8px] uppercase tracking-[0.08em] text-[var(--gorila-text-muted)]">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-[var(--gorila-text-muted)]">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" />
          Leitura baseada somente nas ações abertas da operação atual.
        </p>
      </section>
    </aside>
  )
}
