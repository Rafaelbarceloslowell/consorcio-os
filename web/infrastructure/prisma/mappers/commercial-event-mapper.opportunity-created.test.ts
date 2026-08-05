import {
  CommercialActorType as PrismaCommercialActorType,
  CommercialEventType as PrismaCommercialEventType,
} from "@/lib/generated/prisma/client"

import {
  describe,
  expect,
  it,
} from "vitest"

import {
  CommercialEventMapper,
} from "./commercial-event-mapper"

const timestamp =
  "2026-08-02T21:55:00.000Z"

describe(
  "CommercialEventMapper OPPORTUNITY_CREATED",
  () => {
    it(
      "deve mapear o evento para persistência",
      () => {
        expect(
          CommercialEventMapper
            .toPersistence({
              workspaceId:
                "workspace-1",
              event: {
                id:
                  "event-1",
                workspaceId:
                  "workspace-1",
                journeyId:
                  "journey-1",
                type:
                  "OPPORTUNITY_CREATED",
                actorType:
                  "SYSTEM",
                actorId: null,
                payload: {
                  opportunityId:
                    "journey-1",
                },
                occurredAt:
                  timestamp,
                createdAt:
                  timestamp,
                updatedAt:
                  timestamp,
              },
            }),
        ).toMatchObject({
          type:
            PrismaCommercialEventType.OPPORTUNITY_CREATED,
          actorType:
            PrismaCommercialActorType.SYSTEM,
        })
      },
    )

    it(
      "deve mapear o evento persistido para o domínio",
      () => {
        expect(
          CommercialEventMapper
            .toDomain({
              id:
                "event-1",
              workspaceId:
                "workspace-1",
              journeyId:
                "journey-1",
              type:
                PrismaCommercialEventType.OPPORTUNITY_CREATED,
              actorType:
                PrismaCommercialActorType.SYSTEM,
              actorId: null,
              payload: {
                opportunityId:
                  "journey-1",
              },
              occurredAt:
                new Date(timestamp),
              createdAt:
                new Date(timestamp),
              updatedAt:
                new Date(timestamp),
            }),
        ).toMatchObject({
          type:
            "OPPORTUNITY_CREATED",
          actorType:
            "SYSTEM",
        })
      },
    )
  },
)
