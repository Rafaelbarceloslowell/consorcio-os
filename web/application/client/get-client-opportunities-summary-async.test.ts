import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  GetClientOpportunitiesSummaryAsync,
  type GetClientOpportunitiesSummaryAsyncDependencies,
} from "@/application/client/get-client-opportunities-summary-async"

import type {
  CommercialJourney,
  Consultant,
  JourneyPhase,
  JourneyState,
} from "@/types/domain"

function createOpportunity(
  overrides: Partial<CommercialJourney> = {},
): CommercialJourney {
  return {
    id: "opportunity-1",
    workspaceId: "workspace-1",
    leadId: null,
    clientId: "client-1",
    consultantId: "consultant-1",
    title: "Consórcio imobiliário",
    consortiumType: "REAL_ESTATE",
    priority: "NORMAL",
    score: 0,
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    outcome: null,
    version: 1,
    createdAt:
      "2026-07-27T10:00:00.000Z",
    updatedAt:
      "2026-07-27T11:00:00.000Z",
    closedAt: null,
    ...overrides,
  } as CommercialJourney
}

function createConsultant(
  overrides: Partial<Consultant> = {},
): Consultant {
  return {
    id: "consultant-1",
    workspaceId: "workspace-1",
    name: "Rafael Ramos",
    ...overrides,
  } as Consultant
}

function createPhase(
  overrides: Partial<JourneyPhase> = {},
): JourneyPhase {
  return {
    id: "phase-1",
    workspaceId: "workspace-1",
    name: "Negociação",
    order: 1,
    ...overrides,
  } as JourneyPhase
}

function createState(
  overrides: Partial<JourneyState> = {},
): JourneyState {
  return {
    id: "state-1",
    workspaceId: "workspace-1",
    phaseId: "phase-1",
    name: "Proposta apresentada",
    order: 1,
    ...overrides,
  } as JourneyState
}

function createDependencies(
  opportunities: CommercialJourney[] = [],
): {
  dependencies:
    GetClientOpportunitiesSummaryAsyncDependencies
  findByClientId:
    ReturnType<typeof vi.fn>
  findConsultantById:
    ReturnType<typeof vi.fn>
  findPhaseById:
    ReturnType<typeof vi.fn>
  findStateById:
    ReturnType<typeof vi.fn>
} {
  const findByClientId =
    vi.fn().mockResolvedValue(
      opportunities,
    )

  const findConsultantById =
    vi.fn().mockImplementation(
      async (
        consultantId: string,
      ) => {
        if (
          consultantId !==
          "consultant-1"
        ) {
          return undefined
        }

        return createConsultant()
      },
    )

  const findPhaseById =
    vi.fn().mockImplementation(
      async (
        phaseId: string,
      ) => {
        if (
          phaseId !==
          "phase-1"
        ) {
          return undefined
        }

        return createPhase()
      },
    )

  const findStateById =
    vi.fn().mockImplementation(
      async (
        stateId: string,
      ) => {
        if (
          stateId !==
          "state-1"
        ) {
          return undefined
        }

        return createState()
      },
    )

  const dependencies = {
    workspaceId:
      "workspace-1",

    journeys: {
      findByClientId,
    },

    consultants: {
      findById:
        findConsultantById,
    },

    phases: {
      findById:
        findPhaseById,
    },

    states: {
      findById:
        findStateById,
    },
  } as GetClientOpportunitiesSummaryAsyncDependencies

  return {
    dependencies,
    findByClientId,
    findConsultantById,
    findPhaseById,
    findStateById,
  }
}

