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
  findConsultants: vi.fn(),
  formProps: vi.fn(),
  action: vi.fn(),
}))

vi.mock(
  "@/components/lead/lead-create-form",
  () => ({
    LeadCreateForm: (props: {
      view: {
        consultants: Array<{
          id: string
          name: string
        }>
      }
      action: unknown
    }) => {
      mocks.formProps(props)

      return (
        <p>
          {props.view.consultants[0]
            ?.name ??
            "Sem consultores"}
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
  createLeadAction: mocks.action,
}))

import LeadCreatePage from "./page"

describe("LeadCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.createRepositories.mockReturnValue({
      consultants: {
        findAll:
          mocks.findConsultants,
      },
    })
    mocks.findConsultants.mockResolvedValue([
      {
        id: "consultant-active",
        name: "Rafael Ramos",
        status: "active",
      },
      {
        id: "consultant-inactive",
        name: "Consultor inativo",
        status: "inactive",
      },
    ])
  })

  it("entrega somente consultores ativos ao formulário", async () => {
    render(await LeadCreatePage())

    expect(
      screen.getByText("Rafael Ramos"),
    ).toBeInTheDocument()
    expect(
      mocks.createRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId: "workspace-1",
    })
    expect(
      mocks.formProps,
    ).toHaveBeenCalledExactlyOnceWith({
      view: {
        consultants: [
          {
            id:
              "consultant-active",
            name: "Rafael Ramos",
          },
        ],
      },
      action: mocks.action,
    })
  })

  it("não cria repositories sem workspace", async () => {
    mocks.findWorkspace.mockResolvedValue(
      null,
    )

    await expect(
      LeadCreatePage(),
    ).rejects.toThrow(
      'Workspace "consorcio-os" não encontrado.',
    )
    expect(
      mocks.createRepositories,
    ).not.toHaveBeenCalled()
  })
})
