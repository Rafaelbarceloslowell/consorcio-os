import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  blockExecute: vi.fn(),
  blockDependencies: vi.fn(),

  unblockExecute: vi.fn(),
  unblockDependencies: vi.fn(),

  deactivateExecute: vi.fn(),
  deactivateDependencies: vi.fn(),

  reactivateExecute: vi.fn(),
  reactivateDependencies: vi.fn(),

  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),

  clients: {
    repository: "clients",
  },
}))

vi.mock(
  "@/application/client/block-client-async",
  () => ({
    BlockClientAsync:
      class {
        constructor(
          dependencies: unknown,
        ) {
          mocks.blockDependencies(
            dependencies,
          )
        }

        execute =
          mocks.blockExecute
      },
  }),
)

vi.mock(
  "@/application/client/unblock-client-async",
  () => ({
    UnblockClientAsync:
      class {
        constructor(
          dependencies: unknown,
        ) {
          mocks.unblockDependencies(
            dependencies,
          )
        }

        execute =
          mocks.unblockExecute
      },
  }),
)

vi.mock(
  "@/application/client/deactivate-client-async",
  () => ({
    DeactivateClientAsync:
      class {
        constructor(
          dependencies: unknown,
        ) {
          mocks.deactivateDependencies(
            dependencies,
          )
        }

        execute =
          mocks.deactivateExecute
      },
  }),
)

vi.mock(
  "@/application/client/reactivate-client-async",
  () => ({
    ReactivateClientAsync:
      class {
        constructor(
          dependencies: unknown,
        ) {
          mocks.reactivateDependencies(
            dependencies,
          )
        }

        execute =
          mocks.reactivateExecute
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
  "next/cache",
  () => ({
    revalidatePath:
      mocks.revalidatePath,
  }),
)

vi.mock(
  "next/navigation",
  () => ({
    redirect:
      mocks.redirect,
  }),
)

import {
  blockClientAction,
  deactivateClientAction,
  reactivateClientAction,
  unblockClientAction,
} from "./actions"

describe(
  "client lifecycle actions",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      mocks.findWorkspace
        .mockResolvedValue({
          id: "workspace-1",
        })

      mocks.createRepositories
        .mockReturnValue({
          clients:
            mocks.clients,
        })

      mocks.blockExecute
        .mockResolvedValue({})
      mocks.unblockExecute
        .mockResolvedValue({})
      mocks.deactivateExecute
        .mockResolvedValue({})
      mocks.reactivateExecute
        .mockResolvedValue({})
    })

    it.each([
      {
        name: "bloqueia",
        action:
          blockClientAction,
        execute:
          mocks.blockExecute,
        dependencies:
          mocks.blockDependencies,
      },
      {
        name: "desbloqueia",
        action:
          unblockClientAction,
        execute:
          mocks.unblockExecute,
        dependencies:
          mocks.unblockDependencies,
      },
      {
        name: "desativa",
        action:
          deactivateClientAction,
        execute:
          mocks.deactivateExecute,
        dependencies:
          mocks.deactivateDependencies,
      },
      {
        name: "reativa",
        action:
          reactivateClientAction,
        execute:
          mocks.reactivateExecute,
        dependencies:
          mocks.reactivateDependencies,
      },
    ])(
      "$name o cliente usando workspace e repository scoped",
      async ({
        action,
        execute,
        dependencies,
      }) => {
        await action(
          " client-1 ",
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
          dependencies,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          clients:
            mocks.clients,
        })

        expect(
          execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          clientId:
            "client-1",
        })

        expect(
          mocks.revalidatePath,
        ).toHaveBeenNthCalledWith(
          1,
          "/clients/client-1",
        )

        expect(
          mocks.revalidatePath,
        ).toHaveBeenNthCalledWith(
          2,
          "/clients",
        )

        expect(
          mocks.redirect,
        ).toHaveBeenCalledExactlyOnceWith(
          "/clients/client-1",
        )
      },
    )

    it("não compõe repositories quando o workspace não existe", async () => {
      mocks.findWorkspace
        .mockResolvedValue(null)

      await expect(
        blockClientAction(
          "client-1",
        ),
      ).rejects.toThrow(
        'Workspace "consorcio-os" não encontrado.',
      )

      expect(
        mocks.createRepositories,
      ).not.toHaveBeenCalled()

      expect(
        mocks.blockExecute,
      ).not.toHaveBeenCalled()

      expect(
        mocks.revalidatePath,
      ).not.toHaveBeenCalled()

      expect(
        mocks.redirect,
      ).not.toHaveBeenCalled()
    })

    it("propaga erro do caso de uso sem revalidar ou redirecionar", async () => {
      const error =
        new Error(
          "Somente clientes ativos podem ser bloqueados.",
        )

      mocks.blockExecute
        .mockRejectedValue(error)

      await expect(
        blockClientAction(
          "client-1",
        ),
      ).rejects.toBe(error)

      expect(
        mocks.revalidatePath,
      ).not.toHaveBeenCalled()

      expect(
        mocks.redirect,
      ).not.toHaveBeenCalled()
    })

    it("não executa outros casos de uso durante o bloqueio", async () => {
      await blockClientAction(
        "client-1",
      )

      expect(
        mocks.blockExecute,
      ).toHaveBeenCalledTimes(1)

      expect(
        mocks.unblockExecute,
      ).not.toHaveBeenCalled()

      expect(
        mocks.deactivateExecute,
      ).not.toHaveBeenCalled()

      expect(
        mocks.reactivateExecute,
      ).not.toHaveBeenCalled()
    })
  },
)