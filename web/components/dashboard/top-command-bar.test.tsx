// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  TopCommandBar,
} from "./top-command-bar"

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

vi.mock("@/components/search/global-search", () => ({
  GlobalSearch: ({ open }: { open: boolean }) => (
    open ? <div role="dialog" aria-label="Pesquisa global" /> : null
  ),
}))

describe("TopCommandBar", () => {
  const user = {
    id: "user-1",
    name: "Rafael Ramos",
    positionTitle: "Consultor Sênior",
  }

  it("renderiza a navegação operacional completa", () => {
    render(<TopCommandBar user={user} />)

    expect(screen.getByRole("navigation", { name: "Navegação de comando" })).toBeInTheDocument()
    for (const label of ["Home", "Pipeline", "Leads", "Clientes", "Agenda", "Propostas", "Financeiro"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
    }
  })

  it("marca Home como comando ativo", () => {
    const { container } = render(<TopCommandBar user={user} />)
    expect(container.querySelector(".gorila-glass-1")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("gorila-glass-3")
    expect(screen.getByRole("link", { name: "Pipeline" })).not.toHaveClass("gorila-glass-3")
  })

  it("abre a pesquisa global por um botão semântico", () => {
    render(<TopCommandBar user={user} />)
    fireEvent.click(screen.getByRole("button", { name: "Abrir pesquisa global" }))
    expect(screen.getByRole("dialog", { name: "Pesquisa global" })).toBeInTheDocument()
  })

  it("conecta os atalhos de R2 e perfil a destinos reais", () => {
    render(<TopCommandBar user={user} />)
    expect(screen.getByRole("link", { name: "Ir para o comando do R2" })).toHaveAttribute("href", "/#r2-command")
    expect(screen.getByRole("link", { name: /Abrir perfil de Rafael/i })).toHaveAttribute("href", "/settings")
  })
})
