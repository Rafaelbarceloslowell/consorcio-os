import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}))

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      $queryRaw: mocks.queryRaw,
    },
  }),
)

import {
  GET,
} from "./route"

function request(
  query = "",
): Request {
  return new Request(
    `http://localhost/api/health${query}`,
  )
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.queryRaw.mockResolvedValue([
      { "?column?": 1 },
    ])
  })

  it("responde liveness sem consultar o banco", async () => {
    const result =
      await GET(request())

    expect(result.status).toBe(200)
    await expect(result.json()).resolves.toEqual({
      status: "ok",
      check: "liveness",
    })
    expect(mocks.queryRaw).not.toHaveBeenCalled()
  })

  it("aprova readiness quando o banco responde", async () => {
    const result =
      await GET(request("?check=readiness"))

    expect(result.status).toBe(200)
    await expect(result.json()).resolves.toEqual({
      status: "ready",
      check: "readiness",
      database: "available",
    })
  })

  it("retorna 503 seguro quando o banco está indisponível", async () => {
    mocks.queryRaw.mockRejectedValue(
      new Error(
        "postgresql://secret@database/internal",
      ),
    )

    const result =
      await GET(request("?check=readiness"))

    expect(result.status).toBe(503)
    await expect(result.text())
      .resolves.not.toContain("secret")
  })

  it("rejeita modo desconhecido", async () => {
    const result =
      await GET(request("?check=other"))

    expect(result.status).toBe(400)
  })
})
