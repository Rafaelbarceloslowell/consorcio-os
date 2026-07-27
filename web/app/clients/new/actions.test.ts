import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type { ClientCreateActionState } from "@/types/client-create"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  dependencies: vi.fn(),
  execute: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
  clients: { repository: "clients" },
  consultants: {
    repository: "consultants",
  },
}))

vi.mock(
  "@/application/client/create-client-async",
  () => ({
    CreateClientAsync: class {
      constructor(dependencies: {
        clients: unknown
        consultants: unknown
      }) {
        mocks.dependencies(
          dependencies.clients,
          dependencies.consultants,
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

import { createClientAction } from "./actions"

const initialState:
  ClientCreateActionState = {
    status: "idle",
    message: null,
  }

function createFormData(
  overrides: Record<string, string> = {},
): FormData {
  const values = {
    type: "individual",
    name: " Ana Lima ",
    companyName: "",
    email: " ANA@EXAMPLE.COM ",
    phone: "(41) 99999-8877",
    phoneCountryCode: "55",
    document: "529.982.247-25",
    consultantId: " consultant-1 ",
    addressStreet: " Rua A ",
    addressNumber: " 10 ",
    addressComplement: " Sala 2 ",
    addressNeighborhood: " Centro ",
    addressCity: " Curitiba ",
    addressState: " pr ",
    addressZipCode: "80000-000",
    ...overrides,
  }
  const formData = new FormData()

  for (const [key, value] of
    Object.entries(values)) {
    formData.set(key, value)
  }

  return formData
}

describe("createClientAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.createRepositories.mockReturnValue({
      clients: mocks.clients,
      consultants: mocks.consultants,
    })
    mocks.execute.mockResolvedValue({
      client: { id: "client-new" },
    })
  })

  it("encaminha pessoa física sem normalização e ignora extras", async () => {
    const formData = createFormData()
    for (const field of [
      "workspaceId",
      "id",
      "status",
      "leadId",
      "birthDate",
      "tradeName",
      "stateRegistration",
      "tags",
      "notes",
      "createdAt",
      "updatedAt",
    ]) {
      formData.set(field, "forged")
    }

    await expect(
      createClientAction(
        initialState,
        formData,
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.findWorkspace,
    ).toHaveBeenCalledExactlyOnceWith({
      where: { slug: "consorcio-os" },
      select: { id: true },
    })
    expect(
      mocks.createRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId: "workspace-1",
    })
    expect(
      mocks.dependencies,
    ).toHaveBeenCalledExactlyOnceWith(
      mocks.clients,
      mocks.consultants,
    )
    expect(
      mocks.execute,
    ).toHaveBeenCalledExactlyOnceWith({
      type: "individual",
      name: " Ana Lima ",
      email: " ANA@EXAMPLE.COM ",
      phone: "(41) 99999-8877",
      phoneCountryCode: "55",
      document: "529.982.247-25",
      consultantId: " consultant-1 ",
      address: {
        street: " Rua A ",
        number: " 10 ",
        complement: " Sala 2 ",
        neighborhood: " Centro ",
        city: " Curitiba ",
        state: " pr ",
        zipCode: "80000-000",
      },
    })
    expect(
      mocks.revalidatePath,
    ).toHaveBeenCalledExactlyOnceWith("/")
    expect(
      mocks.redirect,
    ).toHaveBeenCalledExactlyOnceWith("/")
  })

  it("encaminha pessoa jurídica usando razão social e name vazio", async () => {
    await expect(
      createClientAction(
        initialState,
        createFormData({
          type: "company",
          name: "nome adulterado",
          companyName:
            " Consórcio Exemplo Ltda. ",
          document:
            "12.345.678/0001-95",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.execute,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        type: "company",
        name: "",
        companyName:
          " Consórcio Exemplo Ltda. ",
        document:
          "12.345.678/0001-95",
      }),
    )
  })

  it.each([
    [
      "ausente",
      undefined,
      "O tipo do cliente não foi informado.",
      "Selecione um tipo de pessoa.",
    ],
    [
      "vazio",
      "",
      "O tipo do cliente não pode estar vazio.",
      "Selecione um tipo de pessoa.",
    ],
    [
      "inválido",
      "invalid",
      "O tipo do cliente informado é inválido.",
      "Selecione um tipo de pessoa válido.",
    ],
  ])(
    "distingue tipo %s antes do workspace",
    async (
      _label,
      type,
      message,
      fieldMessage,
    ) => {
      const formData = createFormData()
      if (type === undefined) {
        formData.delete("type")
      } else {
        formData.set("type", type)
      }

      const result =
        await createClientAction(
          initialState,
          formData,
        )

      expect(result).toMatchObject({
        status: "error",
        message,
        fieldErrors: {
          type: fieldMessage,
        },
      })
      expect(
        mocks.findWorkspace,
      ).not.toHaveBeenCalled()
      expect(
        mocks.execute,
      ).not.toHaveBeenCalled()
    },
  )

  it("trata código do país e complemento vazios como ausência", async () => {
    await expect(
      createClientAction(
        initialState,
        createFormData({
          phoneCountryCode: "",
          addressComplement: "",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.execute,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.not.objectContaining({
        phoneCountryCode:
          expect.anything(),
      }),
    )
    const input =
      mocks.execute.mock.calls[0]?.[0]
    expect(input.address).not.toHaveProperty(
      "complement",
    )
  })

  it.each([
    [
      "telefone internacional",
      {
        phone: "+351 912 345 678",
        phoneCountryCode: "",
      },
    ],
    [
      "código de país",
      {
        phone: "912 345 678",
        phoneCountryCode: "351",
      },
    ],
    [
      "CEP e estado",
      {
        addressZipCode:
          "80000-000",
        addressState: " pr ",
      },
    ],
  ])(
    "preserva %s para o caso de uso",
    async (_label, overrides) => {
      await expect(
        createClientAction(
          initialState,
          createFormData(overrides),
        ),
      ).rejects.toThrow(
        "NEXT_REDIRECT",
      )

      expect(
        mocks.execute,
      ).toHaveBeenCalledTimes(1)
    },
  )

  it("preserva os quinze valores quando o caso de uso falha", async () => {
    const error = new Error(
      "Já existe um cliente cadastrado com o documento informado.",
    )
    mocks.execute.mockRejectedValue(error)

    const result =
      await createClientAction(
        initialState,
        createFormData(),
      )

    expect(result).toEqual({
      status: "error",
      message: error.message,
      values: {
        type: "individual",
        name: " Ana Lima ",
        companyName: "",
        email: " ANA@EXAMPLE.COM ",
        phone: "(41) 99999-8877",
        phoneCountryCode: "55",
        document: "529.982.247-25",
        consultantId:
          " consultant-1 ",
        addressStreet: " Rua A ",
        addressNumber: " 10 ",
        addressComplement:
          " Sala 2 ",
        addressNeighborhood:
          " Centro ",
        addressCity: " Curitiba ",
        addressState: " pr ",
        addressZipCode:
          "80000-000",
      },
    })
    expect(
      mocks.revalidatePath,
    ).not.toHaveBeenCalled()
    expect(
      mocks.redirect,
    ).not.toHaveBeenCalled()
  })

  it.each([
    "Já existe um cliente cadastrado com o e-mail \"ana@example.com\".",
    "Já existe um cliente cadastrado com o telefone informado.",
    "Falha no repository.",
  ])(
    "preserva erro: %s",
    async (message) => {
      mocks.execute.mockRejectedValue(
        new Error(message),
      )

      const result =
        await createClientAction(
          initialState,
          createFormData(),
        )

      expect(result.message).toBe(
        message,
      )
      expect(
        mocks.revalidatePath,
      ).not.toHaveBeenCalled()
    },
  )

  it("não compõe repositories sem workspace", async () => {
    mocks.findWorkspace.mockResolvedValue(
      null,
    )

    const result =
      await createClientAction(
        initialState,
        createFormData(),
      )

    expect(result.message).toBe(
      'Workspace "consorcio-os" não encontrado.',
    )
    expect(
      mocks.createRepositories,
    ).not.toHaveBeenCalled()
    expect(
      mocks.execute,
    ).not.toHaveBeenCalled()
  })
})
