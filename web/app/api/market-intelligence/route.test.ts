import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  GET,
} from "./route"

const getMarketIntelligenceMock =
  vi.hoisted(() => vi.fn())

vi.mock(
  "@/application/market-intelligence/get-market-intelligence",
  () => ({
    getMarketIntelligence:
      getMarketIntelligenceMock,
  }),
)

describe(
  "GET /api/market-intelligence",
  () => {
    it(
      "expõe a visão normalizada sem acessar o BCB diretamente na rota",
      async () => {
        getMarketIntelligenceMock.mockResolvedValue({
          status: "unavailable",
          indicators: [],
          contexts: [],
          unavailableKeys: [],
          updatedAt: null,
          message:
            "Dados de mercado temporariamente indisponíveis.",
        })

        const response = await GET()

        expect(response.status).toBe(200)
        await expect(
          response.json(),
        ).resolves.toMatchObject({
          status: "unavailable",
        })
      },
    )
  },
)
