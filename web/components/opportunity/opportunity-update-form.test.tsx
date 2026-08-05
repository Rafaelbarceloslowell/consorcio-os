// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  OpportunityUpdateActionState,
  OpportunityUpdateFormView,
} from "@/types/opportunity-update"

const mocks = vi.hoisted(() => ({
  state: {
    status: "idle",
    message: null,
  } as OpportunityUpdateActionState,
  pending: false,
  formAction: vi.fn(),
  useActionState: vi.fn(),
}))

vi.mock(
  "react",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("react")
      >()

    return {
      ...actual,
      useActionState: (
        action: unknown,
        initialState: unknown,
      ) => {
        mocks.useActionState(
          action,
          initialState,
        )

        return [
          mocks.state,
          mocks.formAction,
          mocks.pending,
        ]
      },
    }
  },
)

import {
  OpportunityUpdateForm,
} from "./opportunity-update-form"

function createView(
  id = "journey-1",
): OpportunityUpdateFormView {
  return {
    id,
    title: "Oportunidade real",
    consultantId:
      "consultant-1",
    priority: "HIGH",
    score: 87,
    consultants: [
      {
        id: "consultant-1",
        name: "Rafael",
      },
      {
        id: "consultant-2",
        name: "Marina",
      },
    ],
  }
}

