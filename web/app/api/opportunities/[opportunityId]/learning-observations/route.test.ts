import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(
  () => ({
    findWorkspace:
      vi.fn(),
    findJourney:
      vi.fn(),
    updateJourney:
      vi.fn(),
    createEvent:
      vi.fn(),
    transaction:
      vi.fn(),
  }),
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
      commercialJourney: {
        findFirst:
          mocks.findJourney,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

import {
  POST,
} from "./route"

const context = {
  params:
    Promise.resolve({
      opportunityId:
        "journey-1",
    }),
}

function request(
  overrides:
    Record<string, unknown> = {},
): Request {
  return new Request(
    "http://localhost/api/opportunities/journey-1/learning-observations",
    {
      method:
        "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body:
        JSON.stringify({
          consultantId:
            "consultant-1",
          contactName:
            "Marina",
          sourceIncomingMessage:
            "Como funciona?",
          originalSuggestion:
            "Podemos conversar?",
          finalSentMessage:
            "Podemos conversar amanhã?",
          customerResponse:
            "Sim.",
          outcome:
            "POSITIVE_RESPONSE",
          intent:
            "interested",
          stage:
            "discovery",
          goal:
            "understand_timing",
          notes:
            null,
          ...overrides,
        }),
    },
  )
}

describe(
  "POST /api/opportunities/[opportunityId]/learning-observations",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      mocks
        .findWorkspace
        .mockResolvedValue({
          id:
            "workspace-1",
        })

      mocks
        .findJourney
        .mockResolvedValue({
          id:
            "journey-1",
          consultantId:
            "consultant-1",
          closedAt:
            null,
        })

      mocks
        .updateJourney
        .mockResolvedValue({
          count: 1,
        })

      mocks
        .createEvent
        .mockResolvedValue({
          id:
            "event-1",
        })

      mocks
        .transaction
        .mockImplementation(
          async (
            operation: (
              transaction: unknown,
            ) => unknown,
          ) =>
            operation({
              commercialJourney: {
                updateMany:
                  mocks.updateJourney,
              },
              commercialEvent: {
                create:
                  mocks.createEvent,
              },
            }),
        )
    })

    it(
      "registra observação append-only sem aplicar aprendizado automático",
      async () => {
        const response =
          await POST(
            request(),
            context,
          )

        expect(
          response.status,
        ).toBe(200)

        expect(
          mocks.createEvent,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              workspaceId:
                "workspace-1",
              journeyId:
                "journey-1",
              type:
                "NOTE_ADDED",
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-1",
              payload:
                expect.objectContaining({
                  category:
                    "r2_learning_observation_recorded",
                  originalSuggestion:
                    "Podemos conversar?",
                  finalSentMessage:
                    "Podemos conversar amanhã?",
                  customerResponse:
                    "Sim.",
                  consultantEdited:
                    true,
                  automaticModelUpdateApplied:
                    false,
                  humanReviewRequired:
                    true,
                }),
            }),
          select: {
            id: true,
          },
        })

        const body =
          await response.json()

        expect(body).toMatchObject({
          observationId:
            "event-1",
          learning: {
            consultantEdited:
              true,
            automaticModelUpdateApplied:
              false,
            humanReviewRequired:
              true,
          },
        })
      },
    )

    it(
      "atualiza somente a última interação e a versão da oportunidade",
      async () => {
        await POST(
          request(),
          context,
        )

        expect(
          mocks.updateJourney,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              id:
                "journey-1",
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-1",
              closedAt:
                null,
            }),
          data: {
            lastInteractionAt:
              expect.any(Date),
            version: {
              increment: 1,
            },
          },
        })
      },
    )

    it(
      "bloqueia resultado positivo sem resposta do cliente",
      async () => {
        const response =
          await POST(
            request({
              customerResponse:
                null,
            }),
            context,
          )

        expect(
          response.status,
        ).toBe(400)

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "aceita resultado sem resposta quando a resposta está vazia",
      async () => {
        const response =
          await POST(
            request({
              customerResponse:
                null,
              outcome:
                "NO_RESPONSE",
            }),
            context,
          )

        expect(
          response.status,
        ).toBe(200)
      },
    )

    it(
      "bloqueia consultor diferente",
      async () => {
        mocks
          .findJourney
          .mockResolvedValue({
            id:
              "journey-1",
            consultantId:
              "consultant-2",
            closedAt:
              null,
          })

        const response =
          await POST(
            request(),
            context,
          )

        expect(
          response.status,
        ).toBe(403)

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "bloqueia oportunidade encerrada",
      async () => {
        mocks
          .findJourney
          .mockResolvedValue({
            id:
              "journey-1",
            consultantId:
              "consultant-1",
            closedAt:
              new Date(),
          })

        const response =
          await POST(
            request(),
            context,
          )

        expect(
          response.status,
        ).toBe(409)

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
