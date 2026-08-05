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
  execute: vi.fn(),
  findWorkspace: vi.fn(),
  createRepositories: vi.fn(),
  findConsultants: vi.fn(),
  formProps: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error(
      "NEXT_NOT_FOUND",
    )
  }),
  action: vi.fn(),
  clients: {},
  consultants: {
    findAll: vi.fn(),
  },
}))

vi.mock(
  "@/application/client/get-client-details-async",
  () => ({
    GetClientDetailsAsync:
      class {
        execute = mocks.execute
      },
  }),
)
vi.mock(
  "@/components/client/client-update-form",
  () => ({
    ClientUpdateForm:
      (props: {
        client: {
          name: string
        }
        action: unknown
      }) => {
        mocks.formProps(props)
        return (
          <p>{props.client.name}</p>
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
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}))
vi.mock("./actions", () => ({
  updateClientAction:
    mocks.action,
}))

import ClientEditPage from "./page"

describe("ClientEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace
      .mockResolvedValue({
        id: "workspace-1",
      })
    mocks.consultants.findAll
      .mockResolvedValue([
        {
          id: "consultant-1",
          name: "Marina",
        },
      ])
    mocks.createRepositories
      .mockReturnValue({
        clients: mocks.clients,
        consultants:
          mocks.consultants,
      })
    mocks.execute
      .mockResolvedValue({
        client: {
          id: "client-1",
          type: "individual",
          name: "Ana",
          companyName: null,
          email:
            "ana@example.com",
          phone:
            "5511999999999",
          document:
            "12345678901",
          consultantId:
            "consultant-1",
          address: {
            street: "Rua A",
            number: "1",
            complement: null,
            neighborhood:
              "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode:
              "01000000",
          },
        },
      })
  })

  it("carrega cliente e consultores e entrega view serializável", async () => {
    render(
      await ClientEditPage({
        params: Promise.resolve({
          clientId: "client-1",
        }),
      }),
    )

    expect(
      mocks.createRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId:
        "workspace-1",
    })
    expect(mocks.execute)
      .toHaveBeenCalledExactlyOnceWith({
        workspaceId:
          "workspace-1",
        clientId: "client-1",
      })
    expect(
      mocks.consultants.findAll,
    ).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText("Ana"),
    ).toBeInTheDocument()
    expect(mocks.formProps)
      .toHaveBeenCalledTimes(1)
  })

  it("não compõe repository sem workspace", async () => {
    mocks.findWorkspace
      .mockResolvedValue(null)

    await expect(
      ClientEditPage({
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
  })

  it("usa notFound para cliente inexistente", async () => {
    mocks.execute
      .mockRejectedValue(
        new Error(
          'Cliente não encontrado para o ID "client-404".',
        ),
      )

    await expect(
      ClientEditPage({
        params: Promise.resolve({
          clientId:
            "client-404",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_NOT_FOUND",
    )
    expect(mocks.notFound)
      .toHaveBeenCalledTimes(1)
  })
})
