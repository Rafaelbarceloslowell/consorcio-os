import type {
  MarketIntelligenceProvider,
} from "./market-intelligence-provider"

import type {
  MarketIndicator,
  MarketIndicatorKey,
} from "@/types/market-intelligence"

type CachedMarketIntelligenceProviderOptions = {
  ttlMs?: number
  now?: () => Date
}

export class CachedMarketIntelligenceProvider
implements MarketIntelligenceProvider {
  private readonly ttlMs: number
  private readonly now: () => Date
  private expiresAt = 0
  private lastKnownGood =
    new Map<
      MarketIndicatorKey,
      MarketIndicator
    >()

  constructor(
    private readonly delegate:
      MarketIntelligenceProvider,
    options:
      CachedMarketIntelligenceProviderOptions = {},
  ) {
    this.ttlMs =
      options.ttlMs ??
      60 * 60 * 1000
    this.now =
      options.now ?? (() => new Date())
  }

  async fetchIndicators(): Promise<
    readonly MarketIndicator[]
  > {
    const now = this.now()

    if (
      this.lastKnownGood.size > 0 &&
      now.getTime() < this.expiresAt
    ) {
      return [
        ...this.lastKnownGood.values(),
      ]
    }

    try {
      const fresh =
        await this.delegate.fetchIndicators()

      for (const cached of this.lastKnownGood.values()) {
        this.lastKnownGood.set(
          cached.key,
          {
            ...cached,
            stale: true,
          },
        )
      }

      for (const indicator of fresh) {
        this.lastKnownGood.set(
          indicator.key,
          {
            ...indicator,
            stale:
              indicator.stale,
          },
        )
      }

      if (this.lastKnownGood.size === 0) {
        throw new Error(
          "Nenhum indicador de mercado foi retornado.",
        )
      }

      this.expiresAt =
        now.getTime() + this.ttlMs

      return [
        ...this.lastKnownGood.values(),
      ]
    } catch (error) {
      if (this.lastKnownGood.size === 0) {
        throw error
      }

      this.expiresAt =
        now.getTime() + this.ttlMs

      return [
        ...this.lastKnownGood.values(),
      ].map((indicator) => ({
        ...indicator,
        stale: true,
      }))
    }
  }
}
