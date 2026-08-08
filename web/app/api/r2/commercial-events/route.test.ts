import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  findAfterCursor: vi.fn(),
  repositoryConstructor: vi.fn(),
}))

vi.mock(
  "@/infrastructure/prisma/repositories/commercial/prisma-commercial-event-repository",
  () => ({
    PrismaCommercialEventRepository:
      class PrismaCommercialEventRepositoryMock {
        constructor(
          workspaceId: string,
        ) {
          mocks.repositoryConstructor(
            workspaceId,
          )
        }

        findAfterCursor =
          mocks.findAfterCursor
      },
  }),
)

import {
  GET,
} from "./route"

function request(
  query: string,
): Request {
  return new Request(
    `http://localhost/api/r2/commercial-events?${query}`,
  )
}

describe(
  "GET /api/r2/commercial-events",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.findAfterCursor.mockResolvedValue([])
    })

    it(
      "rejeita requisição sem workspace",
      async () => {
        const response = await GET(
          request(
            "afterCreatedAt=2026-08-02T22%3A00%3A00.000Z",
          ),
        )

        expect(response.status).toBe(400)
      },
    )

    it(
      "isola a leitura no workspace autenticado",
      async () => {
        const response = await GET(
          request(
            "workspaceId=workspace-2&afterCreatedAt=2026-08-02T22%3A00%3A00.000Z",
          ),
        )

        expect(response.status).toBe(403)
        expect(mocks.findAfterCursor).not.toHaveBeenCalled()
      },
    )

    it(
      "retorna lote e cursor do último evento persistido",
      async () => {
        mocks.findAfterCursor.mockResolvedValue([
          {
            id: "event-2",
            workspaceId: "workspace-1",
            journeyId: "journey-1",
            type: "OPPORTUNITY_CREATED",
            actorType: "CONSULTANT",
            actorId: "user-1",
            payload: {},
            occurredAt: "2026-08-02T22:01:00.000Z",
            createdAt: "2026-08-02T22:01:00.000Z",
            updatedAt: "2026-08-02T22:01:00.000Z",
          },
        ])

        const response = await GET(
          request(
            "workspaceId=workspace-1&afterCreatedAt=2026-08-02T22%3A00%3A00.000Z&afterEventId=event-1&limit=25",
          ),
        )

        expect(response.status).toBe(200)
        expect(
          response.headers.get(
            "Cache-Control",
          ),
        ).toBe("no-store")

        expect(mocks.repositoryConstructor).toHaveBeenCalledExactlyOnceWith(
          "workspace-1",
        )
        expect(mocks.findAfterCursor).toHaveBeenCalledExactlyOnceWith({
          cursor: {
            createdAt:
              "2026-08-02T22:00:00.000Z",
            eventId:
              "event-1",
          },
          limit: 25,
        })

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          hasMore: false,
          nextCursor: {
            createdAt:
              "2026-08-02T22:01:00.000Z",
            eventId:
              "event-2",
          },
        })
      },
    )
  },
)
