export const MARKET_INDICATOR_KEYS = [
  "selic_target",
  "vehicle_financing_pf",
  "real_estate_financing_pf",
  "consortium_active_quotas",
] as const

export type MarketIndicatorKey =
  (typeof MARKET_INDICATOR_KEYS)[number]

export type MarketIndicator = Readonly<{
  key: MarketIndicatorKey
  name: string
  value: number
  unit: string
  observedAt: string
  fetchedAt: string
  source: "Banco Central do Brasil"
  sourceReference: string | null
  stale: boolean
}>

export type MarketCommercialContext =
  Readonly<{
    indicatorKey:
      MarketIndicatorKey
    fact: string
    interpretation: string
    commercialRecommendation: string
    warning: string
  }>

export type MarketIntelligenceView =
  Readonly<{
    status:
      | "available"
      | "partial"
      | "unavailable"
    indicators:
      readonly MarketIndicator[]
    contexts:
      readonly MarketCommercialContext[]
    unavailableKeys:
      readonly MarketIndicatorKey[]
    updatedAt: string | null
    message: string
  }>
