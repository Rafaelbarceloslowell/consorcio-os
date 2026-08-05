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
  positionTitle: "Consultor Sênior",
}

afterEach(() => {
  vi.useRealTimers()
})

describe("DashboardHeader", () => {
  it("deve renderizar a saudação da manhã com o nome do usuário", () => {
    vi.useFakeTimers()
    vi.setSystemTime(
      new Date("2026-07-22T09:00:00"),
    )

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Bom dia, Rafael"),
    ).toBeInTheDocument()
  })

  it("deve renderizar a saudação da tarde", () => {
    vi.useFakeTimers()
    vi.setSystemTime(
      new Date("2026-07-22T15:00:00"),
    )

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Boa tarde, Rafael"),
    ).toBeInTheDocument()
  })

  it("deve renderizar a saudação da noite", () => {
    vi.useFakeTimers()
    vi.setSystemTime(
      new Date("2026-07-22T20:00:00"),
    )

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Boa noite, Rafael"),
    ).toBeInTheDocument()
  })

  it("deve renderizar Dashboard como título principal", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      }),
    ).toBeInTheDocument()
  })

  it("deve renderizar a chamada principal do R2", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "O R2 organizou o que merece sua atenção hoje.",
      }),
    ).toBeInTheDocument()
  })

  it("deve preservar o nome completo do usuário", () => {
    const completeUser: User = {
      id: "user-2",
      name: "Rafael Ramos Barcelos",
      positionTitle: "Consultor Sênior",
    }

    render(
      <DashboardHeader
        user={completeUser}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Rafael Ramos Barcelos"),
    ).toBeInTheDocument()
  })

  it("deve gerar as iniciais do usuário", () => {
    const completeUser: User = {
      id: "user-2",
      name: "Rafael Ramos Barcelos",
      positionTitle: "Consultor Sênior",
    }

    render(
      <DashboardHeader
        user={completeUser}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("RR"),
    ).toBeInTheDocument()
  })

  it("deve usar iniciais padrão quando o nome estiver vazio", () => {
    const unnamedUser: User = {
      id: "user-3",
      name: "   ",
      positionTitle: "Consultor Sênior",
    }

    render(
      <DashboardHeader
        user={unnamedUser}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("US"),
    ).toBeInTheDocument()
  })

  it("deve renderizar o contexto sem ações prioritárias por padrão", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText(
        "Hoje existem 0 ações prioritárias na operação.",
      ),
    ).toBeInTheDocument()
  })

  it("deve renderizar o contexto singular para uma ação prioritária", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
        priorityCount={1}
      />,
    )

    expect(
      screen.getByText(
        "Hoje existe 1 ação prioritária na operação.",
      ),
    ).toBeInTheDocument()
  })

  it("deve renderizar o contexto plural para várias ações prioritárias", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
        priorityCount={4}
      />,
    )

    expect(
      screen.getByText(
        "Hoje existem 4 ações prioritárias na operação.",
      ),
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão acessível da pesquisa global", () => {
    const { container } = render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByRole("button", {
        name: "Abrir pesquisa global",
      }),
    ).toBeInTheDocument()

    expect(
      container.querySelector(".lucide-search"),
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão de notificações", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByRole("button", {
        name: "Abrir notificações",
      }),
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão do menu do usuário", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByRole("button", {
        name: "Abrir menu do usuário",
      }),
    ).toBeInTheDocument()
  })

  it("deve renderizar o estado de monitoramento do R2", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Monitorando"),
    ).toBeInTheDocument()
  })

  it("deve renderizar Consultor Sênior como cargo operacional", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Consultor Sênior"),
    ).toBeInTheDocument()
  })

  it("deve respeitar um cargo explícito recebido pelo dashboard", () => {
    const manager: User = {
      id: "user-4",
      name: "Gestor Teste",
      positionTitle: "Gestor",
    }

    render(
      <DashboardHeader
        user={manager}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByText("Gestor"),
    ).toBeInTheDocument()
  })

  it("deve aplicar as classes premium do título principal", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      }),
    ).toHaveClass(
      "text-2xl",
      "font-semibold",
      "tracking-[-0.045em]",
      "text-[#F5F7FA]",
      "sm:text-3xl",
    )
  })

  it("deve manter exatamente os dois headings atuais do cabeçalho", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />,
    )

    expect(
      screen.getAllByRole("heading"),
    ).toHaveLength(2)
  })
})
