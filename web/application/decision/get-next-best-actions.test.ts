import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  createMockAsyncCommercialRepositories,
} from "@/repositories/commercial/mock-async-commercial-repositories"
import {
  MockCrmRepository,
} from "@/repositories/crm/mock-crm-repository"

import type {
  CommercialJourney,
  NextBestAction,
} from "@/types/domain"

import {
  getNextBestActions,
} from "./get-next-best-actions"

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
    priority: "NORMAL",
    score: 70,
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

function createNextBestAction(
  journey: CommercialJourney,
  overrides: Partial<NextBestAction> = {},
): NextBestAction {
  return {
    id: "recommendation-test",
    workspaceId: journey.workspaceId,
    journeyId: journey.id,
    actionType: "SEND_MESSAGE",
    title: "Retomar contato",
    description:
      "Enviar uma mensagem personalizada ao lead.",
    reason:
      "A jornada estÃƒÂ¡ sem interaÃƒÂ§ÃƒÂ£o recente.",
    confidence: 0.8,
    priority: "NORMAL",
    source: "RULE_ENGINE",
    expiresAt:
      "2026-07-24T15:00:00.000Z",
    acceptedAt: null,
    rejectedAt: null,
    executedActionId: null,
    createdAt:
      "2026-07-22T12:00:00.000Z",
    updatedAt:
      "2026-07-22T12:00:00.000Z",
    ...overrides,
  }
}

function createCommercialRepository(
  journeys: CommercialJourney[],
  nextBestActions: NextBestAction[] = [],
) {
  return createMockAsyncCommercialRepositories({
    journeys,
    events: [],
    actions: [],
    nextBestActions,
    phases: [],
    states: [],
    workflowRules: [],
  })
}