describe(
  "OpportunityUpdateForm",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.state = {
        status: "idle",
        message: null,
      }
      mocks.pending = false
    })

    it(
      "renderiza somente os quatro campos editáveis e valores iniciais",
      () => {
        const action = vi.fn()

        const { container } =
          render(
            <OpportunityUpdateForm
              opportunity={createView()}
              action={action}
            />,
          )

        expect(
          mocks.useActionState,
        ).toHaveBeenCalledExactlyOnceWith(
          action,
          {
            status: "idle",
            message: null,
          },
        )

        expect(
          screen.getByLabelText(
            "Título",
          ),
        ).toHaveValue(
          "Oportunidade real",
        )
        expect(
          screen.getByLabelText(
            "Responsável",
          ),
        ).toHaveValue(
          "consultant-1",
        )
        expect(
          screen.getByLabelText(
            "Prioridade",
          ),
        ).toHaveValue("HIGH")
        expect(
          screen.getByLabelText(
            "Score",
          ),
        ).toHaveValue(87)
        expect(
          screen.getByRole(
            "option",
            {
              name: "Marina",
            },
          ),
        ).toHaveValue(
          "consultant-2",
        )

        expect(
          Array.from(
            container.querySelectorAll(
              "input, select",
            ),
          ).map((field) =>
            field.getAttribute(
              "name",
            ),
          ),
        ).toEqual([
          "title",
          "consultantId",
          "priority",
          "score",
        ])
        expect(
          container.querySelector(
            'input[type="hidden"]',
          ),
        ).not.toBeInTheDocument()
        expect(
          container.querySelector(
            '[name="workspaceId"], [name="leadId"], [name="clientId"], [name="currentStateId"], [name="currentPhaseId"], [name="version"]',
          ),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "submete FormData real com exatamente os quatro campos permitidos",
      async () => {
        const action = vi.fn()

        render(
          <OpportunityUpdateForm
            opportunity={createView()}
            action={action}
          />,
        )

        fireEvent.change(
          screen.getByLabelText(
            "Título",
          ),
          {
            target: {
              value:
                "Título submetido",
            },
          },
        )
        fireEvent.change(
          screen.getByLabelText(
            "Responsável",
          ),
          {
            target: {
              value:
                "consultant-2",
            },
          },
        )
        fireEvent.change(
          screen.getByLabelText(
            "Prioridade",
          ),
          {
            target: {
              value: "URGENT",
            },
          },
        )
        fireEvent.change(
          screen.getByLabelText(
            "Score",
          ),
          {
            target: {
              value: "99",
            },
          },
        )

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Salvar alterações",
            },
          ),
        )

        await waitFor(() => {
          expect(
            mocks.formAction,
          ).toHaveBeenCalledTimes(1)
        })

        const submitted =
          mocks.formAction.mock
            .calls[0]?.[0]

        expect(
          submitted,
        ).toBeInstanceOf(FormData)

        if (
          !(
            submitted instanceof
            FormData
          )
        ) {
          throw new Error(
            "FormData esperado.",
          )
        }

        expect(
          Array.from(
            submitted.entries(),
          ),
        ).toEqual([
          [
            "title",
            "Título submetido",
          ],
          [
            "consultantId",
            "consultant-2",
          ],
          [
            "priority",
            "URGENT",
          ],
          ["score", "99"],
        ])
        expect(
          mocks.useActionState,
        ).toHaveBeenCalledExactlyOnceWith(
          action,
          {
            status: "idle",
            message: null,
          },
        )
      },
    )

    it(
      "preserva valores devolvidos e exibe erro acessível",
      async () => {
        mocks.state = {
          status: "error",
          message:
            "Não foi possível salvar.",
          values: {
            title: "Título enviado",
            consultantId:
              "consultant-2",
            priority: "URGENT",
            score: "99",
          },
          fieldErrors: {
            score: "Score inválido.",
          },
        }

        render(
          <OpportunityUpdateForm
            opportunity={createView()}
            action={vi.fn()}
          />,
        )

        expect(
          screen
            .getByText(
              "Não foi possível salvar.",
            )
            .closest(
              '[role="alert"]',
            ),
        ).toBeInTheDocument()
        expect(
          screen.getByLabelText(
            "Título",
          ),
        ).toHaveValue(
          "Título enviado",
        )
        expect(
          screen.getByLabelText(
            "Responsável",
          ),
        ).toHaveValue(
          "consultant-2",
        )
        expect(
          screen.getByLabelText(
            "Prioridade",
          ),
        ).toHaveValue("URGENT")
        expect(
          screen.getByLabelText(
            "Score",
          ),
        ).toHaveValue(99)
        expect(
          screen.getByText(
            "Score inválido.",
          ),
        ).toBeInTheDocument()

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Salvar alterações",
            },
          ),
        )

        await waitFor(() => {
          expect(
            mocks.formAction,
          ).toHaveBeenCalledTimes(1)
        })

        const submitted =
          mocks.formAction.mock
            .calls[0]?.[0]

        expect(
          submitted,
        ).toBeInstanceOf(FormData)

        if (
          !(
            submitted instanceof
            FormData
          )
        ) {
          throw new Error(
            "FormData esperado.",
          )
        }

        expect(
          Array.from(
            submitted.entries(),
          ),
        ).toEqual([
          [
            "title",
            "Título enviado",
          ],
          [
            "consultantId",
            "consultant-2",
          ],
          [
            "priority",
            "URGENT",
          ],
          ["score", "99"],
        ])
      },
    )

    it(
      "mostra estado pendente e desabilita salvar",
      () => {
        mocks.state = {
          status: "idle",
          message: null,
        }
        mocks.pending = true

        render(
          <OpportunityUpdateForm
            opportunity={createView()}
            action={vi.fn()}
          />,
        )

        const button =
          screen.getByRole(
            "button",
            {
              name: "Salvando",
            },
          )

        expect(button).toBeDisabled()
        expect(button).toHaveAttribute(
          "aria-busy",
          "true",
        )
      },
    )

    it(
      "codifica o ID nos dois acessos de cancelamento",
      () => {
        mocks.pending = false

        render(
          <OpportunityUpdateForm
            opportunity={createView(
              "journey/a b",
            )}
            action={vi.fn()}
          />,
        )

        for (const link of screen.getAllByRole(
          "link",
          {
            name: /cancelar/i,
          },
        )) {
          expect(link).toHaveAttribute(
            "href",
            "/opportunities/journey%2Fa%20b",
          )
        }
      },
    )
  },
)
