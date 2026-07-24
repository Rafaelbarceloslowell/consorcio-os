// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Sidebar } from "./sidebar"

describe("Sidebar", () => {
  it("deve renderizar o logo do sistema", () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)

    expect(
      screen.getByText("ConsórcioOS")
    ).toBeInTheDocument()
  })

  it("deve renderizar todos os itens do menu", () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("CRM")).toBeInTheDocument()
    expect(screen.getByText("Agenda")).toBeInTheDocument()
    expect(screen.getByText("IA Copilot")).toBeInTheDocument()
    expect(screen.getByText("Clientes")).toBeInTheDocument()
    expect(
      screen.getByText("Configurações")
    ).toBeInTheDocument()
  })

  it("deve renderizar o rodapé", () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)

    expect(
      screen.getByText("Mission Control v1.0")
    ).toBeInTheDocument()
  })

  it("deve renderizar todos os links do menu", () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)

    expect(screen.getAllByRole("link")).toHaveLength(6)
  })

  it("deve marcar Dashboard como item ativo", () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)

    expect(screen.getByText("Dashboard").closest("a")).toHaveClass(
      "bg-sidebar-accent",
      "text-sidebar-accent-foreground"
    )
  })

  it("deve renderizar o botão de fechar", () => {
    render(<Sidebar open={true} onClose={vi.fn()} />)

    expect(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })
    ).toHaveLength(2)
  })

  it("deve chamar onClose ao clicar no overlay", () => {
    const onClose = vi.fn()

    render(<Sidebar open={true} onClose={onClose} />)

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })[0]
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("deve chamar onClose ao clicar no botão X", () => {
    const onClose = vi.fn()

    render(<Sidebar open={true} onClose={onClose} />)

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })[1]
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("deve manter o botão X quando fechado", () => {
    render(<Sidebar open={false} onClose={vi.fn()} />)

    expect(
      screen.getByRole("button", {
        name: "Fechar menu",
      })
    ).toBeInTheDocument()
  })

  it("deve aplicar translate-x-0 quando aberto", () => {
    const { container } = render(
      <Sidebar open={true} onClose={vi.fn()} />
    )

    expect(container.querySelector("aside")).toHaveClass(
      "translate-x-0"
    )
  })

  it("deve aplicar -translate-x-full quando fechado", () => {
    const { container } = render(
      <Sidebar open={false} onClose={vi.fn()} />
    )

    expect(container.querySelector("aside")).toHaveClass(
      "-translate-x-full"
    )
  })

  it("deve renderizar um ícone para cada item do menu", () => {
    const { container } = render(
      <Sidebar open={true} onClose={vi.fn()} />
    )

    expect(
      container.querySelectorAll("svg").length
    ).toBeGreaterThanOrEqual(8)
  })
})