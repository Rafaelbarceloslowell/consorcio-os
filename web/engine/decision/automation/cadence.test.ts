import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  CommercialStrategy,
  StrategyStep,
} from "../strategy/types"

import {
  advanceStrategyCadence,
  initializeStrategyCadence,
} from "./cadence"

import type {
  AutomationJob,
} from "./types"

const NOW = new Date(
  "2026-07-22T15:00:00.000Z",
)

function createStep(
  overrides: Partial<StrategyStep> = {},
): StrategyStep {
  return {
    id: "step-1",
    strategyId:
      "strategy-test",
    position: 1,
    title:
      "Enviar mensagem",
    description:
      "Realizar contato com o lead.",
    actionType:
      "SEND_MESSAGE",
    channel:
      "WHATSAPP",
    status:
      "READY",
    priority:
      "HIGH",
    waitBeforeMinutes: 0,
    scheduledFor:
      "2026-07-22T14:00:00.000Z",
    startedAt: null,
    completedAt: null,
    failedAt: null,
    failureReason: null,
    sourceRecommendationId:
      "recommendation-test",
    payload: {},
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
      "INITIAL_CONTACT",
    status:
      "ACTIVE",
    source:
      "RULE_ENGINE",
    title:
      "Contato inicial",
    objective:
      "Iniciar relacionamento com o lead.",
    reason:
      "O lead ainda não recebeu contato.",
    priority:
      "HIGH",
    confidence: 0.9,
    steps: [
      createStep(),
      createStep({
        id:
          "step-2",
        position: 2,
        status:
          "PENDING",
        scheduledFor:
          NOW.toISOString(),
      }),
    ],
    maxAttempts: 3,
    currentAttempt: 1,
    currentStepPosition: 1,
    stopOnResponse: true,
    stopOnJourneyClosed: true,
    expiresAt: null,
    startedAt:
      "2026-07-22T14:00:00.000Z",
    pausedAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt:
      "2026-07-22T14:00:00.000Z",
    updatedAt:
      "2026-07-22T14:00:00.000Z",
    ...overrides,
  }
}

function createJob(
  overrides: Partial<AutomationJob> = {},
): AutomationJob {
  return {
    id:
      "job-1",
    workspaceId:
      "workspace-test",
    journeyId:
      "journey-test",
    strategyId:
      "strategy-test",
    strategyStepId:
      "step-1",
    source:
      "STRATEGY_STEP",
    actionType:
      "SEND_MESSAGE",
    channel:
      "WHATSAPP",
    title:
      "Enviar mensagem",
    description:
      "Realizar contato com o lead.",
    status:
      "COMPLETED",
    priority:
      "HIGH",
    scheduledFor:
      "2026-07-22T14:00:00.000Z",
    availableAt:
      "2026-07-22T14:00:00.000Z",
    startedAt:
      "2026-07-22T14:00:00.000Z",
    completedAt:
      "2026-07-22T14:05:00.000Z",
    failedAt: null,
    cancelledAt: null,
    attemptCount: 1,
    maxAttempts: 3,
    lastFailureReason: null,
    payload: {
      strategyStepPosition: 1,
    },
    createdActionId:
      "action-test",
    createdAt:
      "2026-07-22T13:00:00.000Z",
    updatedAt:
      "2026-07-22T14:05:00.000Z",
    ...overrides,
  }
}

