// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { DashboardData } from "@/types/dashboard"

import { DashboardContent } from "./dashboard-content"

const dashboardData: DashboardData = {
  user: {
    id: "user-1",
    name: "Rafael",
  },
  summary: "Hoje existem 2 oportunidades críticas.",
  metrics: {
    newLeads: 18,
    meetingsToday: 7,
    monthlySales: 1250000,
    pendingTasks: 2,
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
  opportunities: [
    {
      id: "journey-1",
      title:
        "Oportunidade real",
      origin: "client",
      originName:
        "Cliente real",
      consultantName:
        "Rafael",
      priority: "HIGH",
      score: 90,
      phaseName: "Negociação",
      stateName:
        "Proposta enviada",
      consortiumType:
        "real_estate",
      lastInteractionAt:
        null,
      updatedAt:
        "2026-07-26T18:00:00.000Z",
      status: "open",
      outcome: null,
    },
  ],
  intelligence: {
    criticalCount: 1,
    importantCount: 1,
    monitoringCount: 0,
    unpreparedMeetings: 2,
    staleOpportunities: 1,
    pipelineValue: 850000,
    nextAction: "Ligar para cliente",
    topOpportunity: {
      id: "lead-1",
      name: "Marina Costa",
      value: 500000,
      score: 92,
    },
  },
}

describe("DashboardContent", () => {
  it("apresenta o resumo operacional do R2", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(
      screen.getByText("Hoje existem 2 oportunidades críticas.")
    ).toBeInTheDocument()
    expect(screen.getByText("R2 em atividade")).toBeInTheDocument()
  })

  it("organiza as ações pela hierarquia operacional", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(screen.getAllByText("Crítico")).toHaveLength(2)
    expect(screen.getAllByText("Importante")).toHaveLength(2)
    expect(screen.getByText("Acompanhar")).toBeInTheDocument()
  })

  it("destaca a primeira ação sem duplicar o título da tarefa", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(
      screen.getByText("Comece por: Ligar para cliente")
    ).toBeInTheDocument()
    expect(screen.getByText("Ligar para cliente")).toBeInTheDocument()
  })

  it("destaca a oportunidade com maior potencial", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(
      screen.getByText(/Marina Costa · R\$\s*500\.000 · score 92/)
    ).toBeInTheDocument()
  })

  it("mantém os indicadores e a fila de tarefas existentes", () => {
    render(<DashboardContent {...dashboardData} />)

    expect(screen.getByText("Novas oportunidades")).toBeInTheDocument()
    expect(screen.getByText("Compromissos hoje")).toBeInTheDocument()
    expect(screen.getByText("Produção no mês")).toBeInTheDocument()
    expect(screen.getByText("Ações pendentes")).toBeInTheDocument()
    expect(screen.getByText("Próximas tarefas")).toBeInTheDocument()
    expect(screen.getByText("Enviar proposta")).toBeInTheDocument()
  })

  it("renderiza as oportunidades reais", () => {
    render(
      <DashboardContent
        {...dashboardData}
      />,
    )

    expect(
      screen.getByText(
        "Oportunidade real",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Cliente real · Rafael/,
      ),
    ).toBeInTheDocument()
  })

  it("renderiza estado vazio de oportunidades", () => {
    render(
      <DashboardContent
        {...dashboardData}
        opportunities={[]}
      />,
    )

    expect(
      screen.getByText(
        "Nenhuma oportunidade encontrada.",
      ),
    ).toBeInTheDocument()
  })

  it("oferece uma orientação segura quando não há tarefas", () => {
    render(
      <DashboardContent
        {...dashboardData}
        tasks={[]}
        intelligence={undefined}
      />
    )

    expect(
      screen.getByText("Comece por: Revisar o pipeline comercial")
    ).toBeInTheDocument()
    expect(screen.getByText("Operação em dia")).toBeInTheDocument()
  })
})
