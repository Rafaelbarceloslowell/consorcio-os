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
    createAutomationJob,
  } from "./scheduler"
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
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
      priority: "HIGH",
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
  
  function createStep(
    overrides: Partial<StrategyStep> = {},
  ): StrategyStep {
    return {
      id: "step-test",
      strategyId: "strategy-test",
      position: 1,
      title: "Enviar mensagem",
      description:
        "Enviar mensagem personalizada ao lead.",
      actionType: "SEND_MESSAGE",
      channel: "WHATSAPP",
      status: "READY",
      priority: "HIGH",
      waitBeforeMinutes: 0,
      scheduledFor:
        "2026-07-22T15:00:00.000Z",
      startedAt: null,
      completedAt: null,
      failedAt: null,
      failureReason: null,
      sourceRecommendationId:
        "recommendation-test",
      payload: {
        reason:
          "Lead precisa de retomada comercial.",
      },
      ...overrides,
    }
  }
  
  function createStrategy(
    overrides: Partial<CommercialStrategy> = {},
  ): CommercialStrategy {
    return {
      id: "strategy-test",
      workspaceId: "workspace-test",
      journeyId: "journey-test",
      type: "RECOVERY",
      status: "ACTIVE",
      source: "RULE_ENGINE",
      title: "Recuperar oportunidade",
      objective:
        "Retomar o contato comercial com o lead.",
      reason:
        "A jornada está sem interação recente.",
      priority: "HIGH",
      confidence: 0.9,
      steps: [
        createStep(),
      ],
      maxAttempts: 3,
      currentAttempt: 0,
      currentStepPosition: 1,
      stopOnResponse: true,
      stopOnJourneyClosed: true,
      expiresAt:
        "2026-07-25T15:00:00.000Z",
      startedAt:
        "2026-07-22T15:00:00.000Z",
      pausedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt:
        "2026-07-22T15:00:00.000Z",
      updatedAt:
        "2026-07-22T15:00:00.000Z",
      ...overrides,
    }
  }
  
  describe(
    "automation scheduler",
    () => {
      it(
        "deve transformar um passo explicitamente escolhido em um trabalho de automação",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep()
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          const job =
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            })
  
          expect(job).toEqual({
            id:
              "strategy-test:automation-job:step-test",
  
            workspaceId:
              journey.workspaceId,
  
            journeyId:
              journey.id,
  
            strategyId:
              strategy.id,
  
            strategyStepId:
              step.id,
  
            source:
              "STRATEGY_STEP",
  
            actionType:
              step.actionType,
  
            channel:
              step.channel,
  
            title:
              step.title,
  
            description:
              step.description,
  
            status:
              "READY",
  
            priority:
              step.priority,
  
            scheduledFor:
              "2026-07-22T15:00:00.000Z",
  
            availableAt:
              "2026-07-22T15:00:00.000Z",
  
            startedAt: null,
  
            completedAt: null,
  
            failedAt: null,
  
            cancelledAt: null,
  
            attemptCount: 0,
  
            maxAttempts: 3,
  
            lastFailureReason: null,
  
            payload: {
              reason:
                "Lead precisa de retomada comercial.",
  
              strategyType:
                strategy.type,
  
              strategyObjective:
                strategy.objective,
  
              strategyReason:
                strategy.reason,
  
              strategyStepPosition:
                step.position,
  
              sourceRecommendationId:
                step.sourceRecommendationId,
            },
  
            createdActionId: null,
  
            createdAt:
              NOW.toISOString(),
  
            updatedAt:
              NOW.toISOString(),
          })
        },
      )
  
      it(
        "deve criar um trabalho pendente quando o passo estiver agendado para o futuro",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep({
              scheduledFor:
                "2026-07-23T15:00:00.000Z",
            })
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          const job =
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            })
  
          expect(
            job.status,
          ).toBe(
            "PENDING",
          )
  
          expect(
            job.scheduledFor,
          ).toBe(
            "2026-07-23T15:00:00.000Z",
          )
  
          expect(
            job.availableAt,
          ).toBe(
            "2026-07-23T15:00:00.000Z",
          )
        },
      )
  
      it(
        "deve criar um trabalho pronto quando o horário do passo já chegou",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep({
              scheduledFor:
                "2026-07-22T14:00:00.000Z",
            })
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          const job =
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            })
  
          expect(
            job.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve usar a data atual quando o passo não possuir agendamento",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep({
              scheduledFor: null,
            })
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          const job =
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            })
  
          expect(
            job.scheduledFor,
          ).toBe(
            NOW.toISOString(),
          )
  
          expect(
            job.availableAt,
          ).toBe(
            NOW.toISOString(),
          )
  
          expect(
            job.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve usar a data atual quando o agendamento do passo for inválido",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep({
              scheduledFor:
                "data-invalida",
            })
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          const job =
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            })
  
          expect(
            job.scheduledFor,
          ).toBe(
            NOW.toISOString(),
          )
  
          expect(
            job.availableAt,
          ).toBe(
            NOW.toISOString(),
          )
  
          expect(
            job.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve preservar os dados comerciais do passo no trabalho",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep({
              id: "step-commercial",
              position: 4,
              actionType:
                "CREATE_TASK",
              channel:
                "INTERNAL",
              priority:
                "HIGH",
              payload: {
                taskType:
                  "CONSULTANT_REVIEW",
              },
            })
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          const job =
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            })
  
          expect(
            job.actionType,
          ).toBe(
            "CREATE_TASK",
          )
  
          expect(
            job.channel,
          ).toBe(
            "INTERNAL",
          )
  
          expect(
            job.priority,
          ).toBe(
            "HIGH",
          )
  
          expect(
            job.payload,
          ).toMatchObject({
            taskType:
              "CONSULTANT_REVIEW",
  
            strategyStepPosition: 4,
          })
        },
      )
  
      it(
        "deve rejeitar uma estratégia de outro workspace",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep()
  
          const strategy =
            createStrategy({
              workspaceId:
                "outro-workspace",
  
              steps: [
                step,
              ],
            })
  
          expect(() =>
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            }),
          ).toThrow(
            'A estratégia "strategy-test" não pertence ao workspace da jornada "journey-test".',
          )
        },
      )
  
      it(
        "deve rejeitar uma estratégia vinculada a outra jornada",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep()
  
          const strategy =
            createStrategy({
              journeyId:
                "outra-jornada",
  
              steps: [
                step,
              ],
            })
  
          expect(() =>
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            }),
          ).toThrow(
            'A estratégia "strategy-test" não pertence à jornada "journey-test".',
          )
        },
      )
  
      it(
        "deve rejeitar um passo pertencente a outra estratégia",
        () => {
          const journey =
            createJourney()
  
          const step =
            createStep({
              strategyId:
                "outra-estrategia",
            })
  
          const strategy =
            createStrategy({
              steps: [
                step,
              ],
            })
  
          expect(() =>
            createAutomationJob({
              strategy,
              step,
              journey,
              now: NOW,
            }),
          ).toThrow(
            'O passo "step-test" não pertence à estratégia "strategy-test".',
          )
        },
      )
    },
  )