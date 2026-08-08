import type {
  MarketIndicator,
} from "@/types/market-intelligence"

export interface MarketIntelligenceProvider {
  fetchIndicators(): Promise<
    readonly MarketIndicator[]
  >
}
