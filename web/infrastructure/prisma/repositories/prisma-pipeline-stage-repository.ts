import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    PipelineStage,
    PipelineStageType,
  } from "@/types/domain/pipeline-stage"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    PipelineStageMapper,
  } from "@/infrastructure/prisma/mappers/pipeline-stage-mapper"
  
  export class PrismaPipelineStageRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de etapas do pipeline não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<PipelineStage[]> {
      const pipelineStages =
        await this.database.pipelineStage.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: [
            {
              type: "asc",
            },
            {
              order: "asc",
            },
          ],
        })
  
      return pipelineStages.map((pipelineStage) =>
        PipelineStageMapper.toDomain(
          pipelineStage,
        ),
      )
    }
  
    async findById(
      pipelineStageId: string,
    ): Promise<PipelineStage | undefined> {
      if (!pipelineStageId.trim()) {
        return undefined
      }
  
      const pipelineStage =
        await this.database.pipelineStage.findFirst({
          where: {
            id: pipelineStageId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!pipelineStage) {
        return undefined
      }
  
      return PipelineStageMapper.toDomain(
        pipelineStage,
      )
    }
  
    async findByType(
      type: PipelineStageType,
    ): Promise<PipelineStage[]> {
      const prismaType =
        type === "lead"
          ? "LEAD"
          : "DEAL"
  
      const pipelineStages =
        await this.database.pipelineStage.findMany({
          where: {
            workspaceId: this.workspaceId,
            type: prismaType,
          },
          orderBy: {
            order: "asc",
          },
        })
  
      return pipelineStages.map((pipelineStage) =>
        PipelineStageMapper.toDomain(
          pipelineStage,
        ),
      )
    }
  
    async findByTypeAndOrder({
      type,
      order,
    }: {
      type: PipelineStageType
      order: number
    }): Promise<PipelineStage | undefined> {
      const prismaType =
        type === "lead"
          ? "LEAD"
          : "DEAL"
  
      const pipelineStage =
        await this.database.pipelineStage.findUnique({
          where: {
            workspaceId_type_order: {
              workspaceId:
                this.workspaceId,
              type:
                prismaType,
              order,
            },
          },
        })
  
      if (!pipelineStage) {
        return undefined
      }
  
      return PipelineStageMapper.toDomain(
        pipelineStage,
      )
    }
  
    async create(
      pipelineStage: PipelineStage,
    ): Promise<PipelineStage> {
      const createdPipelineStage =
        await this.database.pipelineStage.create({
          data: PipelineStageMapper.toPersistence({
            workspaceId:
              this.workspaceId,
            pipelineStage,
          }),
        })
  
      return PipelineStageMapper.toDomain(
        createdPipelineStage,
      )
    }
  
    async update(
      pipelineStage: PipelineStage,
    ): Promise<PipelineStage | undefined> {
      const existingPipelineStage =
        await this.database.pipelineStage.findFirst({
          where: {
            id: pipelineStage.id,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!existingPipelineStage) {
        return undefined
      }
  
      const updatedPipelineStage =
        await this.database.pipelineStage.update({
          where: {
            id: existingPipelineStage.id,
          },
          data: PipelineStageMapper.toPersistence({
            workspaceId:
              this.workspaceId,
            pipelineStage,
          }),
        })
  
      return PipelineStageMapper.toDomain(
        updatedPipelineStage,
      )
    }
  
    async delete(
      pipelineStageId: string,
    ): Promise<boolean> {
      if (!pipelineStageId.trim()) {
        return false
      }
  
      const result =
        await this.database.pipelineStage.deleteMany({
          where: {
            id: pipelineStageId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  }