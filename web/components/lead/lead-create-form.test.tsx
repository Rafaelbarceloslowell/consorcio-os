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
  LeadCreateActionState,
  LeadCreateFormView,
} from "@/types/lead-create"

const mocks = vi.hoisted(() => ({
  state: {
    status: "idle",
    message: null,
  } as LeadCreateActionState,
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

import {
  LeadCreateForm,
} from "./lead-create-form"

function createView(): LeadCreateFormView {
  return {
    consultants: [
      {
        id: "consultant-1",
        name: "Rafael Ramos",
      },
    ],
  }
}

describe("LeadCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.state = {
      status: "idle",
      message: null,
    }
    mocks.pending = false
  })

  it("apresenta o formulário real sem criar cliente", () => {
    render(
      <LeadCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", {
        name: "Novo lead",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /nenhum cliente será criado antes do fechamento da cota/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        "Consultor responsável",
      ),
    ).toHaveValue("consultant-1")
    expect(
      screen.getByLabelText(
        "Código do país",
      ),
    ).toHaveValue("55")
  })

  it("submete somente os doze campos autorizados", async () => {
    render(
      <LeadCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )

    const values: Record<
      string,
      string
    > = {
      "Nome do lead":
        "Maria Oliveira",
      "Empresa (opcional)": "",
      "E-mail (opcional)":
        "maria@example.com",
      "Documento (opcional)":
        "12345678901",
      "Código do país": "55",
      Telefone: "41999999999",
      "Origem do lead":
        "social_media",
      "Tipo de consórcio":
        "real_estate",
      "Crédito desejado":
        "500000",
      "Prazo desejado em meses":
        "200",
      "Consultor responsável":
        "consultant-1",
      "Observações (opcional)":
        "Busca primeiro imóvel.",
    }

    for (const [label, value] of
      Object.entries(values)) {
      fireEvent.change(
        screen.getByLabelText(label),
        {
          target: {
            value,
          },
        },
      )
    }

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Criar lead e oportunidade",
      }),
    )

    await waitFor(() => {
      expect(
        mocks.formAction,
      ).toHaveBeenCalledTimes(1)
    })

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

    expect(
      Array.from(
        submitted.keys(),
      ),
    ).toHaveLength(12)
    expect(
      submitted.has("clientId"),
    ).toBe(false)
    expect(
      submitted.has("workspaceId"),
    ).toBe(false)
  }, 15_000)

  it("restaura valores e apresenta erro do servidor", () => {
    mocks.state = {
      status: "error",
      message:
        "Já existe um lead cadastrado com o telefone informado.",
      values: {
        name: "Maria Oliveira",
        email: "maria@example.com",
        phoneCountryCode: "55",
        phone: "41999999999",
        document: "",
        companyName: "",
        source: "referral",
        consortiumType:
          "real_estate",
        desiredCreditValue:
          "500000",
        desiredTermMonths: "200",
        consultantId:
          "consultant-1",
        notes: "",
      },
      fieldErrors: {
        phone:
          "Este telefone já pertence a outro lead.",
      },
    }

    render(
      <LeadCreateForm
        view={createView()}
        action={vi.fn()}
      />,
    )

    expect(
      screen.getByText(
        "Já existe um lead cadastrado com o telefone informado.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        "Nome do lead",
      ),
    ).toHaveValue("Maria Oliveira")
    expect(
      screen.getByText(
        "Este telefone já pertence a outro lead.",
      ),
    ).toBeInTheDocument()
  })

  it("bloqueia o cadastro quando não existe consultor ativo", () => {
    render(
      <LeadCreateForm
        view={{ consultants: [] }}
        action={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "É necessário ter um consultor ativo",
    )
    expect(
      screen.getByRole("button", {
        name:
          "Criar lead e oportunidade",
      }),
    ).toBeDisabled()
  })
})
