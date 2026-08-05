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
  ClientCreateActionState,
  ClientCreateFormView,
} from "@/types/client-create"

const mocks = vi.hoisted(() => ({
  state: {
    status: "idle",
    message: null,
  } as ClientCreateActionState,
  pending: false,
  formAction: vi.fn(),
  useActionState: vi.fn(),
}))

vi.mock("react", async (importOriginal) => {
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
})

import { ClientCreateForm } from "./client-create-form"

function createView():
  ClientCreateFormView {
  return {
    consultants: [
      {
        id: "consultant-1",
        name: "Marina Costa",
      },
    ],
  }
}

const commonValues = {
  email: "ana@example.com",
  phone: "(41) 99999-8877",
  phoneCountryCode: "55",
  document: "529.982.247-25",
  consultantId: "consultant-1",
  addressStreet: "Rua A",
  addressNumber: "10",
  addressComplement: "",
  addressNeighborhood: "Centro",
  addressCity: "Curitiba",
  addressState: "PR",
  addressZipCode: "80000-000",
}

function fillCommonFields(
  documentLabel: "CPF" | "CNPJ" = "CPF",
) {
  const labels = {
    "E-mail": commonValues.email,
    Telefone: commonValues.phone,
    "Código do país":
      commonValues.phoneCountryCode,
    [documentLabel]:
      commonValues.document,
    Consultor:
      commonValues.consultantId,
    Rua: commonValues.addressStreet,
    Número:
      commonValues.addressNumber,
    Complemento: "",
    Bairro:
      commonValues.addressNeighborhood,
    Cidade: commonValues.addressCity,
    Estado: commonValues.addressState,
    CEP: commonValues.addressZipCode,
  }

  for (const [label, value] of
    Object.entries(labels)) {
    fireEvent.change(
      screen.getByLabelText(label),
      { target: { value } },
    )
  }
}

