// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DashboardShell } from "./dashboard-shell"

const dashboardData = {
  user: {
    id: "user-1",
    name: "Rafael",
  },

  summary: "Você possui 3 tarefas pendentes para hoje.",

  metrics: {
    newLeads: 18,
    meetingsToday: 4,
    monthlySales: 1200000,
    pendingTasks: 3,
  },

  meetings: [
    {
      id: "meeting-1",
      title: "Reunião",
      time: "09:00",
      clientName: "João",
    },
  ],

  tasks: [
    {
      id: "1",
      title: "Ligar para João",
      time: "09:00",
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Enviar proposta",
      time: "14:00",
      priority: "medium" as const,
    },
  ],

  pipeline: [
    {
      id: "pipeline-1",
      name: "Novos Leads",
      count: 10,
      value: 500000,
    },
  ],
}

describe("DashboardShell", () => {
  it("deve renderizar o Sidebar", () => {
    render(<DashboardShell {...dashboardData} />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("deve renderizar o DashboardContent", () => {
    render(<DashboardShell {...dashboardData} />)

    expect(screen.getByText("Ligar para João")).toBeInTheDocument()
  })

  it("deve renderizar o botão de abrir menu", () => {
    render(<DashboardShell {...dashboardData} />)

    expect(
      screen.getByRole("button", {
        name: "Abrir menu",
      })
    ).toBeInTheDocument()
  })

  it("deve abrir o Sidebar ao clicar no botão", () => {
    render(<DashboardShell {...dashboardData} />)

    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir menu",
      })
    )

    expect(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })
    ).toHaveLength(2)
  })

  it("deve fechar o Sidebar ao clicar no overlay", () => {
    render(<DashboardShell {...dashboardData} />)

    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir menu",
      })
    )

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Fechar menu",
      })[0]
    )

    expect(
      screen.getByRole("button", {
        name: "Fechar menu",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar os dois títulos do sistema", () => {
    render(<DashboardShell {...dashboardData} />)

    expect(
      screen.getAllByText("ConsórcioOS")
    ).toHaveLength(2)
  })

  it("deve renderizar o elemento main", () => {
    const { container } = render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      container.querySelector("main")
    ).toBeInTheDocument()
  })

  it("deve renderizar o header mobile", () => {
    const { container } = render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      container.querySelector("header")
    ).toBeInTheDocument()
  })

  it("deve renderizar exatamente um elemento main", () => {
    const { container } = render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      container.querySelectorAll("main")
    ).toHaveLength(1)
  })

  it("deve renderizar exatamente dois headers", () => {
    const { container } = render(
      <DashboardShell {...dashboardData} />
    )

    expect(
      container.querySelectorAll("header")
    ).toHaveLength(2)
  })

  it("deve renderizar o container principal", () => {
    const { container } = render(
      <DashboardShell {...dashboardData} />
    )

    expect(container.firstChild).toHaveClass(
      "flex",
      "min-h-screen"
    )
  })

  it("deve renderizar corretamente quando não houver tarefas", () => {
    render(
      <DashboardShell
        {...dashboardData}
        tasks={[]}
      />
    )

    expect(
      screen.getByRole("button", {
        name: "Abrir menu",
      })
    ).toBeInTheDocument()
  })
})