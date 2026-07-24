import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CommercialJourney,
  } from "@/types/domain"
  
  import type {
    CommercialStrategy,
    StrategyStep,
  } from "../strategy/types"
  
  import {
    runAutomationEngine,
  } from "./engine"
  
  import {
    createAutomationQueue,
  } from "./queue"
  
  import type {
    AutomationJob,
    AutomationQueue,
  } from "./types"
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id:
        "journey-test",
  
      workspaceId:
        "workspace-test",
  
      leadId:
        "lead-test",
  
      clientId:
        null,
  
      consultantId:
        "consultant-test",
  
      title:
        "Jornada comercial de teste",
  
      consortiumType:
        "real_estate",
  
      currentPhaseId:
        "phase-test",
  
      currentStateId:
        "state-test",
  
      priority:
        "HIGH",
  
      score:
        80,
  
      outcome:
        null,
  
      stateEnteredAt:
        "2026-07-20T12:00:00.000Z",
  
      lastInteractionAt:
        "2026-07-21T12:00:00.000Z",
  
      closedAt:
        null,
  
      version:
        1,
  
      createdAt:
        "2026-07-20T12:00:00.000Z",
  
      updatedAt:
        "2026-07-21T12:00:00.000Z",
  
      ...overrides,
    }
  }
  
  function createStep(
    overrides: Partial<StrategyStep> = {},
  ): StrategyStep {
    return {
      id:
        "step-test",
  
      strategyId:
        "strategy-test",
  
      position:
        1,
  
      title:
        "Enviar mensagem",
  
      description:
        "Enviar mensagem personalizada ao lead.",
  
      actionType:
        "SEND_MESSAGE",
  
      channel:
        "WHATSAPP",
  
      status:
        "READY",
  
      priority:
        "HIGH",
  
      waitBeforeMinutes:
        0,
  
      scheduledFor:
        NOW.toISOString(),
  
      startedAt:
        null,
  
      completedAt:
        null,
  
      failedAt:
        null,
  
      failureReason:
        null,
  
      sourceRecommendationId:
        "recommendation-test",
  
      payload: {
        message:
          "Olá, podemos retomar nossa conversa?",
      },
  
      ...overrides,
    }
  }
  
  function createStrategy(
    overrides: Partial<CommercialStrategy> = {},
  ): CommercialStrategy {
    return {
      id:
        "strategy-test",
  
      workspaceId:
        "workspace-test",
  
      journeyId:
        "journey-test",
  
      type:
        "RECOVERY",
  
      status:
        "ACTIVE",
  
      source:
        "RULE_ENGINE",
  
      title:
        "Recuperar oportunidade",
  
      objective:
        "Retomar contato com o lead.",
  
      reason:
        "A jornada está sem interação recente.",
  
      priority:
        "HIGH",
  
      confidence:
        0.9,
  
      steps: [
        createStep(),
      ],
  
      maxAttempts:
        3,
  
      currentAttempt:
        0,
  
      currentStepPosition:
        1,
  
      stopOnResponse:
        true,
  
      stopOnJourneyClosed:
        true,
  
      expiresAt:
        "2026-07-25T15:00:00.000Z",
  
      startedAt:
        NOW.toISOString(),
  
      pausedAt:
        null,
  
      completedAt:
        null,
  
      cancelledAt:
        null,
  
      createdAt:
        NOW.toISOString(),
  
      updatedAt:
        NOW.toISOString(),
  
      ...overrides,
    }
  }
  
  function createJob(
    overrides: Partial<AutomationJob> = {},
  ): AutomationJob {
    return {
      id:
        "existing-job",
  
      workspaceId:
        "workspace-test",
  
      journeyId:
        "journey-test",
  
      strategyId:
        "strategy-existing",
  
      strategyStepId:
        "step-existing",
  
      source:
        "STRATEGY_STEP",
  
      actionType:
        "CREATE_TASK",
  
      channel:
        "INTERNAL",
  
      title:
        "Criar tarefa",
  
      description:
        "Criar tarefa comercial.",
  
      status:
        "READY",
  
      priority:
        "NORMAL",
  
      scheduledFor:
        NOW.toISOString(),
  
      availableAt:
        NOW.toISOString(),
  
      startedAt:
        null,
  
      completedAt:
        null,
  
      failedAt:
        null,
  
      cancelledAt:
        null,
  
      attemptCount:
        0,
  
      maxAttempts:
        3,
  
      lastFailureReason:
        null,
  
      payload: {},
  
      createdActionId:
        null,
  
      createdAt:
        "2026-07-22T14:00:00.000Z",
  
      updatedAt:
        "2026-07-22T14:00:00.000Z",
  
      ...overrides,
    }
  }
  
  function createQueue(
    jobs: AutomationJob[] = [],
  ): AutomationQueue {
    return {
      jobs,
  
      executions: [],
    }
  }
  
  describe(
    "automation engine",
    () => {
      it(
        "deve criar, enfileirar, executar e concluir uma estratégia de um passo",
        () => {
          const result =
            runAutomationEngine({
              strategy:
                createStrategy(),
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
            })
  
          expect(
            result.scheduledJobs,
          ).toHaveLength(1)
  
          expect(
            result.processedJobs,
          ).toHaveLength(1)
  
          expect(
            result.createdActions,
          ).toHaveLength(1)
  
          expect(
            result.executions,
          ).toHaveLength(1)
  
          expect(
            result.processedJobs[0]
              ?.status,
          ).toBe(
            "COMPLETED",
          )
  
          expect(
            result.executions[0]
              ?.status,
          ).toBe(
            "SUCCEEDED",
          )
  
          expect(
            result.createdActions[0]
              ?.type,
          ).toBe(
            "SEND_MESSAGE",
          )
  
          expect(
            result.queue.jobs[0]
              ?.status,
          ).toBe(
            "COMPLETED",
          )
  
          expect(
            result.queue.executions,
          ).toHaveLength(1)
  
          expect(
            result.strategy?.status,
          ).toBe(
            "COMPLETED",
          )
  
          expect(
            result.strategy
              ?.currentStepPosition,
          ).toBeNull()
  
          expect(
            result.strategy
              ?.steps[0]
              ?.status,
          ).toBe(
            "COMPLETED",
          )
        },
      )
  
      it(
        "deve criar os trabalhos sequencialmente conforme a Cadence avança",
        () => {
          const strategy =
            createStrategy({
              currentStepPosition:
                null,
  
              steps: [
                createStep({
                  id:
                    "step-1",
  
                  position:
                    1,
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-2",
  
                  position:
                    2,
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-3",
  
                  position:
                    3,
  
                  status:
                    "PENDING",
                }),
              ],
            })
  
          const result =
            runAutomationEngine({
              strategy,
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
  
              executionLimit:
                2,
            })
  
          expect(
            result.scheduledJobs.map(
              (job) =>
                job.strategyStepId,
            ),
          ).toEqual([
            "step-1",
            "step-2",
            "step-3",
          ])
  
          expect(
            result.processedJobs.map(
              (job) =>
                job.strategyStepId,
            ),
          ).toEqual([
            "step-1",
            "step-2",
          ])
  
          expect(
            result.queue.jobs.find(
              (job) =>
                job.strategyStepId ===
                "step-3",
            )?.status,
          ).toBe(
            "READY",
          )
  
          expect(
            result.strategy
              ?.currentStepPosition,
          ).toBe(3)
  
          expect(
            result.strategy
              ?.status,
          ).toBe(
            "ACTIVE",
          )
        },
      )
  
      it(
        "deve concluir todos os passos imediatos quando não houver limite",
        () => {
          const strategy =
            createStrategy({
              currentStepPosition:
                null,
  
              steps: [
                createStep({
                  id:
                    "step-1",
  
                  position:
                    1,
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-2",
  
                  position:
                    2,
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-3",
  
                  position:
                    3,
  
                  status:
                    "PENDING",
                }),
              ],
            })
  
          const result =
            runAutomationEngine({
              strategy,
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
            })
  
          expect(
            result.scheduledJobs,
          ).toHaveLength(3)
  
          expect(
            result.processedJobs,
          ).toHaveLength(3)
  
          expect(
            result.strategy?.status,
          ).toBe(
            "COMPLETED",
          )
  
          expect(
            result.strategy?.steps.every(
              (step) =>
                step.status ===
                "COMPLETED",
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve processar trabalhos existentes mesmo sem uma nova estratégia",
        () => {
          const result =
            runAutomationEngine({
              strategy:
                null,
  
              journey:
                createJourney(),
  
              queue:
                createQueue([
                  createJob(),
                ]),
  
              now:
                NOW,
            })
  
          expect(
            result.strategy,
          ).toBeNull()
  
          expect(
            result.scheduledJobs,
          ).toEqual([])
  
          expect(
            result.processedJobs,
          ).toHaveLength(1)
  
          expect(
            result.createdActions,
          ).toHaveLength(1)
  
          expect(
            result.executions,
          ).toHaveLength(1)
  
          expect(
            result.diagnostics,
          ).toContain(
            'Nenhuma estratégia foi informada para a jornada "journey-test".',
          )
        },
      )
  
      it(
        "não deve duplicar um trabalho já existente na fila",
        () => {
          const strategy =
            createStrategy()
  
          const existingJob =
            createJob({
              id:
                "strategy-test:automation-job:step-test",
  
              strategyId:
                strategy.id,
  
              strategyStepId:
                "step-test",
            })
  
          const result =
            runAutomationEngine({
              strategy,
  
              journey:
                createJourney(),
  
              queue:
                createQueue([
                  existingJob,
                ]),
  
              now:
                NOW,
            })
  
          expect(
            result.queue.jobs,
          ).toHaveLength(1)
  
          expect(
            result.processedJobs,
          ).toHaveLength(1)
  
          expect(
            result.warnings,
          ).toContain(
            'O trabalho de automação "strategy-test:automation-job:step-test" já existe na fila e foi ignorado.',
          )
        },
      )
  
      it(
        "deve respeitar o limite de execução",
        () => {
          const strategy =
            createStrategy({
              currentStepPosition:
                null,
  
              steps: [
                createStep({
                  id:
                    "step-1",
  
                  position:
                    1,
  
                  priority:
                    "URGENT",
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-2",
  
                  position:
                    2,
  
                  priority:
                    "HIGH",
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-3",
  
                  position:
                    3,
  
                  priority:
                    "NORMAL",
  
                  status:
                    "PENDING",
                }),
              ],
            })
  
          const result =
            runAutomationEngine({
              strategy,
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
  
              executionLimit:
                2,
            })
  
          expect(
            result.scheduledJobs,
          ).toHaveLength(3)
  
          expect(
            result.processedJobs,
          ).toHaveLength(2)
  
          expect(
            result.createdActions,
          ).toHaveLength(2)
  
          expect(
            result.queue.jobs.filter(
              (job) =>
                job.status ===
                "READY",
            ),
          ).toHaveLength(1)
  
          expect(
            result.diagnostics,
          ).toContain(
            "1 trabalhos prontos permaneceram na fila devido ao limite de execução.",
          )
        },
      )
  
      it(
        "deve respeitar a posição dos passos em vez de executar toda a estratégia por prioridade",
        () => {
          const strategy =
            createStrategy({
              currentStepPosition:
                null,
  
              steps: [
                createStep({
                  id:
                    "step-low",
  
                  position:
                    1,
  
                  priority:
                    "LOW",
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-urgent",
  
                  position:
                    2,
  
                  priority:
                    "URGENT",
  
                  status:
                    "PENDING",
                }),
  
                createStep({
                  id:
                    "step-high",
  
                  position:
                    3,
  
                  priority:
                    "HIGH",
  
                  status:
                    "PENDING",
                }),
              ],
            })
  
          const result =
            runAutomationEngine({
              strategy,
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
  
              executionLimit:
                2,
            })
  
          expect(
            result.processedJobs.map(
              (job) =>
                job.strategyStepId,
            ),
          ).toEqual([
            "step-low",
            "step-urgent",
          ])
        },
      )
  
      it(
        "não deve executar um passo agendado para o futuro",
        () => {
          const strategy =
            createStrategy({
              currentStepPosition:
                null,
  
              steps: [
                createStep({
                  status:
                    "PENDING",
  
                  scheduledFor:
                    "2026-07-23T15:00:00.000Z",
                }),
              ],
            })
  
          const result =
            runAutomationEngine({
              strategy,
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
            })
  
          expect(
            result.scheduledJobs,
          ).toHaveLength(1)
  
          expect(
            result.processedJobs,
          ).toEqual([])
  
          expect(
            result.createdActions,
          ).toEqual([])
  
          expect(
            result.queue.jobs[0]
              ?.status,
          ).toBe(
            "PENDING",
          )
  
          expect(
            result.strategy
              ?.currentStepPosition,
          ).toBe(1)
  
          expect(
            result.strategy?.status,
          ).toBe(
            "ACTIVE",
          )
        },
      )
  
      it(
        "deve executar somente trabalhos pertencentes à jornada informada",
        () => {
          const queue =
            createQueue([
              createJob({
                id:
                  "job-current",
  
                journeyId:
                  "journey-test",
  
                priority:
                  "NORMAL",
              }),
  
              createJob({
                id:
                  "job-other",
  
                journeyId:
                  "journey-other",
  
                priority:
                  "URGENT",
              }),
            ])
  
          const result =
            runAutomationEngine({
              strategy:
                null,
  
              journey:
                createJourney(),
  
              queue,
  
              now:
                NOW,
            })
  
          expect(
            result.processedJobs,
          ).toHaveLength(1)
  
          expect(
            result.processedJobs[0]
              ?.id,
          ).toBe(
            "job-current",
          )
  
          expect(
            result.queue.jobs.find(
              (job) =>
                job.id ===
                "job-other",
            )?.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve cancelar a execução quando a jornada estiver encerrada",
        () => {
          const result =
            runAutomationEngine({
              strategy:
                null,
  
              journey:
                createJourney({
                  outcome:
                    "NO_RESPONSE",
  
                  closedAt:
                    "2026-07-22T14:00:00.000Z",
                }),
  
              queue:
                createQueue([
                  createJob(),
                ]),
  
              now:
                NOW,
            })
  
          expect(
            result.processedJobs,
          ).toHaveLength(1)
  
          expect(
            result.processedJobs[0]
              ?.status,
          ).toBe(
            "CANCELLED",
          )
  
          expect(
            result.createdActions,
          ).toEqual([])
  
          expect(
            result.executions[0]
              ?.status,
          ).toBe(
            "CANCELLED",
          )
        },
      )
  
      it(
        "deve preservar execuções já existentes na fila",
        () => {
          const queue =
            createAutomationQueue()
  
          queue.executions.push({
            id:
              "execution-existing",
  
            automationJobId:
              "job-existing",
  
            workspaceId:
              "workspace-test",
  
            journeyId:
              "journey-test",
  
            attempt:
              1,
  
            status:
              "SUCCEEDED",
  
            startedAt:
              "2026-07-21T15:00:00.000Z",
  
            finishedAt:
              "2026-07-21T15:00:00.000Z",
  
            failureReason:
              null,
  
            createdActionId:
              "action-existing",
  
            output: {},
          })
  
          queue.jobs.push(
            createJob(),
          )
  
          const result =
            runAutomationEngine({
              strategy:
                null,
  
              journey:
                createJourney(),
  
              queue,
  
              now:
                NOW,
            })
  
          expect(
            result.queue.executions,
          ).toHaveLength(2)
  
          expect(
            result.queue
              .executions[0]
              ?.id,
          ).toBe(
            "execution-existing",
          )
        },
      )
  
      it(
        "deve rejeitar limite de execução inválido",
        () => {
          expect(() =>
            runAutomationEngine({
              strategy:
                null,
  
              journey:
                createJourney(),
  
              queue:
                createAutomationQueue(),
  
              now:
                NOW,
  
              executionLimit:
                0,
            }),
          ).toThrow(
            "O limite de execução da automação deve ser um número inteiro maior que zero.",
          )
        },
      )
    },
  )