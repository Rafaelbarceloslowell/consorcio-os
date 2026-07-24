import type {
    CommercialEventType,
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialEvent,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    CommercialEventMapper,
  } from "@/infrastructure/prisma/mappers/commercial-event-mapper"
  
  export class PrismaCommercialEventRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de eventos comerciais nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<CommercialEvent[]> {
      const events =
        await this.database.commercialEvent.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: [
            {
              occurredAt: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return events.map((event) =>
        CommercialEventMapper.toDomain(
          event,
        ),
      )
    }
  
    async findById(
      eventId: string,
    ): Promise<CommercialEvent | undefined> {
      if (!eventId.trim()) {
        return undefined
      }
  
      const event =
        await this.database.commercialEvent.findFirst({
          where: {
            id: eventId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!event) {
        return undefined
      }
  
      return CommercialEventMapper.toDomain(
        event,
      )
    }
  
    async findByJourneyId(
      journeyId: string,
    ): Promise<CommercialEvent[]> {
      if (!journeyId.trim()) {
        return []
      }
  
      const events =
        await this.database.commercialEvent.findMany({
          where: {
            workspaceId: this.workspaceId,
            journeyId,
          },
          orderBy: [
            {
              occurredAt: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return events.map((event) =>
        CommercialEventMapper.toDomain(
          event,
        ),
      )
    }
  
    async findByType(
      type: CommercialEventType,
    ): Promise<CommercialEvent[]> {
      const events =
        await this.database.commercialEvent.findMany({
          where: {
            workspaceId: this.workspaceId,
            type,
          },
          orderBy: [
            {
              occurredAt: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return events.map((event) =>
        CommercialEventMapper.toDomain(
          event,
        ),
      )
    }
  
    async create(
      event: CommercialEvent,
    ): Promise<CommercialEvent> {
      this.validateEventWorkspace(
        event,
      )
  
      await this.validateJourneyOwnership(
        event.journeyId,
      )
  
      const createdEvent =
        await this.database.commercialEvent.create({
          data: CommercialEventMapper.toPersistence({
            workspaceId: this.workspaceId,
            event,
          }),
        })
  
      return CommercialEventMapper.toDomain(
        createdEvent,
      )
    }
  
    async delete(
      eventId: string,
    ): Promise<boolean> {
      if (!eventId.trim()) {
        return false
      }
  
      const result =
        await this.database.commercialEvent.deleteMany({
          where: {
            id: eventId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private validateEventWorkspace(
      event: CommercialEvent,
    ): void {
      if (
        event.workspaceId !==
        this.workspaceId
      ) {
        throw new Error(
          "O evento comercial pertence a outro workspace.",
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