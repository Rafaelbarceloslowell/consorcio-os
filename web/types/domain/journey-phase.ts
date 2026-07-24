import type { EntityId, Timestamps } from "./common"

export type JourneyPhase = {
  id: EntityId

  workspaceId: EntityId

  code: string

  name: string

  description?: string

  order: number

  isActive: boolean
} & Timestamps