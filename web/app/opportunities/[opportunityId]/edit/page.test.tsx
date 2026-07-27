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

import type {
  OpportunityDetailsView,
} from "@/types/opportunity-details"

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  findAllConsultants: vi.fn(),
  constructorDependencies:
    vi.fn(),
  findWorkspace: vi.fn(),
  createCommercialRepositories:
    vi.fn(),
  createCrmRepositories: vi.fn(),
  formProps: vi.fn(),
  action: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error(
      "NEXT_NOT_FOUND",
    )
  }),
  journeys: {
    repository: "journeys",
  },
  leads: {
    repository: "leads",
  },
  clients: {
    repository: "clients",
  },
  consultants: {
    repository: "consultants",
  },
  phases: {
    repository: "phases",
  },
  states: {
    repository: "states",
  },
}))

vi.mock(
  "@/application/opportunity/get-opportunity-details-async",
  () => ({
    GetOpportunityDetailsAsync:
      class {
        constructor(
          dependencies: {
            journeys: unknown
            leads: unknown
            clients: unknown
            consultants: unknown
            phases: unknown
            states: unknown
          },
        ) {
          mocks
            .constructorDependencies(
              dependencies.journeys,
              dependencies.leads,
              dependencies.clients,
              dependencies.consultants,
              dependencies.phases,
              dependencies.states,
            )
        }

        execute = mocks.execute
      },
  }),
)

