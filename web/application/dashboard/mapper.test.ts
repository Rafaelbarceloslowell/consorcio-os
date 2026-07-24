import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type { DecisionEngineOutput } from "@/engine/decision/types"
  import type { DashboardData } from "@/types/dashboard"
  import type {
    CommercialJourney,
    NextBestAction,
  } from "@/types/domain"
  
  import type { OperationalNextBestAction } from "../decision/get-next-best-actions"
  import {
    mapDashboardData,
    mapOperationalDashboardData,
  } from "./mapper"
  
  function createBaseDashboardData(): DashboardData {
    return {
      user: {
        id: "user-test",
        name: "Rafael",
      },
      summary: "Resumo original.",
      metrics: {
        newLeads: 12,
        meetingsToday: 4,
        monthlySales: 850_000,
        pendingTasks: 2,
      },
      meetings: [],
      tasks: [
        {
          id: "task-existing-high",
          title: "Tarefa existente prioritária",
          time: "10:00",
          priority: "high",
        },
        {
          id: "task-existing-low",
          title: "Tarefa existente comum",
          time: "16:00",
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
      score: 75,
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
    overrides: Partial<NextBestAction> = {},
  ): NextBestAction {
    return {
      id: "recommendation-test",
      workspaceId: "workspace-test",
      journeyId: "journey-test",
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
  
  function createDecisionOutput(
    nextBestActions: NextBestAction[],
  ): DecisionEngineOutput {
    return {
      nextBestActions,
      strategy: null,
      diagnostics: [],
      warnings: [],
    }
  }
  
  function createOperationalAction(
    recommendation: NextBestAction,
  ): OperationalNextBestAction {
    return {
      recommendation,
      journeyId: recommendation.journeyId,
      journeyTitle:
        "Jornada comercial de teste",
      leadId: "lead-test",
      clientId: null,
    }
  }
  
  describe(
    "mapDashboardData",
    () => {
      it(
        "deve adicionar as recomendações antes das tarefas existentes",
        () => {
          const baseDashboardData =
            createBaseDashboardData()
  
          const recommendation =
            createRecommendation()
  
          const result = mapDashboardData({
            baseDashboardData,
            journey: createJourney(),
            decisionOutput:
              createDecisionOutput([
                recommendation,
              ]),
          })
  
          expect(result.tasks).toEqual([
            {
              id:
                "decision-recommendation-test",
              title: "Retomar contato",
              time: "Agora",
              priority: "medium",
            },
            ...baseDashboardData.tasks,
          ])
        },
      )
  
      it.each([
        ["URGENT", "high"],
        ["HIGH", "high"],
        ["NORMAL", "medium"],
        ["LOW", "low"],
      ] as const)(
        "deve mapear a prioridade %s para %s",
        (
          recommendationPriority,
          expectedTaskPriority,
        ) => {
          const result = mapDashboardData({
            baseDashboardData:
              createBaseDashboardData(),
            journey: createJourney(),
            decisionOutput:
              createDecisionOutput([
                createRecommendation({
                  priority:
                    recommendationPriority,
                }),
              ]),
          })
  
          expect(
            result.tasks[0]?.priority,
          ).toBe(expectedTaskPriority)
        },
      )
  
      it(
        "deve atualizar a quantidade de tarefas pendentes",
        () => {
          const baseDashboardData =
            createBaseDashboardData()
  
          const result = mapDashboardData({
            baseDashboardData,
            journey: createJourney(),
            decisionOutput:
              createDecisionOutput([
                createRecommendation({
                  id: "recommendation-first",
                }),
                createRecommendation({
                  id: "recommendation-second",
                }),
              ]),
          })
  
          expect(
            result.metrics.pendingTasks,
          ).toBe(4)
        },
      )
  
      it(
        "deve informar a quantidade de ações recomendadas e o título da jornada",
        () => {
          const result = mapDashboardData({
            baseDashboardData:
              createBaseDashboardData(),
            journey: createJourney({
              title:
                "Consórcio imobiliário João",
            }),
            decisionOutput:
              createDecisionOutput([
                createRecommendation(),
              ]),
          })
  
          expect(result.summary).toBe(
            "1 próxima(s) ação(ões) recomendada(s) para Consórcio imobiliário João.",
          )
        },
      )
  
      it(
        "deve informar quando não houver novas recomendações",
        () => {
          const result = mapDashboardData({
            baseDashboardData:
              createBaseDashboardData(),
            journey: createJourney({
              title:
                "Consórcio imobiliário Maria",
            }),
            decisionOutput:
              createDecisionOutput([]),
          })
  
          expect(result.summary).toBe(
            "Nenhuma nova ação recomendada para Consórcio imobiliário Maria.",
          )
  
          expect(result.tasks).toEqual(
            createBaseDashboardData().tasks,
          )
        },
      )
  
      it(
        "não deve alterar o dashboard base recebido",
        () => {
          const baseDashboardData =
            createBaseDashboardData()
  
          const originalDashboardData =
            structuredClone(
              baseDashboardData,
            )
  
          mapDashboardData({
            baseDashboardData,
            journey: createJourney(),
            decisionOutput:
              createDecisionOutput([
                createRecommendation(),
              ]),
          })
  
          expect(
            baseDashboardData,
          ).toEqual(originalDashboardData)
        },
      )
    },
  )
  
  describe(
    "mapOperationalDashboardData",
    () => {
      it(
        "deve converter ações operacionais em tarefas do dashboard",
        () => {
          const recommendation =
            createRecommendation({
              id:
                "recommendation-operational",
              title:
                "Enviar proposta atualizada",
              priority: "URGENT",
            })
  
          const result =
            mapOperationalDashboardData({
              baseDashboardData:
                createBaseDashboardData(),
              operationalActions: [
                createOperationalAction(
                  recommendation,
                ),
              ],
            })
  
          expect(result.tasks[0]).toEqual({
            id:
              "decision-recommendation-operational",
            title:
              "Enviar proposta atualizada",
            time: "Agora",
            priority: "high",
          })
        },
      )
  
      it(
        "deve manter as tarefas existentes depois das ações recomendadas",
        () => {
          const baseDashboardData =
            createBaseDashboardData()
  
          const recommendation =
            createRecommendation()
  
          const result =
            mapOperationalDashboardData({
              baseDashboardData,
              operationalActions: [
                createOperationalAction(
                  recommendation,
                ),
              ],
            })
  
          expect(
            result.tasks.slice(1),
          ).toEqual(
            baseDashboardData.tasks,
          )
        },
      )
  
      it(
        "deve atualizar o total de tarefas pendentes",
        () => {
          const result =
            mapOperationalDashboardData({
              baseDashboardData:
                createBaseDashboardData(),
              operationalActions: [
                createOperationalAction(
                  createRecommendation({
                    id:
                      "recommendation-first",
                  }),
                ),
                createOperationalAction(
                  createRecommendation({
                    id:
                      "recommendation-second",
                  }),
                ),
              ],
            })
  
          expect(
            result.metrics.pendingTasks,
          ).toBe(4)
        },
      )
  
      it(
        "deve informar a quantidade de ações prioritárias recomendadas",
        () => {
          const result =
            mapOperationalDashboardData({
              baseDashboardData:
                createBaseDashboardData(),
              operationalActions: [
                createOperationalAction(
                  createRecommendation({
                    id:
                      "recommendation-first",
                  }),
                ),
                createOperationalAction(
                  createRecommendation({
                    id:
                      "recommendation-second",
                  }),
                ),
              ],
            })
  
          expect(result.summary).toBe(
            "2 ação(ões) prioritária(s) recomendada(s) para sua operação hoje.",
          )
        },
      )
  
      it(
        "deve informar quando não houver ações prioritárias",
        () => {
          const baseDashboardData =
            createBaseDashboardData()
  
          const result =
            mapOperationalDashboardData({
              baseDashboardData,
              operationalActions: [],
            })
  
          expect(result.summary).toBe(
            "Nenhuma nova ação prioritária foi recomendada para sua operação.",
          )
  
          expect(result.tasks).toEqual(
            baseDashboardData.tasks,
          )
  
          expect(
            result.metrics.pendingTasks,
          ).toBe(
            baseDashboardData.tasks.length,
          )
        },
      )
  
      it(
        "não deve alterar o dashboard base recebido",
        () => {
          const baseDashboardData =
            createBaseDashboardData()
  
          const originalDashboardData =
            structuredClone(
              baseDashboardData,
            )
  
          mapOperationalDashboardData({
            baseDashboardData,
            operationalActions: [
              createOperationalAction(
                createRecommendation(),
              ),
            ],
          })
  
          expect(
            baseDashboardData,
          ).toEqual(originalDashboardData)
        },
      )
    },
  )