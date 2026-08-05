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
  createCrmRepositories: vi.fn(),
  findAllClients: vi.fn(),
  formProps: vi.fn(),
  action: vi.fn(),
}))

vi.mock(
  "@/components/opportunity/opportunity-create-form",
  () => ({
    OpportunityCreateForm:
      (props: {
        view: {
          clients: Array<{
            id: string
            name: string
          }>
        }
        action: unknown
      }) => {
        mocks.formProps(props)

        return props.view.clients
          .length === 0 ? (
            <p role="status">
              É necessário cadastrar um cliente.
            </p>
          ) : (
            <p>
              {
                props.view
                  .clients[0]?.name
              }
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
      mocks.createCrmRepositories,
  }),
)

vi.mock(
  "./actions",
  () => ({
    createOpportunityAction:
      mocks.action,
  }),
)

import OpportunityCreatePage from "./page"

function createClients() {
  return [
    {
      id: "client-1",
      name: "Marina Costa",
      type: "individual" as const,
      email:
        "marina@example.com",
      phone: "5511999999999",
      document: "123",
      address: {
        street: "Rua A",
        number: "1",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01000000",
      },
      consultantId:
        "consultant-1",
      status: "active" as const,
      tags: ["vip"],
      createdAt:
        "2026-07-01T00:00:00.000Z",
      updatedAt:
        "2026-07-01T00:00:00.000Z",
    },
  ]
}

describe(
  "OpportunityCreatePage",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.findWorkspace
        .mockResolvedValue({
          id: "workspace-1",
        })
      mocks.createCrmRepositories
        .mockReturnValue({
          clients: {
            findAll:
              mocks.findAllClients,
          },
        })
      mocks.findAllClients
        .mockResolvedValue(
          createClients(),
        )
    })

    it(
      "carrega clientes uma vez e entrega view serializável com Action real",
      async () => {
        const clients =
          createClients()
        const snapshot =
          structuredClone(clients)
        mocks.findAllClients
          .mockResolvedValue(clients)

        const page =
          await OpportunityCreatePage()

        render(page)

        expect(
          screen.getByText(
            "Marina Costa",
          ),
        ).toBeInTheDocument()
        expect(
          mocks.findWorkspace,
        ).toHaveBeenCalledExactlyOnceWith({
          where: {
            slug: "consorcio-os",
          },
          select: { id: true },
        })
        expect(
          mocks.createCrmRepositories,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
        })
        expect(
          mocks.findAllClients,
        ).toHaveBeenCalledTimes(1)
        expect(
          mocks.formProps,
        ).toHaveBeenCalledExactlyOnceWith({
          view: {
            clients: [
              {
                id: "client-1",
                name:
                  "Marina Costa",
              },
            ],
          },
          action: mocks.action,
        })
        expect(clients).toEqual(
          snapshot,
        )
        expect(
          Object.keys(
            mocks.formProps.mock
              .calls[0]?.[0].view
                .clients[0],
          ).sort(),
        ).toEqual(["id", "name"])
      },
    )

    it(
      "encaminha lista vazia para estado não submetível",
      async () => {
        mocks.findAllClients
          .mockResolvedValue([])

        render(
          await OpportunityCreatePage(),
        )

        expect(
          screen.getByRole("status"),
        ).toHaveTextContent(
          "É necessário cadastrar um cliente.",
        )
        expect(
          mocks.formProps,
        ).toHaveBeenCalledWith({
          view: {
            clients: [],
          },
          action: mocks.action,
        })
      },
    )

    it(
      "não compõe repository sem workspace",
      async () => {
        mocks.findWorkspace
          .mockResolvedValue(null)

        await expect(
          OpportunityCreatePage(),
        ).rejects.toThrow(
          'Workspace "consorcio-os" não encontrado.',
        )

        expect(
          mocks.createCrmRepositories,
        ).not.toHaveBeenCalled()
        expect(
          mocks.findAllClients,
        ).not.toHaveBeenCalled()
        expect(
          mocks.formProps,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "propaga erro do repository por identidade",
      async () => {
        const error =
          new Error("Falha ao listar")
        mocks.findAllClients
          .mockRejectedValue(error)

        await expect(
          OpportunityCreatePage(),
        ).rejects.toBe(error)
        expect(
          mocks.formProps,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
