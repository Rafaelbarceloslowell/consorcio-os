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
  ClientDetailsView,
} from "@/types/client-details"

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  constructorDependencies:
    vi.fn(),
  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error(
      "NEXT_NOT_FOUND",
    )
  }),
  blockClientAction:
    vi.fn(async () => {}),
  unblockClientAction:
    vi.fn(async () => {}),
  deactivateClientAction:
    vi.fn(async () => {}),
  reactivateClientAction:
    vi.fn(async () => {}),
  clients: {
    repository: "clients",
  },
  consultants: {
    repository: "consultants",
  },
}))

vi.mock(
  "@/application/client/get-client-details-async",
  () => ({
    GetClientDetailsAsync:
      class {
        constructor(
          dependencies: {
            workspaceId: string
            clients: unknown
            consultants: unknown
          },
        ) {
          mocks
            .constructorDependencies(
              dependencies,
            )
        }

        execute = mocks.execute
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

vi.mock(
  "next/navigation",
  () => ({
    notFound: mocks.notFound,
  }),
)

vi.mock(
  "./actions",
  () => ({
    blockClientAction:
      mocks.blockClientAction,
    unblockClientAction:
      mocks.unblockClientAction,
    deactivateClientAction:
      mocks.deactivateClientAction,
    reactivateClientAction:
      mocks.reactivateClientAction,
  }),
)

import ClientDetailsPage from "./page"

function createView(
  overrides:
    Partial<ClientDetailsView> = {},
): ClientDetailsView {
  return {
    id: "client-1",
    name: "Ana Lima",
    type: "individual",
    email: "ana@example.com",
    phone: "5511999999999",
    document: "12345678901",
    birthDate: null,
    companyName: null,
    tradeName: null,
    stateRegistration: null,
    address: {
      street: "Rua A",
      number: "10",
      complement: null,
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
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-02T00:00:00.000Z",
    ...overrides,
  }
}

describe("ClientDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.findWorkspace
      .mockResolvedValue({
        id: "workspace-1",
      })

    mocks.createRepositories
      .mockReturnValue({
        clients: mocks.clients,
        consultants:
          mocks.consultants,
      })

    mocks.execute
      .mockResolvedValue({
        client: createView(),
      })
  })

  it("resolve workspace, compõe repositories scoped e renderiza detalhes", async () => {
    render(
      await ClientDetailsPage({
        params: Promise.resolve({
          clientId: "client-1",
        }),
      }),
    )

    expect(
      mocks.findWorkspace,
    ).toHaveBeenCalledExactlyOnceWith({
      where: {
        slug: "consorcio-os",
      },
      select: {
        id: true,
      },
    })

    expect(
      mocks.createRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId:
        "workspace-1",
    })

    expect(
      mocks
        .constructorDependencies,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId:
        "workspace-1",
      clients: mocks.clients,
      consultants:
        mocks.consultants,
    })

    expect(
      mocks.execute,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId:
        "workspace-1",
      clientId: "client-1",
    })

    expect(
      screen.getByRole(
        "heading",
        {
          name: "Ana Lima",
        },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole(
        "button",
        {
          name:
            "Bloquear cliente",
        },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole(
        "button",
        {
          name:
            "Desativar cliente",
        },
      ),
    ).toBeInTheDocument()
  })

  it("compõe ações válidas para cliente bloqueado", async () => {
    mocks.execute
      .mockResolvedValue({
        client: createView({
          status: "blocked",
        }),
      })

    render(
      await ClientDetailsPage({
        params: Promise.resolve({
          clientId: "client-1",
        }),
      }),
    )

    expect(
      screen.getByRole(
        "button",
        {
          name:
            "Desbloquear cliente",
        },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole(
        "button",
        {
          name:
            "Desativar cliente",
        },
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole(
        "button",
        {
          name:
            "Bloquear cliente",
        },
      ),
    ).not.toBeInTheDocument()
  })

  it("compõe reativação para cliente inativo", async () => {
    mocks.execute
      .mockResolvedValue({
        client: createView({
          status: "inactive",
        }),
      })

    render(
      await ClientDetailsPage({
        params: Promise.resolve({
          clientId: "client-1",
        }),
      }),
    )

    expect(
      screen.getByRole(
        "button",
        {
          name:
            "Reativar cliente",
        },
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole(
        "button",
        {
          name:
            "Desativar cliente",
        },
      ),
    ).not.toBeInTheDocument()
  })

  it("não compõe repositories sem workspace", async () => {
    mocks.findWorkspace
      .mockResolvedValue(null)

    await expect(
      ClientDetailsPage({
        params: Promise.resolve({
          clientId: "client-1",
        }),
      }),
    ).rejects.toThrow(
      'Workspace "consorcio-os" não encontrado.',
    )

    expect(
      mocks.createRepositories,
    ).not.toHaveBeenCalled()

    expect(
      mocks.execute,
    ).not.toHaveBeenCalled()
  })

  it("aciona notFound para cliente inexistente", async () => {
    mocks.execute.mockRejectedValue(
      new Error(
        'Cliente não encontrado para o ID "client-404".',
      ),
    )

    await expect(
      ClientDetailsPage({
        params: Promise.resolve({
          clientId:
            " client-404 ",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_NOT_FOUND",
    )

    expect(
      mocks.notFound,
    ).toHaveBeenCalledTimes(1)
  })

  it("propaga erro inesperado por identidade", async () => {
    const error =
      new Error(
        "Falha inesperada",
      )

    mocks.execute
      .mockRejectedValue(error)

    await expect(
      ClientDetailsPage({
        params: Promise.resolve({
          clientId: "client-1",
        }),
      }),
    ).rejects.toBe(error)

    expect(
      mocks.notFound,
    ).not.toHaveBeenCalled()
  })
})
