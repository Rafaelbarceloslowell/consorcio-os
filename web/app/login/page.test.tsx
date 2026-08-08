// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import LoginPage from "./page"

vi.mock("@/lib/auth/auth-configuration", () => ({
  getAuthConfigurationState: () => ({ configured: true }),
}))

vi.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Selecionar tema" />,
}))

vi.mock("@/components/auth/google-login-button", () => ({
  GoogleLoginButton: ({ configured }: { configured: boolean }) => (
    <button data-configured={configured}>Continuar com Google</button>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ fill: _fill, priority: _priority, unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}))

describe("LoginPage", () => {
  it("apresenta o login como entrada Premium Earth OS", () => {
    render(<LoginPage />)
    expect(screen.getByRole("heading", { name: "Seu centro de operações comerciais." })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Bem-vindo ao GorillaOS" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /R2, copiloto comercial/i })).toHaveAttribute(
      "src",
      "/images/r2/gorila-r2-static-oficial.png",
    )
  })

  it("preserva o CTA Google configurado e o controle de tema", () => {
    render(<LoginPage />)
    expect(screen.getByRole("button", { name: "Continuar com Google" })).toHaveAttribute("data-configured", "true")
    expect(screen.getByRole("button", { name: "Selecionar tema" })).toBeInTheDocument()
  })
})
