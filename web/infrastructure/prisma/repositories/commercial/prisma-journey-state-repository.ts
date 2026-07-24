import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    JourneyState,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    JourneyStateMapper,
  } from "@/infrastructure/prisma/mappers/journey-state-mapper"
  
  export class PrismaJourneyStateRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de estados da jornada nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<JourneyState[]> {
      const states =
        await this.database.journeyState.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: [
            {
              phaseId: "asc",
            },
            {
              order: "asc",
            },
          ],
        })
  
      return states.map((state) =>
        JourneyStateMapper.toDomain(
          state,
        ),
      )
    }
  
    async findById(
      stateId: string,
    ): Promise<JourneyState | undefined> {
      if (!stateId.trim()) {
        return undefined
      }
  
      const state =
        await this.database.journeyState.findFirst({
          where: {
            id: stateId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!state) {
        return undefined
      }
  
      return JourneyStateMapper.toDomain(
        state,
      )
    }
  
    async create(
      state: JourneyState,
    ): Promise<JourneyState> {
      const createdState =
        await this.database.journeyState.create({
          data: JourneyStateMapper.toPersistence({
            workspaceId: this.workspaceId,
            state,
          }),
        })
  
      return JourneyStateMapper.toDomain(
        createdState,
      )
    }
  
    async update(
      state: JourneyState,
    ): Promise<JourneyState | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingState =
            await transaction.journeyState.findFirst({
              where: {
                id: state.id,
                workspaceId: this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingState) {
            return undefined
          }
  
          const updatedState =
            await transaction.journeyState.update({
              where: {
                id: existingState.id,
              },
              data: JourneyStateMapper.toPersistence({
                workspaceId: this.workspaceId,
                state,
              }),
            })
  
          return JourneyStateMapper.toDomain(
            updatedState,
          )
        },
      )
    }
  
    async delete(
      stateId: string,
    ): Promise<boolean> {
      if (!stateId.trim()) {
        return false
      }
  
      const result =
        await this.database.journeyState.deleteMany({
          where: {
            id: stateId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  }