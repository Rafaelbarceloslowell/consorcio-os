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

  it("preserva os tokens visuais aprovados do tema escuro", () => {
    const darkBlock = css.match(
      /\.dark,\s*\.gorila-night\s*\{([\s\S]*?)\n\}/u,
    )?.[1]

    expect(darkBlock).toBeDefined()
    expect(darkBlock).toContain("--gorila-text: #f1eee6")
    expect(darkBlock).toContain("--gorila-text-soft: #d3cec2")
    expect(darkBlock).toContain("--gorila-text-muted: #918b80")
    expect(darkBlock).toContain("--gorila-warning: #aa8159")
  })
})
