import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    JourneyPhase,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    JourneyPhaseMapper,
  } from "@/infrastructure/prisma/mappers/journey-phase-mapper"
  
  export class PrismaJourneyPhaseRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de fases da jornada nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<JourneyPhase[]> {
      const phases =
        await this.database.journeyPhase.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            order: "asc",
          },
        })
  
      return phases.map((phase) =>
        JourneyPhaseMapper.toDomain(
          phase,
        ),
      )
    }
  
    async findById(
      phaseId: string,
    ): Promise<JourneyPhase | undefined> {
      if (!phaseId.trim()) {
        return undefined
      }
  
      const phase =
        await this.database.journeyPhase.findFirst({
          where: {
            id: phaseId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!phase) {
        return undefined
      }
  
      return JourneyPhaseMapper.toDomain(
        phase,
      )
    }
  
    async create(
      phase: JourneyPhase,
    ): Promise<JourneyPhase> {
      const createdPhase =
        await this.database.journeyPhase.create({
          data: JourneyPhaseMapper.toPersistence({
            workspaceId: this.workspaceId,
            phase,
          }),
        })
  
      return JourneyPhaseMapper.toDomain(
        createdPhase,
      )
    }
  
    async update(
      phase: JourneyPhase,
    ): Promise<JourneyPhase | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingPhase =
            await transaction.journeyPhase.findFirst({
              where: {
                id: phase.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingPhase) {
            return undefined
          }
  
          const updatedPhase =
            await transaction.journeyPhase.update({
              where: {
                id: existingPhase.id,
              },
              data: JourneyPhaseMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                phase,
              }),
            })
  
          return JourneyPhaseMapper.toDomain(
            updatedPhase,
          )
        },
      )
    }
  
    async delete(
      phaseId: string,
    ): Promise<boolean> {
      if (!phaseId.trim()) {
        return false
      }
  
      const result =
        await this.database.journeyPhase.deleteMany({
          where: {
            id: phaseId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  }