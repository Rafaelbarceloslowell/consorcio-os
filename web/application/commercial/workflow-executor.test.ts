import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  
  import type {
    CommercialDomain,
    CommercialEvent,
    CommercialJourney,
    WorkflowRule,
  } from "@/types/domain"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    executeWorkflow,
  } from "./workflow-executor"
  
  type RepositoryData = Pick<
    CommercialDomain,
    | "commercialJourneys"
    | "journeyPhases"
    | "journeyStates"
    | "commercialEvents"
    | "commercialActions"
    | "nextBestActions"
    | "workflowRules"
  >
  
  describe(
    "executeWorkflow",
    () => {
      function createRepository(
        overrides: Partial<RepositoryData> = {},
      ): MockCommercialRepository {
        return new MockCommercialRepository({
          ...mockCommercialData,
          ...overrides,
        })
      }
  
      function createJourney(
        overrides: Partial<CommercialJourney> = {},
      ): CommercialJourney {
        return {
          ...mockCommercialData
            .commercialJourneys[0],
  
          id:
            "workflow-test-journey",
  
          currentPhaseId:
            "journey-phase-3",
  
          currentStateId:
            "journey-state-8",
  
          priority:
            "NORMAL",
  
          score:
            85,
  
          version:
            1,
  
          ...overrides,
        }
      }
  
      function createEvent(
        journey: CommercialJourney,
        overrides: Partial<CommercialEvent> = {},
      ): CommercialEvent {
        return {
          id:
            "workflow-test-event",
  
          workspaceId:
            journey.workspaceId,
  
          journeyId:
            journey.id,
  
          type:
            "PROPOSAL_SENT",
  
          actorType:
            "CONSULTANT",
  
          actorId:
            journey.consultantId,
  
          payload: {
            targetStateId:
              journey.currentStateId,
          },
  
          occurredAt:
            "2026-07-22T14:00:00.000Z",
  
          createdAt:
            "2026-07-22T14:00:00.000Z",
  
          updatedAt:
            "2026-07-22T14:00:00.000Z",
  
          ...overrides,
        }
      }
  
      function createRule(
        journey: CommercialJourney,
        overrides: Partial<WorkflowRule> = {},
      ): WorkflowRule {
        return {
          id:
            "workflow-test-rule",
  
          workspaceId:
            journey.workspaceId,
  
          name:
            "Regra de teste",
  
          description:
            "Regra utilizada nos testes do executor.",
  
          eventType:
            "PROPOSAL_SENT",
  
          sourceStateId:
            journey.currentStateId,
  
          conditions: [],
  
          actions: [
            {
              type:
                "CREATE_TASK",
  
              payload: {
                title:
                  "Realizar follow-up",
              },
            },
          ],
  
          priority:
            100,
  
          stopProcessingAfterMatch:
            false,
  
          isActive:
            true,
  
          createdAt:
            "2026-07-22T10:00:00.000Z",
  
          updatedAt:
            "2026-07-22T10:00:00.000Z",
  
          ...overrides,
        }
      }
  
      it(
        "deve criar ações para uma regra compatível",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const rule =
            createRule(journey)
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                now: new Date(
                  "2026-07-22T15:00:00.000Z",
                ),
  
                generateActionId: () =>
                  "workflow-action-1",
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(1)
  
          expect(
            result.createdActions,
          ).toHaveLength(1)
  
          expect(
            result.createdActions[0],
          ).toEqual({
            id:
              "workflow-action-1",
  
            workspaceId:
              journey.workspaceId,
  
            journeyId:
              journey.id,
  
            type:
              "CREATE_TASK",
  
            status:
              "PENDING",
  
            origin:
              "WORKFLOW_RULE",
  
            actorType:
              "AUTOMATION",
  
            actorId:
              null,
  
            title:
              "Realizar follow-up",
  
            description:
              `Ação criada pela regra de workflow "${rule.name}".`,
  
            payload: {
              title:
                "Realizar follow-up",
  
              workflowRuleId:
                rule.id,
  
              sourceEventId:
                event.id,
            },
  
            scheduledFor:
              null,
  
            startedAt:
              null,
  
            completedAt:
              null,
  
            failedAt:
              null,
  
            failureReason:
              null,
  
            createdBy:
              null,
  
            createdAt:
              "2026-07-22T15:00:00.000Z",
  
            updatedAt:
              "2026-07-22T15:00:00.000Z",
          })
        },
      )
  
      it(
        "deve persistir as ações criadas no repositório",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const rule =
            createRule(journey)
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "workflow-action-2",
              },
            )
  
          expect(
            repository
              .getActionsByJourneyId(
                journey.id,
              ),
          ).toEqual(
            result.createdActions,
          )
        },
      )
  
      it(
        "deve criar todas as ações configuradas pela regra",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const rule =
            createRule(
              journey,
              {
                actions: [
                  {
                    type:
                      "CHANGE_STATE",
  
                    payload: {
                      targetStateId:
                        "journey-state-9",
                    },
                  },
                  {
                    type:
                      "UPDATE_PRIORITY",
  
                    payload: {
                      priority:
                        "HIGH",
                    },
                  },
                  {
                    type:
                      "SEND_NOTIFICATION",
  
                    payload: {
                      message:
                        "Oportunidade atualizada.",
                    },
                  },
                ],
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          let generatedId = 0
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () => {
                  generatedId += 1
  
                  return `workflow-action-${generatedId}`
                },
              },
            )
  
          expect(
            result.createdActions,
          ).toHaveLength(3)
  
          expect(
            result.createdActions.map(
              (action) =>
                action.type,
            ),
          ).toEqual([
            "CHANGE_STATE",
            "UPDATE_PRIORITY",
            "SEND_NOTIFICATION",
          ])
        },
      )
  
      it(
        "deve ignorar regras inativas",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const inactiveRule =
            createRule(
              journey,
              {
                isActive:
                  false,
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                inactiveRule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
              },
            )
  
          expect(
            result.matchedRules,
          ).toEqual([])
  
          expect(
            result.createdActions,
          ).toEqual([])
        },
      )
  
      it(
        "deve ignorar regras de outro tipo de evento",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const rule =
            createRule(
              journey,
              {
                eventType:
                  "MEETING_COMPLETED",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(0)
  
          expect(
            result.createdActions,
          ).toHaveLength(0)
        },
      )
  
      it(
        "deve aceitar regras globais com workspaceId nulo",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const globalRule =
            createRule(
              journey,
              {
                workspaceId:
                  null,
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                globalRule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "global-workflow-action",
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(1)
  
          expect(
            result.createdActions,
          ).toHaveLength(1)
        },
      )
  
      it(
        "deve ignorar regras pertencentes a outro workspace",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const foreignRule =
            createRule(
              journey,
              {
                workspaceId:
                  "another-workspace",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                foreignRule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(0)
        },
      )
  
      it(
        "deve validar o estado de origem da regra",
        () => {
          const journey =
            createJourney({
              currentStateId:
                "journey-state-8",
            })
  
          const event =
            createEvent(journey)
  
          const rule =
            createRule(
              journey,
              {
                sourceStateId:
                  "journey-state-7",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(0)
        },
      )
  
      it(
        "deve validar o estado de destino usando o payload do evento",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(
              journey,
              {
                type:
                  "STATE_CHANGED",
  
                payload: {
                  previousStateId:
                    "journey-state-7",
  
                  targetStateId:
                    "journey-state-8",
                },
              },
            )
  
          const matchingRule =
            createRule(
              journey,
              {
                eventType:
                  "STATE_CHANGED",
  
                targetStateId:
                  "journey-state-8",
              },
            )
  
          const nonMatchingRule =
            createRule(
              journey,
              {
                id:
                  "non-matching-target-rule",
  
                eventType:
                  "STATE_CHANGED",
  
                targetStateId:
                  "journey-state-9",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                matchingRule,
                nonMatchingRule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "target-state-action",
              },
            )
  
          expect(
            result.matchedRules.map(
              (execution) =>
                execution.rule.id,
            ),
          ).toEqual([
            matchingRule.id,
          ])
        },
      )
  
      it(
        "deve avaliar condições numéricas",
        () => {
          const journey =
            createJourney({
              score:
                85,
            })
  
          const event =
            createEvent(
              journey,
              {
                type:
                  "STATE_CHANGED",
              },
            )
  
          const matchingRule =
            createRule(
              journey,
              {
                id:
                  "high-score-rule",
  
                eventType:
                  "STATE_CHANGED",
  
                conditions: [
                  {
                    field:
                      "journey.score",
  
                    operator:
                      "GREATER_THAN_OR_EQUAL",
  
                    value:
                      80,
                  },
                ],
              },
            )
  
          const nonMatchingRule =
            createRule(
              journey,
              {
                id:
                  "impossible-score-rule",
  
                eventType:
                  "STATE_CHANGED",
  
                conditions: [
                  {
                    field:
                      "journey.score",
  
                    operator:
                      "GREATER_THAN",
  
                    value:
                      100,
                  },
                ],
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                matchingRule,
                nonMatchingRule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "score-rule-action",
              },
            )
  
          expect(
            result.matchedRules.map(
              (execution) =>
                execution.rule.id,
            ),
          ).toEqual([
            matchingRule.id,
          ])
        },
      )
  
      it(
        "deve avaliar condições em valores do payload do evento",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(
              journey,
              {
                payload: {
                  channel:
                    "whatsapp",
  
                  amount:
                    500000,
                },
              },
            )
  
          const rule =
            createRule(
              journey,
              {
                conditions: [
                  {
                    field:
                      "event.payload.channel",
  
                    operator:
                      "EQUALS",
  
                    value:
                      "whatsapp",
                  },
                  {
                    field:
                      "event.payload.amount",
  
                    operator:
                      "GREATER_THAN_OR_EQUAL",
  
                    value:
                      300000,
                  },
                ],
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "payload-condition-action",
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(1)
        },
      )
  
      it(
        "deve avaliar EQUALS, NOT_EQUALS, IN, NOT_IN, EXISTS e NOT_EXISTS",
        () => {
          const journey =
            createJourney({
              priority:
                "HIGH",
            })
  
          const event =
            createEvent(
              journey,
              {
                payload: {
                  channel:
                    "whatsapp",
  
                  optionalValue:
                    null,
                },
              },
            )
  
          const rule =
            createRule(
              journey,
              {
                conditions: [
                  {
                    field:
                      "journey.priority",
  
                    operator:
                      "EQUALS",
  
                    value:
                      "HIGH",
                  },
                  {
                    field:
                      "journey.priority",
  
                    operator:
                      "NOT_EQUALS",
  
                    value:
                      "LOW",
                  },
                  {
                    field:
                      "event.payload.channel",
  
                    operator:
                      "IN",
  
                    value: [
                      "whatsapp",
                      "instagram",
                    ],
                  },
                  {
                    field:
                      "event.payload.channel",
  
                    operator:
                      "NOT_IN",
  
                    value: [
                      "email",
                      "sms",
                    ],
                  },
                  {
                    field:
                      "journey.consultantId",
  
                    operator:
                      "EXISTS",
                  },
                  {
                    field:
                      "event.payload.missingValue",
  
                    operator:
                      "NOT_EXISTS",
                  },
                ],
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "operators-action",
              },
            )
  
          expect(
            result.matchedRules,
          ).toHaveLength(1)
        },
      )
  
      it(
        "deve processar regras em ordem decrescente de prioridade",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const lowPriorityRule =
            createRule(
              journey,
              {
                id:
                  "low-priority-rule",
  
                priority:
                  10,
              },
            )
  
          const highPriorityRule =
            createRule(
              journey,
              {
                id:
                  "high-priority-rule",
  
                priority:
                  100,
              },
            )
  
          const mediumPriorityRule =
            createRule(
              journey,
              {
                id:
                  "medium-priority-rule",
  
                priority:
                  50,
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                lowPriorityRule,
                highPriorityRule,
                mediumPriorityRule,
              ],
  
              commercialActions: [],
            })
  
          let generatedId = 0
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () => {
                  generatedId += 1
  
                  return `priority-action-${generatedId}`
                },
              },
            )
  
          expect(
            result.matchedRules.map(
              (execution) =>
                execution.rule.id,
            ),
          ).toEqual([
            highPriorityRule.id,
            mediumPriorityRule.id,
            lowPriorityRule.id,
          ])
        },
      )
  
      it(
        "deve interromper o processamento quando uma regra compatível solicitar",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const stoppingRule =
            createRule(
              journey,
              {
                id:
                  "stopping-rule",
  
                priority:
                  100,
  
                stopProcessingAfterMatch:
                  true,
              },
            )
  
          const nextRule =
            createRule(
              journey,
              {
                id:
                  "next-rule",
  
                priority:
                  50,
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                nextRule,
                stoppingRule,
              ],
  
              commercialActions: [],
            })
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () =>
                  "stopping-rule-action",
              },
            )
  
          expect(
            result.matchedRules.map(
              (execution) =>
                execution.rule.id,
            ),
          ).toEqual([
            stoppingRule.id,
          ])
  
          expect(
            result.createdActions,
          ).toHaveLength(1)
        },
      )
  
      it(
        "deve rejeitar evento pertencente a outro workspace",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(
              journey,
              {
                workspaceId:
                  "another-workspace",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [],
            })
  
          expect(() =>
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
              },
            ),
          ).toThrow(
            `O evento comercial "${event.id}" pertence a outro workspace.`,
          )
        },
      )
  
      it(
        "deve rejeitar evento vinculado a uma jornada inexistente",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(
              journey,
              {
                journeyId:
                  "missing-journey",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [],
              workflowRules: [],
            })
  
          expect(() =>
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
              },
            ),
          ).toThrow(
            `Jornada comercial não encontrada para o ID "${event.journeyId}".`,
          )
        },
      )
  
      it(
        "deve utilizar títulos padrão quando a ação não possuir título",
        () => {
          const journey =
            createJourney()
  
          const event =
            createEvent(journey)
  
          const rule =
            createRule(
              journey,
              {
                actions: [
                  {
                    type:
                      "CHANGE_STATE",
  
                    payload: {
                      targetStateId:
                        "journey-state-9",
                    },
                  },
                  {
                    type:
                      "UPDATE_SCORE",
  
                    payload: {
                      score:
                        90,
                    },
                  },
                  {
                    type:
                      "ASSIGN_CONSULTANT",
  
                    payload: {
                      consultantId:
                        "consultant-2",
                    },
                  },
                ],
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              workflowRules: [
                rule,
              ],
  
              commercialActions: [],
            })
  
          let generatedId = 0
  
          const result =
            executeWorkflow(
              {
                workspaceId:
                  journey.workspaceId,
  
                event,
              },
              {
                commercialRepository:
                  repository,
  
                generateActionId: () => {
                  generatedId += 1
  
                  return `title-action-${generatedId}`
                },
              },
            )
  
          expect(
            result.createdActions.map(
              (action) =>
                action.title,
            ),
          ).toEqual([
            "Alterar estado da jornada",
            "Atualizar score da jornada",
            "Atribuir consultor à jornada",
          ])
        },
      )
    },
  )