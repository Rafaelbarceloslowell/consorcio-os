// @vitest-environment jsdom

import {
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
  DashboardContent,
} from "./dashboard-content"

const headerMock = vi.fn()
const metricsMock = vi.fn()
const pipelineMock = vi.fn()
const railMock = vi.fn()

vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: (props: unknown) => {
    headerMock(props)
    return <div data-testid="dashboard-hero" />
  },
}))

vi.mock("@/components/dashboard/metrics-grid", () => ({
  MetricsGrid: (props: unknown) => {
    metricsMock(props)
    return <div data-testid="metrics-strip" />
  },
}))

vi.mock("@/components/dashboard/pipeline-overview", () => ({
  PipelineOverview: (props: unknown) => {
    pipelineMock(props)
    return <div data-testid="pipeline-overview" />
  },
}))

vi.mock("@/components/dashboard/intelligence-rail", () => ({
  IntelligenceRail: (props: unknown) => {
    railMock(props)
    return <aside data-testid="intelligence-rail" />
  },
}))

vi.mock("@/components/dashboard/upcoming-tasks", () => ({
  UpcomingTasks: () => <section data-testid="next-actions" />,
}))

vi.mock("@/components/dashboard/opportunity-list", () => ({
  OpportunityList: () => <section data-testid="opportunity-list" />,
}))

const dashboardData: DashboardData = {
  workspaceId: "workspace-1",
  user: {
    id: "consultant-1",
    name: "Rafael Ramos Barcelos",
  },
  summary: "Resumo real da operação",
  metrics: {
    newLeads: 2,
    meetingsToday: 1,
    monthlySales: 500000,
    pendingTasks: 3,
  },
  meetings: [],
  tasks: [
    { id: "task-1", title: "Ligar", time: "Agora", priority: "high" },
    { id: "task-2", title: "Retornar", time: "15:00", priority: "medium" },
  ],
  pipeline: [
    { id: "stage-1", name: "Prospecção", count: 2, value: 850000 },
  ],
  opportunities: [],
  intelligence: {
    criticalCount: 1,
    importantCount: 1,
    monitoringCount: 0,
    unpreparedMeetings: 0,
    staleOpportunities: 0,
    pipelineValue: 850000,
  },
}

describe("DashboardContent premium cockpit composition", () => {
  beforeEach(() => vi.clearAllMocks())

  it("organiza hero, métricas, próximas ações, pipeline e intelligence rail", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(screen.getByTestId("dashboard-hero")).toBeInTheDocument()
    expect(screen.getByTestId("metrics-strip")).toBeInTheDocument()
    expect(screen.getByTestId("next-actions")).toBeInTheDocument()
    expect(screen.getByTestId("pipeline-overview")).toBeInTheDocument()
    expect(screen.getByTestId("intelligence-rail")).toBeInTheDocument()
    expect(screen.getByTestId("opportunity-list")).toBeInTheDocument()
  })

  it("encaminha somente dados reais para o hero e para o pipeline", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(headerMock).toHaveBeenCalledWith(expect.objectContaining({
      user: dashboardData.user,
      summary: dashboardData.summary,
      priorityCount: 1,
    }))
    expect(pipelineMock).toHaveBeenCalledWith({ pipeline: dashboardData.pipeline })
  })

  it("inclui o volume real do pipeline na faixa de KPIs", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(metricsMock).toHaveBeenCalledWith({
      metrics: dashboardData.metrics,
      pipelineValue: 850000,
    })
  })

  it("deriva a hierarquia de tarefas quando a inteligência não está disponível", () => {
    render(<DashboardContent {...dashboardData} intelligence={undefined} />)

    expect(railMock).toHaveBeenCalledWith(expect.objectContaining({
      criticalCount: 1,
      importantCount: 1,
      monitoringCount: 0,
    }))
  })

  it("usa composição vertical antes do breakpoint do cockpit", () => {
    const { container } = render(<DashboardContent {...dashboardData} />)
    expect(container.querySelector(".xl\\:grid-cols-\\[minmax\\(0\\,1fr\\)_310px\\]")).toBeInTheDocument()
  })
})
