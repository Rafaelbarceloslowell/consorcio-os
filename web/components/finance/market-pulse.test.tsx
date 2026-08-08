// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
} from "@testing-library/react"
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  MarketPulse,
} from "./market-pulse"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe(
  "MarketPulse",
  () => {
    it(
      "carrega somente a API interna e exibe fonte, referência e contexto seguro",
      async () => {
        const fetchMock =
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                status: "partial",
                indicators: [
                  {
                    key: "selic_target",
                    name:
                      "Meta Selic definida pelo Copom",
                    value: 14.75,
                    unit: "% a.a.",
                    observedAt:
                      "2026-08-07",
                    fetchedAt:
                      "2026-08-08T12:00:00.000Z",
                    source:
                      "Banco Central do Brasil",
                    sourceReference:
                      "https://api.bcb.gov.br/serie/432",
                    stale: true,
                  },
                ],
                contexts: [
                  {
                    indicatorKey:
                      "selic_target",
                    fact:
                      "Meta Selic: 14,75 % a.a.",
                    interpretation:
                      "Referência macroeconômica, não taxa final.",
                    commercialRecommendation:
                      "Descubra quanto previsibilidade importa.",
                    warning:
                      "Não prometa economia.",
                  },
                ],
                unavailableKeys: [],
                updatedAt:
                  "2026-08-08T12:00:00.000Z",
                message:
                  "Último valor conhecido.",
              }),
              {
                status: 200,
                headers: {
                  "content-type":
                    "application/json",
                },
              },
            ),
          )
        vi.stubGlobal(
          "fetch",
          fetchMock,
        )

        render(<MarketPulse />)

        expect(
          await screen.findByText(
            "14,75 % a.a.",
          ),
        ).toBeInTheDocument()
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/market-intelligence",
          expect.objectContaining({
            signal:
              expect.any(AbortSignal),
          }),
        )
        expect(
          screen.getByText(
            /último valor conhecido \(stale\)/i,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Referência macroeconômica, não taxa final.",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("link", {
            name:
              "Consultar fonte oficial",
          }),
        ).toHaveAttribute(
          "href",
          "https://api.bcb.gov.br/serie/432",
        )
      },
    )

    it(
      "informa indisponibilidade sem mostrar fallback numérico",
      async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                status:
                  "unavailable",
                indicators: [],
                contexts: [],
                unavailableKeys: [],
                updatedAt: null,
                message:
                  "Dados de mercado temporariamente indisponíveis.",
              }),
              { status: 200 },
            ),
          ),
        )

        render(<MarketPulse />)

        expect(
          await screen.findByText(
            /Nenhum valor foi presumido/i,
          ),
        ).toBeInTheDocument()
        expect(
          screen.queryByText(
            /\d+[,.]\d+ %/u,
          ),
        ).not.toBeInTheDocument()
      },
    )
  },
)
