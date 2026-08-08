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

import type {
  DashboardData,
} from "@/types/dashboard"

import {
  DashboardShell,
} from "./dashboard-shell"

const sidebarMock = vi.fn()
const dashboardContentMock = vi.fn()

vi.mock(
  "@/components/dashboard/sidebar",
  () => ({
    Sidebar: (props: {
      open: boolean
      collapsed: boolean
      user: DashboardData["user"]
      onClose: () => void
      onCollapsedChange: (
        collapsed: boolean
      ) => void
    }) => {
      sidebarMock(props)

      return (
        <aside
          aria-label="Sidebar mock"
          data-open={String(props.open)}
          data-collapsed={String(
            props.collapsed
          )}
        >
          <button
            type="button"
            onClick={props.onClose}
          >
            Fechar sidebar
          </button>

          <button
            type="button"
            onClick={() =>
              props.onCollapsedChange(true)
            }
          >
            Recolher sidebar
          </button>

          <button
            type="button"
            onClick={() =>
              props.onCollapsedChange(false)
            }
          >
            Expandir sidebar
          </button>
        </aside>
      )
    },
  })
)

vi.mock(
  "@/components/dashboard/dashboard-content",
  () => ({
    DashboardContent: (props: {
      user: DashboardData["user"]
      summary: DashboardData["summary"]
      metrics: DashboardData["metrics"]
      tasks: DashboardData["tasks"]
      opportunities:
        DashboardData["opportunities"]
    }) => {
      dashboardContentMock(props)

      return (
        <section aria-label="Conteúdo do dashboard">
          Dashboard Content Mock
        </section>
      )
    },
  })
)

const dashboardData: DashboardData = {
  user: {
    id: "user-1",
    name: "Rafael Barcelos",
    positionTitle:
      "Consultor Sênior",
  },
  summary:
    "O R2 encontrou três ações prioritárias.",
  metrics: {
    newLeads: 12,
    meetingsToday: 4,
    monthlySales: 1850000,
    pendingTasks: 7,
  },
  meetings: [],
  tasks: [
    {
      id: "task-1",
      title: "Retornar contato do cliente",
      time: "10:30",
      priority: "high",
    },
  ],
  pipeline: [],
  opportunities: [
    {
      id: "journey-1",
      title: "Oportunidade",
      origin: "client",
      originName: "Cliente",
      consultantName: "Rafael",
      priority: "NORMAL",
      score: 50,
      phaseName: "Contato",
      stateName: "Em andamento",
      consortiumType:
        "real_estate",
      lastInteractionAt: null,
      updatedAt:
        "2026-07-26T18:00:00.000Z",
      status: "open",
      outcome: null,
    },
  ],
}

