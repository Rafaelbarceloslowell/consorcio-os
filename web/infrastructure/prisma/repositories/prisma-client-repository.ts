import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Client,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    ClientMapper,
  } from "@/infrastructure/prisma/mappers/client-mapper"
  
  export class PrismaClientRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de clientes não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Client[]> {
      const clients =
        await this.database.client.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          include: {
            convertedFromLead: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
  
      return clients.map((client) =>
        ClientMapper.toDomain(client),
      )
    }
  
    async findById(
      clientId: string,
    ): Promise<Client | undefined> {
      if (!clientId.trim()) {
        return undefined
      }
  
      const client =
        await this.database.client.findFirst({
          where: {
            id: clientId,
            workspaceId: this.workspaceId,
          },
          include: {
            convertedFromLead: {
              select: {
                id: true,
              },
            },
          },
        })
  
      if (!client) {
        return undefined
      }
  
      return ClientMapper.toDomain(client)
    }
  
    async create(
      client: Client,
    ): Promise<Client> {
      await this.ensureLeadBelongsToWorkspace(
        client.leadId,
      )
  
      const createdClient =
        await this.database.client.create({
          data: ClientMapper.toPersistence({
            workspaceId: this.workspaceId,
            client,
          }),
          include: {
            convertedFromLead: {
              select: {
                id: true,
              },
            },
          },
        })
  
      return ClientMapper.toDomain(
        createdClient,
      )
    }
  
    async update(
      client: Client,
    ): Promise<Client | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingClient =
            await transaction.client.findFirst({
              where: {
                id: client.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingClient) {
            return undefined
          }
  
          if (client.leadId) {
            const lead =
              await transaction.lead.findFirst({
                where: {
                  id: client.leadId,
                  workspaceId:
                    this.workspaceId,
                },
                select: {
                  id: true,
                },
              })
  
            if (!lead) {
              throw new Error(
                "O lead informado não pertence ao workspace do cliente.",
              )
            }
          }
  
          const persistenceData =
            ClientMapper.toPersistence({
              workspaceId:
                this.workspaceId,
              client,
            })
  
          const updatedClient =
            await transaction.client.update({
              where: {
                id: existingClient.id,
              },
              data: {
                ...persistenceData,
                convertedFromLead:
                  client.leadId
                    ? {
                        connect: {
                          id: client.leadId,
                        },
                      }
                    : {
                        disconnect: true,
                      },
              },
              include: {
                convertedFromLead: {
                  select: {
                    id: true,
                  },
                },
              },
            })
  
          return ClientMapper.toDomain(
            updatedClient,
          )
        },
      )
    }
  
    async delete(
      clientId: string,
    ): Promise<boolean> {
      if (!clientId.trim()) {
        return false
      }
  
      const result =
        await this.database.client.deleteMany({
          where: {
            id: clientId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private async ensureLeadBelongsToWorkspace(
      leadId: string | undefined,
    ): Promise<void> {
      if (!leadId) {
        return
      }
  
      const lead =
        await this.database.lead.findFirst({
          where: {
            id: leadId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!lead) {
        throw new Error(
          "O lead informado não pertence ao workspace do cliente.",
        )
      }
    }
  }