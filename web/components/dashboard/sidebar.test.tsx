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

import { Sidebar } from "./sidebar"

describe("Sidebar", () => {
  it("deve renderizar a identidade do Gorila OS", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText("Gorila OS")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Centro de operações")
    ).toBeInTheDocument()
  })

  it("deve renderizar todos os itens do menu", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText("Dashboard")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Pipeline")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Leads")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Clientes")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Agenda")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Propostas")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Financeiro")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Configurações")
    ).toBeInTheDocument()
  })

  it("deve renderizar todos os links do menu", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getAllByRole("link")
    ).toHaveLength(8)

    expect(
      screen.getByRole("link", {
        name: "Leads",
      }),
    ).toHaveAttribute(
      "href",
      "/leads",
    )

    expect(
      screen.getByRole("link", {
        name: "Clientes",
      }),
    ).toHaveAttribute(
      "href",
      "/clients",
    )

    expect(
      screen.getByRole("link", {
        name: "Agenda",
      }),
    ).toHaveAttribute(
      "href",
      "/agenda",
    )

    expect(
      screen.getByRole("link", {
        name: "Propostas",
      }),
    ).toHaveAttribute(
      "href",
      "/proposals",
    )

    expect(
      screen.getByRole("link", {
        name: "Financeiro",
      }),
    ).toHaveAttribute(
      "href",
      "/finance",
    )

    expect(
      screen.getByRole("link", {
        name: "Configurações",
      }),
    ).toHaveAttribute(
      "href",
      "/settings",
    )
  })

  it("não deve exibir contagens fixas em Leads ou Agenda", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.queryByText("12")
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText("4")
    ).not.toBeInTheDocument()
  })

  it("deve marcar Dashboard como item ativo", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    const dashboardLink = screen
      .getByText("Dashboard")
      .closest("a")

    expect(dashboardLink).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("deve renderizar o R2 como copiloto online", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText("R2")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Online")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Copiloto comercial ativo")
    ).toBeInTheDocument()
  })

  it("deve renderizar o perfil do usuário", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText("Rafael Ramos Barcelos")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Consultor Sênior")
    ).toBeInTheDocument()
  })

  it("deve renderizar dois botões de fechar quando o menu está aberto", () => {
    render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })
    ).toHaveLength(2)
  })

  it("deve chamar onClose ao clicar no overlay", () => {
    const onClose = vi.fn()

    render(
      <Sidebar
        open={true}
        onClose={onClose}
      />
    )

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })[0]
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("deve chamar onClose ao clicar no botão X", () => {
    const onClose = vi.fn()

    render(
      <Sidebar
        open={true}
        onClose={onClose}
      />
    )

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })[1]
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("deve chamar onClose ao navegar por um item", () => {
    const onClose = vi.fn()

    render(
      <Sidebar
        open={true}
        onClose={onClose}
      />
    )

    fireEvent.click(
      screen.getByRole("link", {
        name: "Pipeline",
      })
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("deve manter o botão X quando o menu está fechado", () => {
    render(
      <Sidebar
        open={false}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", {
        name: "Fechar menu",
      })
    ).toBeInTheDocument()
  })

  it("deve aplicar translate-x-0 quando aberto", () => {
    const { container } = render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      container.querySelector("aside")
    ).toHaveClass("translate-x-0")
  })

  it("deve aplicar -translate-x-full quando fechado", () => {
    const { container } = render(
      <Sidebar
        open={false}
        onClose={vi.fn()}
      />
    )

    expect(
      container.querySelector("aside")
    ).toHaveClass("-translate-x-full")
  })

  it("deve renderizar a Sidebar expandida por padrão", () => {
    const { container } = render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      container.querySelector("aside")
    ).toHaveClass("w-[288px]")
  })

  it("deve renderizar a Sidebar recolhida", () => {
    const { container } = render(
      <Sidebar
        open={true}
        collapsed={true}
        onClose={vi.fn()}
      />
    )

    expect(
      container.querySelector("aside")
    ).toHaveClass("w-[88px]")

    expect(
      screen.queryByText("Gorila OS")
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText("Rafael Ramos Barcelos")
    ).not.toBeInTheDocument()
  })

  it("deve solicitar o recolhimento da Sidebar", () => {
    const onCollapsedChange = vi.fn()

    render(
      <Sidebar
        open={true}
        collapsed={false}
        onClose={vi.fn()}
        onCollapsedChange={onCollapsedChange}
      />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recolher menu",
      })
    )

    expect(
      onCollapsedChange
    ).toHaveBeenCalledTimes(1)

    expect(
      onCollapsedChange
    ).toHaveBeenCalledWith(true)
  })

  it("deve solicitar a expansão da Sidebar", () => {
    const onCollapsedChange = vi.fn()

    render(
      <Sidebar
        open={true}
        collapsed={true}
        onClose={vi.fn()}
        onCollapsedChange={onCollapsedChange}
      />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expandir menu",
      })
    )

    expect(
      onCollapsedChange
    ).toHaveBeenCalledTimes(1)

    expect(
      onCollapsedChange
    ).toHaveBeenCalledWith(false)
  })

  it("deve renderizar ícones para os recursos da Sidebar", () => {
    const { container } = render(
      <Sidebar
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(
      container.querySelectorAll("svg").length
    ).toBeGreaterThanOrEqual(11)
  })
})
