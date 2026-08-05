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
  AgendaCreateForm,
} from "./agenda-create-form"

describe("AgendaCreateForm", () => {
  it("permite criar tarefa ou reunião vinculada a lead", () => {
    render(
      <AgendaCreateForm
        view={{
          leads: [
            {
              id: "lead-1",
              name: "Rosecleia",
            },
          ],
        }}
        action={vi.fn(
          async () => ({
            status: "idle" as const,
            message: null,
          }),
        )}
      />,
    )

    expect(
      screen.getByRole("heading", {
        name: "Novo compromisso",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        "Tipo de compromisso",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Lead"),
    ).toHaveValue("lead-1")
    expect(
      screen.getByRole("button", {
        name: "Criar compromisso",
      }),
    ).toBeEnabled()
  })

  it("bloqueia o cadastro sem leads", () => {
    render(
      <AgendaCreateForm
        view={{
          leads: [],
        }}
        action={vi.fn(
          async () => ({
            status: "idle" as const,
            message: null,
          }),
        )}
      />,
    )

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Cadastre um lead",
    )
    expect(
      screen.getByRole("button", {
        name: "Criar compromisso",
      }),
    ).toBeDisabled()
  })
})
