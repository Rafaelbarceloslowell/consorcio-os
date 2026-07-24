import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CommercialJourney,
    WorkflowRule,
  } from "@/types/domain"
  
  import {
    analyzeJourneyDiagnostics,
  } from "./diagnostics"
  
  import {
    generateRecommendations,
  } from "./recommendation"
  
  import {
    analyzeTimeline,
  } from "./timeline"
  
  const NOW = new Date(
    "2026-07-21T12:00:00.000Z",
  )
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id: "journey-1",
      workspaceId: "workspace-1",
      leadId: "lead-1",
      clientId: null,
      consultantId: "consultant-1",
      title: "Compra de veículo",
      consortiumType: "vehicle",
      currentPhaseId: "phase-1",
      currentStateId: "state-1",
      priority: "NORMAL",
      score: 80,
      outcome: null,
      stateEnteredAt: NOW.toISOString(),
      lastInteractionAt:
        "2026-07-11T12:00:00.000Z",
      closedAt: null,
      version: 1,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      ...overrides,
    }
  }
  
  function createRule(
    overrides: Partial<WorkflowRule> = {},
  ): WorkflowRule {
    return {
      id: "rule-1",
      workspaceId: "workspace-1",
      name: "Retomar jornada",
      description:
        "Recomenda retomar o contato com o lead.",
      eventType: "DECISION_ENGINE_ANALYSIS",
      conditions: [
        {
          field: "daysSinceLastInteraction",
          operator: "GREATER_THAN_OR_EQUAL",
          value: 7,
        },
      ],
      actions: [
        {
          type: "TRIGGER_AUTOMATION",
          payload: {
            recommendationType: "SEND_MESSAGE",
            title: "Retomar contato",
            description:
              "Envie uma mensagem personalizada.",
            reason:
              "A jornada está sem interação recente.",
            confidence: 0.9,
            priority: "HIGH",
            expiresInHours: 48,
          },
        },
      ],
      priority: 100,
      stopProcessingAfterMatch: false,
      isActive: true,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      ...overrides,
    }
  }
  
  function generateResult(options?: {
    journey?: Partial<CommercialJourney>
    workflowRules?: WorkflowRule[]
  }) {
    const journey = createJourney(
      options?.journey,
    )
  
    const timelineAnalysis = analyzeTimeline({
      lastInteractionAt:
        journey.lastInteractionAt,
      now: NOW,
    })
  
    const journeyDiagnostics =
      analyzeJourneyDiagnostics({
        journey,
      })
  
    return generateRecommendations({
      journey,
      timelineAnalysis,
      journeyDiagnostics,
      workflowRules:
        options?.workflowRules ?? [
          createRule(),
        ],
      now: NOW,
    })
  }
  
  describe("generateRecommendations", () => {
    it(
      "deve gerar uma recomendação válida quando uma regra for atendida",
      () => {
        const result = generateResult()
  
        expect(
          result.nextBestActions,
        ).toHaveLength(1)
  
        expect(
          result.nextBestActions[0],
        ).toMatchObject({
          id:
            "journey-1:rule-1:2026-07-21T12:00:00.000Z",
          workspaceId: "workspace-1",
          journeyId: "journey-1",
          actionType: "SEND_MESSAGE",
          title: "Retomar contato",
          description:
            "Envie uma mensagem personalizada.",
          reason:
            "A jornada está sem interação recente.",
          confidence: 0.9,
          priority: "HIGH",
          source: "RULE_ENGINE",
          expiresAt:
            "2026-07-23T12:00:00.000Z",
          acceptedAt: null,
          rejectedAt: null,
          executedActionId: null,
          createdAt:
            "2026-07-21T12:00:00.000Z",
          updatedAt:
            "2026-07-21T12:00:00.000Z",
        })
      },
    )
  
    it(
      "deve registrar a regra aplicada nos diagnósticos",
      () => {
        const result = generateResult()
  
        expect(result.diagnostics).toContain(
          "Regra aplicada: Retomar jornada.",
        )
      },
    )
  
    it(
      "deve registrar o horário da análise nos diagnósticos",
      () => {
        const result = generateResult()
  
        expect(result.diagnostics).toContain(
          "Analise de recomendacoes executada em 2026-07-21T12:00:00.000Z.",
        )
      },
    )
  
    it("deve ignorar regras inativas", () => {
      const result = generateResult({
        workflowRules: [
          createRule({
            isActive: false,
          }),
        ],
      })
  
      expect(
        result.nextBestActions,
      ).toHaveLength(0)
  
      expect(result.warnings).toHaveLength(0)
  
      expect(result.diagnostics).toContain(
        "Nenhuma regra de recomendacao foi acionada.",
      )
    })
  
    it(
      "deve ignorar regras cujas condições não forem atendidas",
      () => {
        const result = generateResult({
          workflowRules: [
            createRule({
              conditions: [
                {
                  field: "score",
                  operator: "GREATER_THAN",
                  value: 90,
                },
              ],
            }),
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(0)
  
        expect(result.diagnostics).toContain(
          "Nenhuma regra de recomendacao foi acionada.",
        )
      },
    )
  
    it(
      "deve ordenar as regras pela maior prioridade",
      () => {
        const lowerPriorityRule = createRule({
          id: "rule-low",
          name: "Regra de prioridade baixa",
          priority: 10,
          actions: [
            {
              type: "TRIGGER_AUTOMATION",
              payload: {
                recommendationType:
                  "SEND_MESSAGE",
                title: "Prioridade baixa",
                description:
                  "Mensagem de prioridade baixa.",
                reason:
                  "Regra de prioridade baixa.",
                confidence: 0.7,
                priority: "HIGH",
              },
            },
          ],
        })
  
        const higherPriorityRule = createRule({
          id: "rule-high",
          name: "Regra de prioridade alta",
          priority: 200,
          actions: [
            {
              type: "TRIGGER_AUTOMATION",
              payload: {
                recommendationType:
                  "SEND_MESSAGE",
                title: "Prioridade alta",
                description:
                  "Mensagem de prioridade alta.",
                reason:
                  "Regra de prioridade alta.",
                confidence: 0.95,
                priority: "HIGH",
              },
            },
          ],
        })
  
        const result = generateResult({
          workflowRules: [
            lowerPriorityRule,
            higherPriorityRule,
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(2)
  
        expect(
          result.nextBestActions.map(
            (recommendation) =>
              recommendation.title,
          ),
        ).toEqual([
          "Prioridade alta",
          "Prioridade baixa",
        ])
      },
    )
  
    it(
      "deve gerar várias recomendações quando várias regras forem atendidas",
      () => {
        const firstRule = createRule({
          id: "rule-first",
          name: "Primeira regra",
          priority: 200,
        })
  
        const secondRule = createRule({
          id: "rule-second",
          name: "Segunda regra",
          priority: 100,
        })
  
        const result = generateResult({
          workflowRules: [
            firstRule,
            secondRule,
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(2)
  
        expect(
          result.nextBestActions[0].id,
        ).toContain("rule-first")
  
        expect(
          result.nextBestActions[1].id,
        ).toContain("rule-second")
      },
    )
  
    it(
      "deve interromper o processamento após uma regra com stopProcessingAfterMatch",
      () => {
        const firstRule = createRule({
          id: "rule-first",
          name: "Primeira regra",
          priority: 200,
          stopProcessingAfterMatch: true,
        })
  
        const secondRule = createRule({
          id: "rule-second",
          name: "Segunda regra",
          priority: 100,
        })
  
        const result = generateResult({
          workflowRules: [
            secondRule,
            firstRule,
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(1)
  
        expect(
          result.nextBestActions[0].id,
        ).toContain("rule-first")
  
        expect(
          result.diagnostics.some(
            (diagnostic) =>
              diagnostic.includes(
                "Segunda regra",
              ),
          ),
        ).toBe(false)
      },
    )
  
    it(
      "deve gerar aviso quando uma regra atendida não produzir recomendação válida",
      () => {
        const result = generateResult({
          workflowRules: [
            createRule({
              name: "Criar tarefa comercial",
              actions: [
                {
                  type: "CREATE_TASK",
                  payload: {
                    title: "Entrar em contato",
                  },
                },
              ],
            }),
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(0)
  
        expect(result.warnings).toEqual([
          "A regra Criar tarefa comercial foi acionada, mas nao gerou uma recomendacao valida.",
        ])
      },
    )
  
    it(
      "deve continuar processando regras após uma regra inválida sem bloqueio",
      () => {
        const invalidRule = createRule({
          id: "rule-invalid",
          name: "Regra inválida",
          priority: 200,
          stopProcessingAfterMatch: false,
          actions: [
            {
              type: "CREATE_TASK",
              payload: {},
            },
          ],
        })
  
        const validRule = createRule({
          id: "rule-valid",
          name: "Regra válida",
          priority: 100,
        })
  
        const result = generateResult({
          workflowRules: [
            validRule,
            invalidRule,
          ],
        })
  
        expect(result.warnings).toHaveLength(1)
  
        expect(
          result.nextBestActions,
        ).toHaveLength(1)
  
        expect(
          result.nextBestActions[0].id,
        ).toContain("rule-valid")
      },
    )
  
    it(
      "deve interromper o processamento mesmo quando a regra atendida não gerar recomendação válida",
      () => {
        const invalidBlockingRule = createRule({
          id: "rule-invalid",
          name: "Regra inválida bloqueadora",
          priority: 200,
          stopProcessingAfterMatch: true,
          actions: [
            {
              type: "CREATE_TASK",
              payload: {},
            },
          ],
        })
  
        const validRule = createRule({
          id: "rule-valid",
          name: "Regra válida",
          priority: 100,
        })
  
        const result = generateResult({
          workflowRules: [
            validRule,
            invalidBlockingRule,
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(0)
  
        expect(result.warnings).toHaveLength(1)
  
        expect(
          result.diagnostics.some(
            (diagnostic) =>
              diagnostic.includes(
                "Regra válida",
              ),
          ),
        ).toBe(false)
      },
    )
  
    it(
      "deve usar os diagnósticos da jornada para montar o contexto das regras",
      () => {
        const result = generateResult({
          journey: {
            outcome: "WON",
            closedAt:
              "2026-07-20T12:00:00.000Z",
          },
          workflowRules: [
            createRule({
              conditions: [
                {
                  field: "isClosed",
                  operator: "EQUALS",
                  value: true,
                },
              ],
            }),
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(1)
      },
    )
  
    it(
      "deve usar a análise da timeline para montar o contexto das regras",
      () => {
        const result = generateResult({
          journey: {
            lastInteractionAt: null,
          },
          workflowRules: [
            createRule({
              conditions: [
                {
                  field:
                    "daysSinceLastInteraction",
                  operator: "NOT_EXISTS",
                },
              ],
            }),
          ],
        })
  
        expect(
          result.nextBestActions,
        ).toHaveLength(1)
      },
    )
  
    it(
      "deve retornar listas vazias quando não houver regras",
      () => {
        const result = generateResult({
          workflowRules: [],
        })
  
        expect(
          result.nextBestActions,
        ).toEqual([])
  
        expect(result.warnings).toEqual([])
  
        expect(result.diagnostics).toEqual([
          "Nenhuma regra de recomendacao foi acionada.",
          "Analise de recomendacoes executada em 2026-07-21T12:00:00.000Z.",
        ])
      },
    )
  })