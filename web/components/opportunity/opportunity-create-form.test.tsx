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
  OpportunityCreateActionState,
  OpportunityCreateFormView,
} from "@/types/opportunity-create"

const mocks = vi.hoisted(() => ({
  state: {
    status: "idle",
    message: null,
  } as OpportunityCreateActionState,
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
  OpportunityCreateForm,
} from "./opportunity-create-form"

function createView():
  OpportunityCreateFormView {
  return {
    clients: [
      {
        id: "client-1",
        name: "Marina Costa",
      },
      {
        id: "client-2",
        name: "Rafael Lima",
      },
    ],
  }
}

describe(
  "OpportunityCreateForm",
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
      "renderiza estado inicial, labels e somente cinco campos",
      () => {
        const action = vi.fn()
        const { container } =
          render(
            <OpportunityCreateForm
              view={createView()}
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
            "Cliente",
          ),
        ).toHaveValue("")
        expect(
          screen.getByLabelText(
            "Título",
          ),
        ).toHaveValue("")
        expect(
          screen.getByLabelText(
            "Título",
          ),
        ).toHaveAttribute(
          "placeholder",
          "Ex.: Compra do primeiro imóvel",
        )
        expect(
          screen.getByLabelText(
            "Tipo de consórcio",
          ),
        ).toHaveValue(
          "real_estate",
        )
        expect(
          screen.getByLabelText(
            "Prioridade",
          ),
        ).toHaveValue("NORMAL")
        expect(
          screen.getByLabelText(
            "Score",
          ),
        ).toHaveValue(0)
        expect(
          screen.getByRole(
            "option",
            {
              name:
                "Marina Costa",
            },
          ),
        ).toHaveValue("client-1")
        expect(
          screen.getByRole(
            "option",
            {
              name: "Imóvel",
            },
          ),
        ).toHaveValue(
          "real_estate",
        )
        expect(
          screen.getByRole(
            "option",
            {
              name: "Urgente",
            },
          ),
        ).toHaveValue("URGENT")

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
          "clientId",
          "title",
          "consortiumType",
          "priority",
          "score",
        ])
        expect(
          container.querySelector(
            'input[type="hidden"]',
          ),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "submete FormData real com exatamente cinco valores atuais",
      async () => {
        const action = vi.fn()
        render(
          <OpportunityCreateForm
            view={createView()}
            action={action}
          />,
        )

        const changes = [
          [
            "Cliente",
            "client-2",
          ],
          [
            "Título",
            "Minha oportunidade",
          ],
          [
            "Tipo de consórcio",
            "vehicle",
          ],
          [
            "Prioridade",
            "HIGH",
          ],
          ["Score", "72"],
        ] as const

        for (const [
          label,
          value,
        ] of changes) {
          fireEvent.change(
            screen.getByLabelText(
              label,
            ),
            {
              target: { value },
            },
          )
        }

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Criar oportunidade",
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
          ["clientId", "client-2"],
          [
            "title",
            "Minha oportunidade",
          ],
          [
            "consortiumType",
            "vehicle",
          ],
          ["priority", "HIGH"],
          ["score", "72"],
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
      "preserva valores e field errors após erro",
      async () => {
        mocks.state = {
          status: "error",
          message:
            "Não foi possível criar.",
          values: {
            clientId: "client-2",
            title: "Título enviado",
            consortiumType:
              "services",
            priority: "URGENT",
            score: "99",
          },
          fieldErrors: {
            clientId:
              "Cliente inválido.",
            score: "Score inválido.",
          },
        }

        render(
          <OpportunityCreateForm
            view={createView()}
            action={vi.fn()}
          />,
        )

        expect(
          screen.getByText(
            "Não foi possível criar.",
          ),
        ).toHaveAttribute(
          "role",
          "alert",
        )
        expect(
          screen.getByLabelText(
            "Cliente",
          ),
        ).toHaveValue("client-2")
        expect(
          screen.getByLabelText(
            "Título",
          ),
        ).toHaveValue(
          "Título enviado",
        )
        expect(
          screen.getByLabelText(
            "Tipo de consórcio",
          ),
        ).toHaveValue("services")
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
            "Cliente inválido.",
          ),
        ).toBeInTheDocument()
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
                "Criar oportunidade",
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
        ).toHaveLength(5)
      },
    )

    it(
      "desabilita criação durante pending",
      () => {
        mocks.pending = true

        render(
          <OpportunityCreateForm
            view={createView()}
            action={vi.fn()}
          />,
        )

        expect(
          screen.getByRole(
            "button",
            {
              name: "Criando",
            },
          ),
        ).toBeDisabled()
      },
    )

    it(
      "bloqueia envio e informa ausência de clientes",
      () => {
        render(
          <OpportunityCreateForm
            view={{ clients: [] }}
            action={vi.fn()}
          />,
        )

        expect(
          screen.getByRole("status"),
        ).toHaveTextContent(
          "É necessário cadastrar um cliente antes de criar uma oportunidade.",
        )
        expect(
          screen.getByLabelText(
            "Cliente",
          ),
        ).toBeDisabled()
        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Criar oportunidade",
            },
          ),
        ).toBeDisabled()
        expect(
          mocks.formAction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "oferece cancelamento seguro para o Mission Control",
      () => {
        render(
          <OpportunityCreateForm
            view={createView()}
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
            "/",
          )
        }
      },
    )
  },
)
