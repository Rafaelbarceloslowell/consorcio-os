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
    NextBestAction,
  } from "@/types/domain"
  
  import {
    runApplicationDecisionEngine,
  } from "./run-decision-engine"
  
  import {
    runCommercialDecisionCycle,
  } from "./run-commercial-decision-cycle"
  
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
      "2026-07-22T19:00:00.000Z",
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
  
  function createCommercialRepository(
    journey:
      CommercialJourney,
  
    options: {
      nextBestActions?:
        NextBestAction[]
  
      commercialActions?:
        CommercialAction[]
    } = {},
  ): MockCommercialRepository {
    return new MockCommercialRepository({
      ...mockCommercialData,
  
      commercialJourneys: [
        journey,
      ],
  
      commercialEvents:
        mockCommercialData
          .commercialEvents
          .filter(
            (event) =>
              event.journeyId ===
              journey.id,
          ),
  
      commercialActions:
        options.commercialActions ??
        [],
  
      nextBestActions:
        options.nextBestActions ??
        [],
    })
  }
  
  function createNextBestAction(
    journey:
      CommercialJourney,
  
    overrides:
      Partial<NextBestAction> = {},
  ): NextBestAction {
    return {
      id:
        "cycle-recommendation-1",
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
      actionType:
        "SEND_MESSAGE",
  
      title:
        "Retomar negociação",
  
      description:
        "Enviar uma mensagem personalizada.",
  
      reason:
        "A oportunidade está sem interação recente.",
  
      confidence:
        90,
  
      priority:
        "HIGH",
  
      source:
        "RULE_ENGINE",
  
      expiresAt:
        "2026-07-24T19:00:00.000Z",
  
      acceptedAt:
        null,
  
      rejectedAt:
        null,
  
      executedActionId:
        null,
  
      createdAt:
        NOW.toISOString(),
  
      updatedAt:
        NOW.toISOString(),
  
      ...overrides,
    }
  }
  
  function createStrategy(
    journey:
      CommercialJourney,
  
    overrides:
      Partial<CommercialStrategy> = {},
  ): CommercialStrategy {
    return {
      id:
        "cycle-strategy-1",
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
      type:
        "NEGOTIATION",
  
      status:
        "PLANNED",
  
      source:
        "RULE_ENGINE",
  
      title:
        "Acompanhar negociação",
  
      objective:
        "Avançar a oportunidade.",
  
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
    journey:
      CommercialJourney,
  
    strategyId:
      string | null,
  
    overrides:
      Partial<AutomationJob> = {},
  ): AutomationJob {
    return {
      id:
        "cycle-job-1",
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
      strategyId,
  
      strategyStepId:
        strategyId
          ? "cycle-step-1"
          : null,
  
      source:
        strategyId
          ? "STRATEGY_STEP"
          : "SYSTEM",
  
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
        "cycle-action-1",
  
      createdAt:
        NOW.toISOString(),
  
      updatedAt:
        NOW.toISOString(),
  
      ...overrides,
    }
  }
  
  function createAutomationExecution(
    journey:
      CommercialJourney,
  
    job:
      AutomationJob,
  
    overrides:
      Partial<AutomationExecution> = {},
  ): AutomationExecution {
    return {
      id:
        `${job.id}:execution:1`,
  
      automationJobId:
        job.id,
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
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
        "cycle-action-1",
  
      output: {
        actionId:
          "cycle-action-1",
      },
  
      ...overrides,
    }
  }
  
  function createCommercialAction(
    journey:
      CommercialJourney,
  
    overrides:
      Partial<CommercialAction> = {},
  ): CommercialAction {
    return {
      id:
        "cycle-action-1",
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
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
          "cycle-job-1",
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
      jobs?:
        AutomationJob[]
  
      executions?:
        AutomationExecution[]
  
      actions?:
        CommercialAction[]
  
      diagnostics?:
        string[]
  
      warnings?:
        string[]
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
  
  describe(
    "runCommercialDecisionCycle",
    () => {
      beforeEach(() => {
        mockedRunApplicationDecisionEngine
          .mockReset()
  
        mockedRunAutomationEngine
          .mockReset()
      })
  
      it(
        "deve executar o ciclo completo usando uma única decisão",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          const recommendation =
            createNextBestAction(
              journey,
            )
  
          const strategy =
            createStrategy(
              journey,
            )
  
          const completedStrategy = {
            ...strategy,
  
            status:
              "COMPLETED" as const,
  
            startedAt:
              NOW.toISOString(),
  
            completedAt:
              NOW.toISOString(),
  
            updatedAt:
              NOW.toISOString(),
          }
  
          const job =
            createAutomationJob(
              journey,
              strategy.id,
            )
  
          const execution =
            createAutomationExecution(
              journey,
              job,
            )
  
          const action =
            createCommercialAction(
              journey,
            )
  
          mockedRunApplicationDecisionEngine
            .mockReturnValue({
              nextBestActions: [
                recommendation,
              ],
  
              strategy,
  
              diagnostics: [
                "Decisão executada.",
              ],
  
              warnings: [],
            })
  
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
            runCommercialDecisionCycle({
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
          ).toHaveBeenCalledTimes(1)
  
          expect(
            mockedRunAutomationEngine,
          ).toHaveBeenCalledTimes(1)
  
          expect(
            result.createdNextBestActions,
          ).toEqual([
            recommendation,
          ])
  
          expect(
            result.persistedActions,
          ).toEqual([
            action,
          ])
  
          expect(
            commercialRepository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toEqual([
            recommendation,
          ])
  
          expect(
            commercialRepository
              .getActionById(
                action.id,
              ),
          ).toEqual(
            action,
          )
  
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
        },
      )
  
      it(
        "deve substituir recomendações abertas e preservar o histórico",
        () => {
          const journey =
            getJourney()
  
          const openRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-open",
              },
            )
  
          const acceptedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-accepted",
  
                acceptedAt:
                  "2026-07-21T15:00:00.000Z",
              },
            )
  
          const generatedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-new",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              {
                nextBestActions: [
                  openRecommendation,
                  acceptedRecommendation,
                ],
              },
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          mockedRunApplicationDecisionEngine
            .mockReturnValue({
              nextBestActions: [
                generatedRecommendation,
              ],
  
              strategy:
                null,
  
              diagnostics: [],
  
              warnings: [],
            })
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                null,
              ),
            )
  
          const result =
            runCommercialDecisionCycle({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                journey.id,
              now:
                NOW,
            })
  
          expect(
            result.removedNextBestActions,
          ).toEqual([
            openRecommendation,
          ])
  
          expect(
            result.preservedNextBestActions,
          ).toEqual([
            acceptedRecommendation,
          ])
  
          expect(
            result.createdNextBestActions,
          ).toEqual([
            generatedRecommendation,
          ])
  
          expect(
            result.nextBestActions,
          ).toEqual([
            acceptedRecommendation,
            generatedRecommendation,
          ])
        },
      )
  
      it(
        "deve preservar a estratégia ativa já persistida",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const activeStrategy =
            createStrategy(
              journey,
              {
                id:
                  "active-strategy",
  
                status:
                  "ACTIVE",
              },
            )
  
          const generatedStrategy =
            createStrategy(
              journey,
              {
                id:
                  "generated-strategy",
              },
            )
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository({
              strategies: [
                activeStrategy,
              ],
            })
  
          mockedRunApplicationDecisionEngine
            .mockReturnValue({
              nextBestActions: [],
  
              strategy:
                generatedStrategy,
  
              diagnostics: [],
  
              warnings: [],
            })
  
          mockedRunAutomationEngine
            .mockReturnValue(
              createAutomationOutput(
                activeStrategy,
              ),
            )
  
          const result =
            runCommercialDecisionCycle({
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
        "deve processar a fila persistida sem estratégia nova",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const pendingJob =
            createAutomationJob(
              journey,
              null,
              {
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
              },
            )
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository({
              automationJobs: [
                pendingJob,
              ],
            })
  
          mockedRunApplicationDecisionEngine
            .mockReturnValue({
              nextBestActions: [],
  
              strategy:
                null,
  
              diagnostics: [],
  
              warnings: [],
            })
  
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
  
          runCommercialDecisionCycle({
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
        "deve preservar uma ação já persistida sem duplicação",
        () => {
          const journey =
            getJourney()
  
          const existingAction =
            createCommercialAction(
              journey,
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              {
                commercialActions: [
                  existingAction,
                ],
              },
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          mockedRunApplicationDecisionEngine
            .mockReturnValue({
              nextBestActions: [],
  
              strategy:
                null,
  
              diagnostics: [],
  
              warnings: [],
            })
  
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
            runCommercialDecisionCycle({
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
        "deve rejeitar recomendações inválidas antes da automação e da persistência",
        () => {
          const journey =
            getJourney()
  
          const existingRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-existing",
              },
            )
  
          const invalidRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-invalid",
  
                journeyId:
                  "outra-jornada",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              {
                nextBestActions: [
                  existingRecommendation,
                ],
              },
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          mockedRunApplicationDecisionEngine
            .mockReturnValue({
              nextBestActions: [
                invalidRecommendation,
              ],
  
              strategy:
                null,
  
              diagnostics: [],
  
              warnings: [],
            })
  
          expect(() =>
            runCommercialDecisionCycle({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                journey.id,
              now:
                NOW,
            }),
          ).toThrow(
            `A recomendação comercial "${invalidRecommendation.id}" foi gerada para a jornada incorreta "outra-jornada".`,
          )
  
          expect(
            mockedRunAutomationEngine,
          ).not.toHaveBeenCalled()
  
          expect(
            commercialRepository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toEqual([
            existingRecommendation,
          ])
        },
      )
  
      it(
        "deve rejeitar um ID de jornada vazio antes de executar os motores",
        () => {
          const journey =
            getJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          expect(() =>
            runCommercialDecisionCycle({
              commercialRepository,
              crmRepository,
              decisionAutomationRepository,
              journeyId:
                "   ",
              now:
                NOW,
            }),
          ).toThrow(
            "O ID da jornada comercial é obrigatório para executar o ciclo comercial de decisão.",
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
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const decisionAutomationRepository =
            new MockDecisionAutomationRepository()
  
          expect(() =>
            runCommercialDecisionCycle({
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