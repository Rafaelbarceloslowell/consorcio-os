import {
  describe,
  expect,
  it,
} from "vitest"

import nextConfig, {
  securityHeaders,
} from "./next.config"

describe("next.config", () => {
  it("aplica o baseline de headers a todas as rotas", async () => {
    expect(nextConfig.headers).toBeTypeOf("function")

    const configuredHeaders =
      await nextConfig.headers?.()

    expect(configuredHeaders).toEqual([
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ])
  })

  it("não abre CORS nem adiciona dados sensíveis", () => {
    const names = securityHeaders.map(
      ({ key }) => key,
    )

    expect(names).toContain(
      "Strict-Transport-Security",
    )
    expect(names).toContain(
      "X-Content-Type-Options",
    )
    expect(names).toContain(
      "X-Frame-Options",
    )
    expect(names).not.toContain(
      "Access-Control-Allow-Origin",
    )
  })
})
