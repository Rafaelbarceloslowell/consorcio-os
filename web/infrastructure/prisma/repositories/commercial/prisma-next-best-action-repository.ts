import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    NextBestAction,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    NextBestActionMapper,
  } from "@/infrastructure/prisma/mappers/next-best-action-mapper"
  
  export class PrismaNextBestActionRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de proximas melhores acoes nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<NextBestAction[]> {
      const nextBestActions =
        await this.database.nextBestAction.findMany({
          where: {
            workspaceId:
              this.workspaceId,
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              confidence: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return nextBestActions.map(
        (nextBestAction) =>
          NextBestActionMapper.toDomain(
            nextBestAction,
          ),
      )
    }
  
    async findById(
      nextBestActionId: string,
    ): Promise<NextBestAction | undefined> {
      if (!nextBestActionId.trim()) {
        return undefined
      }
  
      const nextBestAction =
        await this.database.nextBestAction.findFirst({
          where: {
            id: nextBestActionId,
  
            workspaceId:
              this.workspaceId,
          },
        })
  
      if (!nextBestAction) {
        return undefined
      }
  
      return NextBestActionMapper.toDomain(
        nextBestAction,
      )
    }
  
    async findByJourneyId(
      journeyId: string,
    ): Promise<NextBestAction[]> {
      if (!journeyId.trim()) {
        return []
      }
  
      const nextBestActions =
        await this.database.nextBestAction.findMany({
          where: {
            workspaceId:
              this.workspaceId,
  
            journeyId,
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              confidence: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return nextBestActions.map(
        (nextBestAction) =>
          NextBestActionMapper.toDomain(
            nextBestAction,
          ),
      )
    }
  
    async findOpen(): Promise<NextBestAction[]> {
      const now =
        new Date()
  
      const nextBestActions =
        await this.database.nextBestAction.findMany({
          where: {
            workspaceId:
              this.workspaceId,
  
            acceptedAt: null,
  
            rejectedAt: null,
  
            executedActionId: null,
  
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              confidence: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return nextBestActions.map(
        (nextBestAction) =>
          NextBestActionMapper.toDomain(
            nextBestAction,
          ),
      )
    }
  
    async findOpenByJourneyId(
      journeyId: string,
    ): Promise<NextBestAction[]> {
      if (!journeyId.trim()) {
        return []
      }
  
      const now =
        new Date()
  
      const nextBestActions =
        await this.database.nextBestAction.findMany({
          where: {
            workspaceId:
              this.workspaceId,
  
            journeyId,
  
            acceptedAt: null,
  
            rejectedAt: null,
  
            executedActionId: null,
  
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              confidence: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return nextBestActions.map(
        (nextBestAction) =>
          NextBestActionMapper.toDomain(
            nextBestAction,
          ),
      )
    }
  
    async create(
      nextBestAction: NextBestAction,
    ): Promise<NextBestAction> {
      this.validateNextBestActionWorkspace(
        nextBestAction,
      )
  
      await this.validateJourneyOwnership(
        nextBestAction.journeyId,
      )
  
      await this.validateExecutedActionOwnership(
        nextBestAction.executedActionId,
      )
  
      const createdNextBestAction =
        await this.database.nextBestAction.create({
          data:
            NextBestActionMapper.toPersistence({
              workspaceId:
                this.workspaceId,
  
              nextBestAction,
            }),
        })
  
      return NextBestActionMapper.toDomain(
        createdNextBestAction,
      )
    }
  
    async update(
      nextBestAction: NextBestAction,
    ): Promise<NextBestAction | undefined> {
      this.validateNextBestActionWorkspace(
        nextBestAction,
      )
  
      return this.database.$transaction(
        async (transaction) => {
          const existingNextBestAction =
            await transaction.nextBestAction.findFirst({
              where: {
                id:
                  nextBestAction.id,
  
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
  
                journeyId: true,
              },
            })
  
          if (!existingNextBestAction) {
            return undefined
          }
  
          if (
            existingNextBestAction.journeyId !==
            nextBestAction.journeyId
          ) {
            const journey =
              await transaction.commercialJourney.findFirst({
                where: {
                  id:
                    nextBestAction.journeyId,
  
                  workspaceId:
                    this.workspaceId,
                },
                select: {
                  id: true,
                },
              })
  
            if (!journey) {
              throw new Error(
                "A nova jornada da proxima melhor acao nao existe neste workspace.",
              )
            }
          }
  
          if (
            nextBestAction.executedActionId
          ) {
            const executedAction =
              await transaction.commercialAction.findFirst({
                where: {
                  id:
                    nextBestAction.executedActionId,
  
                  workspaceId:
                    this.workspaceId,
  
                  journeyId:
                    nextBestAction.journeyId,
                },
                select: {
                  id: true,
                },
              })
  
            if (!executedAction) {
              throw new Error(
                "A acao executada informada nao existe nesta jornada e workspace.",
              )
            }
          }
  
          const updatedNextBestAction =
            await transaction.nextBestAction.update({
              where: {
                id:
                  existingNextBestAction.id,
              },
              data:
                NextBestActionMapper.toPersistence({
                  workspaceId:
                    this.workspaceId,
  
                  nextBestAction,
                }),
            })
  
          return NextBestActionMapper.toDomain(
            updatedNextBestAction,
          )
        },
      )
    }
  
    async delete(
      nextBestActionId: string,
    ): Promise<boolean> {
      if (!nextBestActionId.trim()) {
        return false
      }
  
      const result =
        await this.database.nextBestAction.deleteMany({
          where: {
            id:
              nextBestActionId,
  
            workspaceId:
              this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private validateNextBestActionWorkspace(
      nextBestAction: NextBestAction,
    ): void {
      if (
        nextBestAction.workspaceId !==
        this.workspaceId
      ) {
        throw new Error(
          "A proxima melhor acao pertence a outro workspace.",
        )
      }
    }
  
    private async validateJourneyOwnership(
      journeyId: string,
    ): Promise<void> {
      const journey =
        await this.database.commercialJourney.findFirst({
          where: {
            id:
              journeyId,
  
            workspaceId:
              this.workspaceId,
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
  
    private async validateExecutedActionOwnership(
      executedActionId: string | null,
    ): Promise<void> {
      if (!executedActionId) {
        return
      }
  
      const executedAction =
        await this.database.commercialAction.findFirst({
          where: {
            id:
              executedActionId,
  
            workspaceId:
              this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!executedAction) {
        throw new Error(
          "A acao executada informada nao existe neste workspace.",
        )
      }
    }
  }