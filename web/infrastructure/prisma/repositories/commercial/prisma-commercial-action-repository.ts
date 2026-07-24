import {
    CommercialActionStatus as PrismaCommercialActionStatus,
  } from "@/lib/generated/prisma/client"
  
  import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialAction,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    CommercialActionMapper,
  } from "@/infrastructure/prisma/mappers/commercial-action-mapper"
  
  export class PrismaCommercialActionRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de acoes comerciais nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<CommercialAction[]> {
      const actions =
        await this.database.commercialAction.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: [
            {
              scheduledFor: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return actions.map((action) =>
        CommercialActionMapper.toDomain(
          action,
        ),
      )
    }
  
    async findById(
      actionId: string,
    ): Promise<CommercialAction | undefined> {
      if (!actionId.trim()) {
        return undefined
      }
  
      const action =
        await this.database.commercialAction.findFirst({
          where: {
            id: actionId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!action) {
        return undefined
      }
  
      return CommercialActionMapper.toDomain(
        action,
      )
    }
  
    async findByJourneyId(
      journeyId: string,
    ): Promise<CommercialAction[]> {
      if (!journeyId.trim()) {
        return []
      }
  
      const actions =
        await this.database.commercialAction.findMany({
          where: {
            workspaceId: this.workspaceId,
            journeyId,
          },
          orderBy: [
            {
              scheduledFor: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return actions.map((action) =>
        CommercialActionMapper.toDomain(
          action,
        ),
      )
    }
  
    async findOpen(): Promise<CommercialAction[]> {
      const actions =
        await this.database.commercialAction.findMany({
          where: {
            workspaceId: this.workspaceId,
  
            status: {
              in: [
                PrismaCommercialActionStatus.PENDING,
                PrismaCommercialActionStatus.IN_PROGRESS,
              ],
            },
          },
          orderBy: [
            {
              scheduledFor: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return actions.map((action) =>
        CommercialActionMapper.toDomain(
          action,
        ),
      )
    }
  
    async findOpenByJourneyId(
      journeyId: string,
    ): Promise<CommercialAction[]> {
      if (!journeyId.trim()) {
        return []
      }
  
      const actions =
        await this.database.commercialAction.findMany({
          where: {
            workspaceId: this.workspaceId,
            journeyId,
  
            status: {
              in: [
                PrismaCommercialActionStatus.PENDING,
                PrismaCommercialActionStatus.IN_PROGRESS,
              ],
            },
          },
          orderBy: [
            {
              scheduledFor: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return actions.map((action) =>
        CommercialActionMapper.toDomain(
          action,
        ),
      )
    }
  
    async create(
      action: CommercialAction,
    ): Promise<CommercialAction> {
      this.validateActionWorkspace(
        action,
      )
  
      await this.validateJourneyOwnership(
        action.journeyId,
      )
  
      const createdAction =
        await this.database.commercialAction.create({
          data: CommercialActionMapper.toPersistence({
            workspaceId: this.workspaceId,
            action,
          }),
        })
  
      return CommercialActionMapper.toDomain(
        createdAction,
      )
    }
  
    async update(
      action: CommercialAction,
    ): Promise<CommercialAction | undefined> {
      this.validateActionWorkspace(
        action,
      )
  
      return this.database.$transaction(
        async (transaction) => {
          const existingAction =
            await transaction.commercialAction.findFirst({
              where: {
                id: action.id,
                workspaceId: this.workspaceId,
              },
              select: {
                id: true,
                journeyId: true,
              },
            })
  
          if (!existingAction) {
            return undefined
          }
  
          if (
            existingAction.journeyId !==
            action.journeyId
          ) {
            const journey =
              await transaction.commercialJourney.findFirst({
                where: {
                  id: action.journeyId,
                  workspaceId: this.workspaceId,
                },
                select: {
                  id: true,
                },
              })
  
            if (!journey) {
              throw new Error(
                "A nova jornada da acao comercial nao existe neste workspace.",
              )
            }
          }
  
          const updatedAction =
            await transaction.commercialAction.update({
              where: {
                id: existingAction.id,
              },
              data: CommercialActionMapper.toPersistence({
                workspaceId: this.workspaceId,
                action,
              }),
            })
  
          return CommercialActionMapper.toDomain(
            updatedAction,
          )
        },
      )
    }
  
    async delete(
      actionId: string,
    ): Promise<boolean> {
      if (!actionId.trim()) {
        return false
      }
  
      const result =
        await this.database.commercialAction.deleteMany({
          where: {
            id: actionId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private validateActionWorkspace(
      action: CommercialAction,
    ): void {
      if (
        action.workspaceId !==
        this.workspaceId
      ) {
        throw new Error(
          "A acao comercial pertence a outro workspace.",
        )
      }
    }
  
    private async validateJourneyOwnership(
      journeyId: string,
    ): Promise<void> {
      const journey =
        await this.database.commercialJourney.findFirst({
          where: {
            id: journeyId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!journey) {
        throw new Error(
          "A jornada comercial informada nao existe neste workspace.",
        )
      }
    }
  }