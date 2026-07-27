import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  OpportunityCreateActionState,
} from "@/types/opportunity-create"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  createCommercialRepositories:
    vi.fn(),
  createCrmRepositories: vi.fn(),
  constructorDependencies:
    vi.fn(),
  execute: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error(
      "NEXT_REDIRECT",
    )
  }),
  clients: { repository: "clients" },
  consultants: {
    repository: "consultants",
  },
  journeys: {
    repository: "journeys",
  },
  phases: { repository: "phases" },
  states: { repository: "states" },
}))

vi.mock(
  "@/application/opportunity/create-opportunity-async",
  () => ({
    CreateOpportunityAsync:
      class {
        constructor(
          dependencies: {
            clients: unknown
            consultants: unknown
            journeys: unknown
            phases: unknown
            states: unknown
          },
        ) {
          mocks
            .constructorDependencies(
              dependencies.clients,
              dependencies.consultants,
              dependencies.journeys,
              dependencies.phases,
              dependencies.states,
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
  "@/infrastructure/prisma/repositories/prisma-commercial-repositories",
  () => ({
    createPrismaCommercialRepositories:
      mocks
        .createCommercialRepositories,
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/prisma-crm-repositories",
  () => ({
    createPrismaCrmRepositories:
      mocks.createCrmRepositories,
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
    redirect: mocks.redirect,
  }),
)

import {
  createOpportunityAction,
} from "./actions"

const initialState:
  OpportunityCreateActionState = {
  status: "idle",
  message: null,
}

function createFormData(
  values: Record<string, string> = {
    clientId: " client-1 ",
    title: " Minha oportunidade ",
    consortiumType:
      "real_estate",
    priority: "HIGH",
    score: "87",
  },
): FormData {
  const formData = new FormData()

  for (const [
    key,
    value,
  ] of Object.entries(values)) {
    formData.set(key, value)
  }

  return formData
}

describe(
  "createOpportunityAction",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.findWorkspace
        .mockResolvedValue({
          id: "workspace-1",
        })
      mocks
        .createCommercialRepositories
        .mockReturnValue({
          journeys:
            mocks.journeys,
          phases: mocks.phases,
          states: mocks.states,
        })
      mocks.createCrmRepositories
        .mockReturnValue({
          clients: mocks.clients,
          consultants:
            mocks.consultants,
        })
      mocks.execute
        .mockResolvedValue({
          opportunity: {
            id: "journey-created",
          },
        })
    })

    it(
      "encaminha somente cinco campos e compõe dependencies scoped",
      async () => {
        const formData =
          createFormData()
        formData.set(
          "workspaceId",
          "workspace-forged",
        )
        formData.set(
          "consultantId",
          "consultant-forged",
        )
        formData.set(
          "currentStateId",
          "state-forged",
        )

        await expect(
          createOpportunityAction(
            initialState,
            formData,
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.findWorkspace,
        ).toHaveBeenCalledExactlyOnceWith({
          where: {
            slug: "consorcio-os",
          },
          select: { id: true },
        })
        expect(
          mocks
            .createCommercialRepositories,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
        })
        expect(
          mocks.createCrmRepositories,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
        })
        expect(
          mocks
            .constructorDependencies,
        ).toHaveBeenCalledExactlyOnceWith(
          mocks.clients,
          mocks.consultants,
          mocks.journeys,
          mocks.phases,
          mocks.states,
        )
        expect(
          mocks.execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          clientId: " client-1 ",
          title:
            " Minha oportunidade ",
          consortiumType:
            "real_estate",
          priority: "HIGH",
          score: 87,
        })
        expect(
          mocks.revalidatePath,
        ).toHaveBeenCalledExactlyOnceWith(
          "/",
        )
        expect(
          mocks.redirect,
        ).toHaveBeenCalledExactlyOnceWith(
          "/opportunities/journey-created",
        )
      },
    )

    it.each([
      [
        "clientId",
        "client-2",
        {
          clientId: "client-2",
          consortiumType:
            "real_estate",
        },
      ],
      [
        "title",
        "",
        {
          clientId: "client-1",
          title: "",
          consortiumType:
            "real_estate",
        },
      ],
      [
        "consortiumType",
        "vehicle",
        {
          clientId: "client-1",
          consortiumType:
            "vehicle",
        },
      ],
      [
        "priority",
        "URGENT",
        {
          clientId: "client-1",
          consortiumType:
            "real_estate",
          priority: "URGENT",
        },
      ],
      [
        "score",
        "0",
        {
          clientId: "client-1",
          consortiumType:
            "real_estate",
          score: 0,
        },
      ],
      [
        "score",
        "100",
        {
          clientId: "client-1",
          consortiumType:
            "real_estate",
          score: 100,
        },
      ],
    ] as const)(
      "encaminha corretamente %s",
      async (
        field,
        value,
        expectedFields,
      ) => {
        const base = {
          clientId: "client-1",
          consortiumType:
            "real_estate",
        }

        await expect(
          createOpportunityAction(
            initialState,
            createFormData({
              ...base,
              [field]: value,
            }),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          ...expectedFields,
        })
      },
    )

    it(
      "preserva campos opcionais ausentes",
      async () => {
        await expect(
          createOpportunityAction(
            initialState,
            createFormData({
              clientId: "client-1",
              consortiumType:
                "services",
            }),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          clientId: "client-1",
          consortiumType:
            "services",
        })
      },
    )

    it.each([
      "",
      "abc",
      "1.5",
      "1e2",
      "0x64",
      "+1",
      " 1 ",
      "01",
    ])(
      "rejeita formato de score %j antes do workspace",
      async (score) => {
        const result =
          await createOpportunityAction(
            initialState,
            createFormData({
              clientId: "client-1",
              consortiumType:
                "real_estate",
              score,
            }),
          )

        expect(result).toEqual({
          status: "error",
          message:
            "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
          values: {
            clientId: "client-1",
            title: "",
            consortiumType:
              "real_estate",
            priority: "",
            score,
          },
          fieldErrors: {
            score:
              "Informe um número inteiro entre 0 e 100.",
          },
        })
        expect(
          mocks.findWorkspace,
        ).not.toHaveBeenCalled()
        expect(
          mocks.execute,
        ).not.toHaveBeenCalled()
        expect(
          mocks.revalidatePath,
        ).not.toHaveBeenCalled()
        expect(
          mocks.redirect,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      [
        {
          consortiumType:
            "invalid",
        },
        "O tipo de consórcio informado é inválido.",
      ],
      [
        {
          priority: "CRITICAL",
        },
        "A prioridade da oportunidade é inválida.",
      ],
    ])(
      "rejeita enum inválido antes do workspace",
      async (
        override,
        message,
      ) => {
        const result =
          await createOpportunityAction(
            initialState,
            createFormData({
              clientId: "client-1",
              consortiumType:
                "real_estate",
              ...override,
            }),
          )

        expect(result.message).toBe(
          message,
        )
        expect(
          mocks.findWorkspace,
        ).not.toHaveBeenCalled()
        expect(
          mocks.execute,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      [
        {
          consortiumType:
            "real_estate",
        },
        "O cliente é obrigatório para criar a oportunidade.",
      ],
      [
        {
          clientId: "client-1",
        },
        "O tipo de consórcio informado é inválido.",
      ],
    ])(
      "rejeita campo obrigatório ausente",
      async (values, message) => {
        const result =
          await createOpportunityAction(
            initialState,
            createFormData(values),
          )

        expect(result.message).toBe(
          message,
        )
        expect(
          mocks.findWorkspace,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "não compõe repositories quando workspace não existe",
      async () => {
        mocks.findWorkspace
          .mockResolvedValue(null)

        const result =
          await createOpportunityAction(
            initialState,
            createFormData(),
          )

        expect(result.message).toBe(
          'Workspace "consorcio-os" não encontrado.',
        )
        expect(
          mocks
            .createCommercialRepositories,
        ).not.toHaveBeenCalled()
        expect(
          mocks.createCrmRepositories,
        ).not.toHaveBeenCalled()
        expect(
          mocks.execute,
        ).not.toHaveBeenCalled()
        expect(
          mocks.revalidatePath,
        ).not.toHaveBeenCalled()
        expect(
          mocks.redirect,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      ["caso de uso", "execute"],
      ["repository", "factory"],
    ])(
      "retorna erro de %s sem navegar",
      async (_label, source) => {
        const error =
          new Error("Falha interna")

        if (source === "execute") {
          mocks.execute
            .mockRejectedValue(error)
        } else {
          mocks
            .createCommercialRepositories
            .mockImplementation(() => {
              throw error
            })
        }

        const result =
          await createOpportunityAction(
            initialState,
            createFormData(),
          )

        expect(result).toEqual({
          status: "error",
          message: "Falha interna",
          values: {
            clientId:
              " client-1 ",
            title:
              " Minha oportunidade ",
            consortiumType:
              "real_estate",
            priority: "HIGH",
            score: "87",
          },
          fieldErrors: undefined,
        })
        expect(
          mocks.revalidatePath,
        ).not.toHaveBeenCalled()
        expect(
          mocks.redirect,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "usa e codifica o ID retornado pela criação",
      async () => {
        mocks.execute
          .mockResolvedValue({
            opportunity: {
              id: "journey/a b",
            },
          })

        await expect(
          createOpportunityAction(
            initialState,
            createFormData(),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.redirect,
        ).toHaveBeenCalledExactlyOnceWith(
          "/opportunities/journey%2Fa%20b",
        )
        expect(
          mocks.revalidatePath,
        ).toHaveBeenCalledExactlyOnceWith(
          "/",
        )
      },
    )
  },
)
