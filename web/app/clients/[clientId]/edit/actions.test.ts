import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  dependencies: vi.fn(),
  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  clients: {},
  consultants: {},
}))

vi.mock(
  "@/application/client/update-client-async",
  () => ({
    UpdateClientAsync: class {
      constructor(
        dependencies: unknown,
      ) {
        mocks.dependencies(
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

vi.mock("next/cache", () => ({
  revalidatePath:
    mocks.revalidatePath,
}))
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

import {
  updateClientAction,
} from "./actions"

function formData() {
  const data = new FormData()
  const values = {
    type: "individual",
    name: "Ana",
    companyName: "",
    email: "ana@example.com",
    phone: "11999999999",
    phoneCountryCode: "55",
    document: "12345678901",
    consultantId:
      "consultant-1",
    addressStreet: "Rua A",
    addressNumber: "1",
    addressComplement: "",
    addressNeighborhood:
      "Centro",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZipCode:
      "01000000",
  }

  Object.entries(values).forEach(
    ([key, value]) =>
      data.set(key, value),
  )
  return data
}

describe("updateClientAction", () => {
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
      .mockResolvedValue({})
  })

  it("usa workspace e repositories scoped e redireciona ao detalhe", async () => {
    await updateClientAction(
      "client-1",
      {
        status: "idle",
        message: null,
      },
      formData(),
    )

    expect(
      mocks.findWorkspace,
    ).toHaveBeenCalledTimes(1)
    expect(
      mocks.createRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId:
        "workspace-1",
    })
    expect(mocks.dependencies)
      .toHaveBeenCalledExactlyOnceWith({
        workspaceId:
          "workspace-1",
        clients: mocks.clients,
        consultants:
          mocks.consultants,
      })
    expect(mocks.execute)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId:
            "workspace-1",
          clientId: "client-1",
          type: "individual",
          name: "Ana",
        }),
      )
    expect(
      mocks.revalidatePath,
    ).toHaveBeenNthCalledWith(
      1,
      "/clients/client-1",
    )
    expect(mocks.redirect)
      .toHaveBeenCalledExactlyOnceWith(
        "/clients/client-1",
      )
  })

  it("retorna validação sem acessar infraestrutura", async () => {
    const data = formData()
    data.set("type", "invalid")

    const result =
      await updateClientAction(
        "client-1",
        {
          status: "idle",
          message: null,
        },
        data,
      )

    expect(result.status)
      .toBe("error")
    expect(mocks.findWorkspace)
      .not.toHaveBeenCalled()
    expect(mocks.execute)
      .not.toHaveBeenCalled()
    expect(mocks.redirect)
      .not.toHaveBeenCalled()
  })

  it("retorna erro do caso de uso sem redirecionar", async () => {
    const error =
      new Error(
        "Cliente duplicado",
      )
    mocks.execute
      .mockRejectedValue(error)

    const result =
      await updateClientAction(
        "client-1",
        {
          status: "idle",
          message: null,
        },
        formData(),
      )

    expect(result).toMatchObject({
      status: "error",
      message:
        "Cliente duplicado",
    })
    expect(mocks.redirect)
      .not.toHaveBeenCalled()
    expect(
      mocks.revalidatePath,
    ).not.toHaveBeenCalled()
  })
})
