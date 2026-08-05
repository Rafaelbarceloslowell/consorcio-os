import type {
  CommercialEvent,
} from "@/types/domain"

export type CommercialEventSubscriber = (
  event: CommercialEvent,
) => void | Promise<void>

const subscribers =
  new Set<CommercialEventSubscriber>()

export function publishCommercialEvent(
  event: CommercialEvent,
): void {
  const currentSubscribers =
    Array.from(subscribers)

  for (const subscriber of currentSubscribers) {
    try {
      void Promise
        .resolve(
          subscriber(event),
        )
        .catch(() => undefined)
    } catch {
      // Presentation listeners must never interrupt the commercial operation.
    }
  }
}

export function subscribeCommercialEvent(
  subscriber: CommercialEventSubscriber,
): () => void {
  subscribers.add(subscriber)

  return () => {
    subscribers.delete(subscriber)
  }
}