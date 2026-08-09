import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  BcbMarketIntelligenceProvider,
  buildConsortiumDataBases,
} from "./bcb-market-intelligence-provider"

function jsonResponse(
  value: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(value),
    {
      status,
      headers: {
        "content-type":
          "application/json",
      },
    },
  )
}

describe(
  "BcbMarketIntelligenceProvider",
  () => {
    it(
      "gera datas-base trimestrais sem fixar o período atual",
      () => {
        expect(
          buildConsortiumDataBases(
            new Date(
              "2026-08-08T12:00:00.000Z",
            ),
            4,
          ),
        ).toEqual([
          202606,
          202603,
          202512,
          202509,
        ])
      },
    )

    it(
      "normaliza SGS e busca a última data-base disponível de consórcios",
      async () => {
        const fetchFn = vi.fn(
          async (input: string | URL | Request) => {
            const url = String(input)

            if (
              url.includes(
                "bcdata.sgs.432",
              )
            ) {
              return jsonResponse([
                {
                  data:
                    "07/08/2026",
                  valor: "14.75",
                },
              ])
            }

            if (
              url.includes(
                "bcdata.sgs.20749",
              )
            ) {
              return jsonResponse([
                {
                  data:
                    "01/06/2026",
                  valor: "26.44",
                },
              ])
            }

            if (
              url.includes(
                "bcdata.sgs.20772",
              )
            ) {
              return jsonResponse([
                {
                  data:
                    "01/06/2026",
                  valor: "11.25",
                },
              ])
            }

            if (
              url.includes(
                "DataBase=202512",
              )
            ) {
              return jsonResponse({
                value: [
                  {
                    DataBase:
                      202512,
                    IdMetrica: "10",
                    Grupo:
                      "Cotas ativas",
                    Metrica:
                      "Cotas ativas - Total",
                    Valor: 11200,
                    Unidade: "mil",
                  },
                ],
              })
            }

            return jsonResponse(
              { error: "not published" },
              500,
            )
          },
        )
        const provider =
          new BcbMarketIntelligenceProvider({
            fetchFn:
              fetchFn as typeof fetch,
            now: () =>
              new Date(
                "2026-08-08T12:00:00.000Z",
              ),
            timeoutMs: 100,
            consortiumLookbackQuarters:
              3,
          })

        const indicators =
          await provider.fetchIndicators()

        expect(
          indicators.map(
            (indicator) =>
              indicator.key,
          ),
        ).toEqual([
          "selic_target",
          "vehicle_financing_pf",
          "real_estate_financing_pf",
          "consortium_active_quotas",
        ])
        expect(
          indicators[0],
        ).toMatchObject({
          value: 14.75,
          observedAt:
            "2026-08-07",
          source:
            "Banco Central do Brasil",
          stale: false,
        })
        expect(
          indicators[3],
        ).toMatchObject({
          value: 11200,
          unit: "mil",
          observedAt:
            "2025-12-01",
          stale: true,
        })
        expect(indicators.map((indicator) => indicator.sourceReference)).toEqual([
          "https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarGraficoPorId&hdOidSeriesSelecionadas=432",
          "https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarGraficoPorId&hdOidSeriesSelecionadas=20749",
          "https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarGraficoPorId&hdOidSeriesSelecionadas=20772",
          "https://dadosabertos.bcb.gov.br/dataset/dados-agregados-do-segmento-de-consorcios",
        ])
      },
    )

    it(
      "ignora data futura e mantém os demais indicadores disponíveis",
      async () => {
        const fetchFn = vi.fn(
          async (input: string | URL | Request) => {
            const url = String(input)

            if (
              url.includes(
                "bcdata.sgs.432",
              )
            ) {
              return jsonResponse([
                {
                  data:
                    "16/09/2026",
                  valor: "14.75",
                },
              ])
            }

            if (
              url.includes(
                "bcdata.sgs.20749",
              )
            ) {
              return jsonResponse([
                {
                  data:
                    "01/06/2026",
                  valor: "26.44",
                },
              ])
            }

            return jsonResponse(
              { error: "unavailable" },
              503,
            )
          },
        )
        const provider =
          new BcbMarketIntelligenceProvider({
            fetchFn:
              fetchFn as typeof fetch,
            now: () =>
              new Date(
                "2026-08-08T12:00:00.000Z",
              ),
            timeoutMs: 100,
            consortiumLookbackQuarters:
              1,
          })

        await expect(
          provider.fetchIndicators(),
        ).resolves.toMatchObject([
          {
            key:
              "vehicle_financing_pf",
          },
        ])
      },
    )
  },
)
