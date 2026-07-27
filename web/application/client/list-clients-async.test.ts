import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  ListClientsAsyncDependencies,
} from "./list-clients-async"

import {
  ListClientsAsync,
} from "./list-clients-async"

import type {
  Client,
} from "@/types/domain"

function createClient(
  overrides:
    Partial<Client> = {},
): Client {
  return {
    id: "client-1",
    type: "individual",
    name: "Ana Lima",
    email: "ana@example.com",
    phone: "5511999999999",
    document: "12345678901",
    address: {
      street: "Rua A",
      number: "10",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000000",
    },
    consultantId: "consultant-1",
    status: "active",
    tags: [],
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
    ...overrides,
  }
}

function createDependencies(
  clients: Client[],
): {
  dependencies:
    ListClientsAsyncDependencies
  findAll: ReturnType<typeof vi.fn>
} {
  const findAll =
    vi.fn().mockResolvedValue(
      clients,
    )

  return {
    dependencies: {
      clients: {
        findAll,
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    findAll,
  }
}

describe("ListClientsAsync", () => {
  it("lista todos os clientes uma única vez", async () => {
    const clients = [
      createClient(),
      createClient({
        id: "client-2",
        name: "Bruno Dias",
      }),
    ]
    const {
      dependencies,
      findAll,
    } = createDependencies(clients)

    const result =
      await new ListClientsAsync(
        dependencies,
      ).execute()

    expect(findAll)
      .toHaveBeenCalledTimes(1)
    expect(result.clients)
      .toEqual(clients)
    expect(result.total).toBe(2)
  })

  it("ordena por nome sem distinguir caixa ou acento e desempata por ID", async () => {
    const clients = [
      createClient({
        id: "client-3",
        name: "Álpha",
      }),
      createClient({
        id: "client-1",
        name: "alpha",
      }),
      createClient({
        id: "client-2",
        name: "Alpha",
      }),
      createClient({
        id: "client-4",
        name: "Beta",
      }),
    ]
    const { dependencies } =
      createDependencies(clients)

    const result =
      await new ListClientsAsync(
        dependencies,
      ).execute()

    expect(
      result.clients.map(
        (client) => client.id,
      ),
    ).toEqual([
      "client-1",
      "client-2",
      "client-3",
      "client-4",
    ])
  })

  it("não muta a coleção nem as entidades do repository", async () => {
    const first = createClient({
      id: "client-2",
      name: "Bruno",
    })
    const second = createClient({
      id: "client-1",
      name: "Ana",
    })
    const clients = [first, second]
    const snapshot =
      structuredClone(clients)
    const originalOrder =
      clients.map(
        (client) => client.id,
      )
    const { dependencies } =
      createDependencies(clients)

    const result =
      await new ListClientsAsync(
        dependencies,
      ).execute()

    expect(result.clients)
      .not.toBe(clients)
    expect(
      clients.map(
        (client) => client.id,
      ),
    ).toEqual(originalOrder)
    expect(clients).toEqual(snapshot)
    expect(result.clients[0])
      .toBe(second)
    expect(result.clients[1])
      .toBe(first)
  })

  it("retorna uma lista vazia", async () => {
    const {
      dependencies,
      findAll,
    } = createDependencies([])

    const result =
      await new ListClientsAsync(
        dependencies,
      ).execute()

    expect(findAll)
      .toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      clients: [],
      total: 0,
    })
  })

  it("propaga erro do repository por identidade", async () => {
    const error =
      new Error(
        "Falha ao listar clientes",
      )
    const { dependencies } =
      createDependencies([])
    vi.mocked(
      dependencies.clients.findAll,
    ).mockRejectedValue(error)

    await expect(
      new ListClientsAsync(
        dependencies,
      ).execute(),
    ).rejects.toBe(error)
  })

  it("aguarda a conclusão do repository", async () => {
    let resolveFindAll:
      ((clients: Client[]) => void)
      | undefined
    const findAllPromise =
      new Promise<Client[]>(
        (resolve) => {
          resolveFindAll = resolve
        },
      )
    const { dependencies } =
      createDependencies([])
    vi.mocked(
      dependencies.clients.findAll,
    ).mockReturnValue(
      findAllPromise,
    )
    let settled = false

    const execution =
      new ListClientsAsync(
        dependencies,
      ).execute().then(
        (result) => {
          settled = true
          return result
        },
      )

    await Promise.resolve()
    expect(settled).toBe(false)

    resolveFindAll?.([
      createClient(),
    ])
    const result = await execution

    expect(settled).toBe(true)
    expect(result.total).toBe(1)
  })
})
