import type {
  MarketIntelligenceProvider,
} from "@/application/market-intelligence/market-intelligence-provider"

import type {
  MarketIndicator,
  MarketIndicatorKey,
} from "@/types/market-intelligence"

type BcbMarketIntelligenceProviderOptions = {
  fetchFn?: typeof fetch
  now?: () => Date
  timeoutMs?: number
  consortiumLookbackQuarters?: number
}

type SgsSeriesConfiguration = {
  key: MarketIndicatorKey
  code: number
  name: string
  unit: string
  staleAfterDays: number
  sourceUrl: string
}

const BCB_SGS_BASE_URL =
  "https://api.bcb.gov.br/dados/serie"
const BCB_CONSORTIUM_BASE_URL =
  "https://olinda.bcb.gov.br/olinda/servico/PANORAMA_DE_CONSORCIOS/versao/v1/odata"
const BCB_CONSORTIUM_SOURCE_URL =
  "https://dadosabertos.bcb.gov.br/dataset/dados-agregados-do-segmento-de-consorcios"

function sgsSourceUrl(code: number): string {
  return `https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarGraficoPorId&hdOidSeriesSelecionadas=${code}`
}

const SGS_SERIES:
  readonly SgsSeriesConfiguration[] = [
    {
      key: "selic_target",
      code: 432,
      name: "Meta Selic definida pelo Copom",
      unit: "% a.a.",
      staleAfterDays: 7,
      sourceUrl: sgsSourceUrl(432),
    },
    {
      key: "vehicle_financing_pf",
      code: 20749,
      name: "Taxa média de financiamento de veículos para pessoas físicas",
      unit: "% a.a.",
      staleAfterDays: 120,
      sourceUrl: sgsSourceUrl(20749),
    },
    {
      key: "real_estate_financing_pf",
      code: 20772,
      name: "Taxa média de financiamento imobiliário para pessoas físicas",
      unit: "% a.a.",
      staleAfterDays: 120,
      sourceUrl: sgsSourceUrl(20772),
    },
  ]

type SgsRecord = {
  data: string
  valor: string
}

type ConsortiumMetricRecord = {
  DataBase: number
  IdMetrica: string
  Metrica: string
  Valor: number
  Unidade: string
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null
}

function parseSgsRecord(
  value: unknown,
): SgsRecord | null {
  if (!isRecord(value)) {
    return null
  }

  return typeof value.data === "string" &&
    typeof value.valor === "string"
    ? {
        data: value.data,
        valor: value.valor,
      }
    : null
}

function parseConsortiumRecord(
  value: unknown,
): ConsortiumMetricRecord | null {
  if (!isRecord(value)) {
    return null
  }

  return typeof value.DataBase === "number" &&
    typeof value.IdMetrica === "string" &&
    typeof value.Metrica === "string" &&
    typeof value.Valor === "number" &&
    typeof value.Unidade === "string"
    ? {
        DataBase: value.DataBase,
        IdMetrica: value.IdMetrica,
        Metrica: value.Metrica,
        Valor: value.Valor,
        Unidade: value.Unidade,
      }
    : null
}

function parseBrazilianDate(
  value: string,
): string | null {
  const match =
    value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/u,
    )

  if (!match) {
    return null
  }

  const [, day, month, year] =
    match

  return `${year}-${month}-${day}`
}

function formatDataBase(
  date: Date,
): number {
  return Number(
    `${date.getUTCFullYear()}${String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")}`,
  )
}

function observedAtStatus(
  observedAt: string,
  fetchedAt: Date,
  staleAfterDays: number,
): "current" | "stale" | "future" {
  const observedTime =
    Date.parse(
      `${observedAt}T00:00:00.000Z`,
    )
  const ageMs =
    fetchedAt.getTime() -
    observedTime

  if (ageMs < -24 * 60 * 60 * 1000) {
    return "future"
  }

  return ageMs >
    staleAfterDays * 24 * 60 * 60 * 1000
    ? "stale"
    : "current"
}

export function buildConsortiumDataBases(
  now: Date,
  count: number,
): readonly number[] {
  const currentQuarterStart =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        Math.floor(
          now.getUTCMonth() / 3,
        ) * 3,
        1,
      ),
    )

  currentQuarterStart.setUTCMonth(
    currentQuarterStart.getUTCMonth() -
      1,
  )

  return Array.from(
    { length: count },
    (_, index) => {
      const candidate =
        new Date(
          currentQuarterStart,
        )
      candidate.setUTCMonth(
        candidate.getUTCMonth() -
          index * 3,
      )
      return formatDataBase(candidate)
    },
  )
}

