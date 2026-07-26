// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  User,
} from "@/types/dashboard"

import {
  DashboardHeader,
} from "./dashboard-header"

const user: User = {
  id: "user-1",
  name: "Rafael",
}

afterEach(() => {
  vi.useRealTimers()
})

describe("DashboardHeader", () => {
  it("deve renderizar a saudação da manhã com o nome do usuário", () => {
    vi.useFakeTimers()

    vi.setSystemTime(
      new Date("2026-07-22T09:00:00")
    )

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Bom dia, Rafael")
    ).toBeInTheDocument()
  })

  it("deve renderizar a saudação da tarde", () => {
    vi.useFakeTimers()

    vi.setSystemTime(
      new Date("2026-07-22T15:00:00")
    )

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Boa tarde, Rafael")
    ).toBeInTheDocument()
  })

  it("deve renderizar a saudação da noite", () => {
    vi.useFakeTimers()

    vi.setSystemTime(
      new Date("2026-07-22T20:00:00")
    )

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Boa noite, Rafael")
    ).toBeInTheDocument()
  })

  it("deve renderizar Dashboard como título principal", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar a chamada principal do R2", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "O R2 organizou o que merece sua atenção hoje.",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar o título do resumo do R2", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Resumo do R2",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar o resumo informado", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Você possui 12 tarefas pendentes"
      />
    )

    expect(
      screen.getByText(
        "Você possui 12 tarefas pendentes"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o resumo dentro de um parágrafo", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    const summary =
      screen.getByText("Resumo comercial")

    expect(summary.tagName).toBe("P")
  })

  it("deve preservar o nome completo do usuário", () => {
    const completeUser: User = {
      id: "user-2",
      name: "Rafael Barcelos",
    }

    render(
      <DashboardHeader
        user={completeUser}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Rafael Barcelos")
    ).toBeInTheDocument()
  })

  it("deve gerar as iniciais do usuário", () => {
    const completeUser: User = {
      id: "user-2",
      name: "Rafael Barcelos",
    }

    render(
      <DashboardHeader
        user={completeUser}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("RB")
    ).toBeInTheDocument()
  })

  it("deve usar iniciais padrão quando o nome estiver vazio", () => {
    const unnamedUser: User = {
      id: "user-3",
      name: "   ",
    }

    render(
      <DashboardHeader
        user={unnamedUser}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("US")
    ).toBeInTheDocument()
  })

  it("deve renderizar o contexto sem ações prioritárias por padrão", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText(
        "Hoje existem 0 ações prioritárias na operação."
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o contexto singular para uma ação prioritária", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
        priorityCount={1}
      />
    )

    expect(
      screen.getByText(
        "Hoje existe 1 ação prioritária na operação."
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o contexto plural para várias ações prioritárias", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
        priorityCount={4}
      />
    )

    expect(
      screen.getByText(
        "Hoje existem 4 ações prioritárias na operação."
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o campo de busca operacional", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByPlaceholderText(
        "Buscar clientes, leads, grupos, cotas..."
      )
    ).toHaveAttribute(
      "type",
      "search"
    )
  })

  it("deve fornecer descrição acessível para o campo de busca", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("searchbox", {
        name: /Buscar clientes, leads, grupos ou cotas/i,
      })
    ).toBeInTheDocument()
  })

  it("deve aplicar elevação no hover ao campo de busca sem usar azul", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    const searchInput =
      screen.getByPlaceholderText(
        "Buscar clientes, leads, grupos, cotas..."
      )

    expect(searchInput).toHaveClass(
      "hover:-translate-y-px",
      "hover:border-[#2F8F5B]/30"
    )

    expect(searchInput.className).not.toMatch(
      /hover:(bg|border|text)-(blue|sky|cyan|indigo)/
    )
  })

  it("deve renderizar o atalho visual da busca", () => {
    const {
      container,
    } = render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      container.querySelector(
        ".lucide-command"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText("K")
    ).toBeInTheDocument()
  })

  it("deve renderizar o ícone de busca", () => {
    const {
      container,
    } = render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      container.querySelector(
        ".lucide-search"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão de notificações", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("button", {
        name: "Abrir notificações",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão do menu do usuário", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("button", {
        name: "Abrir menu do usuário",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar o estado de monitoramento do R2", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("R2")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Monitorando")
    ).toBeInTheDocument()
  })

  it("deve renderizar o cargo do usuário", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Supervisor")
    ).toBeInTheDocument()
  })

  it("deve aplicar as classes premium do título principal", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      })
    ).toHaveClass(
      "text-2xl",
      "font-semibold",
      "tracking-[-0.045em]",
      "text-[#F5F7FA]",
      "sm:text-3xl"
    )
  })

  it("deve aplicar as classes premium do resumo", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Resumo comercial")
    ).toHaveClass(
      "mt-2",
      "text-sm",
      "leading-6",
      "text-[#D6DBE3]"
    )
  })

  it("deve renderizar exatamente três níveis de heading", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getAllByRole("heading")
    ).toHaveLength(3)
  })
})