describe(
  "GetClientOpportunitiesSummaryAsync",
  () => {
    it(
      "deve rejeitar um workspace vazio",
      async () => {
        const {
          dependencies,
          findByClientId,
        } =
          createDependencies()

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        await expect(
          useCase.execute({
            workspaceId: "   ",
            clientId: "client-1",
          }),
        ).rejects.toThrow(
          "O workspace é obrigatório para consultar as oportunidades do cliente.",
        )

        expect(
          findByClientId,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "deve rejeitar um ID de cliente vazio",
      async () => {
        const {
          dependencies,
          findByClientId,
        } =
          createDependencies()

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        await expect(
          useCase.execute({
            workspaceId:
              "workspace-1",
            clientId: "   ",
          }),
        ).rejects.toThrow(
          "O ID do cliente é obrigatório para consultar as oportunidades.",
        )

        expect(
          findByClientId,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "deve normalizar o workspace e o ID do cliente",
      async () => {
        const {
          dependencies,
          findByClientId,
        } =
          createDependencies()

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "  workspace-1  ",
            clientId:
              "  client-1  ",
          })

        expect(
          findByClientId,
        ).toHaveBeenCalledWith(
          "client-1",
        )

        expect(
          result.summary.clientId,
        ).toBe(
          "client-1",
        )
      },
    )

    it(
      "deve retornar um resumo vazio quando o workspace não pertencer à instância",
      async () => {
        const {
          dependencies,
          findByClientId,
          findConsultantById,
          findPhaseById,
          findStateById,
        } =
          createDependencies([
            createOpportunity(),
          ])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "outro-workspace",
            clientId:
              "client-1",
          })

        expect(
          result,
        ).toEqual({
          summary: {
            clientId:
              "client-1",
            opportunities: [],
          },
        })

        expect(
          findByClientId,
        ).not.toHaveBeenCalled()

        expect(
          findConsultantById,
        ).not.toHaveBeenCalled()

        expect(
          findPhaseById,
        ).not.toHaveBeenCalled()

        expect(
          findStateById,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "deve retornar as oportunidades do cliente com os dados relacionados",
      async () => {
        const opportunity =
          createOpportunity()

        const {
          dependencies,
          findByClientId,
          findConsultantById,
          findPhaseById,
          findStateById,
        } =
          createDependencies([
            opportunity,
          ])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "workspace-1",
            clientId:
              "client-1",
          })

        expect(
          findByClientId,
        ).toHaveBeenCalledWith(
          "client-1",
        )

        expect(
          findConsultantById,
        ).toHaveBeenCalledWith(
          "consultant-1",
        )

        expect(
          findPhaseById,
        ).toHaveBeenCalledWith(
          "phase-1",
        )

        expect(
          findStateById,
        ).toHaveBeenCalledWith(
          "state-1",
        )

        expect(
          result,
        ).toEqual({
          summary: {
            clientId:
              "client-1",

            opportunities: [
              {
                id:
                  "opportunity-1",

                title:
                  "Consórcio imobiliário",

                consortiumType:
                  "REAL_ESTATE",

                priority:
                  "NORMAL",

                consultantId:
                  "consultant-1",

                consultantName:
                  "Rafael Ramos",

                phaseId:
                  "phase-1",

                phaseName:
                  "Negociação",

                stateId:
                  "state-1",

                stateName:
                  "Proposta apresentada",

                outcome: null,

                status:
                  "open",

                updatedAt:
                  "2026-07-27T11:00:00.000Z",
              },
            ],
          },
        })
      },
    )

    it(
      "deve ignorar oportunidades de outro workspace e de outro cliente",
      async () => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id:
                "opportunity-valid",
            }),

            createOpportunity({
              id:
                "opportunity-other-workspace",

              workspaceId:
                "other-workspace",
            }),

            createOpportunity({
              id:
                "opportunity-other-client",

              clientId:
                "client-2",
            }),
          ])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "workspace-1",
            clientId:
              "client-1",
          })

        expect(
          result.summary.opportunities.map(
            (opportunity) =>
              opportunity.id,
          ),
        ).toEqual([
          "opportunity-valid",
        ])
      },
    )

    it(
      "deve usar textos alternativos quando os dados relacionados não forem encontrados",
      async () => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              consultantId:
                "consultant-missing",

              currentPhaseId:
                "phase-missing",

              currentStateId:
                "state-missing",
            }),
          ])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "workspace-1",
            clientId:
              "client-1",
          })

        expect(
          result.summary.opportunities[0],
        ).toMatchObject({
          consultantName:
            "Consultor não identificado",

          phaseName:
            "Fase indisponível",

          stateName:
            "Estado indisponível",
        })
      },
    )

    it(
      "deve identificar oportunidades abertas e fechadas",
      async () => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id:
                "opportunity-open",

              outcome: null,
              closedAt: null,
            }),

            createOpportunity({
              id:
                "opportunity-closed-at",

              closedAt:
                "2026-07-27T12:00:00.000Z",
            }),

            createOpportunity({
              id:
                "opportunity-won",

              outcome: "WON",
              closedAt: null,
            }),
          ])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "workspace-1",
            clientId:
              "client-1",
          })

        expect(
          Object.fromEntries(
            result.summary.opportunities.map(
              (opportunity) => [
                opportunity.id,
                opportunity.status,
              ],
            ),
          ),
        ).toEqual({
          "opportunity-closed-at":
            "closed",
          "opportunity-open":
            "open",
          "opportunity-won":
            "closed",
        })
      },
    )

    it(
      "deve ordenar pela atualização mais recente e desempatar pelo ID",
      async () => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id:
                "opportunity-old",

              updatedAt:
                "2026-07-25T10:00:00.000Z",
            }),

            createOpportunity({
              id:
                "opportunity-b",

              updatedAt:
                "2026-07-27T10:00:00.000Z",
            }),

            createOpportunity({
              id:
                "opportunity-a",

              updatedAt:
                "2026-07-27T10:00:00.000Z",
            }),
          ])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "workspace-1",
            clientId:
              "client-1",
          })

        expect(
          result.summary.opportunities.map(
            (opportunity) =>
              opportunity.id,
          ),
        ).toEqual([
          "opportunity-a",
          "opportunity-b",
          "opportunity-old",
        ])
      },
    )

    it(
      "não deve alterar a lista nem as oportunidades retornadas pelo repositório",
      async () => {
        const firstOpportunity =
          createOpportunity({
            id:
              "opportunity-old",

            updatedAt:
              "2026-07-25T10:00:00.000Z",
          })

        const secondOpportunity =
          createOpportunity({
            id:
              "opportunity-new",

            updatedAt:
              "2026-07-27T10:00:00.000Z",
          })

        const repositoryOpportunities = [
          firstOpportunity,
          secondOpportunity,
        ]

        const originalSnapshot =
          structuredClone(
            repositoryOpportunities,
          )

        const {
          dependencies,
        } =
          createDependencies(
            repositoryOpportunities,
          )

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        await useCase.execute({
          workspaceId:
            "workspace-1",
          clientId:
            "client-1",
        })

        expect(
          repositoryOpportunities,
        ).toEqual(
          originalSnapshot,
        )

        expect(
          repositoryOpportunities[0],
        ).toBe(
          firstOpportunity,
        )

        expect(
          repositoryOpportunities[1],
        ).toBe(
          secondOpportunity,
        )
      },
    )

    it(
      "deve retornar um resumo vazio quando o cliente não possuir oportunidades",
      async () => {
        const {
          dependencies,
          findConsultantById,
          findPhaseById,
          findStateById,
        } =
          createDependencies([])

        const useCase =
          new GetClientOpportunitiesSummaryAsync(
            dependencies,
          )

        const result =
          await useCase.execute({
            workspaceId:
              "workspace-1",
            clientId:
              "client-1",
          })

        expect(
          result,
        ).toEqual({
          summary: {
            clientId:
              "client-1",

            opportunities: [],
          },
        })

        expect(
          findConsultantById,
        ).not.toHaveBeenCalled()

        expect(
          findPhaseById,
        ).not.toHaveBeenCalled()

        expect(
          findStateById,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
