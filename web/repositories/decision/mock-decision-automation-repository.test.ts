import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    AutomationExecution,
    AutomationJob,
  } from "@/engine/decision/automation"
  
  import type {
    CommercialStrategy,
  } from "@/engine/decision/strategy/types"
  
  import {
    MockDecisionAutomationRepository,
  } from "./mock-decision-automation-repository"
  
  const NOW =
    "2026-07-22T18:00:00.000Z"
  
  function createStrategy(
    overrides:
      Partial<CommercialStrategy> = {},
  ): CommercialStrategy {
    return {
      id: "strategy-1",
      workspaceId: "workspace-1",
      journeyId: "journey-1",
      type: "INITIAL_CONTACT",
      status: "PLANNED",
      source: "RULE_ENGINE",
      title: "Realizar contato inicial",
      objective:
        "Iniciar o atendimento comercial.",
      reason:
        "A jornada ainda não possui interação.",
      priority: "HIGH",
      confidence: 90,
      steps: [],
      maxAttempts: 3,
      currentAttempt: 0,
      currentStepPosition: null,
      stopOnResponse: true,
      stopOnJourneyClosed: true,
      expiresAt: null,
      startedAt: null,
      pausedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    }
  }
  
  function createAutomationJob(
    overrides:
      Partial<AutomationJob> = {},
  ): AutomationJob {
    return {
      id: "automation-job-1",
      workspaceId: "workspace-1",
      journeyId: "journey-1",
      strategyId: "strategy-1",
      strategyStepId: "strategy-step-1",
      source: "STRATEGY_STEP",
      actionType: "SEND_MESSAGE",
      channel: "WHATSAPP",
      title: "Enviar mensagem inicial",
      status: "PENDING",
      priority: "HIGH",
      scheduledFor: NOW,
      availableAt: NOW,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      cancelledAt: null,
      attemptCount: 0,
      maxAttempts: 3,
      lastFailureReason: null,
      payload: {},
      createdActionId: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    }
  }
  
  function createAutomationExecution(
    overrides:
      Partial<AutomationExecution> = {},
  ): AutomationExecution {
    return {
      id: "automation-execution-1",
      automationJobId:
        "automation-job-1",
      workspaceId: "workspace-1",
      journeyId: "journey-1",
      attempt: 1,
      status: "SUCCEEDED",
      startedAt: NOW,
      finishedAt: NOW,
      failureReason: null,
      createdActionId:
        "commercial-action-1",
      output: {},
      ...overrides,
    }
  }
  
  describe(
    "MockDecisionAutomationRepository",
    () => {
      it(
        "deve iniciar sem dados",
        () => {
          const repository =
            new MockDecisionAutomationRepository()
  
          expect(
            repository
              .getStrategiesByJourneyId(
                "journey-1",
              ),
          ).toEqual([])
  
          expect(
            repository
              .getAutomationQueueByJourneyId(
                "journey-1",
              ),
          ).toEqual({
            jobs: [],
            executions: [],
          })
        },
      )
  
      it(
        "deve criar e consultar uma estratégia",
        () => {
          const repository =
            new MockDecisionAutomationRepository()
  
          const strategy =
            createStrategy()
  
          repository.createStrategy(
            strategy,
          )
  
          expect(
            repository.getStrategyById(
              strategy.id,
            ),
          ).toEqual(
            strategy,
          )
  
          expect(
            repository
              .getActiveStrategyByJourneyId(
                strategy.journeyId,
              ),
          ).toEqual(
            strategy,
          )
        },
      )
  
      it(
        "deve rejeitar uma estratégia duplicada",
        () => {
          const strategy =
            createStrategy()
  
          const repository =
            new MockDecisionAutomationRepository({
              strategies: [
                strategy,
              ],
            })
  
          expect(() =>
            repository.createStrategy({
              ...strategy,
            }),
          ).toThrow(
            `Já existe uma estratégia comercial com o ID "${strategy.id}".`,
          )
        },
      )
  
      it(
        "deve impedir duas estratégias ativas na mesma jornada",
        () => {
          const currentStrategy =
            createStrategy()
  
          const repository =
            new MockDecisionAutomationRepository({
              strategies: [
                currentStrategy,
              ],
            })
  
          expect(() =>
            repository.createStrategy(
              createStrategy({
                id: "strategy-2",
              }),
            ),
          ).toThrow(
            `A jornada comercial "${currentStrategy.journeyId}" já possui a estratégia ativa "${currentStrategy.id}".`,
          )
        },
      )
  
      it(
        "deve permitir uma nova estratégia quando a anterior estiver concluída",
        () => {
          const completedStrategy =
            createStrategy({
              status: "COMPLETED",
              completedAt: NOW,
            })
  
          const repository =
            new MockDecisionAutomationRepository({
              strategies: [
                completedStrategy,
              ],
            })
  
          const newStrategy =
            createStrategy({
              id: "strategy-2",
            })
  
          expect(
            repository.createStrategy(
              newStrategy,
            ),
          ).toEqual(
            newStrategy,
          )
        },
      )
  
      it(
        "deve criar e atualizar um trabalho de automação",
        () => {
          const strategy =
            createStrategy()
  
          const automationJob =
            createAutomationJob()
  
          const repository =
            new MockDecisionAutomationRepository({
              strategies: [
                strategy,
              ],
            })
  
          repository.createAutomationJob(
            automationJob,
          )
  
          const updatedAutomationJob = {
            ...automationJob,
            status: "READY" as const,
            updatedAt:
              "2026-07-22T18:05:00.000Z",
          }
  
          repository.updateAutomationJob(
            updatedAutomationJob,
          )
  
          expect(
            repository.getAutomationJobById(
              automationJob.id,
            ),
          ).toEqual(
            updatedAutomationJob,
          )
        },
      )
  
      it(
        "deve rejeitar um trabalho ligado a uma estratégia de outra jornada",
        () => {
          const strategy =
            createStrategy()
  
          const repository =
            new MockDecisionAutomationRepository({
              strategies: [
                strategy,
              ],
            })
  
          const invalidAutomationJob =
            createAutomationJob({
              journeyId:
                "journey-2",
            })
  
          expect(() =>
            repository.createAutomationJob(
              invalidAutomationJob,
            ),
          ).toThrow(
            `O trabalho de automação "${invalidAutomationJob.id}" não pertence à mesma jornada da estratégia "${strategy.id}".`,
          )
        },
      )
  
      it(
        "deve criar uma execução ligada a um trabalho existente",
        () => {
          const strategy =
            createStrategy()
  
          const automationJob =
            createAutomationJob()
  
          const automationExecution =
            createAutomationExecution()
  
          const repository =
            new MockDecisionAutomationRepository({
              strategies: [
                strategy,
              ],
              automationJobs: [
                automationJob,
              ],
            })
  
          expect(
            repository
              .createAutomationExecution(
                automationExecution,
              ),
          ).toEqual(
            automationExecution,
          )
  
          expect(
            repository
              .getAutomationExecutionsByJourneyId(
                automationExecution.journeyId,
              ),
          ).toEqual([
            automationExecution,
          ])
        },
      )
  
      it(
        "deve reconstruir a fila de uma jornada",
        () => {
          const automationJob =
            createAutomationJob()
  
          const automationExecution =
            createAutomationExecution()
  
          const otherJourneyJob =
            createAutomationJob({
              id: "automation-job-2",
              journeyId:
                "journey-2",
              strategyId: null,
              strategyStepId: null,
            })
  
          const repository =
            new MockDecisionAutomationRepository({
              automationJobs: [
                automationJob,
                otherJourneyJob,
              ],
              automationExecutions: [
                automationExecution,
              ],
            })
  
          expect(
            repository
              .getAutomationQueueByJourneyId(
                "journey-1",
              ),
          ).toEqual({
            jobs: [
              automationJob,
            ],
            executions: [
              automationExecution,
            ],
          })
        },
      )
  
      it(
        "deve salvar estratégia, fila e execuções em uma única operação",
        () => {
          const repository =
            new MockDecisionAutomationRepository()
  
          const strategy =
            createStrategy()
  
          const automationJob =
            createAutomationJob()
  
          const automationExecution =
            createAutomationExecution()
  
          const result =
            repository
              .saveDecisionAutomationState({
                strategy,
                queue: {
                  jobs: [
                    automationJob,
                  ],
                  executions: [
                    automationExecution,
                  ],
                },
              })
  
          expect(result).toEqual({
            strategy,
            queue: {
              jobs: [
                automationJob,
              ],
              executions: [
                automationExecution,
              ],
            },
          })
  
          expect(
            repository.getStrategyById(
              strategy.id,
            ),
          ).toEqual(
            strategy,
          )
  
          expect(
            repository
              .getAutomationQueueByJourneyId(
                strategy.journeyId,
              ),
          ).toEqual({
            jobs: [
              automationJob,
            ],
            executions: [
              automationExecution,
            ],
          })
        },
      )
  
      it(
        "deve rejeitar um estado contendo dados de jornadas diferentes",
        () => {
          const repository =
            new MockDecisionAutomationRepository()
  
          const strategy =
            createStrategy()
  
          const automationJob =
            createAutomationJob({
              journeyId:
                "journey-2",
            })
  
          expect(() =>
            repository
              .saveDecisionAutomationState({
                strategy,
                queue: {
                  jobs: [
                    automationJob,
                  ],
                  executions: [],
                },
              }),
          ).toThrow(
            `O trabalho de automação "${automationJob.id}" pertence a outra jornada.`,
          )
  
          expect(
            repository
              .getStrategiesByJourneyId(
                strategy.journeyId,
              ),
          ).toEqual([])
        },
      )
    },
  )