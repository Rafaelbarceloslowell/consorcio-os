import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import {
    runAutomationEngine,
  } from "@/engine/decision/automation"
  
  import type {
    AutomationEngineOutput,
    AutomationExecution,
    AutomationJob,
  } from "@/engine/decision/automation"
  
  import type {
    CommercialStrategy,
  } from "@/engine/decision/strategy/types"
  
  import {
    mockCommercialData,
  } from "@/data/mock-commercial"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    MockDecisionAutomationRepository,
  } from "@/repositories/decision/mock-decision-automation-repository"
  
  import type {
    CommercialAction,
    CommercialJourney,
  } from "@/types/domain"
  
  import {
    runApplicationDecisionEngine,
  } from "./run-decision-engine"
  
  import {
    runDecisionAutomationPipeline,
  } from "./run-decision-automation-pipeline"
  
  vi.mock(
    "./run-decision-engine",
    () => ({
      runApplicationDecisionEngine:
        vi.fn(),
    }),
  )
  
  vi.mock(
    "@/engine/decision/automation",
    async () => {
      const actual =
        await vi.importActual<
          typeof import(
            "@/engine/decision/automation"
          )
        >(
          "@/engine/decision/automation",
        )
  
      return {
        ...actual,
  
        runAutomationEngine:
          vi.fn(),
      }
    },
  )
  
  const NOW =
    new Date(
      "2026-07-22T18:30:00.000Z",
    )
  
  const mockedRunApplicationDecisionEngine =
    vi.mocked(
      runApplicationDecisionEngine,
    )
  
  const mockedRunAutomationEngine =
    vi.mocked(
      runAutomationEngine,
    )
  
  function getJourney():
    CommercialJourney {
    const journey =
      mockCommercialData
        .commercialJourneys
        .find(
          (
            currentJourney,
          ) =>
            currentJourney.id ===
            "journey-1",
        )
  
    if (!journey) {
      throw new Error(
        "A jornada de teste não foi encontrada.",
      )
    }
  
    return journey
  }
  
  function createStrategy(
    overrides:
      Partial<CommercialStrategy> = {},
  ): CommercialStrategy {
    return {
      id:
        "pipeline-strategy-1",
  
      workspaceId:
        "workspace-1",
  
      journeyId:
        "journey-1",
  
      type:
        "NEGOTIATION",
  
      status:
        "PLANNED",
  
      source:
        "RULE_ENGINE",
  
      title:
        "Acompanhar negociação",
  
      objective:
        "Avançar a oportunidade até a decisão.",
  
      reason:
        "A jornada está em negociação.",
  
      priority:
        "HIGH",
  
      confidence:
        90,
  
      steps: [],
  
      maxAttempts:
        3,
  
      currentAttempt:
        0,
  
      currentStepPosition:
        null,
  
      stopOnResponse:
        true,
  
      stopOnJourneyClosed:
        true,
  
      expiresAt:
        null,
  
      startedAt:
        null,
  
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
  
  function createAutomationJob(
    overrides:
      Partial<AutomationJob> = {},
  ): AutomationJob {
    return {
      id:
        "pipeline-job-1",
  
      workspaceId:
        "workspace-1",
  
      journeyId:
        "journey-1",
  
      strategyId:
        "pipeline-strategy-1",
  
      strategyStepId:
        "pipeline-step-1",
  
      source:
        "STRATEGY_STEP",
  
      actionType:
        "SEND_MESSAGE",
  
      channel:
        "WHATSAPP",
  
      title:
        "Enviar acompanhamento",
  
      description:
        "Enviar mensagem de acompanhamento.",
  
      status:
        "COMPLETED",
  
      priority:
        "HIGH",
  
      scheduledFor:
        NOW.toISOString(),
  
      availableAt:
        NOW.toISOString(),
  
      startedAt:
        NOW.toISOString(),
  
      completedAt:
        NOW.toISOString(),
  
      failedAt:
        null,
  
      cancelledAt:
        null,
  
      attemptCount:
        1,
  
      maxAttempts:
        3,
  
      lastFailureReason:
        null,
  
      payload: {},
  
      createdActionId:
        "pipeline-action-1",
  
      createdAt:
        NOW.toISOString(),
  
      updatedAt:
        NOW.toISOString(),
  
      ...overrides,
    }
  }
  
  function createAutomationExecution(
    overrides:
      Partial<AutomationExecution> = {},
  ): AutomationExecution {
    return {
      id:
        "pipeline-job-1:execution:1",
  
      automationJobId:
        "pipeline-job-1",
  
      workspaceId:
        "workspace-1",
  
      journeyId:
        "journey-1",
  
      attempt:
        1,
  
      status:
        "SUCCEEDED",
  
      startedAt:
        NOW.toISOString(),
  
      finishedAt:
        NOW.toISOString(),
  
      failureReason:
        null,
  
      createdActionId:
        "pipeline-action-1",
  
      output: {
        actionId:
          "pipeline-action-1",
      },
  
      ...overrides,
    }
  }
  
  function createCommercialAction(
    overrides:
      Partial<CommercialAction> = {},
  ): CommercialAction {
    return {
      id:
        "pipeline-action-1",
  
      workspaceId:
        "workspace-1",
  
      journeyId:
        "journey-1",
  
      type:
        "SEND_MESSAGE",
  
      status:
        "PENDING",
  
      origin:
        "SYSTEM",
  
      actorType:
        "AUTOMATION",
  
      actorId:
        null,
  
      title:
        "Enviar acompanhamento",
  
      description:
        "Enviar mensagem de acompanhamento.",
  
      payload: {
        automationJobId:
          "pipeline-job-1",
      },
  
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
  
      createdBy:
        null,
  
      createdAt:
        NOW.toISOString(),
  
      updatedAt:
        NOW.toISOString(),
  
      ...overrides,
    }
  }
  
  function createAutomationOutput(
    strategy:
      CommercialStrategy | null,
    options: {
      jobs?: AutomationJob[]
      executions?: AutomationExecution[]
      actions?: CommercialAction[]
      diagnostics?: string[]
      warnings?: string[]
    } = {},
  ): AutomationEngineOutput {
    const jobs =
      options.jobs ?? []
  
    const executions =
      options.executions ?? []
  
    return {
      strategy,
  
      queue: {
        jobs,
        executions,
      },
  
      scheduledJobs:
        jobs,
  
      processedJobs:
        jobs,
  
      createdActions:
        options.actions ?? [],
  
      executions,
  
      diagnostics:
        options.diagnostics ?? [],
  
      warnings:
        options.warnings ?? [],
    }
  }
  
  function configureDecisionEngine(
    strategy:
      CommercialStrategy | null,
  ): void {
    mockedRunApplicationDecisionEngine
      .mockReturnValue({
        nextBestActions: [],
  
        strategy,
  
        diagnostics: [
          "Decisão executada.",
        ],
  
        warnings: [],
      })
  }
  
  describe(
    "runDecisionAutomationPipeline",
    () => {
      beforeEach(() => {
        mockedRunApplicationDecisionEngine
          .mockReset()
  
        mockedRunAutomationEngine
          .mockReset()
      })
  
      it(
        "deve executar decisão, automação e persistir o estado produzido",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          const strategy =
            createStrategy()
  
          const completedStrategy = {
            ...strategy,
  
            status:
              "COMPLETED" as const,
  
            startedAt:
              NOW.toISOString(),
  
            completedAt:
              NOW.toISOString(),
  
            currentStepPosition:
              null,
  
            updatedAt:
              NOW.toISOString(),
          }
  
          const job =
            createAutomationJob()
  
          const execution =
            createAutomationExecution()
  
          const action =
            createCommercialAction()
  
          configureDecisionEngine(
            strategy,
          )
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                completedStrategy,
                {
                  jobs: [
                    job,
                  ],
  
                  executions: [
                    execution,
                  ],
  
                  actions: [
                    action,
                  ],
  
                  diagnostics: [
                    "Automação executada.",
                  ],
                },
              ),
            )
  
          const result =
            runDecisionAutomationPipeline({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                journey.id,
              workspaceId:
                journey.workspaceId,
              now:
                NOW,
            })
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).toHaveBeenCalledWith({
            commercialRepository,
            crmRepository,
            journeyId:
              journey.id,
            now:
              NOW,
          })
  
          expect(
            mockedRunAutomationEngine,
          ).toHaveBeenCalledWith({
            strategy,
  
            journey,
  
            queue: {
              jobs: [],
              executions: [],
            },
  
            now:
              NOW,
  
            executionLimit:
              undefined,
          })
  
          expect(
            decisionAutomationRepository
              .getStrategyById(
                completedStrategy.id,
              ),
          ).toEqual(
            completedStrategy,
          )
  
          expect(
            decisionAutomationRepository
              .getAutomationQueueByJourneyId(
                journey.id,
              ),
          ).toEqual({
            jobs: [
              job,
            ],
  
            executions: [
              execution,
            ],
          })
  
          expect(
            commercialRepository
              .getActionById(
                action.id,
              ),
          ).toEqual(
            action,
          )
  
          expect(
            result.persistedActions,
          ).toEqual([
            action,
          ])
  
          expect(
            result.existingActions,
          ).toEqual([])
  
          expect(
            result.diagnostics,
          ).toContain(
            "Decisão executada.",
          )
  
          expect(
            result.diagnostics,
          ).toContain(
            "Automação executada.",
          )
        },
      )
  
      it(
        "deve preservar a estratégia ativa já persistida",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const activeStrategy =
            createStrategy({
              id:
                "active-strategy",
  
              status:
                "ACTIVE",
            })
  
          const generatedStrategy =
            createStrategy({
              id:
                "generated-strategy",
            })
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository({
              strategies: [
                activeStrategy,
              ],
            })
  
          configureDecisionEngine(
            generatedStrategy,
          )
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                activeStrategy,
              ),
            )
  
          const result =
            runDecisionAutomationPipeline({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                journey.id,
              now:
                NOW,
            })
  
          expect(
            mockedRunAutomationEngine,
          ).toHaveBeenCalledWith({
            strategy:
              activeStrategy,
  
            journey,
  
            queue: {
              jobs: [],
              executions: [],
            },
  
            now:
              NOW,
  
            executionLimit:
              undefined,
          })
  
          expect(
            result.diagnostics,
          ).toContain(
            `A estratégia ativa "${activeStrategy.id}" foi preservada para a jornada "${journey.id}".`,
          )
  
          expect(
            decisionAutomationRepository
              .getStrategyById(
                generatedStrategy.id,
              ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve executar a fila mesmo quando nenhuma estratégia for gerada",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const pendingJob =
            createAutomationJob({
              strategyId:
                null,
  
              strategyStepId:
                null,
  
              source:
                "SYSTEM",
  
              status:
                "PENDING",
  
              startedAt:
                null,
  
              completedAt:
                null,
  
              attemptCount:
                0,
  
              createdActionId:
                null,
            })
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository({
              automationJobs: [
                pendingJob,
              ],
            })
  
          configureDecisionEngine(
            null,
          )
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                null,
                {
                  jobs: [
                    pendingJob,
                  ],
                },
              ),
            )
  
          runDecisionAutomationPipeline({
            commercialRepository,
            crmRepository,
            decisionAutomationRepository,
            journeyId:
              journey.id,
            now:
              NOW,
          })
  
          expect(
            mockedRunAutomationEngine,
          ).toHaveBeenCalledWith({
            strategy:
              null,
  
            journey,
  
            queue: {
              jobs: [
                pendingJob,
              ],
  
              executions: [],
            },
  
            now:
              NOW,
  
            executionLimit:
              undefined,
          })
        },
      )
  
      it(
        "deve preservar uma ação já persistida sem duplicá-la",
        () => {
          const journey =
            getJourney()
  
          const existingAction =
            createCommercialAction()
  
          const commercialRepository =
            new MockCommercialRepository({
              ...mockCommercialData,
  
              commercialActions: [
                ...mockCommercialData
                  .commercialActions,
  
                existingAction,
              ],
            })
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          configureDecisionEngine(
            null,
          )
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                null,
                {
                  actions: [
                    existingAction,
                  ],
                },
              ),
            )
  
          const result =
            runDecisionAutomationPipeline({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                journey.id,
              now:
                NOW,
            })
  
          expect(
            result.persistedActions,
          ).toEqual([])
  
          expect(
            result.existingActions,
          ).toEqual([
            existingAction,
          ])
  
          expect(
            commercialRepository
              .getActionsByJourneyId(
                journey.id,
              )
              .filter(
                (action) =>
                  action.id ===
                  existingAction.id,
              ),
          ).toHaveLength(1)
        },
      )
  
      it(
        "deve encaminhar o limite de execução para o Automation Engine",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          configureDecisionEngine(
            null,
          )
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                null,
              ),
            )
  
          runDecisionAutomationPipeline({
            commercialRepository,
            crmRepository,
            decisionAutomationRepository,
            journeyId:
              journey.id,
            now:
              NOW,
            executionLimit:
              2,
          })
  
          expect(
            mockedRunAutomationEngine,
          ).toHaveBeenCalledWith({
            strategy:
              null,
  
            journey,
  
            queue: {
              jobs: [],
              executions: [],
            },
  
            now:
              NOW,
  
            executionLimit:
              2,
          })
        },
      )
  
      it(
        "deve rejeitar um ID de jornada vazio antes de executar os motores",
        () => {
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          expect(() =>
            runDecisionAutomationPipeline({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                "   ",
              now:
                NOW,
            }),
          ).toThrow(
            "O ID da jornada comercial é obrigatório para executar o pipeline de decisão e automação.",
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).not.toHaveBeenCalled()
  
          expect(
            mockedRunAutomationEngine,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma jornada inexistente antes de executar os motores",
        () => {
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          expect(() =>
            runDecisionAutomationPipeline({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                "journey-inexistente",
              now:
                NOW,
            }),
          ).toThrow(
            'Jornada comercial não encontrada para o ID "journey-inexistente".',
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).not.toHaveBeenCalled()
  
          expect(
            mockedRunAutomationEngine,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma jornada pertencente a outro workspace",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            new MockCommercialRepository(
              mockCommercialData,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          expect(() =>
            runDecisionAutomationPipeline({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                journey.id,
              workspaceId:
                "outro-workspace",
              now:
                NOW,
            }),
          ).toThrow(
            `A jornada comercial "${journey.id}" não pertence ao workspace "outro-workspace".`,
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).not.toHaveBeenCalled()
  
          expect(
            mockedRunAutomationEngine,
          ).not.toHaveBeenCalled()
        },
      )
    },
  )