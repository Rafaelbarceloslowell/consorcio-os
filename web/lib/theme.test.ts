// @vitest-environment jsdom

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  applyResolvedTheme,
  normalizeThemePreference,
  resolveTheme,
  themeInitializationScript,
  THEME_STORAGE_KEY,
} from "./theme"

describe("theme engine", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ""
    delete document.documentElement.dataset.theme
    delete document.documentElement.dataset.themePreference
  })

  it.each([
    ["dark", "dark"],
    ["light", "light"],
    ["system", "system"],
    ["gorila-night", "dark"],
    ["gorila-light", "light"],
    [null, "dark"],
  ])("normaliza %s como %s", (stored, expected) => {
    expect(normalizeThemePreference(stored)).toBe(expected)
  })

  it("resolve o tema do sistema", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
  })

  it("aplica as classes sem misturar os dois temas", () => {
    applyResolvedTheme(document.documentElement, "light", "light")
    expect(document.documentElement).toHaveClass("gorila-light")
    expect(document.documentElement).not.toHaveClass("gorila-night", "dark")

    applyResolvedTheme(document.documentElement, "dark", "system")
    expect(document.documentElement).toHaveClass("gorila-night", "dark")
    expect(document.documentElement).not.toHaveClass("gorila-light")
    expect(document.documentElement.dataset.themePreference).toBe("system")
  })

  it("inicializa o tema persistido antes da hidratação", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light")
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    })

    new Function(themeInitializationScript)()

    expect(document.documentElement).toHaveClass("gorila-light")
    expect(document.documentElement.dataset.theme).toBe("light")
  })
})
