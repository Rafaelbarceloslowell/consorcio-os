import {
    PipelineStageType as PrismaPipelineStageType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Prisma,
    PipelineStage as PrismaPipelineStage,
  } from "@/lib/generated/prisma/client"
  
  import type {
    PipelineStage,
    PipelineStageType,
  } from "@/types/domain/pipeline-stage"
  
  const pipelineStageTypeToPrisma: Record<
    PipelineStageType,
    PrismaPipelineStageType
  > = {
    lead: PrismaPipelineStageType.LEAD,
    deal: PrismaPipelineStageType.DEAL,
  }
  
  const pipelineStageTypeToDomain: Record<
    PrismaPipelineStageType,
    PipelineStageType
  > = {
    [PrismaPipelineStageType.LEAD]: "lead",
    [PrismaPipelineStageType.DEAL]: "deal",
  }
  
  export class PipelineStageMapper {
    static toDomain(
      raw: PrismaPipelineStage,
    ): PipelineStage {
      return {
        id: raw.id,
  
        name: raw.name,
  
        order: raw.order,
  
        type:
          pipelineStageTypeToDomain[
            raw.type
          ],
  
        color: raw.color,
  
        description:
          raw.description ?? undefined,
  
        winProbability:
          Number(raw.winProbability),
  
        isClosedStage:
          raw.isClosedStage,
  
        isWonStage:
          raw.isWonStage,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      pipelineStage,
    }: {
      workspaceId: string
      pipelineStage: PipelineStage
    }): Prisma.PipelineStageUncheckedCreateInput {
      return {
        id: pipelineStage.id,
  
        workspaceId,
  
        name: pipelineStage.name,
  
        order: pipelineStage.order,
  
        type:
          pipelineStageTypeToPrisma[
            pipelineStage.type
          ],
  
        color: pipelineStage.color,
  
        description:
          pipelineStage.description ?? null,
  
        winProbability:
          pipelineStage.winProbability,
  
        isClosedStage:
          pipelineStage.isClosedStage,
  
        isWonStage:
          pipelineStage.isWonStage,
  
        createdAt:
          new Date(
            pipelineStage.createdAt,
          ),
  
        updatedAt:
          new Date(
            pipelineStage.updatedAt,
          ),
      }
    }
  }