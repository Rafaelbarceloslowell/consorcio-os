import {
  ArrowUpRight,
  Target,
} from "lucide-react"
import Link from "next/link"

import {
  formatCompactCurrency,
} from "@/lib/formatters"
import type {
  PipelineStage,
} from "@/types/dashboard"

export function PipelineOverview({
  pipeline,
}: Readonly<{
  pipeline: PipelineStage[]
}>) {
  const largestValue = Math.max(
    ...pipeline.map((stage) => stage.value),
    1,
  )

  return (
    <section
      id="pipeline"
      aria-labelledby="pipeline-overview-title"
      className="gorilla-panel overflow-hidden"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[var(--gorila-line)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--gorila-green-soft)] text-[var(--gorila-green-bright)]">
            <Target className="size-4" strokeWidth={1.7} />
          </span>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--gorila-bronze)]">
              Leitura operacional
            </p>
            <h2
              id="pipeline-overview-title"
              className="mt-1 text-base font-semibold text-[var(--gorila-text)]"
            >
              Pipeline de oportunidades
            </h2>
          </div>
        </div>

        <Link
          href="/opportunities/new"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--gorila-line)] px-3 text-[10px] font-medium text-[var(--gorila-text-soft)] transition hover:border-[var(--gorila-green)] hover:bg-[var(--gorila-green-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
        >
          Nova oportunidade
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      {pipeline.length === 0 ? (
        <p className="px-6 py-8 text-sm text-[var(--gorila-text-muted)]">
          Nenhuma etapa comercial disponível para este workspace.
        </p>
      ) : (
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {pipeline.map((stage) => {
            const progress = Math.max(
              stage.value > 0 ? 6 : 0,
              Math.round((stage.value / largestValue) * 100),
            )

            return (
              <article
                key={stage.id}
                className="grid items-center gap-2 sm:grid-cols-[minmax(120px,0.8fr)_minmax(0,2fr)_auto] sm:gap-4"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-medium text-[var(--gorila-text-soft)]">
                    {stage.name}
                  </h3>
                  <p className="mt-1 text-[10px] text-[var(--gorila-text-muted)]">
                    {stage.count} {stage.count === 1 ? "oportunidade" : "oportunidades"}
                  </p>
                </div>

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-black/25"
                  aria-label={`${stage.name}: ${progress}% do maior volume do pipeline`}
                >
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[var(--gorila-green)] to-[var(--gorila-bronze)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="whitespace-nowrap text-xs font-medium tabular-nums text-[var(--gorila-text)] sm:min-w-24 sm:text-right">
                  {formatCompactCurrency(stage.value)}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