describe("DashboardShell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deve renderizar o container principal da aplicação", () => {
    const {
      container,
    } = render(
      <DashboardShell {...dashboardData} />
    )

    const shell =
      container.firstElementChild

    expect(shell).toHaveClass(
      "min-h-screen",
      "bg-[var(--gorila-canvas)]",
      "text-[var(--gorila-text)]"
    )
  })

  it("deve renderizar a sidebar", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toBeInTheDocument()
  })

  it("deve iniciar a sidebar móvel fechada", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-open",
      "false"
    )
  })

  it("deve iniciar a sidebar expandida", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-collapsed",
      "false"
    )
  })

  it("deve abrir a sidebar móvel ao clicar no botão de menu", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir menu",
      })
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-open",
      "true"
    )
  })

  it("deve fechar a sidebar móvel por meio do callback onClose", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir menu",
      })
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-open",
      "true"
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Fechar sidebar",
      })
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-open",
      "false"
    )
  })

  it("deve recolher a sidebar por meio do callback onCollapsedChange", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recolher sidebar",
      })
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-collapsed",
      "true"
    )
  })

  it("deve expandir novamente a sidebar", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recolher sidebar",
      })
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expandir sidebar",
      })
    )

    expect(
      screen.getByRole("complementary", {
        name: "Sidebar mock",
      })
    ).toHaveAttribute(
      "data-collapsed",
      "false"
    )
  })

  it("deve reservar 248 pixels para a rail expandida", () => {
    const {
      container,
    } = render(
      <DashboardShell {...dashboardData} />
    )

    const contentWrapper =
      container.querySelector(
        ".lg\\:pl-\\[248px\\]"
      )

    expect(
      contentWrapper
    ).toBeInTheDocument()

    expect(
      contentWrapper
    ).not.toHaveClass(
      "lg:pl-[84px]"
    )
  })

  it("deve reservar 84 pixels para a rail recolhida", () => {
    const {
      container,
    } = render(
      <DashboardShell {...dashboardData} />
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recolher sidebar",
      })
    )

    const contentWrapper =
      container.querySelector(
        ".lg\\:pl-\\[84px\\]"
      )

    expect(
      contentWrapper
    ).toBeInTheDocument()

    expect(
      contentWrapper
    ).not.toHaveClass(
      "lg:pl-[248px]"
    )
  })

  it("deve aplicar transição ao espaço lateral da sidebar", () => {
    const {
      container,
    } = render(
      <DashboardShell {...dashboardData} />
    )

    const contentWrapper =
      container.querySelector(
        ".transition-\\[padding-left\\]"
      )

    expect(
      contentWrapper
    ).toHaveClass(
      "min-h-screen",
      "transition-[padding-left]",
      "duration-250",
      "ease-out"
    )
  })

  it("deve renderizar o cabeçalho móvel", () => {
    const {
      container,
    } = render(
      <DashboardShell {...dashboardData} />
    )

    const mobileHeader =
      container.querySelector(
        "header"
      )

    expect(
      mobileHeader
    ).toBeInTheDocument()

    expect(
      mobileHeader
    ).toHaveClass(
      "sticky",
      "top-0",
      "z-30",
      "lg:hidden"
    )
  })

  it("deve renderizar a marca Gorila OS no cabeçalho móvel", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      screen.getByText("Gorila OS")
    ).toBeInTheDocument()
  })

  it("deve renderizar o subtítulo do centro de operações", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      screen.getByText(
        "Centro de operações"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o ícone de menu", () => {
    const {
      container,
    } = render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      container.querySelector(
        ".lucide-menu"
      )
    ).toBeInTheDocument()
  })

  it("deve aplicar relevo no hover do botão de menu sem usar azul", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    const menuButton =
      screen.getByRole("button", {
        name: "Abrir menu",
      })

    expect(menuButton).toHaveClass(
      "hover:-translate-y-px",
      "hover:border-white/[0.1]",
      "hover:bg-white/[0.045]",
      "hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
    )

    expect(
      menuButton.className
    ).not.toMatch(
      /hover:(bg|border|text)-(blue|sky|cyan|indigo)/
    )
  })

  it("deve renderizar o conteúdo principal", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      screen.getByRole("main")
    ).toBeInTheDocument()

    expect(
      screen.getByRole("region", {
        name: "Conteúdo do dashboard",
      })
    ).toBeInTheDocument()
  })

  it("deve encaminhar o usuário para o DashboardContent", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      dashboardContentMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        user: dashboardData.user,
      })
    )
  })

  it("deve encaminhar o resumo para o DashboardContent", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      dashboardContentMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        summary:
          dashboardData.summary,
      })
    )
  })

  it("deve encaminhar as métricas para o DashboardContent", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      dashboardContentMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics:
          dashboardData.metrics,
      })
    )
  })

  it("deve encaminhar as tarefas para o DashboardContent", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      dashboardContentMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks:
          dashboardData.tasks,
      })
    )
  })

  it("deve encaminhar as oportunidades para o DashboardContent", () => {
    render(
      <DashboardShell
        {...dashboardData}
      />,
    )

    const receivedProps =
      dashboardContentMock.mock
        .calls[0]?.[0]

    expect(
      receivedProps
        ?.opportunities,
    ).toBe(
      dashboardData
        .opportunities,
    )
  })

  it("deve encaminhar o pipeline real para o DashboardContent", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    const receivedProps =
      dashboardContentMock.mock
        .calls[0]?.[0]

    expect(
      receivedProps
    ).not.toHaveProperty(
      "meetings"
    )

    expect(
      receivedProps
    ).toHaveProperty(
      "pipeline",
      dashboardData.pipeline,
    )
  })

  it("deve encaminhar o estado inicial correto para a Sidebar", () => {
    render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      sidebarMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        open: false,
        collapsed: false,
        user: dashboardData.user,
        onClose: expect.any(
          Function
        ),
        onCollapsedChange:
          expect.any(Function),
      })
    )
  })
})
