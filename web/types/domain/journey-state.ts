import type { EntityId, Timestamps } from "./common"

export type JourneyState = {
  id: EntityId

  workspaceId: EntityId

  phaseId: EntityId

  code: string

  name: string

  description?: string

  order: number

  color?: string

  icon?: string

  isInitial: boolean

  isFinal: boolean

  isWon: boolean

  isLost: boolean

  allowReopen: boolean

  isActive: boolean
} & Timestamps