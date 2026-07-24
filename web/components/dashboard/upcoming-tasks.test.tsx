// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { UpcomingTasks } from "./upcoming-tasks"
import type { Task } from "@/types/dashboard"

const tasks: Task[] = [
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
  {
    id: "task-3",
    title: "Follow-up",
    time: "16:00",
    priority: "low",
  },
]

describe("UpcomingTasks", () => {
  it("deve renderizar o título da seção", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(
      screen.getByText("Próximas tarefas")
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão Ver todas", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(
      screen.getByRole("button", {
        name: /Ver todas/i,
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar todas as tarefas", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(screen.getByText("Ligar para cliente")).toBeInTheDocument()
    expect(screen.getByText("Enviar proposta")).toBeInTheDocument()
    expect(screen.getByText("Follow-up")).toBeInTheDocument()
  })

  it("deve renderizar todos os horários", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(screen.getByText("09:00")).toBeInTheDocument()
    expect(screen.getByText("11:30")).toBeInTheDocument()
    expect(screen.getByText("16:00")).toBeInTheDocument()
  })

  it("deve renderizar os labels de prioridade", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(screen.getByText("Alta")).toBeInTheDocument()
    expect(screen.getByText("Média")).toBeInTheDocument()
    expect(screen.getByText("Baixa")).toBeInTheDocument()
  })

  it("deve renderizar um card para cada tarefa", () => {
    const { container } = render(<UpcomingTasks tasks={tasks} />)

    expect(
      container.querySelectorAll('[data-slot="card"]')
    ).toHaveLength(1)

    expect(
      container.querySelectorAll('[data-slot="card-content"]')
    ).toHaveLength(1)
  })

  it("deve renderizar um ícone de relógio para cada tarefa", () => {
    const { container } = render(<UpcomingTasks tasks={tasks} />)

    const clocks = container.querySelectorAll("svg")

    expect(clocks.length).toBeGreaterThanOrEqual(tasks.length)
  })

  it("deve aplicar o estilo da prioridade alta", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(screen.getByText("Alta")).toHaveClass(
      "bg-destructive/10",
      "text-destructive"
    )
  })

  it("deve aplicar o estilo da prioridade média", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(screen.getByText("Média")).toHaveClass(
      "bg-amber-500/10",
      "text-amber-700"
    )
  })

  it("deve aplicar o estilo da prioridade baixa", () => {
    render(<UpcomingTasks tasks={tasks} />)

    expect(screen.getByText("Baixa")).toHaveClass(
      "bg-muted",
      "text-muted-foreground"
    )
  })

  it("deve renderizar corretamente quando existir apenas uma tarefa", () => {
    render(<UpcomingTasks tasks={[tasks[0]]} />)

    expect(
      screen.getByText("Ligar para cliente")
    ).toBeInTheDocument()

    expect(screen.queryByText("Enviar proposta")).not.toBeInTheDocument()
  })

  it("deve renderizar corretamente quando não houver tarefas", () => {
    const { container } = render(<UpcomingTasks tasks={[]} />)

    expect(
      container.querySelector('[data-slot="card"]')
    ).toBeInTheDocument()

    expect(screen.queryByText("Alta")).not.toBeInTheDocument()
    expect(screen.queryByText("Média")).not.toBeInTheDocument()
    expect(screen.queryByText("Baixa")).not.toBeInTheDocument()
  })

  it("deve renderizar os componentes Card corretamente", () => {
    const { container } = render(<UpcomingTasks tasks={tasks} />)

    expect(
      container.querySelector('[data-slot="card-header"]')
    ).toBeInTheDocument()

    expect(
      container.querySelector('[data-slot="card-title"]')
    ).toBeInTheDocument()

    expect(
      container.querySelector('[data-slot="card-content"]')
    ).toBeInTheDocument()
  })
})