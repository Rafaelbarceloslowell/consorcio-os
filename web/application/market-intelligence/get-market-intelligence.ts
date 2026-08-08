import {
  BcbMarketIntelligenceProvider,
} from "@/infrastructure/market-intelligence/bcb-market-intelligence-provider"

import {
  buildMarketIntelligenceView,
} from "./build-market-intelligence-view"
import {
  CachedMarketIntelligenceProvider,
} from "./cached-market-intelligence-provider"

import type {
  MarketIntelligenceView,
} from "@/types/market-intelligence"

const provider =
  new CachedMarketIntelligenceProvider(
    new BcbMarketIntelligenceProvider(),
  )

export async function getMarketIntelligence(): Promise<
  MarketIntelligenceView
> {
  try {
    return buildMarketIntelligenceView(
      await provider.fetchIndicators(),
    )
  } catch {
    return buildMarketIntelligenceView(
      [],
    )
  }
}
