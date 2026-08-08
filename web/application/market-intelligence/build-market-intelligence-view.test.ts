import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildMarketIntelligenceView,
} from "./build-market-intelligence-view"

import type {
  MarketIndicator,
} from "@/types/market-intelligence"

const indicator: MarketIndicator = {
  key: "vehicle_financing_pf",
  name:
    "Taxa média de financiamento de veículos para pessoas físicas",
  value: 26.44,
  unit: "% a.a.",
  observedAt: "2026-06-01",
  fetchedAt:
    "2026-08-08T12:00:00.000Z",
  source:
    "Banco Central do Brasil",
  sourceReference:
    "https://api.bcb.gov.br/",
  stale: false,
}

describe(
  "buildMarketIntelligenceView",
  () => {
    it(
      "separa fato, interpretação e recomendação comercial segura",
      () => {
        const view =
          buildMarketIntelligenceView([
            indicator,
          ])

        expect(view.status).toBe(
          "partial",
        )
        expect(
          view.contexts[0],
        ).toMatchObject({
          fact:
            expect.stringContaining(
              "26,44 % a.a.",
            ),
          interpretation:
            expect.stringContaining(
              "não uma proposta individual",
            ),
          commercialRecommendation:
            expect.stringContaining(
              "Compare alternativas somente",
            ),
          warning:
            expect.stringContaining(
              "consórcio é sempre melhor",
            ),
        })
      },
    )

    it(
      "não inventa fallback numérico quando não há dados",
      () => {
        expect(
          buildMarketIntelligenceView(
            [],
          ),
        ).toMatchObject({
          status: "unavailable",
          indicators: [],
          updatedAt: null,
          message:
            "Dados de mercado temporariamente indisponíveis.",
        })
      },
    )
  },
)
