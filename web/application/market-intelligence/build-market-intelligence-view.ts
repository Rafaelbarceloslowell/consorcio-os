import {
  MARKET_INDICATOR_KEYS,
} from "@/types/market-intelligence"

import type {
  MarketCommercialContext,
  MarketIndicator,
  MarketIntelligenceView,
} from "@/types/market-intelligence"

function formatValue(
  indicator: MarketIndicator,
): string {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 2,
    },
  ).format(indicator.value)} ${indicator.unit}`
}

function buildContext(
  indicator: MarketIndicator,
): MarketCommercialContext {
  const fact =
    `${indicator.name}: ${formatValue(indicator)}, observado em ${indicator.observedAt}.`

  switch (indicator.key) {
    case "selic_target":
      return {
        indicatorKey:
          indicator.key,
        fact,
        interpretation:
          "A Meta Selic é uma referência macroeconômica; ela não representa diretamente a taxa final oferecida a um cliente.",
        commercialRecommendation:
          "Use o dado para contextualizar o custo do dinheiro e descobrir quanto planejamento e previsibilidade importam para o cliente.",
        warning:
          "Não transforme a Selic em taxa de financiamento nem em promessa de economia.",
      }

    case "vehicle_financing_pf":
    case "real_estate_financing_pf":
      return {
        indicatorKey:
          indicator.key,
        fact,
        interpretation:
          "A série mostra a média de novas operações no período, não uma proposta individual nem a taxa disponível para todo cliente.",
        commercialRecommendation:
          "Compare alternativas somente com valor, prazo, entrada, custos e taxa efetivamente informados para o caso concreto.",
        warning:
          "Não afirme que consórcio é sempre melhor nem que financiamento é sempre pior.",
      }

    case "consortium_active_quotas":
      return {
        indicatorKey:
          indicator.key,
        fact,
        interpretation:
          "O volume agregado dimensiona o segmento, mas não comprova desempenho, contemplação ou adequação de um plano específico.",
        commercialRecommendation:
          "Use como contexto institucional e volte a conversa para objetivo, prazo e capacidade do cliente.",
        warning:
          "Não use o agregado como prova de resultado individual.",
      }
  }
}

export function buildMarketIntelligenceView(
  indicators:
    readonly MarketIndicator[],
): MarketIntelligenceView {
  const availableKeys =
    new Set(
      indicators.map(
        (indicator) =>
          indicator.key,
      ),
    )
  const unavailableKeys =
    MARKET_INDICATOR_KEYS.filter(
      (key) =>
        !availableKeys.has(key),
    )
  const status =
    indicators.length === 0
      ? "unavailable"
      : unavailableKeys.length > 0 ||
          indicators.some(
            (indicator) =>
              indicator.stale,
          )
        ? "partial"
        : "available"
  const updatedAt =
    indicators
      .map((indicator) =>
        indicator.fetchedAt,
      )
      .sort()
      .at(-1) ?? null

  return {
    status,
    indicators,
    contexts:
      indicators.map(buildContext),
    unavailableKeys,
    updatedAt,
    message:
      status === "unavailable"
        ? "Dados de mercado temporariamente indisponíveis."
        : status === "partial"
          ? "Parte dos dados está indisponível ou usa o último valor conhecido, identificado como desatualizado."
          : "Dados oficiais atualizados pelo provedor do Banco Central.",
  }
}