describe(
  "getNextBestActions",
  () => {
    it(
      "deve retornar recomendaÃƒÂ§ÃƒÂµes abertas com os dados operacionais da jornada",
      async () => {
        const journey =
          createJourney()

        const recommendation =
          createNextBestAction(
            journey,
          )

        const commercialRepository =
          createCommercialRepository(
            [journey],
            [recommendation],
          )

        const crmRepository =
          new MockCrmRepository()
        const recommendationFindAll =
          vi.spyOn(
            commercialRepository
              .nextBestActions,
            "findAll",
          )
        const recommendationFindByJourneyId =
          vi.spyOn(
            commercialRepository
              .nextBestActions,
            "findByJourneyId",
          )

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
          })

        expect(result).toEqual([
          {
            recommendation,
            journeyId: journey.id,
            journeyTitle:
              journey.title,
            leadId: journey.leadId,
            clientId:
              journey.clientId,
            contactName: null,
            approachType: null,
          },
        ])
        expect(
          recommendationFindAll,
        ).toHaveBeenCalledTimes(1)
        expect(
          recommendationFindByJourneyId,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "deve retornar recomendaÃƒÂ§ÃƒÂµes de todas as jornadas quando nenhum consultor for informado",
      async () => {
        const firstJourney =
          createJourney({
            id: "journey-first",
            title: "Primeira jornada",
            leadId: "lead-first",
            consultantId:
              "consultant-first",
          })

        const secondJourney =
          createJourney({
            id: "journey-second",
            title: "Segunda jornada",
            leadId: "lead-second",
            clientId:
              "client-second",
            consultantId:
              "consultant-second",
          })

        const firstRecommendation =
          createNextBestAction(
            firstJourney,
            {
              id:
                "recommendation-first",
              priority: "HIGH",
            },
          )

        const secondRecommendation =
          createNextBestAction(
            secondJourney,
            {
              id:
                "recommendation-second",
              priority: "NORMAL",
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [
              firstJourney,
              secondJourney,
            ],
            [
              firstRecommendation,
              secondRecommendation,
            ],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
          })

        expect(result).toHaveLength(2)

        expect(
          result.map(
            ({
              recommendation,
            }) =>
              recommendation.id,
          ),
        ).toEqual([
          firstRecommendation.id,
          secondRecommendation.id,
        ])
      },
    )

    it(
      "deve filtrar as jornadas pelo consultor informado",
      async () => {
        const selectedJourney =
          createJourney({
            id:
              "journey-selected",
            consultantId:
              "consultant-selected",
          })

        const otherJourney =
          createJourney({
            id: "journey-other",
            consultantId:
              "consultant-other",
          })

        const selectedRecommendation =
          createNextBestAction(
            selectedJourney,
            {
              id:
                "recommendation-selected",
            },
          )

        const otherRecommendation =
          createNextBestAction(
            otherJourney,
            {
              id:
                "recommendation-other",
              priority: "URGENT",
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [
              selectedJourney,
              otherJourney,
            ],
            [
              selectedRecommendation,
              otherRecommendation,
            ],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            consultantId:
              "consultant-selected",
            now: NOW,
          })

        expect(result).toEqual([
          {
            recommendation:
              selectedRecommendation,
            journeyId:
              selectedJourney.id,
            journeyTitle:
              selectedJourney.title,
            leadId:
              selectedJourney.leadId,
            clientId:
              selectedJourney.clientId,
            contactName: null,
            approachType: null,
          },
        ])
      },
    )

    it(
      "deve ignorar recomendaÃƒÂ§ÃƒÂµes aceitas, rejeitadas, executadas, expiradas ou com expiraÃƒÂ§ÃƒÂ£o invÃƒÂ¡lida",
      async () => {
        const journey =
          createJourney()

        const openRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-open",
              expiresAt:
                "2026-07-23T15:00:00.000Z",
            },
          )

        const acceptedRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-accepted",
              acceptedAt:
                "2026-07-22T14:00:00.000Z",
            },
          )

        const rejectedRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-rejected",
              rejectedAt:
                "2026-07-22T14:00:00.000Z",
            },
          )

        const executedRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-executed",
              executedActionId:
                "action-test",
            },
          )

        const expiredRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-expired",
              expiresAt:
                "2026-07-22T14:59:59.000Z",
            },
          )

        const invalidExpirationRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-invalid-expiration",
              expiresAt:
                "data-invalida",
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [journey],
            [
              openRecommendation,
              acceptedRecommendation,
              rejectedRecommendation,
              executedRecommendation,
              expiredRecommendation,
              invalidExpirationRecommendation,
            ],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
          })

        expect(result).toHaveLength(1)

        expect(
          result[0]?.recommendation,
        ).toEqual(
          openRecommendation,
        )
      },
    )

    it(
      "deve considerar aberta uma recomendaÃƒÂ§ÃƒÂ£o sem data de expiraÃƒÂ§ÃƒÂ£o",   
      async () => {
        const journey =
          createJourney()

        const recommendation =
          createNextBestAction(
            journey,
            {
              expiresAt: null,
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [journey],
            [recommendation],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
          })

        expect(result).toHaveLength(1)

        expect(
          result[0]?.recommendation,
        ).toEqual(recommendation)
      },
    )

    it(
      "deve ordenar recomendaÃƒÂ§ÃƒÂµes por prioridade, confianÃƒÂ§a e data de criaÃƒÂ§ÃƒÂ£o",
      async () => {
        const journey =
          createJourney()

        const lowPriority =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-low",
              priority: "LOW",
              confidence: 1,
              createdAt:
                "2026-07-20T10:00:00.000Z",
            },
          )

        const normalPriority =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-normal",
              priority: "NORMAL",
              confidence: 1,
              createdAt:
                "2026-07-20T10:00:00.000Z",
            },
          )

        const highLowerConfidence =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-high-lower-confidence",
              priority: "HIGH",
              confidence: 0.7,
              createdAt:
                "2026-07-20T10:00:00.000Z",
            },
          )

        const highNewer =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-high-newer",
              priority: "HIGH",
              confidence: 0.9,
              createdAt:
                "2026-07-22T10:00:00.000Z",
            },
          )

        const highOlder =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-high-older",
              priority: "HIGH",
              confidence: 0.9,
              createdAt:
                "2026-07-21T10:00:00.000Z",
            },
          )

        const urgentPriority =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-urgent",
              priority: "URGENT",
              confidence: 0.1,
              createdAt:
                "2026-07-22T14:00:00.000Z",
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [journey],
            [
              lowPriority,
              normalPriority,
              highLowerConfidence,
              highNewer,
              highOlder,
              urgentPriority,
            ],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
          })

        expect(
          result.map(
            ({
              recommendation,
            }) =>
              recommendation.id,
          ),
        ).toEqual([
          urgentPriority.id,
          highOlder.id,
          highNewer.id,
          highLowerConfidence.id,
          normalPriority.id,
          lowPriority.id,
        ])
      },
    )

    it(
      "deve aplicar o limite apÃƒÂ³s ordenar as recomendaÃƒÂ§ÃƒÂµes",
      async () => {
        const journey =
          createJourney()

        const urgentRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-urgent",
              priority: "URGENT",
            },
          )

        const highRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-high",
              priority: "HIGH",
            },
          )

        const normalRecommendation =
          createNextBestAction(
            journey,
            {
              id:
                "recommendation-normal",
              priority: "NORMAL",
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [journey],
            [
              normalRecommendation,
              highRecommendation,
              urgentRecommendation,
            ],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
            limit: 2,
          })

        expect(
          result.map(
            ({
              recommendation,
            }) =>
              recommendation.id,
          ),
        ).toEqual([
          urgentRecommendation.id,
          highRecommendation.id,
        ])
      },
    )

    it.each([
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      "deve rejeitar o limite invÃƒÂ¡lido %s",
      async (limit) => {
        const journey =
          createJourney()

        const commercialRepository =
          createCommercialRepository(
            [journey],
          )

        const crmRepository =
          new MockCrmRepository()

        expect(() =>
            getNextBestActions({
              commercialRepository,
              crmRepository,
              now: NOW,
              limit,
            }),
          ).toThrow(
            /inteiro maior que zero/,
          )
      },
    )

    it(
      "deve retornar uma lista vazia quando nÃƒÂ£o houver recomendaÃƒÂ§ÃƒÂµes abertas",
      async () => {
        const journey =
          createJourney()

        const acceptedRecommendation =
          createNextBestAction(
            journey,
            {
              acceptedAt:
                "2026-07-22T14:00:00.000Z",
            },
          )

        const commercialRepository =
          createCommercialRepository(
            [journey],
            [
              acceptedRecommendation,
            ],
          )

        const crmRepository =
          new MockCrmRepository()

        const result =
          await getNextBestActions({
            commercialRepository,
            crmRepository,
            now: NOW,
          })

        expect(result).toEqual([])
      },
    )
  },
)