describe("ClientCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.state = {
      status: "idle",
      message: null,
    }
    mocks.pending = false
  })

  it("usa Action e estado inicial exatos e apresenta PF", () => {
    const action = vi.fn()
    const { container } = render(
      <ClientCreateForm
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
        "Tipo de pessoa",
      ),
    ).toHaveValue("individual")
    expect(
      screen.getByLabelText(
        "Código do país",
      ),
    ).toHaveValue("55")
    expect(
      screen.getByLabelText("Nome"),
    ).toHaveValue("")
    expect(
      screen.queryByLabelText(
        "Razão social",
      ),
    ).not.toBeInTheDocument()
    expect(
      container.querySelector(
        'input[type="hidden"]',
      ),
    ).not.toBeInTheDocument()
  })

  it("alterna para PJ sem manter o campo PF no DOM", () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText(
        "Tipo de pessoa",
      ),
      { target: { value: "company" } },
    )

    expect(
      screen.getByLabelText(
        "Razão social",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText("Nome"),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText("CNPJ"),
    ).toBeInTheDocument()
  })

  it("preserva name ao alternar PF para PJ e voltar", () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    fireEvent.change(
      screen.getByLabelText("Nome"),
      {
        target: {
          value: "Ana Lima",
        },
      },
    )
    fireEvent.change(
      screen.getByLabelText(
        "Tipo de pessoa",
      ),
      { target: { value: "company" } },
    )
    fireEvent.change(
      screen.getByLabelText(
        "Tipo de pessoa",
      ),
      {
        target: {
          value: "individual",
        },
      },
    )

    expect(
      screen.getByLabelText("Nome"),
    ).toHaveValue("Ana Lima")
  })

  it("preserva companyName ao alternar PJ para PF e voltar", () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    const typeField =
      screen.getByLabelText(
        "Tipo de pessoa",
      )
    fireEvent.change(typeField, {
      target: { value: "company" },
    })
    fireEvent.change(
      screen.getByLabelText(
        "Razão social",
      ),
      {
        target: {
          value: "Empresa Ltda.",
        },
      },
    )
    fireEvent.change(typeField, {
      target: { value: "individual" },
    })
    fireEvent.change(typeField, {
      target: { value: "company" },
    })

    expect(
      screen.getByLabelText(
        "Razão social",
      ),
    ).toHaveValue("Empresa Ltda.")
  })

  it("preserva independentemente name e companyName em alternâncias sucessivas", () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    const typeField =
      screen.getByLabelText(
        "Tipo de pessoa",
      )
    fireEvent.change(
      screen.getByLabelText("Nome"),
      {
        target: {
          value: "Ana Lima",
        },
      },
    )
    fireEvent.change(typeField, {
      target: { value: "company" },
    })
    fireEvent.change(
      screen.getByLabelText(
        "Razão social",
      ),
      {
        target: {
          value: "Empresa Ltda.",
        },
      },
    )
    fireEvent.change(typeField, {
      target: { value: "individual" },
    })
    expect(
      screen.getByLabelText("Nome"),
    ).toHaveValue("Ana Lima")
    fireEvent.change(typeField, {
      target: { value: "company" },
    })
    expect(
      screen.getByLabelText(
        "Razão social",
      ),
    ).toHaveValue("Empresa Ltda.")
  })

  it("submete FormData PF real com 14 campos e sem campos proibidos", async () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    fireEvent.change(
      screen.getByLabelText("Nome"),
      { target: { value: "Ana Lima" } },
    )
    fillCommonFields()
    fireEvent.click(
      screen.getByRole("button", {
        name: "Criar cliente",
      }),
    )

    await waitFor(() =>
      expect(
        mocks.formAction,
      ).toHaveBeenCalledTimes(1),
    )
    const submitted =
      mocks.formAction.mock.calls[0]?.[0]
    expect(submitted).toBeInstanceOf(
      FormData,
    )
    if (!(submitted instanceof FormData)) {
      throw new Error(
        "FormData esperado.",
      )
    }

    const entries = Array.from(
      submitted.entries(),
    )
    expect(entries).toHaveLength(14)
    expect(
      Object.fromEntries(entries),
    ).toEqual({
      type: "individual",
      name: "Ana Lima",
      ...commonValues,
    })
    expect(
      submitted.has("companyName"),
    ).toBe(false)
  }, 15_000)

  it("submete FormData PJ real com 14 campos e sem name", async () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    fireEvent.change(
      screen.getByLabelText(
        "Tipo de pessoa",
      ),
      { target: { value: "company" } },
    )
    fireEvent.change(
      screen.getByLabelText(
        "Razão social",
      ),
      {
        target: {
          value:
            "Consórcio Exemplo Ltda.",
        },
      },
    )
    fillCommonFields("CNPJ")
    fireEvent.click(
      screen.getByRole("button", {
        name: "Criar cliente",
      }),
    )

    await waitFor(() =>
      expect(
        mocks.formAction,
      ).toHaveBeenCalledTimes(1),
    )
    const submitted =
      mocks.formAction.mock.calls[0]?.[0]
    if (!(submitted instanceof FormData)) {
      throw new Error(
        "FormData esperado.",
      )
    }
    expect(
      Object.fromEntries(
        submitted.entries(),
      ),
    ).toEqual({
      type: "company",
      companyName:
        "Consórcio Exemplo Ltda.",
      ...commonValues,
    })
    expect(
      Array.from(
        submitted.entries(),
      ),
    ).toHaveLength(14)
    expect(submitted.has("name")).toBe(
      false,
    )
  }, 15_000)

  it.each([
    ["individual", "Nome"],
    ["company", "Razão social"],
  ])(
    "restaura estado de erro %s e permite ressubmissão",
    async (type, conditionalLabel) => {
      mocks.state = {
        status: "error",
        message: "Falha ao criar.",
        values: {
          type,
          name:
            type === "individual"
              ? "Ana Lima"
              : "",
          companyName:
            type === "company"
              ? "Empresa Ltda."
              : "",
          ...commonValues,
        },
        fieldErrors: {
          document:
            "Documento inválido.",
        },
      }

      render(
        <ClientCreateForm
          view={createView()}
          action={vi.fn()}
        />,
      )

      expect(
        screen.getByText(
          "Falha ao criar.",
        ),
      ).toHaveAttribute(
        "role",
        "alert",
      )
      expect(
        screen.getByText(
          "Falha ao criar.",
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(
          conditionalLabel,
        ),
      ).toHaveValue(
        type === "individual"
          ? "Ana Lima"
          : "Empresa Ltda.",
      )
      expect(
        screen.getByText(
          "Documento inválido.",
        ),
      ).toBeInTheDocument()

      const typeField =
        screen.getByLabelText(
          "Tipo de pessoa",
        )
      fireEvent.change(typeField, {
        target: {
          value:
            type === "individual"
              ? "company"
              : "individual",
        },
      })
      fireEvent.change(typeField, {
        target: { value: type },
      })
      expect(
        screen.getByLabelText(
          conditionalLabel,
        ),
      ).toHaveValue(
        type === "individual"
          ? "Ana Lima"
          : "Empresa Ltda.",
      )

      fireEvent.click(
        screen.getByRole("button", {
          name: "Criar cliente",
        }),
      )
      await waitFor(() =>
        expect(
          mocks.formAction,
        ).toHaveBeenCalledTimes(1),
      )

      const submitted =
        mocks.formAction.mock
          .calls[0]?.[0]
      if (
        !(submitted instanceof FormData)
      ) {
        throw new Error(
          "FormData esperado.",
        )
      }
      expect(
        Array.from(
          submitted.entries(),
        ),
      ).toHaveLength(14)
      expect(
        submitted.has(
          type === "individual"
            ? "companyName"
            : "name",
        ),
      ).toBe(false)
    },
  )

  it("desabilita criação durante pending", () => {
    mocks.pending = true
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    expect(
      screen.getByRole("button", {
        name: "Criando",
      }),
    ).toBeDisabled()
  })

  it("bloqueia criação sem consultores", () => {
    render(
      <ClientCreateForm
        view={{ consultants: [] }}
        action={vi.fn()}
      />,
    )
    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "É necessário cadastrar um consultor antes de criar um cliente.",
    )
    expect(
      screen.getByLabelText(
        "Consultor",
      ),
    ).toBeDisabled()
    expect(
      screen.getByRole("button", {
        name: "Criar cliente",
      }),
    ).toBeDisabled()
    expect(
      mocks.formAction,
    ).not.toHaveBeenCalled()
  })

  it("oferece cancelamento para o Mission Control", () => {
    render(
      <ClientCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )
    for (const link of screen.getAllByRole(
      "link",
      { name: /cancelar/i },
    )) {
      expect(link).toHaveAttribute(
        "href",
        "/",
      )
    }
  })
})
