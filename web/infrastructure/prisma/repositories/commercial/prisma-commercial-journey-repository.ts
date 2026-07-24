import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialJourney,
  } from "@/types/domain"
  
  import type {
    AsyncCommercialJourneyRepository,
  } from "@/repositories/commercial/async-commercial-repositories"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    CommercialJourneyMapper,
  } from "@/infrastructure/prisma/mappers/commercial-journey-mapper"
  
  export class PrismaCommercialJourneyRepository
    implements AsyncCommercialJourneyRepository
  {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de jornadas comerciais nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<CommercialJourney[]> {
      const journeys =
        await this.database.commercialJourney.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
  
      return journeys.map((journey) =>
        CommercialJourneyMapper.toDomain(
          journey,
        ),
      )
    }
  
    async findById(
      journeyId: string,
    ): Promise<CommercialJourney | undefined> {
      if (!journeyId.trim()) {
        return undefined
      }
  
      const journey =
        await this.database.commercialJourney.findFirst({
          where: {
            id: journeyId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!journey) {
        return undefined
      }
  
      return CommercialJourneyMapper.toDomain(
        journey,
      )
    }
  
    async findByLeadId(
      leadId: string,
    ): Promise<CommercialJourney[]> {
      if (!leadId.trim()) {
        return []
      }
  
      const journeys =
        await this.database.commercialJourney.findMany({
          where: {
            workspaceId: this.workspaceId,
            leadId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
  
      return journeys.map((journey) =>
        CommercialJourneyMapper.toDomain(
          journey,
        ),
      )
    }
  
    async findByClientId(
      clientId: string,
    ): Promise<CommercialJourney[]> {
      if (!clientId.trim()) {
        return []
      }
  
      const journeys =
        await this.database.commercialJourney.findMany({
          where: {
            workspaceId: this.workspaceId,
            clientId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
  
      return journeys.map((journey) =>
        CommercialJourneyMapper.toDomain(
          journey,
        ),
      )
    }
  
    async findByConsultantId(
      consultantId: string,
    ): Promise<CommercialJourney[]> {
      if (!consultantId.trim()) {
        return []
      }
  
      const journeys =
        await this.database.commercialJourney.findMany({
          where: {
            workspaceId: this.workspaceId,
            consultantId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
  
      return journeys.map((journey) =>
        CommercialJourneyMapper.toDomain(
          journey,
        ),
      )
    }
  
    async create(
      journey: CommercialJourney,
    ): Promise<CommercialJourney> {
      this.validateJourneyWorkspace(
        journey,
      )
  
      const createdJourney =
        await this.database.commercialJourney.create({
          data: CommercialJourneyMapper.toPersistence({
            workspaceId: this.workspaceId,
            journey,
          }),
        })
  
      return CommercialJourneyMapper.toDomain(
        createdJourney,
      )
    }
  
    async update(
      journey: CommercialJourney,
    ): Promise<CommercialJourney | undefined> {
      this.validateJourneyWorkspace(
        journey,
      )
  
      return this.database.$transaction(
        async (transaction) => {
          const existingJourney =
            await transaction.commercialJourney.findFirst({
              where: {
                id: journey.id,
                workspaceId: this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingJourney) {
            return undefined
          }
  
          const updatedJourney =
            await transaction.commercialJourney.update({
              where: {
                id: existingJourney.id,
              },
              data: CommercialJourneyMapper.toPersistence({
                workspaceId: this.workspaceId,
                journey,
              }),
            })
  
          return CommercialJourneyMapper.toDomain(
            updatedJourney,
          )
        },
      )
    }
  
    async delete(
      journeyId: string,
    ): Promise<boolean> {
      if (!journeyId.trim()) {
        return false
      }
  
      const result =
        await this.database.commercialJourney.deleteMany({
          where: {
            id: journeyId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private validateJourneyWorkspace(
      journey: CommercialJourney,
    ): void {
      if (
        journey.workspaceId !==
        this.workspaceId
      ) {
        throw new Error(
          "A jornada comercial pertence a outro workspace.",
        )
      }
    }
  }