vi.mock(
  "@/components/opportunity/opportunity-update-form",
  () => ({
    OpportunityUpdateForm:
      (props: {
        opportunity: {
          id: string
          title: string
          consultantId: string
          priority: string
          score: number
          consultants: Array<{
            id: string
            name: string
          }>
        }
        action: unknown
      }) => {
        mocks.formProps(props)

        return (
          <div>
            {props.opportunity.title}
          </div>
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
  "next/navigation",
  () => ({
    notFound: mocks.notFound,
  }),
)

vi.mock(
  "./actions",
  () => ({
    updateOpportunityAction:
      mocks.action,
  }),
)

import OpportunityEditPage from "./page"

function createView():
  OpportunityDetailsView {
  return {
    id: "journey-1",
    workspaceId: "workspace-1",
    title: "Oportunidade real",
    origin: "client",
    originName: "Cliente real",
    leadId: null,
    clientId: "client-1",
    consultantId:
      "consultant-1",
    consultantName: "Rafael",
    priority: "HIGH",
    score: 87,
    consortiumType:
      "real_estate",
    phaseId: "phase-1",
    phaseName: "Negociação",
    stateId: "state-1",
    stateName:
      "Proposta enviada",
    outcome: null,
    status: "open",
    stateEnteredAt:
      "2026-07-27T12:00:00.000Z",
    lastInteractionAt: null,
    closedAt: null,
    version: 1,
    createdAt:
      "2026-07-26T12:00:00.000Z",
    updatedAt:
      "2026-07-27T14:00:00.000Z",
  }
}

function createConsultants() {
  return [
    {
      id: "consultant-1",
      name: "Rafael",
      email:
        "rafael@example.com",
      phone: "11999999999",
      document: "123",
      role: "consultant" as const,
      team: "A",
      region: "SP",
      status: "active" as const,
      monthlySalesTarget: 10,
      monthlyLeadsTarget: 20,
      createdAt:
        "2026-07-01T00:00:00.000Z",
      updatedAt:
        "2026-07-01T00:00:00.000Z",
    },
    {
      id: "consultant-2",
      name: "Marina",
      email:
        "marina@example.com",
      phone: "11888888888",
      document: "456",
      role: "consultant" as const,
      team: "B",
      region: "SP",
      status: "active" as const,
      monthlySalesTarget: 10,
      monthlyLeadsTarget: 20,
      createdAt:
        "2026-07-01T00:00:00.000Z",
      updatedAt:
        "2026-07-01T00:00:00.000Z",
    },
  ]
}

describe(
  "OpportunityEditPage",
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
          leads: mocks.leads,
          clients: mocks.clients,
          consultants: {
            ...mocks.consultants,
            findAll:
              mocks.findAllConsultants,
          },
        })
      mocks.execute
        .mockResolvedValue({
          opportunity:
            createView(),
        })
      mocks.findAllConsultants
        .mockResolvedValue(
          createConsultants(),
        )
    })

    it(
      "carrega dados em servidor e entrega somente view model serializável",
      async () => {
        const sourceView =
          createView()
        const sourceConsultants =
          createConsultants()
        const viewSnapshot =
          structuredClone(
            sourceView,
          )
        const consultantsSnapshot =
          structuredClone(
            sourceConsultants,
          )

        mocks.execute
          .mockResolvedValue({
            opportunity:
              sourceView,
          })
        mocks.findAllConsultants
          .mockResolvedValue(
            sourceConsultants,
          )

        const page =
          await OpportunityEditPage({
            params:
              Promise.resolve({
                opportunityId:
                  "journey-1",
              }),
          })

        render(page)

        expect(
          screen.getByText(
            "Oportunidade real",
          ),
        ).toBeInTheDocument()
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
          mocks.leads,
          mocks.clients,
          expect.objectContaining({
            findAll:
              mocks.findAllConsultants,
          }),
          mocks.phases,
          mocks.states,
        )
        expect(
          mocks.execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          opportunityId:
            "journey-1",
        })
        expect(
          mocks.findAllConsultants,
        ).toHaveBeenCalledTimes(1)

        const formProps =
          mocks.formProps.mock
            .calls[0]?.[0]

        expect(
          formProps.opportunity,
        ).toEqual({
          id: "journey-1",
          title:
            "Oportunidade real",
          consultantId:
            "consultant-1",
          priority: "HIGH",
          score: 87,
          consultants: [
            {
              id: "consultant-1",
              name: "Rafael",
            },
            {
              id: "consultant-2",
              name: "Marina",
            },
          ],
        })
        expect(
          Object.keys(
            formProps.opportunity,
          ).sort(),
        ).toEqual([
          "consultantId",
          "consultants",
          "id",
          "priority",
          "score",
          "title",
        ])
        expect(sourceView).toEqual(
          viewSnapshot,
        )
        expect(
          sourceConsultants,
        ).toEqual(
          consultantsSnapshot,
        )

        const boundAction =
          formProps.action
        const previousState = {
          status: "idle",
          message: null,
        } as const
        const formData =
          new FormData()

        await boundAction(
          previousState,
          formData,
        )

        expect(
          mocks.action,
        ).toHaveBeenCalledExactlyOnceWith(
          "journey-1",
          previousState,
          formData,
        )
      },
    )

    it(
      "vincula a Action ao ID carregado, não ao parâmetro cliente",
      async () => {
        const loadedView =
          createView()
        loadedView.id =
          "journey/a b"
        mocks.execute
          .mockResolvedValue({
            opportunity:
              loadedView,
          })

        const page =
          await OpportunityEditPage({
            params:
              Promise.resolve({
                opportunityId:
                  "route-forged",
              }),
          })

        render(page)

        expect(
          mocks.execute,
        ).toHaveBeenCalledWith({
          workspaceId:
            "workspace-1",
          opportunityId:
            "route-forged",
        })

        const formProps =
          mocks.formProps.mock
            .calls[0]?.[0]
        const previousState = {
          status: "idle",
          message: null,
        } as const
        const formData =
          new FormData()

        await formProps.action(
          previousState,
          formData,
        )

        expect(
          mocks.action,
        ).toHaveBeenCalledExactlyOnceWith(
          "journey/a b",
          previousState,
          formData,
        )
      },
    )

    it(
      "não consulta nem compõe repositories sem workspace",
      async () => {
        mocks.findWorkspace
          .mockResolvedValue(null)

        await expect(
          OpportunityEditPage({
            params:
              Promise.resolve({
                opportunityId:
                  "journey-1",
              }),
          }),
        ).rejects.toThrow(
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
          mocks.findAllConsultants,
        ).not.toHaveBeenCalled()
        expect(
          mocks.notFound,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "usa notFound somente para oportunidade inexistente",
      async () => {
        mocks.execute
          .mockRejectedValue(
            new Error(
              'Oportunidade comercial não encontrada para o ID "journey-404".',
            ),
          )

        await expect(
          OpportunityEditPage({
            params:
              Promise.resolve({
                opportunityId:
                  "journey-404",
              }),
          }),
        ).rejects.toThrow(
          "NEXT_NOT_FOUND",
        )

        expect(
          mocks.notFound,
        ).toHaveBeenCalledTimes(1)
      },
    )

    it(
      "propaga erro inesperado por identidade",
      async () => {
        const repositoryError =
          new Error(
            "Falha inesperada",
          )
        mocks.execute
          .mockRejectedValue(
            repositoryError,
          )

        await expect(
          OpportunityEditPage({
            params:
              Promise.resolve({
                opportunityId:
                  "journey-1",
              }),
          }),
        ).rejects.toBe(
          repositoryError,
        )
        expect(
          mocks.notFound,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
