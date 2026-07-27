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
  constructorDependencies:
    vi.fn(),
  findWorkspace: vi.fn(),
  createCommercialRepositories:
    vi.fn(),
  createCrmRepositories:
    vi.fn(),
  notFound: vi.fn(() => {
    throw new Error(
      "NEXT_NOT_FOUND",
    )
  }),
  journeys: {
    repository: "journeys",
  },
  events: {
    repository: "events",
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
            events: unknown
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
              dependencies.events,
              dependencies.leads,
              dependencies.clients,
              dependencies.consultants,
              dependencies.phases,
              dependencies.states,
            )
        }

        execute =
          mocks.execute
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

import OpportunityDetailsPage from "./page"

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
    phaseName: "NegociaÃ§Ã£o",
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
    timeline: [],
  }
}

describe(
  "OpportunityDetailsPage",
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
          events: mocks.events,
          phases: mocks.phases,
          states: mocks.states,
        })
      mocks.createCrmRepositories
        .mockReturnValue({
          leads: mocks.leads,
          clients: mocks.clients,
          consultants:
            mocks.consultants,
        })
      mocks.execute
        .mockResolvedValue({
          opportunity:
            createView(),
        })
    })

    it(
      "propaga workspace e parÃ¢metro e renderiza detalhes",
      async () => {
        const page =
          await OpportunityDetailsPage({
            params:
              Promise.resolve({
                opportunityId:
                  "journey-1",
              }),
          })

        render(page)

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
          mocks.execute,
        ).toHaveBeenCalledExactlyOnceWith({
          workspaceId:
            "workspace-1",
          opportunityId:
            "journey-1",
        })
        expect(
          mocks
            .constructorDependencies,
        ).toHaveBeenCalledExactlyOnceWith(
          mocks.journeys,
          mocks.events,
          mocks.leads,
          mocks.clients,
          mocks.consultants,
          mocks.phases,
          mocks.states,
        )
        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Oportunidade real",
            },
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "nÃ£o compÃµe repositories quando o workspace nÃ£o existe",
      async () => {
        mocks.findWorkspace
          .mockResolvedValue(null)

        await expect(
          OpportunityDetailsPage({
            params:
              Promise.resolve({
                opportunityId:
                  "journey-1",
              }),
          }),
        ).rejects.toThrow(
          'Workspace "consorcio-os" nÃ£o encontrado.',
        )

        expect(
          mocks
            .createCommercialRepositories,
        ).not.toHaveBeenCalled()
        expect(
          mocks.createCrmRepositories,
        ).not.toHaveBeenCalled()
        expect(
          mocks
            .constructorDependencies,
        ).not.toHaveBeenCalled()
        expect(
          mocks.execute,
        ).not.toHaveBeenCalled()
        expect(
          mocks.notFound,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "usa notFound para oportunidade inexistente",
      async () => {
        mocks.execute
          .mockRejectedValue(
            new Error(
              'Oportunidade comercial nÃ£o encontrada para o ID "journey-404".',
            ),
          )

        await expect(
          OpportunityDetailsPage({
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
      "propaga erros inesperados por identidade",
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
          OpportunityDetailsPage({
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
