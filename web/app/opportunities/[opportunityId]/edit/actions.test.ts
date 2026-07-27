import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  OpportunityUpdateActionState,
} from "@/types/opportunity-update"

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
  journeys: {
    repository: "journeys",
  },
  consultants: {
    repository: "consultants",
  },
}))

vi.mock(
  "@/application/opportunity/update-opportunity-async",
  () => ({
    UpdateOpportunityAsync:
      class {
        constructor(
          dependencies: {
            journeys: unknown
            consultants: unknown
          },
        ) {
          mocks
            .constructorDependencies(
              dependencies.journeys,
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
  updateOpportunityAction,
} from "./actions"

const initialState:
  OpportunityUpdateActionState = {
  status: "idle",
  message: null,
}

function createFormData(
  values: Record<string, string> = {
    title: " Novo título ",
    consultantId:
      " consultant-2 ",
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
  "updateOpportunityAction",
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
        })
      mocks.createCrmRepositories
        .mockReturnValue({
          consultants:
            mocks.consultants,
        })
      mocks.execute
        .mockResolvedValue({
          opportunity: {
            id: "journey-1",
          },
        })
    })

    it(
      "encaminha somente os quatro campos e compõe dependencies com workspace do servidor",
      async () => {
        const formData =
          createFormData()
        formData.set(
          "workspaceId",
          "workspace-forged",
        )
        formData.set(
          "currentStateId",
          "state-forged",
        )

        await expect(
          updateOpportunityAction(
            "journey-1",
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
          select: {
            id: true,
          },
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
          mocks.journeys,
          mocks.consultants,
        )
        expect(
          mocks.execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          opportunityId:
            "journey-1",
          title: " Novo título ",
          consultantId:
            " consultant-2 ",
          priority: "HIGH",
          score: 87,
        })
        expect(
          mocks.revalidatePath,
        ).toHaveBeenCalledExactlyOnceWith(
          "/opportunities/journey-1",
        )
        expect(
          mocks.revalidatePath,
        ).not.toHaveBeenCalledWith("/")
        expect(
          mocks.redirect,
        ).toHaveBeenCalledExactlyOnceWith(
          "/opportunities/journey-1",
        )
      },
    )

    it.each([
      ["title", "Título", "title"],
      [
        "consultantId",
        "consultant-2",
        "consultantId",
      ],
      [
        "priority",
        "URGENT",
        "priority",
      ],
      ["score", "0", "score"],
      ["score", "100", "score"],
    ])(
      "encaminha isoladamente %s",
      async (
        field,
        value,
        expectedField,
      ) => {
        await expect(
          updateOpportunityAction(
            "journey-1",
            initialState,
            createFormData({
              [field]: value,
            }),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.execute,
        ).toHaveBeenCalledWith({
          workspaceId:
            "workspace-1",
          opportunityId:
            "journey-1",
          [expectedField]:
            field === "score"
              ? Number(value)
              : value,
        })
      },
    )

    it(
      "preserva campo ausente como ausente",
      async () => {
        await expect(
          updateOpportunityAction(
            "journey-1",
            initialState,
            createFormData({
              title: "Título",
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
          opportunityId:
            "journey-1",
          title: "Título",
        })
      },
    )

    it.each([
      ["", "score vazio"],
      ["abc", "score não numérico"],
      ["1.5", "score decimal"],
      ["01", "score ambíguo"],
    ])(
      "rejeita %s (%s) antes de acessar workspace",
      async (score) => {
        const result =
          await updateOpportunityAction(
            "journey-1",
            initialState,
            createFormData({
              score,
            }),
          )

        expect(result).toEqual({
          status: "error",
          message:
            "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
          values: {
            title: "",
            consultantId: "",
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

    it(
      "rejeita prioridade inválida antes de acessar workspace",
      async () => {
        const result =
          await updateOpportunityAction(
            "journey-1",
            initialState,
            createFormData({
              priority: "CRITICAL",
            }),
          )

        expect(result.message).toBe(
          "A prioridade da oportunidade é inválida.",
        )
        expect(result.status).toBe(
          "error",
        )

        if (
          result.status !== "error"
        ) {
          throw new Error(
            "Estado de erro esperado.",
          )
        }

        expect(
          result.values.priority,
        ).toBe("CRITICAL")
        expect(
          mocks.findWorkspace,
        ).not.toHaveBeenCalled()
        expect(
          mocks.execute,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "retorna erro quando workspace não existe sem compor repositories",
      async () => {
        mocks.findWorkspace
          .mockResolvedValue(null)

        const result =
          await updateOpportunityAction(
            "journey-1",
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
      ["use case", "execute"],
      [
        "repository factory",
        "factory",
      ],
    ])(
      "retorna erro de %s sem redirect ou revalidate",
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
          await updateOpportunityAction(
            "journey-1",
            initialState,
            createFormData(),
          )

        expect(result.message).toBe(
          "Falha interna",
        )
        expect(
          mocks.revalidatePath,
        ).not.toHaveBeenCalled()
        expect(
          mocks.redirect,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "codifica opportunityId na revalidação e redirect",
      async () => {
        await expect(
          updateOpportunityAction(
            "journey/a b",
            initialState,
            createFormData(),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.revalidatePath,
        ).toHaveBeenCalledWith(
          "/opportunities/journey%2Fa%20b",
        )
        expect(
          mocks.redirect,
        ).toHaveBeenCalledWith(
          "/opportunities/journey%2Fa%20b",
        )
      },
    )
  },
)
