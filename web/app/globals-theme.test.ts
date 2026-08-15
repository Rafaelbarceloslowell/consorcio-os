import {
  readFileSync,
  statSync,
} from "node:fs"

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

  it("define níveis estruturais de glass distintos entre Light e Dark", () => {
    const lightBlock = css.match(
      /:root,\s*\.gorila-light\s*\{([\s\S]*?)\n\}/u,
    )?.[1]
    const darkBlock = css.match(
      /\.dark,\s*\.gorila-night\s*\{([\s\S]*?)\n\}/u,
    )?.[1]

    expect(lightBlock).toContain("--gorila-glass-0: transparent")
    expect(lightBlock).toContain("--gorila-glass-1: rgba(244, 240, 233, 0.20)")
    expect(lightBlock).toContain("--gorila-glass-2: rgba(250, 247, 240, 0.26)")
    expect(lightBlock).toContain("--gorila-glass-3: rgba(248, 244, 237, 0.17)")
    expect(darkBlock).toContain("--gorila-glass-1: rgba(24, 27, 23, 0.26)")
    expect(darkBlock).toContain("--gorila-glass-2: rgba(29, 32, 27, 0.30)")
    expect(darkBlock).toContain("--gorila-glass-3: rgba(32, 35, 30, 0.21)")
    expect(css).toContain(".gorila-glass-0")
    expect(css).toContain("background: var(--gorila-glass-0) !important")
    expect(css).toContain("backdrop-filter: none !important")
  })

  it("protege superfícies no mobile sem alterar a fotografia desktop", () => {
    expect(css).toContain("--gorila-canvas-image-opacity: 0.52")
    expect(css).toContain("--gorila-canvas-image-opacity: 0.56")
    expect(css).toContain("--gorila-glass-2: rgba(250, 247, 240, 0.40)")
    expect(css).toContain("--gorila-glass-2: rgba(29, 32, 27, 0.44)")
  })

  it("mantem frosted glass claro com blur controlado e sem empilhar blur nos filhos", () => {
    expect(css).toContain("backdrop-filter: blur(22px) saturate(114%)")
    expect(css).toContain("backdrop-filter: blur(22px) saturate(112%)")
    expect(css).toContain("backdrop-filter: blur(24px) saturate(110%)")
    expect(css).toMatch(/\.gorila-glass-3\s*\{[\s\S]*?backdrop-filter: none;/u)
    expect(css).toContain("--gorila-glass-border: rgba(255, 252, 244, 0.46)")
    expect(css).toContain("--gorila-glass-border: rgba(255, 249, 238, 0.12)")
    expect(css).toContain("--gorila-hero-haze-main: rgba(229, 223, 213, 0.14)")
    expect(css).toContain("--gorila-hero-haze-main: rgba(25, 26, 22, 0.13)")
    expect(css).toContain("opacity: var(--gorila-hero-grid-opacity)")
  })

  it("seleciona o skyline colorido no Light e o skyline P&B no Dark", () => {
    const lightBlock = css.match(
      /:root,\s*\.gorila-light\s*\{([\s\S]*?)\n\}/u,
    )?.[1]
    const darkBlock = css.match(
      /\.dark,\s*\.gorila-night\s*\{([\s\S]*?)\n\}/u,
    )?.[1]

    expect(lightBlock).toContain(
      "/images/dashboard/gorillaos-dashboard-city-light.avif",
    )
    expect(lightBlock).toContain(
      "/images/dashboard/gorillaos-dashboard-city-light.webp",
    )
    expect(darkBlock).toContain(
      "/images/dashboard/gorillaos-dashboard-city-dark.avif",
    )
    expect(darkBlock).toContain(
      "/images/dashboard/gorillaos-dashboard-city-dark.webp",
    )
  })

  it("preserva canvas solido, overlay e vignette independentes do conteudo", () => {
    expect(css).toContain(".gorilla-cinematic-canvas::before")
    expect(css).toContain("background: var(--gorila-canvas)")
    expect(css).toContain("background: var(--gorila-canvas-vignette), var(--gorila-canvas-overlay)")
    expect(css).toContain("pointer-events: none")
  })

  it("mantem os assets de producao dentro do budget", () => {
    const assetUrls = [
      "../public/images/dashboard/gorillaos-dashboard-city-light.avif",
      "../public/images/dashboard/gorillaos-dashboard-city-dark.avif",
      "../public/images/dashboard/gorillaos-dashboard-city-light.webp",
      "../public/images/dashboard/gorillaos-dashboard-city-dark.webp",
    ]

    for (const assetUrl of assetUrls) {
      expect(statSync(new URL(assetUrl, import.meta.url)).size).toBeLessThan(160_000)
    }
  })
})
