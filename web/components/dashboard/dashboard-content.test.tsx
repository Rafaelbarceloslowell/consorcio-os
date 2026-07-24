// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DashboardContent } from "./dashboard-content"
import type { DashboardData } from "@/types/dashboard"

const dashboardData: DashboardData = {
  user: {
    id: "user-1",
    name: "Rafael",
  },
  summary: "Bom trabalho hoje!",
  metrics: {
    newLeads: 18,
    meetingsToday: 7,
    monthlySales: 1250000,
    pendingTasks: 12,
  },
  meetings: [],
  tasks: [
    {
      id: "task-1",
      title: "Ligar para cliente",
      time: "09:00",
      priority: "high",
    },
    {
      id: "task-2",
      title: "Enviar proposta",
      time: "11:30",
      priority: "medium",
    },
  ],
  pipeline: [],
}

describe("DashboardContent", () => {
  it("deve renderizar o DashboardHeader", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(
      screen.getByText("Bom trabalho hoje!")
    ).toBeInTheDocument()
  })

  it("deve renderizar o MetricsGrid", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(screen.getByText("Leads novos")).toBeInTheDocument()
    expect(screen.getByText("Reuniões hoje")).toBeInTheDocument()
    expect(screen.getByText("Vendas no mês")).toBeInTheDocument()
    expect(screen.getByText("Tarefas pendentes")).toBeInTheDocument()
  })

  it("deve renderizar o UpcomingTasks", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(
      screen.getByText("Próximas tarefas")
    ).toBeInTheDocument()

    expect(
      screen.getByText("Ligar para cliente")
    ).toBeInTheDocument()
  })

  it("deve renderizar todas as tarefas", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(screen.getByText("Ligar para cliente")).toBeInTheDocument()
    expect(screen.getByText("Enviar proposta")).toBeInTheDocument()
  })

  it("deve renderizar os indicadores", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()

    expect(
      screen.getByText("R$ 1.250.000")
    ).toBeInTheDocument()
  })

  it("deve renderizar o container principal", () => {
    const { container } = render(
      <DashboardContent {...dashboardData} />
    )

    expect(container.firstChild).toHaveClass(
      "mx-auto",
      "max-w-7xl",
      "space-y-8",
      "p-6",
      "lg:p-8"
    )
  })

  it("deve renderizar as duas seções da dashboard", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(
      screen.getByRole("region", {
        name: "Indicadores da operação",
      })
    ).toBeInTheDocument()

    expect(
      screen.getByRole("region", {
        name: "Próximas tarefas",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar exatamente duas seções", () => {
    const { container } = render(
      <DashboardContent {...dashboardData} />
    )

    expect(
      container.querySelectorAll("section")
    ).toHaveLength(2)
  })

  it("deve renderizar exatamente cinco Cards", () => {
    const { container } = render(
      <DashboardContent {...dashboardData} />
    )

    expect(
      container.querySelectorAll('[data-slot="card"]')
    ).toHaveLength(5)
  })

  it("deve renderizar corretamente com lista vazia de tarefas", () => {
    render(
      <DashboardContent
        {...dashboardData}
        tasks={[]}
      />
    )

    expect(
      screen.getByText("Próximas tarefas")
    ).toBeInTheDocument()
  })
})