export class BcbMarketIntelligenceProvider
implements MarketIntelligenceProvider {
  private readonly fetchFn: typeof fetch
  private readonly now: () => Date
  private readonly timeoutMs: number
  private readonly consortiumLookbackQuarters: number

  constructor(
    options:
      BcbMarketIntelligenceProviderOptions = {},
  ) {
    this.fetchFn =
      options.fetchFn ?? fetch
    this.now =
      options.now ?? (() => new Date())
    this.timeoutMs =
      options.timeoutMs ?? 5000
    this.consortiumLookbackQuarters =
      options.consortiumLookbackQuarters ??
      8
  }

  private async fetchJson(
    url: string,
  ): Promise<unknown> {
    const controller =
      new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    )

    try {
      const response =
        await this.fetchFn(url, {
          headers: {
            accept:
              "application/json",
          },
          signal: controller.signal,
        })

      if (!response.ok) {
        throw new Error(
          `BCB respondeu com status ${response.status}.`,
        )
      }

      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  private async fetchSgsIndicator(
    configuration:
      SgsSeriesConfiguration,
  ): Promise<MarketIndicator> {
    const url =
      `${BCB_SGS_BASE_URL}/bcdata.sgs.${configuration.code}/dados/ultimos/1?formato=json`
    const payload =
      await this.fetchJson(url)
    const first =
      Array.isArray(payload)
        ? parseSgsRecord(payload[0])
        : null
    const value =
      first
        ? Number(first.valor)
        : Number.NaN
    const observedAt =
      first
        ? parseBrazilianDate(
            first.data,
          )
        : null
    const fetchedAt = this.now()
    const status = observedAt
      ? observedAtStatus(
          observedAt,
          fetchedAt,
          configuration.staleAfterDays,
        )
      : "future"

    if (
      !first ||
      !Number.isFinite(value) ||
      !observedAt ||
      status === "future"
    ) {
      throw new Error(
        `Resposta inválida para a série SGS ${configuration.code}.`,
      )
    }

    return {
      key: configuration.key,
      name: configuration.name,
      value,
      unit: configuration.unit,
      observedAt,
      fetchedAt:
        fetchedAt.toISOString(),
      source:
        "Banco Central do Brasil",
      sourceReference:
        configuration.sourceUrl,
      stale: status === "stale",
    }
  }

  private async fetchConsortiumDataBase(
    dataBase: number,
  ): Promise<MarketIndicator | null> {
    const url =
      `${BCB_CONSORTIUM_BASE_URL}/Metricas(DataBase=${dataBase})?%24format=json&%24top=200`
    const payload =
      await this.fetchJson(url)
    const records =
      isRecord(payload) &&
      Array.isArray(payload.value)
        ? payload.value
            .map(
              parseConsortiumRecord,
            )
            .filter(
              (
                record,
              ): record is ConsortiumMetricRecord =>
                record !== null,
            )
        : []
    const activeQuotas =
      records.find(
        (record) =>
          record.IdMetrica === "10",
      )

    if (!activeQuotas) {
      return null
    }

    const year =
      String(dataBase).slice(0, 4)
    const month =
      String(dataBase).slice(4, 6)
    const observedAt =
      `${year}-${month}-01`
    const fetchedAt = this.now()

    return {
      key:
        "consortium_active_quotas",
      name:
        "Cotas ativas de consórcios",
      value:
        activeQuotas.Valor,
      unit:
        activeQuotas.Unidade,
      observedAt,
      fetchedAt:
        fetchedAt.toISOString(),
      source:
        "Banco Central do Brasil",
      sourceReference:
        BCB_CONSORTIUM_SOURCE_URL,
      stale:
        observedAtStatus(
          observedAt,
          fetchedAt,
          180,
        ) === "stale",
    }
  }

  private async fetchConsortiumIndicator(): Promise<
    MarketIndicator
  > {
    const dataBases =
      buildConsortiumDataBases(
        this.now(),
        this.consortiumLookbackQuarters,
      )
    const results =
      await Promise.allSettled(
        dataBases.map((dataBase) =>
          this.fetchConsortiumDataBase(
            dataBase,
          ),
        ),
      )

    for (const result of results) {
      if (
        result.status === "fulfilled" &&
        result.value
      ) {
        return result.value
      }
    }

    throw new Error(
      "Nenhuma data-base de consórcios disponível no período consultado.",
    )
  }

  async fetchIndicators(): Promise<
    readonly MarketIndicator[]
  > {
    const results =
      await Promise.allSettled([
        ...SGS_SERIES.map(
          (configuration) =>
            this.fetchSgsIndicator(
              configuration,
            ),
        ),
        this.fetchConsortiumIndicator(),
      ])
    const indicators =
      results.flatMap((result) =>
        result.status === "fulfilled"
          ? [result.value]
          : [],
      )

    if (indicators.length === 0) {
      throw new Error(
        "Dados de mercado temporariamente indisponíveis.",
      )
    }

    return indicators
  }
}
