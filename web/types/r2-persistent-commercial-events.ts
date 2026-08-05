import type {
  CommercialEvent,
} from "@/types/domain"

export type R2CommercialEventCursor = Readonly<{
  createdAt: string
  eventId: string
}>

export type R2CommercialEventBatch = Readonly<{
  events: readonly CommercialEvent[]
  nextCursor: R2CommercialEventCursor
  hasMore: boolean
}>
