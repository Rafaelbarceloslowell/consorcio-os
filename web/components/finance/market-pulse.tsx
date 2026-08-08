"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  MarketIndicator,
  MarketIntelligenceView,
} from "@/types/market-intelligence"

function formatObservedAt(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

function formatIndicator(indicator: MarketIndicator) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(indicator.value)} ${indicator.unit}`
}

export function MarketPulse({
  compact = false,
}: Readonly<{
  compact?: boolean
}>) {
  const [view, setView] = useState<MarketIntelligenceView | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch("/api/market-intelligence", {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Market Intelligence indisponível.")
        }

        setView(await response.json() as MarketIntelligenceView)
      }
      catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setFailed(true)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  return (
    <section
      className={["gorilla-panel overflow-hidden", compact ? "" : "mx-6 mb-6"].join(" ")}
      data-testid="market-pulse"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--gorila-line)] px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--gorila-green-bright)]">
            Market Intelligence
            <span className="size-1.5 rounded-full bg-[var(--gorila-green-bright)]" />
          </p>
          <h2 className="mt-1 text-sm font-semibold">Market Pulse</h2>
        </div>
        <span className="text-right text-[9px] uppercase leading-4 tracking-[0.08em] text-[var(--gorila-text-muted)]">
          Banco Central<br />do Brasil
        </span>
      </header>

      {!view && !failed ? (
        <p className="px-5 py-5 text-xs text-[var(--gorila-text-muted)]">
          Carregando dados oficiais...
        </p>
      ) : null}

      {failed || view?.status === "unavailable" ? (
        <p className="px-5 py-5 text-xs leading-5 text-amber-100/75">
          Dados de mercado temporariamente indisponíveis. Nenhum valor foi presumido.
        </p>
      ) : null}

      {view && view.indicators.length > 0 ? (
        <>
          <div className={compact
            ? "divide-y divide-[var(--gorila-line)] px-5"
            : "grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4"
          }>
            {view.indicators.map((indicator) => (
              <article
                key={indicator.key}
                className={compact
                  ? "py-3.5"
                  : "rounded-xl border border-[var(--gorila-line)] bg-black/10 p-4"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] leading-5 text-[var(--gorila-text-soft)]">
                    {indicator.name}
                  </p>
                  <p className={compact
                    ? "shrink-0 text-xs font-semibold tabular-nums"
                    : "shrink-0 text-lg font-semibold tabular-nums"
                  }>
                    {formatIndicator(indicator)}
                  </p>
                </div>
                <p className="mt-1 text-[9px] leading-4 text-[var(--gorila-text-muted)]">
                  Referência: {formatObservedAt(indicator.observedAt)}
                  {indicator.stale
                    ? " · último valor conhecido (stale)"
                    : " · atualizado"}
                </p>
                <a
                  className="mt-1 inline-flex text-[9px] font-semibold text-[var(--gorila-green-bright)] underline decoration-[var(--gorila-green)] underline-offset-4"
                  href={indicator.sourceReference}
                  target="_blank"
                  rel="noreferrer"
                >
                  Consultar fonte oficial
                </a>
              </article>
            ))}
          </div>

          {!compact ? (
            <div className="grid gap-3 px-5 pb-5 lg:grid-cols-3">
              <ContextBlock label="Fato" value={view.contexts[0]?.fact ?? ""} />
              <ContextBlock label="Interpretação" value={view.contexts[0]?.interpretation ?? ""} />
              <ContextBlock label="Uso comercial seguro" value={view.contexts[0]?.commercialRecommendation ?? ""} />
            </div>
          ) : null}

          <p className="border-t border-[var(--gorila-line)] px-5 py-4 text-[9px] leading-4 text-amber-100/65">
            {view.message} As médias oficiais não substituem uma proposta individual e não garantem resultado.
          </p>
        </>
      ) : null}
    </section>
  )
}

function ContextBlock({
  label,
  value,
}: Readonly<{
  label: string
  value: string
}>) {
  return (
    <div className="rounded-xl border border-[var(--gorila-line)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gorila-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-[var(--gorila-text-soft)]">
        {value}
      </p>
    </div>
  )
}
