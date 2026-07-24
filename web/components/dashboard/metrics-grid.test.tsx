// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MetricsGrid } from "./metrics-grid"
import type { DashboardMetrics } from "@/types/dashboard"

const metrics: DashboardMetrics = {
  newLeads: 18,
  meetingsToday: 7,
  monthlySales: 1250000,
  pendingTasks: 12,
}

describe("MetricsGrid", () => {
  it("deve renderizar a seção de indicadores", () => {
    render(<MetricsGrid metrics={metrics} />)

    expect(
      screen.getByRole("region", {
        name: "Indicadores da operação",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar os quatro títulos", () => {
    render(<MetricsGrid metrics={metrics} />)

    expect(screen.getByText("Leads novos")).toBeInTheDocument()
    expect(screen.getByText("Reuniões hoje")).toBeInTheDocument()
    expect(screen.getByText("Vendas no mês")).toBeInTheDocument()
    expect(screen.getByText("Tarefas pendentes")).toBeInTheDocument()
  })

  it("deve renderizar os valores numéricos", () => {
    render(<MetricsGrid metrics={metrics} />)

    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
  })

  it("deve formatar corretamente o valor monetário", () => {
    render(<MetricsGrid metrics={metrics} />)

    expect(
      screen.getByText("R$ 1.250.000")
    ).toBeInTheDocument()
  })

  it("deve renderizar quatro cards", () => {
    const { container } = render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      container.querySelectorAll('[data-slot="card"]')
    ).toHaveLength(4)
  })

  it("deve renderizar quatro conteúdos de card", () => {
    const { container } = render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      container.querySelectorAll('[data-slot="card-content"]')
    ).toHaveLength(4)
  })

  it("deve renderizar quatro ícones SVG", () => {
    const { container } = render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      container.querySelectorAll("svg")
    ).toHaveLength(4)
  })

  it("deve aplicar as classes da grid", () => {
    const { container } = render(
      <MetricsGrid metrics={metrics} />
    )

    const section = container.querySelector("section")

    expect(section).toHaveClass(
      "grid",
      "gap-4",
      "sm:grid-cols-2",
      "xl:grid-cols-4"
    )
  })

  it("deve atualizar os valores quando as métricas mudarem", () => {
    const updatedMetrics: DashboardMetrics = {
      newLeads: 30,
      meetingsToday: 10,
      monthlySales: 2500000,
      pendingTasks: 5,
    }

    render(<MetricsGrid metrics={updatedMetrics} />)

    expect(screen.getByText("30")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()

    expect(
      screen.getByText("R$ 2.500.000")
    ).toBeInTheDocument()
  })

  it("deve manter todos os títulos após atualização das métricas", () => {
    render(<MetricsGrid metrics={metrics} />)

    expect(screen.getAllByText(/Leads|Reuniões|Vendas|Tarefas/)).toHaveLength(4)
  })
})