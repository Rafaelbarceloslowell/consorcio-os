import type { EntityId, Timestamps } from "./common"

export type PipelineStageType = "lead" | "deal"

export type PipelineStage = {
  id: EntityId
  name: string
  order: number
  type: PipelineStageType
  color: string
  description?: string
  winProbability: number
  isClosedStage: boolean
  isWonStage: boolean
} & Timestamps
