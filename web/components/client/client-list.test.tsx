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
  ClientListView,
} from "@/types/client-list"

import {
  ClientList,
} from "./client-list"

function createView():
  ClientListView {
  return {
    clients: [
      {
        id: "client-2",
        name: "Empresa Alfa",
        typeLabel:
          "Pessoa jurídica",
        email:
          "contato@alfa.com",
        phone: "5511999999999",
        document: "12345678000199",
        statusLabel: "Ativo",
      },
      {
        id: "client-1",
        name: "Ana Lima",
        typeLabel:
          "Pessoa física",
        email: "ana@example.com",
        phone: "5511888888888",
        document: "12345678901",
        statusLabel: "Inativo",
      },
    ],
  }
}

describe("ClientList", () => {
  it("renderiza clientes PF e PJ com os campos operacionais", () => {
    render(
      <ClientList
        view={createView()}
      />,
    )

    expect(
      screen.getByRole(
        "heading",
        { name: "Clientes" },
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "2 clientes cadastrados",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Empresa Alfa",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Pessoa jurídica",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "contato@alfa.com",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "12345678000199",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ana Lima"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Pessoa física",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Inativo"),
    ).toBeInTheDocument()
  })

  it("preserva a ordem recebida e não muta o view model", () => {
    const view = createView()
    const snapshot =
      structuredClone(view)

    render(
      <ClientList view={view} />,
    )

    const names =
      screen.getAllByRole(
        "heading",
        { level: 2 },
      )

    expect(names[0])
      .toHaveTextContent(
        "Empresa Alfa",
      )
    expect(names[1])
      .toHaveTextContent(
        "Ana Lima",
      )
    expect(view).toEqual(snapshot)
  })

  it("renderiza estado vazio acessível sem lista quebrada", () => {
    render(
      <ClientList
        view={{ clients: [] }}
      />,
    )

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Ainda não existem clientes cadastrados.",
    )
    expect(
      screen.queryByRole("list"),
    ).not.toBeInTheDocument()
  })

  it("oferece somente a ação Novo cliente", () => {
    render(
      <ClientList
        view={createView()}
      />,
    )

    expect(
      screen.getByRole("link", {
        name: "Novo cliente",
      }),
    ).toHaveAttribute(
      "href",
      "/clients/new",
    )
    expect(
      screen.getAllByRole("link"),
    ).toHaveLength(1)
    expect(
      screen.queryByRole("form"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole(
        "button",
        { name: /editar|excluir|status/i },
      ),
    ).not.toBeInTheDocument()
  })
})
