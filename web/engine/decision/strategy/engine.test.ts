import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  CommercialJourney,
  NextBestAction,
} from "@/types/domain"

import {
  runStrategyEngine,
} from "./engine"

const NOW =
  new Date(
    "2026-07-22T15:00:00.000Z",
  )

const NOW_ISO =
  "2026-07-22T15:00:00.000Z"

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
      3,

    createdAt:
      "2026-07-20T12:00:00.000Z",

    updatedAt:
      "2026-07-21T12:00:00.000Z",

    ...overrides,
  }
}

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
  "runStrategyEngine",
  () => {
    it(
      "deve criar uma estratÃ©gia para recomendaÃ§Ãµes vÃ¡lidas",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "CREATE_PROPOSAL",
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy,
        ).not.toBeNull()

        expect(
          result.strategy?.type,
        ).toBe(
          "NEGOTIATION",
        )

        expect(
          result.strategy?.status,
        ).toBe(
          "ACTIVE",
        )

        expect(
          result.strategy?.steps,
        ).toHaveLength(1)

        expect(
          result.warnings,
        ).toEqual([])
      },
    )

    it(
      "nÃ£o deve criar estratÃ©gia para uma jornada encerrada",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney({
                closedAt:
                  "2026-07-22T14:00:00.000Z",
              }),

            recommendations: [
              createRecommendation(
                "SEND_MESSAGE",
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy,
        ).toBeNull()

        expect(
          result.warnings,
        ).toEqual(
          expect.arrayContaining([
            expect.stringContaining(
              "já está encerrada",
            ),
          ]),
        )
      },
    )

    it(
      "nÃ£o deve criar estratÃ©gia sem recomendaÃ§Ãµes",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations:
              [],

            now:
              NOW,
          })

        expect(
          result.strategy,
        ).toBeNull()

        expect(
          result.warnings,
        ).toEqual(
          expect.arrayContaining([
            expect.stringContaining(
              "Nenhuma recomendação",
            ),
          ]),
        )
      },
    )

    it(
      "deve usar a maior prioridade das recomendaÃ§Ãµes",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "CREATE_TASK",
                {
                  id:
                    "recommendation-low",
                  priority:
                    "LOW",
                },
              ),

              createRecommendation(
                "REQUEST_DOCUMENT",
                {
                  id:
                    "recommendation-urgent",
                  priority:
                    "URGENT",
                },
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy?.priority,
        ).toBe(
          "URGENT",
        )
      },
    )

    it(
      "deve calcular a mÃ©dia de confianÃ§a das recomendaÃ§Ãµes",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "CREATE_TASK",
                {
                  id:
                    "recommendation-first",
                  confidence:
                    0.8,
                },
              ),

              createRecommendation(
                "CREATE_PROPOSAL",
                {
                  id:
                    "recommendation-second",
                  confidence:
                    0.9,
                },
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy?.confidence,
        ).toBe(
          0.85,
        )
      },
    )

    it(
      "deve definir a origem como AI quando existir recomendaÃ§Ã£o da IA",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "CREATE_TASK",
              ),

              createRecommendation(
                "CREATE_PROPOSAL",
                {
                  id:
                    "recommendation-ai",
                  source:
                    "AI",
                },
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy?.source,
        ).toBe(
          "AI",
        )
      },
    )

    it(
      "deve usar a primeira expiraÃ§Ã£o disponÃ­vel",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "CREATE_TASK",
                {
                  id:
                    "recommendation-later",
                  expiresAt:
                    "2026-07-25T15:00:00.000Z",
                },
              ),

              createRecommendation(
                "CREATE_PROPOSAL",
                {
                  id:
                    "recommendation-earlier",
                  expiresAt:
                    "2026-07-23T15:00:00.000Z",
                },
              ),

              createRecommendation(
                "ADD_NOTE",
                {
                  id:
                    "recommendation-without-expiration",
                  expiresAt:
                    null,
                },
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy?.expiresAt,
        ).toBe(
          "2026-07-23T15:00:00.000Z",
        )
      },
    )

    it(
      "deve preencher os dados operacionais da estratÃ©gia",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "SEND_MESSAGE",
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy,
        ).toMatchObject({
          workspaceId:
            "workspace-test",

          journeyId:
            "journey-test",

          currentAttempt:
            0,

          currentStepPosition:
            1,

          startedAt:
            NOW_ISO,

          createdAt:
            NOW_ISO,

          updatedAt:
            NOW_ISO,

          pausedAt:
            null,

          completedAt:
            null,

          cancelledAt:
            null,
        })
      },
    )

    it(
      "deve criar identificador determinÃ­stico para a estratÃ©gia",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "REQUEST_DOCUMENT",
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.strategy?.id,
        ).toBe(
          "journey-test:strategy:closing:2026-07-22T15:00:00.000Z",
        )
      },
    )

    it(
      "deve devolver diagnÃ³sticos sobre o planejamento",
      () => {
        const result =
          runStrategyEngine({
            journey:
              createJourney(),

            recommendations: [
              createRecommendation(
                "CREATE_TASK",
              ),
            ],

            now:
              NOW,
          })

        expect(
          result.diagnostics.length,
        ).toBeGreaterThan(0)

        expect(
          result.diagnostics.some(
            (diagnostic) =>
              diagnostic.includes(
                "journey-test",
              ),
          ),
        ).toBe(true)

        expect(
          result.diagnostics.some(
            (diagnostic) =>
              diagnostic.includes(
                "QUALIFICATION",
              ),
          ),
        ).toBe(true)
      },
    )
  },
)

