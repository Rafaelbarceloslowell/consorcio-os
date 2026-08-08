// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
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
  useGorillaTheme,
} from "./theme-provider"

let systemDark = false
let systemListener: (() => void) | undefined

function Consumer() {
  const { theme, resolvedTheme, setTheme } = useGorillaTheme()

  return (
    <div>
      <span>{theme}:{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("system")}>system</button>
    </div>
  )
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    systemDark = false
    systemListener = undefined
    window.localStorage.clear()
    document.documentElement.className = ""
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: systemDark,
        addEventListener: (_event: string, listener: () => void) => {
          systemListener = listener
        },
        removeEventListener: vi.fn(),
      })),
    })
  })

  it("usa Dark Earth como padrão", async () => {
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    await waitFor(() => expect(screen.getByText("dark:dark")).toBeInTheDocument())
    expect(document.documentElement).toHaveClass("gorila-night", "dark")
  })

  it("restaura e persiste Warm Earth Light", async () => {
    window.localStorage.setItem("gorila-os-theme", "light")
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    await waitFor(() => expect(screen.getByText("light:light")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "dark" }))
    expect(window.localStorage.getItem("gorila-os-theme")).toBe("dark")
    expect(document.documentElement).toHaveClass("gorila-night", "dark")
  })

  it("acompanha mudanças do sistema", async () => {
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    fireEvent.click(screen.getByRole("button", { name: "system" }))
    await waitFor(() => expect(screen.getByText("system:light")).toBeInTheDocument())

    systemDark = true
    systemListener?.()
    await waitFor(() => expect(screen.getByText("system:dark")).toBeInTheDocument())
  })
})
