import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  PrismaClient,
} from "@/lib/generated/prisma/client"

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {},
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/commercial-event-mapper",
  () => ({
    CommercialEventMapper: {
      toDomain: vi.fn((event) => event),
    },
  }),
)

import {
  PrismaCommercialEventRepository,
} from "./prisma-commercial-event-repository"

function createDatabase() {
  const findMany = vi.fn()

  return {
    findMany,
    database: {
      commercialEvent: {
        findMany,
      },
    } as unknown as PrismaClient,
  }
}

describe(
  "PrismaCommercialEventRepository cursor read",
  () => {
    it(
      "lista eventos do workspace depois do cursor em ordem determinística",
      async () => {
        const {
          database,
          findMany,
        } = createDatabase()

        findMany.mockResolvedValue([
          {
            id: "event-2",
          },
        ])

        const repository =
          new PrismaCommercialEventRepository(
            "workspace-1",
            database,
          )

        const result =
          await repository.findAfterCursor({
            cursor: {
              createdAt:
                "2026-08-02T22:00:00.000Z",
              eventId:
                "event-1",
            },
            limit: 25,
          })

        expect(result).toEqual([
          {
            id: "event-2",
          },
        ])

        expect(findMany).toHaveBeenCalledExactlyOnceWith({
          where: {
            workspaceId:
              "workspace-1",
            OR: [
              {
                createdAt: {
                  gt: new Date(
                    "2026-08-02T22:00:00.000Z",
                  ),
                },
              },
              {
                createdAt: new Date(
                  "2026-08-02T22:00:00.000Z",
                ),
                id: {
                  gt: "event-1",
                },
              },
            ],
          },
          orderBy: [
            {
              createdAt: "asc",
            },
            {
              id: "asc",
            },
          ],
          take: 25,
        })
      },
    )

    it(
      "rejeita cursor com data inválida antes de consultar o banco",
      async () => {
        const {
          database,
          findMany,
        } = createDatabase()

        const repository =
          new PrismaCommercialEventRepository(
            "workspace-1",
            database,
          )

        await expect(
          repository.findAfterCursor({
            cursor: {
              createdAt: "invalid",
              eventId: "",
            },
            limit: 25,
          }),
        ).rejects.toThrow(
          "O cursor de eventos comerciais precisa de uma data valida.",
        )

        expect(findMany).not.toHaveBeenCalled()
      },
    )
  },
)
