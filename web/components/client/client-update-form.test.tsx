// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  ClientUpdateActionState,
  ClientUpdateFormView,
} from "@/types/client-update"

import {
  ClientUpdateForm,
} from "./client-update-form"

function view():
  ClientUpdateFormView {
  return {
    id: "client-1",
    type: "individual",
    name: "Ana Lima",
    companyName: "",
    email: "ana@example.com",
    phone: "5511999999999",
    phoneCountryCode: "55",
    document: "12345678901",
    consultantId:
      "consultant-1",
    addressStreet: "Rua A",
    addressNumber: "10",
    addressComplement: "",
    addressNeighborhood:
      "Centro",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZipCode:
      "01000000",
    consultants: [
      {
        id: "consultant-1",
        name: "Marina",
      },
    ],
  }
}

describe("ClientUpdateForm", () => {
  it("renderiza valores atuais e labels acessíveis", () => {
    render(
      <ClientUpdateForm
        client={view()}
        action={vi.fn()}
      />,
    )

    expect(
      screen.getByRole(
        "heading",
        { name: "Editar cliente" },
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Nome"),
    ).toHaveValue("Ana Lima")
    expect(
      screen.getByLabelText("E-mail"),
    ).toHaveValue(
      "ana@example.com",
    )
    expect(
      screen.getByLabelText(
        "Consultor",
      ),
    ).toHaveValue(
      "consultant-1",
    )
  })

  it("submete somente os campos editáveis esperados", async () => {
    const action = vi.fn(
      async (
        _state:
          ClientUpdateActionState,
        formData: FormData,
      ): Promise<ClientUpdateActionState> => {
        expect(
          Object.fromEntries(
            formData.entries(),
          ),
        ).toEqual({
          type: "individual",
          name: "Ana Lima",
          document:
            "12345678901",
          email:
            "ana@example.com",
          phoneCountryCode:
            "55",
          phone:
            "5511999999999",
          consultantId:
            "consultant-1",
          addressStreet:
            "Rua A",
          addressNumber: "10",
          addressComplement:
            "",
          addressNeighborhood:
            "Centro",
          addressCity:
            "São Paulo",
          addressState: "SP",
          addressZipCode:
            "01000000",
        })

        return {
          status: "idle",
          message: null,
        }
      },
    )

    render(
      <ClientUpdateForm
        client={view()}
        action={action}
      />,
    )
    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            "Salvar alterações",
        })
        .closest("form")!,
    )

    await waitFor(() =>
      expect(action)
        .toHaveBeenCalledTimes(1),
    )
  })

  it("apresenta erro, cancelamento seguro e nenhuma ação extra", async () => {
    const action = vi.fn(
      async ():
        Promise<ClientUpdateActionState> => ({
        status: "error",
        message: "Dados inválidos",
        values: {
          ...view(),
          name: "Ana",
        },
      }),
    )
    render(
      <ClientUpdateForm
        client={view()}
        action={action}
      />,
    )
    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            "Salvar alterações",
        })
        .closest("form")!,
    )

    expect(
      await screen.findByRole(
        "alert",
      ),
    ).toHaveTextContent(
      "Dados inválidos",
    )
    expect(
      screen.getAllByRole("link", {
        name:
          /cancelar/i,
      }),
    ).toHaveLength(2)
    expect(
      screen.getAllByRole("link", {
        name: /cancelar/i,
      })[0],
    ).toHaveAttribute(
      "href",
      "/clients/client-1",
    )
    expect(
      screen.queryByText(
        /excluir|oportunidade|venda/i,
      ),
    ).not.toBeInTheDocument()
  })
})
