import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  import type { DashboardData } from "@/types/dashboard"
  import type {
    CommercialJourney,
    NextBestAction,
  } from "@/types/domain"
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    getDashboardData,
    type GetDashboardDataDependencies,
  } from "./get-dashboard-data"
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
  function createBaseDashboardData(): DashboardData {
    return {
      user: {
        id: "user-test",
        name: "Rafael",
      },
      summary: "Resumo original.",
      metrics: {
        newLeads: 5,
        meetingsToday: 2,
        monthlySales: 500_000,
        pendingTasks: 1,
      },
      meetings: [],
      tasks: [
        {
          id: "task-existing",
          title: "Tarefa existente",
          time: "10:00",
          priority: "low",
        },
      ],
      pipeline: [],
    }
  }
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id: "journey-test",
      workspaceId: "workspace-test",
      leadId: "lead-test",
      clientId: null,
      consultantId: "consultant-test",
      title: "Jornada comercial de teste",
      consortiumType: "real_estate",
      currentPhaseId: "phase-test",
      currentStateId: "state-test",
      priority: "NORMAL",
      score: 80,
      outcome: null,
      stateEnteredAt:
        "2026-07-20T12:00:00.000Z",
      lastInteractionAt:
        "2026-07-21T12:00:00.000Z",
      closedAt: null,
      version: 1,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-21T12:00:00.000Z",
      ...overrides,
    }
  }
  
  function createRecommendation(
    journey: CommercialJourney,
    overrides: Partial<NextBestAction> = {},
  ): NextBestAction {
    return {
      id: "recommendation-test",
      workspaceId: journey.workspaceId,
      journeyId: journey.id,
      actionType: "SEND_MESSAGE",
      title: "Retomar contato",
      description:
        "Enviar uma mensagem personalizada ao lead.",
      reason:
        "A jornada está sem interação recente.",
      confidence: 0.8,
      priority: "NORMAL",
      source: "RULE_ENGINE",
      expiresAt:
        "2026-07-24T15:00:00.000Z",
      acceptedAt: null,
      rejectedAt: null,
      executedActionId: null,
      createdAt:
        "2026-07-22T12:00:00.000Z",
      updatedAt:
        "2026-07-22T12:00:00.000Z",
      ...overrides,
    }
  }
  
  function createDependencies(
    journeys: CommercialJourney[],
    recommendations: NextBestAction[],
  ): GetDashboardDataDependencies {
    return {
      commercialRepository:
        new MockCommercialRepository({
          ...mockCommercialData,
          commercialJourneys: journeys,
          journeyPhases: [],
          journeyStates: [],
          commercialEvents: [],
          commercialActions: [],
          nextBestActions:
            recommendations,
          workflowRules: [],
        }),
      crmRepository:
        new MockCrmRepository(),
      baseDashboardData:
        createBaseDashboardData(),
    }
  }
  
  describe(
    "getDashboardData",
    () => {
      it(
        "deve retornar o dashboard com as recomendações abertas",
        () => {
          const journey =
            createJourney()
  
          const recommendation =
            createRecommendation(
              journey,
            )
  
          const result =
            getDashboardData(
              {
                now: NOW,
              },
              createDependencies(
                [journey],
                [recommendation],
              ),
            )
  
          expect(result.tasks[0]).toEqual({
            id:
              "decision-recommendation-test",
            title: "Retomar contato",
            time: "Agora",
            priority: "medium",
          })
  
          expect(
            result.metrics.pendingTasks,
          ).toBe(2)
  
          expect(result.summary).toBe(
            "1 ação(ões) prioritária(s) recomendada(s) para sua operação hoje.",
          )
        },
      )
  
      it(
        "deve filtrar as recomendações pelo consultor informado",
        () => {
          const selectedJourney =
            createJourney({
              id:
                "journey-selected",
              consultantId:
                "consultant-selected",
            })
  
          const otherJourney =
            createJourney({
              id: "journey-other",
              consultantId:
                "consultant-other",
            })
  
          const selectedRecommendation =
            createRecommendation(
              selectedJourney,
              {
                id:
                  "recommendation-selected",
                title:
                  "Ação do consultor selecionado",
              },
            )
  
          const otherRecommendation =
            createRecommendation(
              otherJourney,
              {
                id:
                  "recommendation-other",
                title:
                  "Ação de outro consultor",
                priority: "URGENT",
              },
            )
  
          const result =
            getDashboardData(
              {
                consultantId:
                  "consultant-selected",
                now: NOW,
              },
              createDependencies(
                [
                  selectedJourney,
                  otherJourney,
                ],
                [
                  selectedRecommendation,
                  otherRecommendation,
                ],
              ),
            )
  
          expect(
            result.tasks.map(
              (task) => task.id,
            ),
          ).toEqual([
            "decision-recommendation-selected",
            "task-existing",
          ])
  
          expect(
            result.tasks.some(
              (task) =>
                task.id ===
                "decision-recommendation-other",
            ),
          ).toBe(false)
        },
      )
  
      it(
        "deve ignorar recomendações aceitas",
        () => {
          const journey =
            createJourney()
  
          const recommendation =
            createRecommendation(
              journey,
              {
                acceptedAt:
                  "2026-07-22T14:00:00.000Z",
              },
            )
  
          const result =
            getDashboardData(
              {
                now: NOW,
              },
              createDependencies(
                [journey],
                [recommendation],
              ),
            )
  
          expect(result.tasks).toEqual([
            {
              id: "task-existing",
              title:
                "Tarefa existente",
              time: "10:00",
              priority: "low",
            },
          ])
  
          expect(result.summary).toBe(
            "Nenhuma nova ação prioritária foi recomendada para sua operação.",
          )
        },
      )
  
      it(
        "deve ignorar recomendações expiradas",
        () => {
          const journey =
            createJourney()
  
          const recommendation =
            createRecommendation(
              journey,
              {
                expiresAt:
                  "2026-07-22T14:59:59.000Z",
              },
            )
  
          const result =
            getDashboardData(
              {
                now: NOW,
              },
              createDependencies(
                [journey],
                [recommendation],
              ),
            )
  
          expect(result.tasks).toHaveLength(
            1,
          )
  
          expect(
            result.metrics.pendingTasks,
          ).toBe(1)
        },
      )
  
      it(
        "deve ordenar as recomendações por prioridade",
        () => {
          const journey =
            createJourney()
  
          const normalRecommendation =
            createRecommendation(
              journey,
              {
                id:
                  "recommendation-normal",
                title:
                  "Recomendação normal",
                priority: "NORMAL",
              },
            )
  
          const urgentRecommendation =
            createRecommendation(
              journey,
              {
                id:
                  "recommendation-urgent",
                title:
                  "Recomendação urgente",
                priority: "URGENT",
              },
            )
  
          const result =
            getDashboardData(
              {
                now: NOW,
              },
              createDependencies(
                [journey],
                [
                  normalRecommendation,
                  urgentRecommendation,
                ],
              ),
            )
  
          expect(
            result.tasks
              .slice(0, 2)
              .map((task) => task.id),
          ).toEqual([
            "decision-recommendation-urgent",
            "decision-recommendation-normal",
          ])
        },
      )
  
      it(
        "não deve alterar o dashboard base recebido",
        () => {
          const journey =
            createJourney()
  
          const recommendation =
            createRecommendation(
              journey,
            )
  
          const dependencies =
            createDependencies(
              [journey],
              [recommendation],
            )
  
          const originalDashboardData =
            structuredClone(
              dependencies.baseDashboardData,
            )
  
          getDashboardData(
            {
              now: NOW,
            },
            dependencies,
          )
  
          expect(
            dependencies.baseDashboardData,
          ).toEqual(originalDashboardData)
        },
      )
  
      it(
        "deve funcionar sem informar dependências manualmente",
        () => {
          expect(() =>
            getDashboardData({
              now: NOW,
            }),
          ).not.toThrow()
        },
      )
    },
  )