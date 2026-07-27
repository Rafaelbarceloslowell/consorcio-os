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

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  findAllConsultants: vi.fn(),
  formProps: vi.fn(),
  action: vi.fn(),
}))

vi.mock(
  "@/components/client/client-create-form",
  () => ({
    ClientCreateForm: (props: {
      view: {
        consultants: Array<{
          id: string
          name: string
        }>
      }
      action: unknown
    }) => {
      mocks.formProps(props)
      return props.view.consultants
        .length ? (
          <p>
            {
              props.view
                .consultants[0]?.name
            }
          </p>
        ) : (
          <p role="status">
            Sem consultores
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

vi.mock("./actions", () => ({
  createClientAction: mocks.action,
}))

import ClientCreatePage from "./page"

function createConsultants() {
  return [
    {
      id: "consultant-1",
      name: "Marina Costa",
      email: "marina@example.com",
      phone: "+5541999999999",
      document: "12345678901",
      role: "consultant" as const,
      team: "Sul",
      region: "PR",
      status: "inactive" as const,
      monthlySalesTarget: 10,
      monthlyLeadsTarget: 20,
      createdAt:
        "2026-07-01T00:00:00.000Z",
      updatedAt:
        "2026-07-01T00:00:00.000Z",
    },
  ]
}

describe("ClientCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.createRepositories.mockReturnValue({
      consultants: {
        findAll:
          mocks.findAllConsultants,
      },
      clients: {
        forbidden: true,
      },
    })
    mocks.findAllConsultants.mockResolvedValue(
      createConsultants(),
    )
  })

  it("carrega consultores uma vez e entrega view reduzida com Action real", async () => {
    const consultants =
      createConsultants()
    const snapshot =
      structuredClone(consultants)
    mocks.findAllConsultants.mockResolvedValue(
      consultants,
    )

    render(await ClientCreatePage())

    expect(
      screen.getByText("Marina Costa"),
    ).toBeInTheDocument()
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
      mocks.findAllConsultants,
    ).toHaveBeenCalledTimes(1)
    expect(
      mocks.formProps,
    ).toHaveBeenCalledExactlyOnceWith({
      view: {
        consultants: [
          {
            id: "consultant-1",
            name: "Marina Costa",
          },
        ],
      },
      action: mocks.action,
    })
    expect(consultants).toEqual(
      snapshot,
    )
  })

  it("encaminha lista vazia", async () => {
    mocks.findAllConsultants.mockResolvedValue(
      [],
    )
    render(await ClientCreatePage())

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Sem consultores",
    )
    expect(
      mocks.formProps,
    ).toHaveBeenCalledWith({
      view: { consultants: [] },
      action: mocks.action,
    })
  })

  it("não cria repository sem workspace", async () => {
    mocks.findWorkspace.mockResolvedValue(
      null,
    )

    await expect(
      ClientCreatePage(),
    ).rejects.toThrow(
      'Workspace "consorcio-os" não encontrado.',
    )
    expect(
      mocks.createRepositories,
    ).not.toHaveBeenCalled()
    expect(
      mocks.findAllConsultants,
    ).not.toHaveBeenCalled()
  })

  it("propaga erro do repository por identidade", async () => {
    const error = new Error(
      "Falha ao listar consultores",
    )
    mocks.findAllConsultants.mockRejectedValue(
      error,
    )

    await expect(
      ClientCreatePage(),
    ).rejects.toBe(error)
    expect(
      mocks.formProps,
    ).not.toHaveBeenCalled()
  })
})
