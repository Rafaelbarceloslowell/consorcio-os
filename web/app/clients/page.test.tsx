// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  Client,
} from "@/types/domain"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  findAllClients: vi.fn(),
  listProps: vi.fn(),
}))

vi.mock(
  "@/components/client/client-list",
  () => ({
    ClientList: (props: {
      view: {
        clients: Array<
          Record<string, string>
        >
      }
    }) => {
      mocks.listProps(props)
      return (
        <p>
          {props.view.clients[0]
            ?.name ?? "Sem clientes"}
        </p>
      )
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/prisma-crm-repositories",
  () => ({
    createPrismaCrmRepositories:
      mocks.createRepositories,
  }),
)

import ClientsPage from "./page"

function createClient():
  Client {
  return {
    id: "client-1",
    type: "company",
    name: "Empresa Alfa",
    email:
      "contato@alfa.com",
    phone: "5511999999999",
    document: "12345678000199",
    companyName:
      "Empresa Alfa Ltda.",
    address: {
      street: "Rua A",
      number: "10",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000000",
    },
    consultantId: "consultant-1",
    status: "blocked",
    tags: ["vip"],
    notes: "Não expor",
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-02T00:00:00.000Z",
  }
}

describe("ClientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace
      .mockResolvedValue({
        id: "workspace-1",
      })
    mocks.findAllClients
      .mockResolvedValue([
        createClient(),
      ])
    mocks.createRepositories
      .mockReturnValue({
        clients: {
          findAll:
            mocks.findAllClients,
          findById: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
      })
  })

  it("resolve o workspace, usa repository scoped e entrega view model mínimo", async () => {
    const clients = [
      createClient(),
    ]
    const snapshot =
      structuredClone(clients)
    mocks.findAllClients
      .mockResolvedValue(clients)

    render(await ClientsPage())

    expect(
      screen.getByText(
        "Empresa Alfa",
      ),
    ).toBeInTheDocument()
    expect(
      mocks.findWorkspace,
    ).toHaveBeenCalledExactlyOnceWith({
      where: {
        slug: "consorcio-os",
      },
      select: { id: true },
    })
    expect(
      mocks.createRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId:
        "workspace-1",
    })
    expect(
      mocks.findAllClients,
    ).toHaveBeenCalledTimes(1)
    expect(
      mocks.listProps,
    ).toHaveBeenCalledExactlyOnceWith({
      view: {
        clients: [
          {
            id: "client-1",
            name: "Empresa Alfa",
            typeLabel:
              "Pessoa jurídica",
            email:
              "contato@alfa.com",
            phone:
              "5511999999999",
            document:
              "12345678000199",
            statusLabel:
              "Bloqueado",
          },
        ],
      },
    })
    expect(
      Object.keys(
        mocks.listProps.mock
          .calls[0]?.[0].view
          .clients[0],
      ).sort(),
    ).toEqual([
      "document",
      "email",
      "id",
      "name",
      "phone",
      "statusLabel",
      "typeLabel",
    ])
    expect(clients).toEqual(
      snapshot,
    )
  })

  it("encaminha lista vazia", async () => {
    mocks.findAllClients
      .mockResolvedValue([])

    render(await ClientsPage())

    expect(
      screen.getByText(
        "Sem clientes",
      ),
    ).toBeInTheDocument()
    expect(
      mocks.listProps,
    ).toHaveBeenCalledWith({
      view: {
        clients: [],
      },
    })
  })

  it("não cria repositories sem workspace", async () => {
    mocks.findWorkspace
      .mockResolvedValue(null)

    await expect(
      ClientsPage(),
    ).rejects.toThrow(
      'Workspace "consorcio-os" não encontrado.',
    )
    expect(
      mocks.createRepositories,
    ).not.toHaveBeenCalled()
    expect(
      mocks.findAllClients,
    ).not.toHaveBeenCalled()
    expect(
      mocks.listProps,
    ).not.toHaveBeenCalled()
  })

  it("propaga erro inesperado por identidade", async () => {
    const error =
      new Error(
        "Falha ao listar clientes",
      )
    mocks.findAllClients
      .mockRejectedValue(error)

    await expect(
      ClientsPage(),
    ).rejects.toBe(error)
    expect(
      mocks.listProps,
    ).not.toHaveBeenCalled()
  })
})
