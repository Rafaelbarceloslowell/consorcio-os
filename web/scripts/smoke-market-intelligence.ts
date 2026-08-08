import {
  BcbMarketIntelligenceProvider,
} from "../infrastructure/market-intelligence/bcb-market-intelligence-provider"

const provider =
  new BcbMarketIntelligenceProvider({
    timeoutMs: 10000,
  })

async function main() {
  try {
    const indicators =
      await provider.fetchIndicators()

    console.log(
      JSON.stringify(
        indicators.map(
          (indicator) => ({
            key: indicator.key,
            observedAt:
              indicator.observedAt,
            source:
              indicator.source,
            stale:
              indicator.stale,
          }),
        ),
        null,
        2,
      ),
    )
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Smoke test do BCB falhou.",
    )
    process.exitCode = 1
  }
}

void main()
