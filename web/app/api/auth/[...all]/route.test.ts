import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

vi.mock(
  "@/lib/auth/auth",
  () => ({
    getAuth: vi.fn(),
  }),
)

describe(
  "Better Auth route",
  () => {
    beforeEach(() => {
      vi.resetModules()

      delete process.env.BETTER_AUTH_SECRET
      delete process.env.BETTER_AUTH_URL
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET
    })

    it(
      "returns 503 while Google credentials are not configured",
      async () => {
        const route =
          await import(
            "@/app/api/auth/[...all]/route"
          )

        const response =
          await route.GET(
            new Request(
              "http://localhost:3000/api/auth/session",
            ),
          )

        expect(response.status).toBe(503)
        await expect(
          response.json(),
        ).resolves.toMatchObject({
          error:
            "AUTH_NOT_CONFIGURED",
        })
      },
    )
  },
)
