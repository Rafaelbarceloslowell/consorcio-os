import { readFileSync } from "node:fs"

import {
  describe,
  expect,
  it,
} from "vitest"

const css = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
)

describe("Warm Earth theme tokens", () => {
  it("mantém texto auxiliar e estados stale legíveis no tema claro", () => {
    expect(css).toContain("--gorila-text-muted: #625d53")
    expect(css).toContain("--gorila-warning: #705035")
    expect(css).toContain("--gorila-link: #46502f")
    expect(css).toContain("--gorila-stale: #704d31")
    expect(css).toContain('[class*="text-amber-100"]')
    expect(css).toContain("color: var(--gorila-stale) !important")
  })

  it("preserva a identidade em smoked glass no tema escuro", () => {
    const darkBlock = css.match(
      /\.dark,\s*\.gorila-night\s*\{([\s\S]*?)\n\}/u,
    )?.[1]

    expect(darkBlock).toBeDefined()
    expect(darkBlock).toContain("--gorila-canvas: #171815")
    expect(darkBlock).toContain("--gorila-surface: rgba(40, 42, 37, 0.60)")
    expect(darkBlock).toContain("--gorila-text: #e8e4da")
    expect(darkBlock).toContain("--gorila-text-soft: #c9c3b7")
    expect(darkBlock).toContain("--gorila-text-muted: #a8a195")
    expect(darkBlock).toContain("--gorila-warning: #aa8159")
  })

  it("usa superfícies warm glass no claro e limita o blur dos materiais", () => {
    expect(css).toContain("--gorila-canvas: #cec7bc")
    expect(css).toContain("--gorila-surface: rgba(239, 235, 228, 0.60)")
    expect(css).toContain("backdrop-filter: blur(16px) saturate(110%)")
    expect(css).toContain(".gorilla-action-card")
    expect(css).not.toContain("--gorila-canvas: #11120f")
  })
})
