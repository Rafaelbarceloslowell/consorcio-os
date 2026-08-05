import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  CommercialEvent,
} from "@/types/domain"

import {
  publishCommercialEvent,
  subscribeCommercialEvent,
} from "./commercial-event-dispatcher"

function event(
  id: string,
): CommercialEvent {
  const now =
    "2026-08-02T17:30:00.000Z"

  return {
    id,
    workspaceId:
      "workspace-test",
    journeyId:
      "journey-test",
    type:
      "LEAD_REPLIED",
    actorType:
      "LEAD",
    actorId:
      "lead-test",
    payload: {
      channel:
        "WHATSAPP",
    },
    occurredAt:
      now,
    createdAt:
      now,
    updatedAt:
      now,
  }
}

describe(
  "commercial-event-dispatcher",
  () => {
    it(
      "publica o evento para o assinante e permite cancelar a assinatura",
      () => {
        const subscriber =
          vi.fn()

        const unsubscribe =
          subscribeCommercialEvent(
            subscriber,
          )

        const firstEvent =
          event("event-first")

        publishCommercialEvent(
          firstEvent,
        )

        expect(
          subscriber,
        ).toHaveBeenCalledWith(
          firstEvent,
        )

        unsubscribe()

        publishCommercialEvent(
          event("event-second"),
        )

        expect(
          subscriber,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      "isola uma falha de apresentaÃ§Ã£o sem bloquear os outros assinantes",
      () => {
        const healthySubscriber =
          vi.fn()

        const unsubscribeFailure =
          subscribeCommercialEvent(
            () => {
              throw new Error(
                "Falha simulada do consumidor.",
              )
            },
          )

        const unsubscribeHealthy =
          subscribeCommercialEvent(
            healthySubscriber,
          )

        const commercialEvent =
          event("event-isolated")

        expect(() =>
          publishCommercialEvent(
            commercialEvent,
          ),
        ).not.toThrow()

        expect(
          healthySubscriber,
        ).toHaveBeenCalledWith(
          commercialEvent,
        )

        unsubscribeFailure()
        unsubscribeHealthy()
      },
    )
  },
)