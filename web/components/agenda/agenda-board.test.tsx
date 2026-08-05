// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  AgendaBoard,
} from "./agenda-board"

const action =
  vi.fn(async () => {})

describe("AgendaBoard", () => {
  it("renderiza tarefas e reuniões reais", () => {
    render(
      <AgendaBoard
        view={{
          tasks: [
            {
              id: "task-1",
              title:
                "Retornar contato com Rosecleia",
              description:
                "Confirmar interesse.",
              statusLabel:
                "Pendente",
              priorityLabel:
                "Alta",
              dueAtLabel:
                "04/08/2026 13:10",
              dueAtInput:
                "2026-08-04T13:10",
              overdue: false,
              relatedName:
                "Rosecleia",
              opportunityHref:
                "/opportunities/journey-1",
            },
          ],
          meetings: [
            {
              id: "meeting-1",
              title:
                "Reunião de diagnóstico",
              description: null,
              typeLabel:
                "Online",
              startAtLabel:
                "05/08/2026 10:00",
              startAtInput:
                "2026-08-05T10:00",
              endAtInput:
                "2026-08-05T11:00",
              relatedName:
                "Maria",
              location: null,
              meetingUrl:
                "https://meet.example.com/test",
              opportunityHref:
                "/opportunities/journey-2",
            },
          ],
        }}
        completeTaskAction={action}
        rescheduleTaskAction={action}
        completeMeetingAction={action}
        rescheduleMeetingAction={action}
      />,
    )

    expect(
      screen.getByText(
        "Retornar contato com Rosecleia",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Reunião de diagnóstico",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", {
        name: "Novo compromisso",
      }),
    ).toHaveAttribute(
      "href",
      "/agenda/new",
    )
    expect(
      screen.getByRole("link", {
        name: "Entrar na reunião",
      }),
    ).toHaveAttribute(
      "href",
      "https://meet.example.com/test",
    )
  })

  it("exibe estados vazios", () => {
    render(
      <AgendaBoard
        view={{
          tasks: [],
          meetings: [],
        }}
        completeTaskAction={action}
        rescheduleTaskAction={action}
        completeMeetingAction={action}
        rescheduleMeetingAction={action}
      />,
    )

    expect(
      screen.getByText(
        "Nenhuma tarefa pendente.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Nenhuma reunião agendada.",
      ),
    ).toBeInTheDocument()
  })
})
