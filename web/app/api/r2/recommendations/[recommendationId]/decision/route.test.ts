import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  findRecommendation: vi.fn(),
  createAction: vi.fn(),
  updateRecommendation: vi.fn(),
  createEvent: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findFirst:
          mocks.findWorkspace,
      },
      nextBestAction: {
        findFirst:
          mocks.findRecommendation,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

import {
  POST,
} from "./route"

const recommendation = {
  id: "recommendation-1",
  workspaceId: "workspace-1",
  journeyId: "journey-1",
  actionType: "SEND_MESSAGE",
  title: "Retomar contato",
  description: null,
  reason: "O cliente aguarda retorno.",
  acceptedAt: null,
  rejectedAt: null,
  executedActionId: null,
  expiresAt: null,
  journey: {
    id: "journey-1",
    consultantId: "consultant-1",
  },
}

function request(
  body: unknown,
): Request {
  return new Request(
    "http://localhost/api/r2/recommendations/recommendation-1/decision",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  )
}

const context = {
  params: Promise.resolve({
    recommendationId:
      "recommendation-1",
  }),
}

describe(
  "POST /api/r2/recommendations/[recommendationId]/decision",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      mocks.findWorkspace.mockResolvedValue({
        id: "workspace-1",
      })
      mocks.findRecommendation.mockResolvedValue(
        recommendation,
      )
      mocks.createAction.mockResolvedValue({
        id: "action-1",
      })
      mocks.updateRecommendation.mockResolvedValue({
        count: 1,
      })
      mocks.createEvent.mockResolvedValue({
        id: "event-1",
      })
      mocks.transaction.mockImplementation(
        async (
          operation: (
            transaction: unknown,
          ) => unknown,
        ) =>
          operation({
            commercialAction: {
              create:
                mocks.createAction,
            },
            nextBestAction: {
              updateMany:
                mocks.updateRecommendation,
            },
            commercialEvent: {
              create:
                mocks.createEvent,
            },
          }),
      )
    })

    it(
      "aceita a recomendação, cria a ação e registra o histórico",
      async () => {
        const response = await POST(
          request({
            workspaceId: "workspace-1",
            consultantId:
              "consultant-1",
            decision: "ACCEPT",
          }),
          context,
        )

        expect(response.status).toBe(200)
        expect(
          mocks.createAction,
        ).toHaveBeenCalledWith({
          data: expect.objectContaining({
            workspaceId: "workspace-1",
            journeyId: "journey-1",
            type: "SEND_MESSAGE",
            status: "PENDING",
            origin:
              "NEXT_BEST_ACTION",
            actorType: "CONSULTANT",
            actorId: "consultant-1",
            scheduledFor:
              expect.any(Date),
          }),
          select: {
            id: true,
          },
        })
        expect(
          mocks.updateRecommendation,
        ).toHaveBeenCalledWith({
          where: expect.objectContaining({
            id: "recommendation-1",
            acceptedAt: null,
            rejectedAt: null,
            executedActionId: null,
          }),
          data: expect.objectContaining({
            acceptedAt:
              expect.any(Date),
            executedActionId:
              "action-1",
          }),
        })
        expect(
          mocks.createEvent,
        ).toHaveBeenCalledWith({
          data: expect.objectContaining({
            type: "NOTE_ADDED",
            actorId: "consultant-1",
            payload:
              expect.objectContaining({
                decision: "ACCEPT",
                recommendationId:
                  "recommendation-1",
              }),
          }),
        })
      },
    )

    it(
      "agenda a recomendação para o dia seguinte",
      async () => {
        const response = await POST(
          request({
            workspaceId: "workspace-1",
            consultantId:
              "consultant-1",
            decision: "POSTPONE",
            postponeMinutes: 1440,
          }),
          context,
        )

        expect(response.status).toBe(200)

        const call =
          mocks.createAction.mock.calls[0]?.[0]
        const scheduledFor =
          call?.data?.scheduledFor as Date

        expect(scheduledFor).toBeInstanceOf(Date)
        expect(
          scheduledFor.getTime(),
        ).toBeGreaterThan(Date.now())
      },
    )

    it(
      "descarta sem criar ação externa e registra a decisão",
      async () => {
        const response = await POST(
          request({
            workspaceId: "workspace-1",
            consultantId:
              "consultant-1",
            decision: "REJECT",
          }),
          context,
        )

        expect(response.status).toBe(200)
        expect(
          mocks.createAction,
        ).not.toHaveBeenCalled()
        expect(
          mocks.updateRecommendation,
        ).toHaveBeenCalledWith({
          where: expect.any(Object),
          data: {
            rejectedAt:
              expect.any(Date),
          },
        })
        expect(
          mocks.createEvent,
        ).toHaveBeenCalledTimes(1)
      },
    )

    it(
      "impede outro consultor de decidir a recomendação",
      async () => {
        const response = await POST(
          request({
            workspaceId: "workspace-1",
            consultantId:
              "consultant-2",
            decision: "ACCEPT",
          }),
          context,
        )

        expect(response.status).toBe(403)
        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita recomendação já decidida",
      async () => {
        mocks.findRecommendation.mockResolvedValue({
          ...recommendation,
          acceptedAt:
            new Date(
              "2026-08-03T22:00:00.000Z",
            ),
        })

        const response = await POST(
          request({
            workspaceId: "workspace-1",
            consultantId:
              "consultant-1",
            decision: "ACCEPT",
          }),
          context,
        )

        expect(response.status).toBe(409)
        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "valida o workspace antes de ler a recomendação",
      async () => {
        mocks.findWorkspace.mockResolvedValue(null)

        const response = await POST(
          request({
            workspaceId: "workspace-2",
            consultantId:
              "consultant-1",
            decision: "ACCEPT",
          }),
          context,
        )

        expect(response.status).toBe(403)
        expect(
          mocks.findRecommendation,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
