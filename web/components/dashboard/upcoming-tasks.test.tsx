// @vitest-environment jsdom

import {
  render,
  screen,
  within,
} from "@testing-library/react"

import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  Task,
} from "@/types/dashboard"

import {
  UpcomingTasks,
} from "./upcoming-tasks"

const tasks: Task[] = [
  {
    id: "task-1",
    title: "Retornar contato do cliente Rafael",
    time: "09:30",
    priority: "high",
  },
  {
    id: "task-2",
    title: "Enviar proposta atualizada",
    time: "11:00",
    priority: "medium",
  },
  {
    id: "task-3",
    title: "Confirmar reunião comercial",
    time: "14:45",
    priority: "low",
  },
]

describe("UpcomingTasks", () => {
  it("deve renderizar a seção de próximas tarefas", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByRole("region", {
        name: "Próximas ações",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar o título da seção", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Próximas ações",
      })
    ).toBeInTheDocument()
  })

  it("deve associar corretamente o título à seção", () => {
    const {
      container,
    } = render(
      <UpcomingTasks tasks={tasks} />
    )

    const section =
      container.querySelector("section")

    const title =
      screen.getByRole("heading", {
        level: 2,
        name: "Próximas ações",
      })

    expect(section).toHaveAttribute(
      "aria-labelledby",
      "upcoming-tasks-title"
    )

    expect(title).toHaveAttribute(
      "id",
      "upcoming-tasks-title"
    )
  })

  it("deve renderizar o rótulo de execução comercial", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText(
        "Execução comercial"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o botão para visualizar todas as tarefas", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByRole("link", {
        name: "Ver agenda",
      })
    ).toBeInTheDocument()
  })

  it("deve conectar o atalho à agenda real", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByRole("link", {
        name: "Ver agenda",
      })
    ).toHaveAttribute(
      "href",
      "/agenda"
    )
  })

  it("deve renderizar o ícone principal da seção", () => {
    const {
      container,
    } = render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      container.querySelector(
        "svg.lucide-list-todo"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o ícone de seta no botão", () => {
    const {
      container,
    } = render(
      <UpcomingTasks tasks={tasks} />
    )

    const button =
      screen.getByRole("link", {
        name: "Ver agenda",
      })

    expect(
      button.querySelector(
        "svg.lucide-arrow-right"
      )
    ).toBeInTheDocument()

    expect(
      container.querySelectorAll(
        "svg.lucide-arrow-right"
      ).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("deve renderizar uma tarefa para cada item recebido", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getAllByRole("article")
    ).toHaveLength(3)
  })

  it("deve preservar a ordem das tarefas recebidas", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    const articles =
      screen.getAllByRole("article")

    expect(
      within(
        articles[0]
      ).getByText(
        "Retornar contato do cliente Rafael"
      )
    ).toBeInTheDocument()

    expect(
      within(
        articles[1]
      ).getByText(
        "Enviar proposta atualizada"
      )
    ).toBeInTheDocument()

    expect(
      within(
        articles[2]
      ).getByText(
        "Confirmar reunião comercial"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar os títulos das tarefas", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText(
        "Retornar contato do cliente Rafael"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "Enviar proposta atualizada"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "Confirmar reunião comercial"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar os horários das tarefas", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("09:30")
    ).toBeInTheDocument()

    expect(
      screen.getByText("11:00")
    ).toBeInTheDocument()

    expect(
      screen.getByText("14:45")
    ).toBeInTheDocument()
  })

  it("deve renderizar a numeração das tarefas com dois dígitos", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("01")
    ).toBeInTheDocument()

    expect(
      screen.getByText("02")
    ).toBeInTheDocument()

    expect(
      screen.getByText("03")
    ).toBeInTheDocument()
  })

  it("deve numerar corretamente uma lista com mais de nove tarefas", () => {
    const manyTasks: Task[] =
      Array.from(
        {
          length: 10,
        },
        (
          _,
          index
        ) => ({
          id: `task-${index + 1}`,
          title: `Tarefa ${index + 1}`,
          time: "10:00",
          priority: "low",
        })
      )

    render(
      <UpcomingTasks
        tasks={manyTasks}
      />
    )

    expect(
      screen.getByText("09")
    ).toBeInTheDocument()

    expect(
      screen.getByText("10")
    ).toBeInTheDocument()
  })

  it("deve renderizar o rótulo de prioridade alta", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("Crítico")
    ).toBeInTheDocument()
  })

  it("deve renderizar o rótulo de prioridade média com acentuação correta", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("Importante")
    ).toBeInTheDocument()
  })

  it("deve renderizar o rótulo de prioridade baixa", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("Acompanhamento")
    ).toBeInTheDocument()
  })

  it("deve aplicar o estilo da prioridade alta", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("Crítico")
    ).toHaveClass(
      "border-[#E16A6A]/15",
      "bg-[#E16A6A]/[0.07]",
      "text-[#E98A8A]"
    )
  })

  it("deve aplicar o estilo da prioridade média", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("Importante")
    ).toHaveClass(
      "border-[#2F8F5B]/20",
      "bg-[#2F8F5B]/[0.10]",
      "text-[#43A972]"
    )
  })

  it("deve aplicar o estilo da prioridade baixa", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText("Acompanhamento")
    ).toHaveClass(
      "border-white/[0.06]",
      "bg-white/[0.035]",
      "text-[#96A0AF]"
    )
  })

  it("deve aplicar as classes padrão aos indicadores de prioridade", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    const priority =
      screen.getByText("Crítico")

    expect(priority).toHaveClass(
      "shrink-0",
      "rounded-full",
      "border",
      "px-2.5",
      "py-1",
      "text-[10px]",
      "font-semibold",
      "uppercase",
      "tracking-[0.10em]"
    )
  })

  it("deve renderizar um ícone de relógio para cada tarefa", () => {
    const {
      container,
    } = render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      container.querySelectorAll(
        "svg.lucide-clock"
      )
    ).toHaveLength(3)
  })

  it("deve renderizar uma seta de ação para cada tarefa", () => {
    const {
      container,
    } = render(
      <UpcomingTasks tasks={tasks} />
    )

    const taskArrows =
      container.querySelectorAll(
        "article svg.lucide-arrow-right"
      )

    expect(
      taskArrows
    ).toHaveLength(3)
  })

  it("deve aplicar truncamento aos títulos das tarefas", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByText(
        "Retornar contato do cliente Rafael"
      )
    ).toHaveClass(
      "truncate",
      "text-sm",
      "font-medium",
      "text-[#D6DBE3]"
    )
  })

  it("deve aplicar o efeito de relevo às tarefas sem usar azul", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    const article =
      screen.getAllByRole(
        "article"
      )[0]

    expect(article).toHaveClass(
      "transition-[border-color,background-color,box-shadow,transform]",
      "duration-200",
      "hover:-translate-y-px",
      "hover:border-white/[0.065]",
      "hover:bg-white/[0.025]"
    )

    expect(
      article.className.toLowerCase()
    ).not.toContain("blue")
  })

  it("deve aplicar o efeito de relevo ao botão sem usar azul", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    const button =
      screen.getByRole("link", {
        name: "Ver agenda",
      })

    expect(button).toHaveClass(
      "transition-[border-color,background-color,box-shadow,color,transform]",
      "duration-200",
      "hover:-translate-y-0.5",
      "hover:border-white/[0.10]",
      "hover:bg-white/[0.025]",
      "active:translate-y-px"
    )

    expect(
      button.className.toLowerCase()
    ).not.toContain("blue")
  })

  it("deve aplicar foco visível dourado ao botão", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByRole("link", {
        name: "Ver agenda",
      })
    ).toHaveClass(
      "focus-visible:border-[#2F8F5B]/50",
      "focus-visible:shadow-[0_0_0_4px_rgba(47,143,91,0.12)]"
    )
  })

  it("deve aplicar a estrutura visual premium à seção", () => {
    render(
      <UpcomingTasks tasks={tasks} />
    )

    expect(
      screen.getByRole("region", {
        name: "Próximas ações",
      })
    ).toHaveClass(
      "overflow-hidden",
      "rounded-[24px]",
      "border",
      "border-white/[0.065]",
      "bg-[#15191F]/88",
      "backdrop-blur-xl"
    )
  })

  it("deve renderizar o estado vazio quando não houver tarefas", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Operação em dia",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar a mensagem explicativa do estado vazio", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    expect(
      screen.getByText(
        "O R2 está acompanhando sua operação. Novas ações prioritárias aparecerão aqui no momento certo."
      )
    ).toBeInTheDocument()
  })

  it("não deve renderizar artigos quando a lista estiver vazia", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    expect(
      screen.queryAllByRole(
        "article"
      )
    ).toHaveLength(0)
  })

  it("deve renderizar o ícone de conclusão no estado vazio", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    const emptyTitle =
      screen.getByRole("heading", {
        level: 3,
        name: "Operação em dia",
      })

    const emptyContainer =
      emptyTitle.parentElement

    const icon =
      emptyContainer?.querySelector(
        "svg"
      )

    expect(
      icon
    ).toBeInTheDocument()
  })

  it("deve aplicar as classes corretas ao contêiner do estado vazio", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    const emptyTitle =
      screen.getByRole("heading", {
        level: 3,
        name: "Operação em dia",
      })

    const emptyContainer =
      emptyTitle.parentElement

    expect(emptyContainer).toHaveClass(
      "flex",
      "min-h-52",
      "flex-col",
      "items-center",
      "justify-center",
      "rounded-[20px]",
      "border",
      "gorila-material",
      "relative",
      "overflow-hidden",
      "text-center"
    )
  })

  it("deve aplicar corretamente as classes separadas do ícone vazio", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    const emptyTitle =
      screen.getByRole("heading", {
        level: 3,
        name: "Operação em dia",
      })

    const emptyContainer =
      emptyTitle.parentElement

    const icon =
      emptyContainer?.querySelector(
        "svg"
      )

    const iconContainer =
      icon?.parentElement

    expect(iconContainer).toHaveClass(
      "flex",
      "size-11",
      "items-center",
      "justify-center",
      "rounded-2xl",
      "border",
      "border-[var(--gorila-green-bright)]/20",
      "bg-[var(--gorila-green-soft)]",
      "text-[var(--gorila-green-bright)]"
    )
  })

  it("deve manter o botão disponível mesmo no estado vazio", () => {
    render(
      <UpcomingTasks tasks={[]} />
    )

    expect(
      screen.getByRole("link", {
        name: "Ver agenda",
      })
    ).toBeInTheDocument()
  })
})
