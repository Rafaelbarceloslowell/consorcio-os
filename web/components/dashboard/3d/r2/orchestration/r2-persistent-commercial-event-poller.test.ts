// @vitest-environment jsdom

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  CommercialEvent,
} from "@/types/domain"

import {
  createR2InitialCommercialEventCursor,
  createR2PersistentEventCursorStorageKey,
  loadR2CommercialEventCursor,
  startR2PersistentCommercialEventPolling,
} from "./r2-persistent-commercial-event-poller"

function event(
  id: string,
  createdAt: string,
): CommercialEvent {
  return {
    id,
    workspaceId: "workspace-1",
    journeyId: "journey-1",
    type: "OPPORTUNITY_CREATED",
    actorType: "CONSULTANT",
    actorId: "user-1",
    payload: {
      opportunityId:
        "journey-1",
    },
    occurredAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  }
}

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe(
  "persistent R2 commercial event polling",
  () => {
    it(
      "cria cursor inicial com lookback de quinze minutos",
      () => {
        expect(
          createR2InitialCommercialEventCursor(
            new Date(
              "2026-08-02T22:30:00.000Z",
            ),
          ),
        ).toEqual({
          createdAt:
            "2026-08-02T22:15:00.000Z",
          eventId: "",
        })
      },
    )

    it(
      "consome páginas em sequência e persiste o cursor por workspace e usuário",
      async () => {
        vi.useFakeTimers()

        const firstEvent = event(
          "event-1",
          "2026-08-02T22:20:00.000Z",
        )
        const secondEvent = event(
          "event-2",
          "2026-08-02T22:21:00.000Z",
        )

        const fetchImpl = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            Response.json({
              events: [firstEvent],
              nextCursor: {
                createdAt:
                  firstEvent.createdAt,
                eventId:
                  firstEvent.id,
              },
              hasMore: true,
            }),
          )
          .mockResolvedValueOnce(
            Response.json({
              events: [secondEvent],
              nextCursor: {
                createdAt:
                  secondEvent.createdAt,
                eventId:
                  secondEvent.id,
              },
              hasMore: false,
            }),
          )

        const receivedEventIds: string[] = []

        const onEvent = vi.fn(
          async (receivedEvent: CommercialEvent) => {
            receivedEventIds.push(
              receivedEvent.id,
            )
          },
        )

        const stop =
          startR2PersistentCommercialEventPolling({
            workspaceId:
              "workspace-1",
            userId:
              "user-1",
            onEvent,
            fetchImpl,
            origin:
              "http://localhost",
            now: () =>
              new Date(
                "2026-08-02T22:30:00.000Z",
              ),
          })

        await vi.waitFor(() => {
          expect(onEvent).toHaveBeenCalledTimes(2)
        })

        expect(receivedEventIds).toEqual([
          "event-1",
          "event-2",
        ])

        const key =
          createR2PersistentEventCursorStorageKey(
            "workspace-1",
            "user-1",
          )

        expect(
          loadR2CommercialEventCursor(
            window.localStorage,
            key,
          ),
        ).toEqual({
          createdAt:
            secondEvent.createdAt,
          eventId:
            secondEvent.id,
        })

        stop()
      },
    )

    it(
      "não inicia requisições sobrepostas",
      async () => {
        vi.useFakeTimers()

        let resolveRequest:
          ((response: Response) => void) |
          undefined

        const fetchImpl = vi.fn<typeof fetch>(
          () =>
            new Promise<Response>((resolve) => {
              resolveRequest = resolve
            }),
        )

        const stop =
          startR2PersistentCommercialEventPolling({
            workspaceId:
              "workspace-1",
            userId:
              "user-1",
            onEvent:
              async () => undefined,
            fetchImpl,
            origin:
              "http://localhost",
            intervalMs: 1_000,
          })

        await vi.waitFor(() => {
          expect(fetchImpl).toHaveBeenCalledTimes(1)
        })

        await vi.advanceTimersByTimeAsync(5_000)

        expect(fetchImpl).toHaveBeenCalledTimes(1)

        resolveRequest?.(
          Response.json({
            events: [],
            nextCursor:
              createR2InitialCommercialEventCursor(),
            hasMore: false,
          }),
        )

        await Promise.resolve()
        stop()
      },
    )
  },
)
