import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  CachedMarketIntelligenceProvider,
} from "./cached-market-intelligence-provider"

import type {
  MarketIndicator,
} from "@/types/market-intelligence"

const indicator: MarketIndicator = {
  key: "selic_target",
  name: "Meta Selic",
  value: 14.75,
  unit: "% a.a.",
  observedAt: "2026-08-07",
  fetchedAt:
    "2026-08-08T12:00:00.000Z",
  source:
    "Banco Central do Brasil",
  sourceReference:
    "https://api.bcb.gov.br/",
  stale: false,
}

describe(
  "CachedMarketIntelligenceProvider",
  () => {
    it(
      "evita refetch dentro do TTL e retorna último valor conhecido como stale na falha",
      async () => {
        let now =
          new Date(
            "2026-08-08T12:00:00.000Z",
          )
        const fetchIndicators =
          vi.fn()
            .mockResolvedValueOnce([
              indicator,
            ])
            .mockRejectedValueOnce(
              new Error(
                "BCB indisponível",
              ),
            )
        const provider =
          new CachedMarketIntelligenceProvider(
            { fetchIndicators },
            {
              ttlMs: 1000,
              now: () => now,
            },
          )

        await expect(
          provider.fetchIndicators(),
        ).resolves.toMatchObject([
          { stale: false },
        ])
        await provider.fetchIndicators()
        expect(
          fetchIndicators,
        ).toHaveBeenCalledTimes(1)

        now = new Date(
          "2026-08-08T12:00:02.000Z",
        )

        await expect(
          provider.fetchIndicators(),
        ).resolves.toMatchObject([
          { stale: true },
        ])
      },
    )

    it(
      "propaga indisponibilidade quando ainda não existe snapshot",
      async () => {
        const provider =
          new CachedMarketIntelligenceProvider({
            fetchIndicators:
              vi.fn().mockRejectedValue(
                new Error(
                  "sem conexão",
                ),
              ),
          })

        await expect(
          provider.fetchIndicators(),
        ).rejects.toThrow(
          "sem conexão",
        )
      },
    )
  },
)
