// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  ClientDetailsView,
} from "@/types/client-details"

import {
  ClientDetails,
} from "./client-details"

function createView(
  overrides:
    Partial<ClientDetailsView> = {},
): ClientDetailsView {
  return {
    id: "client-1",
    name: "Empresa Alfa",
    type: "company",
    email: "contato@alfa.com",
    phone: "5511999999999",
    document: "12345678000199",
    birthDate: null,
    companyName:
      "Empresa Alfa Ltda.",
    tradeName: "Alfa",
    stateRegistration:
      "123456789",
    address: {
      street: "Rua A",
      number: "10",
      complement: "Sala 2",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000000",
    },
    consultantId:
      "consultant-1",
    consultantName:
      "Marina Costa",
    status: "active",
    createdAt:
      "2026-07-01T12:00:00.000Z",
    updatedAt:
      "2026-07-02T12:00:00.000Z",
    ...overrides,
  }
}

describe("ClientDetails", () => {
  it("renderiza dados e labels amigáveis", () => {
    render(
      <ClientDetails
        client={createView()}
      />,
    )

    expect(
      screen.getByRole(
        "heading",
        { name: "Empresa Alfa" },
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Pessoa jurídica",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ativo"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Marina Costa",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "contato@alfa.com",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Rua A, 10 · Sala 2 · Centro · São Paulo - SP · 01000000/,
      ),
    ).toBeInTheDocument()
  })

  it("formata datas e trata campos opcionais", () => {
    render(
      <ClientDetails
        client={createView({
          type: "individual",
          status: "blocked",
          birthDate:
            "1990-05-10T00:00:00.000Z",
          companyName: null,
          tradeName: null,
          stateRegistration: null,
          address: {
            ...createView().address,
            complement: null,
          },
        })}
      />,
    )

    expect(
      screen.getByText(
        "Pessoa física",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Bloqueado"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "10/05/1990",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        "Não informado",
      ),
    ).toHaveLength(3)
    expect(
      screen.queryByText(
        /undefined|null/,
      ),
    ).not.toBeInTheDocument()
  })

  it("mantém navegação acessível e não oferece mutações", () => {
    render(
      <ClientDetails
        client={createView()}
      />,
    )

    expect(
      screen.getByRole("link", {
        name:
          "Voltar para clientes",
      }),
    ).toHaveAttribute(
      "href",
      "/clients",
    )
    expect(
      screen.queryByRole("button"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("form"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        /editar|excluir|oportunidade/i,
      ),
    ).not.toBeInTheDocument()
  })

  it("não muta o view model recebido", () => {
    const client = createView()
    const snapshot =
      structuredClone(client)

    render(
      <ClientDetails
        client={client}
      />,
    )

    expect(client).toEqual(snapshot)
  })
})
