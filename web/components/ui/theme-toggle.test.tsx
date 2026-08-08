// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  ThemeProvider,
} from "@/components/theme/theme-provider"

import {
  ThemeToggle,
} from "./theme-toggle"

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  it("oferece Escuro, Claro e Sistema", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    fireEvent.click(screen.getByRole("button", { name: /Selecionar tema/i }))

    expect(screen.getByRole("menuitemradio", { name: "Escuro" })).toBeInTheDocument()
    expect(screen.getByRole("menuitemradio", { name: "Claro" })).toBeInTheDocument()
    expect(screen.getByRole("menuitemradio", { name: "Sistema" })).toBeInTheDocument()
  })

  it("ativa e persiste o tema claro", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    fireEvent.click(screen.getByRole("button", { name: /Selecionar tema/i }))
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Claro" }))

    expect(window.localStorage.getItem("gorila-os-theme")).toBe("light")
    expect(document.documentElement).toHaveClass("gorila-light")
  })

  it("fecha o menu com Escape", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    const trigger = screen.getByRole("button", { name: /Selecionar tema/i })
    fireEvent.click(trigger)
    fireEvent.keyDown(trigger.parentElement as HTMLElement, { key: "Escape" })
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })
})
