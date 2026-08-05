import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  Client,
} from "@/types/domain"

import {
  ReactivateClientAsync,
} from "./reactivate-client-async"

const transitionDate =
  new Date(
    "2026-07-27T16:00:00.000Z",
  )

function createClient(
  overrides:
    Partial<Client> = {},
): Client {
  return {
    id:
      "client-reactivate-async",

    type:
      "individual",

    name:
      "Cliente Reativação",

    email:
      "client.block.async@example.com",

    phone:
      "+5541999997101",

    document:
      "101.101.101-01",

    address: {
      street:
        "Rua Teste",

      number:
        "100",

      neighborhood:
        "Centro",

      city:
        "Curitiba",

      state:
        "PR",

      zipCode:
        "80000-000",
    },

    consultantId:
      "consultant-1",

    status:
      "inactive",

    tags: [
      "premium",
    ],

    notes:
      "Cliente em análise",

    createdAt:
      "2026-01-01T10:00:00.000Z",

    updatedAt:
      "2026-01-01T10:00:00.000Z",

    ...overrides,
  }
}

function setup(
  currentClient:
    Client | null =
      createClient(),
  updateResult?:
    Client | undefined,
) {
  const findById =
    vi.fn().mockResolvedValue(
      currentClient ??
        undefined,
    )

  const update =
    vi.fn(
      async (
        client: Client,
      ): Promise<Client | undefined> =>
        updateResult === undefined
          ? client
          : updateResult,
    )

  const subject =
    new ReactivateClientAsync(
      {
        workspaceId:
          "workspace-1",

        clients: {
          findById,
          update,
        },
      },
      {
        now:
          transitionDate,
      },
    )

  return {
    subject,
    findById,
    update,
  }
}

describe(
  "ReactivateClientAsync",
  () => {
    it(
      "reativa um cliente inativo",
      async () => {
        const {
          subject,
        } =
          setup()

        const result =
          await subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              "client-reactivate-async",
          })

        expect(
          result.client.status,
        ).toBe(
          "active",
        )

        expect(
          result.client.updatedAt,
        ).toBe(
          transitionDate.toISOString(),
        )
      },
    )

    it(
      "persiste a transição no repositório assíncrono",
      async () => {
        const {
          subject,
          findById,
          update,
        } =
          setup()

        await subject.execute({
          workspaceId:
            "workspace-1",

          clientId:
            " client-reactivate-async ",
        })

        expect(
          findById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          findById,
        ).toHaveBeenCalledWith(
          "client-reactivate-async",
        )

        expect(
          update,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          update,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              "client-reactivate-async",

            status:
              "active",

            updatedAt:
              transitionDate.toISOString(),
          }),
        )
      },
    )

    it(
      "rejeita um workspace vazio",
      async () => {
        const {
          subject,
          findById,
          update,
        } =
          setup()

        await expect(
          subject.execute({
            workspaceId:
              "   ",

            clientId:
              "client-reactivate-async",
          }),
        ).rejects.toThrow(
          "O workspace é obrigatório.",
        )

        expect(
          findById,
        ).not.toHaveBeenCalled()

        expect(
          update,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita um ID de cliente vazio",
      async () => {
        const {
          subject,
          findById,
          update,
        } =
          setup()

        await expect(
          subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              "   ",
          }),
        ).rejects.toThrow(
          "O ID do cliente é obrigatório.",
        )

        expect(
          findById,
        ).not.toHaveBeenCalled()

        expect(
          update,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "protege o acesso entre workspaces",
      async () => {
        const {
          subject,
          findById,
          update,
        } =
          setup()

        await expect(
          subject.execute({
            workspaceId:
              "workspace-2",

            clientId:
              "client-reactivate-async",
          }),
        ).rejects.toThrow(
          'Cliente não encontrado para o ID "client-reactivate-async".',
        )

        expect(
          findById,
        ).not.toHaveBeenCalled()

        expect(
          update,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita um cliente inexistente",
      async () => {
        const {
          subject,
          update,
        } =
          setup(
            null,
          )

        await expect(
          subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              "client-inexistente",
          }),
        ).rejects.toThrow(
          'Cliente não encontrado para o ID "client-inexistente".',
        )

        expect(
          update,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita um cliente já ativo",
      async () => {
        const {
          subject,
          update,
        } =
          setup(
            createClient({
              status:
                "active",
            }),
          )

        await expect(
          subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              "client-reactivate-async",
          }),
        ).rejects.toThrow(
          "O cliente já está ativo.",
        )

        expect(
          update,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita a reativação de um cliente bloqueado",
      async () => {
        const {
          subject,
          update,
        } =
          setup(
            createClient({
              status:
                "blocked",
            }),
          )

        await expect(
          subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              "client-reactivate-async",
          }),
        ).rejects.toThrow(
          "Somente clientes inativos podem ser reativados.",
        )

        expect(
          update,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita quando o repositório não consegue persistir",
      async () => {
        const currentClient =
          createClient()

        const findById =
          vi.fn().mockResolvedValue(
            currentClient,
          )

        const update =
          vi.fn().mockResolvedValue(
            undefined,
          )

        const subject =
          new ReactivateClientAsync(
            {
              workspaceId:
                "workspace-1",

              clients: {
                findById,
                update,
              },
            },
            {
              now:
                transitionDate,
            },
          )

        await expect(
          subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              "client-reactivate-async",
          }),
        ).rejects.toThrow(
          'O cliente "client-reactivate-async" não pôde ser atualizado.',
        )
      },
    )

    it(
      "preserva os demais dados e não altera o objeto original",
      async () => {
        const original =
          createClient()

        const snapshot =
          structuredClone(
            original,
          )

        const {
          subject,
          update,
        } =
          setup(
            original,
          )

        const result =
          await subject.execute({
            workspaceId:
              "workspace-1",

            clientId:
              original.id,
          })

        const persistedClient =
          update.mock.calls[0]?.[0]

        expect(
          persistedClient,
        ).toEqual({
          ...snapshot,

          status:
            "active",

          updatedAt:
            transitionDate.toISOString(),
        })

        expect(
          original,
        ).toEqual(
          snapshot,
        )

        expect(
          persistedClient,
        ).not.toBe(
          original,
        )

        expect(
          persistedClient?.address,
        ).not.toBe(
          original.address,
        )

        expect(
          persistedClient?.tags,
        ).not.toBe(
          original.tags,
        )

        expect(
          result.client,
        ).not.toBe(
          persistedClient,
        )

        expect(
          result.client.address,
        ).not.toBe(
          persistedClient?.address,
        )

        expect(
          result.client.tags,
        ).not.toBe(
          persistedClient?.tags,
        )
      },
    )
  },
)

