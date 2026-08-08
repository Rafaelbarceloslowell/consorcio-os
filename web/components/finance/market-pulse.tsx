"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  MarketIndicator,
  MarketIntelligenceView,
} from "@/types/market-intelligence"

function formatObservedAt(
  value: string,
): string {
  const [year, month, day] =
    value.split("-").map(Number)

  if (!year || !month || !day) {
    return value
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    ),
  )
}

function formatIndicator(
  indicator: MarketIndicator,
): string {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 2,
    },
  ).format(indicator.value)} ${indicator.unit}`
}

export function MarketPulse() {
  const [view, setView] =
    useState<
      MarketIntelligenceView | null
    >(null)
  const [failed, setFailed] =
    useState(false)

  useEffect(() => {
    const controller =
      new AbortController()

    async function load() {
      try {
        const response =
          await fetch(
            "/api/market-intelligence",
            {
              signal:
                controller.signal,
            },
          )

        if (!response.ok) {
          throw new Error(
            "Market Intelligence indisponível.",
          )
        }

        setView(
          await response.json() as MarketIntelligenceView,
        )
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return
        }

        setFailed(true)
      }
    }

    void load()

    return () => controller.abort()
  }, [])

  return (
    <section
      className="mx-6 mb-6 rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.055] p-5"
      data-testid="market-pulse"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63C68C]">
            Market Intelligence
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Market Pulse oficial
          </h2>
        </div>
        <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-[#96A0AF]">
          Fonte: Banco Central do Brasil
        </span>
      </div>

      {!view && !failed ? (
        <p className="mt-4 text-sm text-[#96A0AF]">
          Carregando dados oficiais...
        </p>
      ) : null}

      {failed ||
      view?.status ===
        "unavailable" ? (
        <p className="mt-4 text-sm text-amber-100/75">
          Dados de mercado temporariamente indisponíveis. Nenhum valor foi presumido.
        </p>
      ) : null}

      {view &&
      view.indicators.length > 0 ? (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {view.indicators.map(
              (indicator) => (
                <article
                  key={indicator.key}
                  className="rounded-xl border border-white/[0.07] bg-black/10 p-4"
                >
                  <p className="text-xs leading-5 text-[#96A0AF]">
                    {indicator.name}
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatIndicator(
                      indicator,
                    )}
                  </p>
                  <p className="mt-2 text-[11px] text-[#697384]">
                    Referência: {formatObservedAt(
                      indicator.observedAt,
                    )}
                    {indicator.stale
                      ? " · último valor conhecido (stale)"
                      : " · atualizado"}
                  </p>
                  <a
                    className="mt-3 inline-flex text-[11px] font-semibold text-[#63C68C] underline decoration-[#63C68C]/30 underline-offset-4"
                    href={indicator.sourceReference}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar fonte oficial
                  </a>
                </article>
              ),
            )}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ContextBlock
              label="Fato"
              value={
                view.contexts[0]
                  ?.fact ?? ""
              }
            />
            <ContextBlock
              label="Interpretação"
              value={
                view.contexts[0]
                  ?.interpretation ?? ""
              }
            />
            <ContextBlock
              label="Uso comercial seguro"
              value={
                view.contexts[0]
                  ?.commercialRecommendation ??
                ""
              }
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-amber-100/65">
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
    <div className="rounded-xl border border-white/[0.06] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#B7C0CC]">
        {value}
      </p>
    </div>
  )
}