describe(
  "automation cadence",
  () => {
    describe(
      "initializeStrategyCadence",
      () => {
        it(
          "deve selecionar somente o primeiro passo elegível",
          () => {
            const strategy =
              createStrategy({
                currentStepPosition:
                  null,

                steps: [
                  createStep({
                    id:
                      "step-3",
                    position: 3,
                    status:
                      "PENDING",
                  }),

                  createStep({
                    id:
                      "step-1",
                    position: 1,
                    status:
                      "PENDING",
                  }),

                  createStep({
                    id:
                      "step-2",
                    position: 2,
                    status:
                      "PENDING",
                  }),
                ],
              })

            const result =
              initializeStrategyCadence({
                strategy,
                now: NOW,
              })

            expect(
              result.initialized,
            ).toBe(true)

            expect(
              result.nextStep?.id,
            ).toBe(
              "step-1",
            )

            expect(
              result.strategy
                .currentStepPosition,
            ).toBe(1)
          },
        )

        it(
          "deve manter o primeiro passo pendente quando o horário ainda não chegou",
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
              initializeStrategyCadence({
                strategy,
                now: NOW,
              })

            expect(
              result.nextStep?.status,
            ).toBe(
              "PENDING",
            )
          },
        )

        it(
          "deve concluir a estratégia sem passos ativos",
          () => {
            const strategy =
              createStrategy({
                currentStepPosition:
                  null,

                steps: [
                  createStep({
                    status:
                      "COMPLETED",
                  }),

                  createStep({
                    id:
                      "step-2",
                    position: 2,
                    status:
                      "CANCELLED",
                  }),
                ],
              })

            const result =
              initializeStrategyCadence({
                strategy,
                now: NOW,
              })

            expect(
              result.strategyCompleted,
            ).toBe(true)

            expect(
              result.strategy.status,
            ).toBe(
              "COMPLETED",
            )

            expect(
              result.nextStep,
            ).toBeNull()
          },
        )

        it(
          "não deve iniciar uma estratégia encerrada",
          () => {
            const strategy =
              createStrategy({
                status:
                  "CANCELLED",
              })

            const result =
              initializeStrategyCadence({
                strategy,
                now: NOW,
              })

            expect(
              result.initialized,
            ).toBe(false)

            expect(
              result.nextStep,
            ).toBeNull()
          },
        )
      },
    )

    describe(
      "advanceStrategyCadence",
      () => {
        it(
          "deve concluir o passo atual e selecionar o próximo",
          () => {
            const result =
              advanceStrategyCadence({
                strategy:
                  createStrategy(),

                completedJob:
                  createJob(),

                now:
                  NOW,
              })

            expect(
              result.advanced,
            ).toBe(true)

            expect(
              result.completedStep
                ?.status,
            ).toBe(
              "COMPLETED",
            )

            expect(
              result.nextStep?.id,
            ).toBe(
              "step-2",
            )

            expect(
              result.nextStep?.status,
            ).toBe(
              "READY",
            )

            expect(
              result.strategy
                .currentStepPosition,
            ).toBe(2)
          },
        )

        it(
          "deve manter o próximo passo pendente quando o horário ainda não chegou",
          () => {
            const strategy =
              createStrategy({
                steps: [
                  createStep(),

                  createStep({
                    id:
                      "step-2",
                    position: 2,
                    status:
                      "PENDING",
                    scheduledFor:
                      "2026-07-23T15:00:00.000Z",
                  }),
                ],
              })

            const result =
              advanceStrategyCadence({
                strategy,

                completedJob:
                  createJob(),

                now:
                  NOW,
              })

            expect(
              result.nextStep?.status,
            ).toBe(
              "PENDING",
            )

            expect(
              result.strategy
                .currentStepPosition,
            ).toBe(2)
          },
        )

        it(
          "deve concluir a estratégia quando não houver próximo passo",
          () => {
            const strategy =
              createStrategy({
                steps: [
                  createStep(),
                ],
              })

            const result =
              advanceStrategyCadence({
                strategy,

                completedJob:
                  createJob(),

                now:
                  NOW,
              })

            expect(
              result.strategyCompleted,
            ).toBe(true)

            expect(
              result.strategy.status,
            ).toBe(
              "COMPLETED",
            )

            expect(
              result.strategy
                .currentStepPosition,
            ).toBeNull()

            expect(
              result.nextStep,
            ).toBeNull()
          },
        )

        it(
          "deve ignorar passos encerrados ao procurar o próximo",
          () => {
            const strategy =
              createStrategy({
                steps: [
                  createStep(),

                  createStep({
                    id:
                      "step-2",
                    position: 2,
                    status:
                      "CANCELLED",
                  }),

                  createStep({
                    id:
                      "step-3",
                    position: 3,
                    status:
                      "FAILED",
                  }),

                  createStep({
                    id:
                      "step-4",
                    position: 4,
                    status:
                      "PENDING",
                    scheduledFor:
                      NOW.toISOString(),
                  }),
                ],
              })

            const result =
              advanceStrategyCadence({
                strategy,

                completedJob:
                  createJob(),

                now:
                  NOW,
              })

            expect(
              result.nextStep?.id,
            ).toBe(
              "step-4",
            )

            expect(
              result.strategy
                .currentStepPosition,
            ).toBe(4)
          },
        )

        it(
          "não deve avançar quando o trabalho ainda não estiver concluído",
          () => {
            const result =
              advanceStrategyCadence({
                strategy:
                  createStrategy(),

                completedJob:
                  createJob({
                    status:
                      "IN_PROGRESS",
                    completedAt:
                      null,
                  }),

                now:
                  NOW,
              })

            expect(
              result.advanced,
            ).toBe(false)

            expect(
              result.nextStep,
            ).toBeNull()

            expect(
              result.warnings,
            ).toContain(
              'O trabalho "job-1" ainda não foi concluído e não pode avançar a cadência.',
            )
          },
        )

        it(
          "deve rejeitar trabalho pertencente a outra estratégia",
          () => {
            expect(() =>
              advanceStrategyCadence({
                strategy:
                  createStrategy(),

                completedJob:
                  createJob({
                    strategyId:
                      "other-strategy",
                  }),

                now:
                  NOW,
              }),
            ).toThrow(
              'O trabalho "job-1" não pertence à estratégia "strategy-test".',
            )
          },
        )

        it(
          "deve rejeitar trabalho sem passo de estratégia",
          () => {
            expect(() =>
              advanceStrategyCadence({
                strategy:
                  createStrategy(),

                completedJob:
                  createJob({
                    strategyStepId:
                      null,
                  }),

                now:
                  NOW,
              }),
            ).toThrow(
              'O trabalho "job-1" não está vinculado a um passo de estratégia.',
            )
          },
        )

        it(
          "deve rejeitar passo inexistente na estratégia",
          () => {
            expect(() =>
              advanceStrategyCadence({
                strategy:
                  createStrategy(),

                completedJob:
                  createJob({
                    strategyStepId:
                      "step-inexistente",
                  }),

                now:
                  NOW,
              }),
            ).toThrow(
              'O passo "step-inexistente" do trabalho "job-1" não foi encontrado na estratégia "strategy-test".',
            )
          },
        )
      },
    )
  },
)