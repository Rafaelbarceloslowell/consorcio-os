import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  NextBestAction,
} from "@/types/domain"

import {
  createStrategySteps,
} from "./planner"

const NOW =
  new Date(
    "2026-07-22T15:00:00.000Z",
  )

function createRecommendation(
  actionType: NextBestAction["actionType"],
  overrides: Partial<NextBestAction> = {},
): NextBestAction {
  return {
    id:
      `recommendation-${actionType.toLowerCase()}`,

    workspaceId:
      "workspace-test",

    journeyId:
      "journey-test",

    actionType,

    title:
      `Executar ${actionType}`,

    description:
      "DescriÃ§Ã£o da recomendaÃ§Ã£o.",

    reason:
      "RecomendaÃ§Ã£o criada para teste.",

    confidence:
      0.85,

    priority:
      "HIGH",

    source:
      "RULE_ENGINE",

    expiresAt:
      null,

    acceptedAt:
      null,

    rejectedAt:
      null,

    executedActionId:
      null,

    createdAt:
      "2026-07-22T14:00:00.000Z",

    updatedAt:
      "2026-07-22T14:00:00.000Z",

    ...overrides,
  }
}

describe(
  "createStrategySteps",
  () => {
    it(
      "deve criar um passo para cada recomendaÃ§Ã£o",
      () => {
        const recommendations = [
          createRecommendation(
            "SEND_MESSAGE",
          ),

          createRecommendation(
            "CREATE_TASK",
            {
              id:
                "recommendation-task",
            },
          ),
        ]

        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations,
            now:
              NOW,
          })

        expect(
          result,
        ).toHaveLength(2)

        expect(
          result[0]?.sourceRecommendationId,
        ).toBe(
          recommendations[0]?.id,
        )

        expect(
          result[1]?.sourceRecommendationId,
        ).toBe(
          recommendations[1]?.id,
        )
      },
    )

    it(
      "deve ordenar as recomendaÃ§Ãµes pela prioridade",
      () => {
        const lowRecommendation =
          createRecommendation(
            "SEND_MESSAGE",
            {
              id:
                "recommendation-low",
              priority:
                "LOW",
            },
          )

        const urgentRecommendation =
          createRecommendation(
            "CREATE_TASK",
            {
              id:
                "recommendation-urgent",
              priority:
                "URGENT",
            },
          )

        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              lowRecommendation,
              urgentRecommendation,
            ],
            now:
              NOW,
          })

        expect(
          result[0]?.sourceRecommendationId,
        ).toBe(
          urgentRecommendation.id,
        )

        expect(
          result[1]?.sourceRecommendationId,
        ).toBe(
          lowRecommendation.id,
        )
      },
    )

    it(
      "deve usar a confianÃ§a como desempate de prioridade",
      () => {
        const lowerConfidence =
          createRecommendation(
            "SEND_MESSAGE",
            {
              id:
                "recommendation-lower-confidence",
              confidence:
                0.7,
            },
          )

        const higherConfidence =
          createRecommendation(
            "CREATE_TASK",
            {
              id:
                "recommendation-higher-confidence",
              confidence:
                0.95,
            },
          )

        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              lowerConfidence,
              higherConfidence,
            ],
            now:
              NOW,
          })

        expect(
          result[0]?.sourceRecommendationId,
        ).toBe(
          higherConfidence.id,
        )
      },
    )

    it(
      "deve usar a data de criaÃ§Ã£o como Ãºltimo desempate",
      () => {
        const newerRecommendation =
          createRecommendation(
            "SEND_MESSAGE",
            {
              id:
                "recommendation-newer",
              createdAt:
                "2026-07-22T14:30:00.000Z",
            },
          )

        const olderRecommendation =
          createRecommendation(
            "CREATE_TASK",
            {
              id:
                "recommendation-older",
              createdAt:
                "2026-07-22T13:30:00.000Z",
            },
          )

        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              newerRecommendation,
              olderRecommendation,
            ],
            now:
              NOW,
          })

        expect(
          result[0]?.sourceRecommendationId,
        ).toBe(
          olderRecommendation.id,
        )
      },
    )

    it(
      "deve deixar o primeiro passo pronto para execuÃ§Ã£o",
      () => {
        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              createRecommendation(
                "SEND_MESSAGE",
              ),

              createRecommendation(
                "CREATE_TASK",
                {
                  id:
                    "recommendation-task",
                },
              ),
            ],
            now:
              NOW,
          })

        expect(
          result[0]?.status,
        ).toBe(
          "READY",
        )

        expect(
          result[1]?.status,
        ).toBe(
          "PENDING",
        )

        expect(
          result[0]?.position,
        ).toBe(1)

        expect(
          result[1]?.position,
        ).toBe(2)
      },
    )

    it(
      "deve agendar o primeiro passo imediatamente",
      () => {
        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              createRecommendation(
                "SEND_MESSAGE",
              ),
            ],
            now:
              NOW,
          })

        expect(
          result[0]?.waitBeforeMinutes,
        ).toBe(0)

        expect(
          result[0]?.scheduledFor,
        ).toBe(
          NOW.toISOString(),
        )
      },
    )

    it(
      "deve acumular o tempo de espera entre os passos",
      () => {
        const firstRecommendation =
          createRecommendation(
            "CREATE_TASK",
            {
              id:
                "recommendation-first",
              priority:
                "URGENT",
            },
          )

        const secondRecommendation =
          createRecommendation(
            "SEND_MESSAGE",
            {
              id:
                "recommendation-second",
              priority:
                "HIGH",
            },
          )

        const thirdRecommendation =
          createRecommendation(
            "SEND_NOTIFICATION",
            {
              id:
                "recommendation-third",
              priority:
                "NORMAL",
            },
          )

        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              thirdRecommendation,
              secondRecommendation,
              firstRecommendation,
            ],
            now:
              NOW,
          })

        expect(
          result[0]?.scheduledFor,
        ).toBe(
          "2026-07-22T15:00:00.000Z",
        )

        expect(
          result[1]?.waitBeforeMinutes,
        ).toBe(
          24 * 60,
        )

        expect(
          result[1]?.scheduledFor,
        ).toBe(
          "2026-07-23T15:00:00.000Z",
        )

        expect(
          result[2]?.waitBeforeMinutes,
        ).toBe(60)

        expect(
          result[2]?.scheduledFor,
        ).toBe(
          "2026-07-23T16:00:00.000Z",
        )
      },
    )

    it(
      "deve definir o canal correto para cada aÃ§Ã£o",
      () => {
        const result =
          createStrategySteps({
            strategyId:
              "strategy-test",
            recommendations: [
              createRecommendation(
                "SEND_MESSAGE",
                {
                  id:
                    "recommendation-message",
                  priority:
                    "URGENT",
                },
              ),

              createRecommendation(
                "CREATE_PROPOSAL",
                {
                  id:
                    "recommendation-proposal",
                  priority:
                    "HIGH",
                },
              ),

              createRecommendation(
                "CREATE_TASK",
                {
                  id:
                    "recommendation-task",
                  priority:
                    "NORMAL",
                },
              ),

              createRecommendation(
                "TRIGGER_AUTOMATION",
                {
                  id:
                    "recommendation-automation",
                  priority:
                    "LOW",
                },
              ),
            ],
            now:
              NOW,
          })

        expect(
          result.map(
            (step) =>
              step.channel,
          ),
        ).toEqual([
          "WHATSAPP",
          "EMAIL",
          "INTERNAL",
          "AUTOMATION",
        ])
      },
    )

    it(
      "nÃ£o deve modificar a lista original de recomendaÃ§Ãµes",
      () => {
        const recommendations = [
          createRecommendation(
            "SEND_MESSAGE",
            {
              id:
                "recommendation-low",
              priority:
                "LOW",
            },
          ),

          createRecommendation(
            "CREATE_TASK",
            {
              id:
                "recommendation-urgent",
              priority:
                "URGENT",
            },
          ),
        ]

        const originalSnapshot =
          structuredClone(
            recommendations,
          )

        createStrategySteps({
          strategyId:
            "strategy-test",
          recommendations,
          now:
            NOW,
        })

        expect(
          recommendations,
        ).toEqual(
          originalSnapshot,
        )
      },
    )
  },
)
