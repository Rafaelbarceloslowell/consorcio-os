import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Consortium,
  } from "@/types/domain/consortium"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    ConsortiumMapper,
  } from "@/infrastructure/prisma/mappers/consortium-mapper"
  
  export class PrismaConsortiumRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de consórcios não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Consortium[]> {
      const consortiums =
        await this.database.consortium.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: [
            {
              administrator: "asc",
            },
            {
              groupNumber: "asc",
            },
          ],
        })
  
      return consortiums.map((consortium) =>
        ConsortiumMapper.toDomain(
          consortium,
        ),
      )
    }
  
    async findById(
      consortiumId: string,
    ): Promise<Consortium | undefined> {
      if (!consortiumId.trim()) {
        return undefined
      }
  
      const consortium =
        await this.database.consortium.findFirst({
          where: {
            id: consortiumId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!consortium) {
        return undefined
      }
  
      return ConsortiumMapper.toDomain(
        consortium,
      )
    }
  
    async findByAdministratorAndGroupNumber({
      administrator,
      groupNumber,
    }: {
      administrator: string
      groupNumber: string
    }): Promise<Consortium | undefined> {
      const normalizedAdministrator =
        administrator.trim()
  
      const normalizedGroupNumber =
        groupNumber.trim()
  
      if (
        !normalizedAdministrator ||
        !normalizedGroupNumber
      ) {
        return undefined
      }
  
      const consortium =
        await this.database.consortium.findUnique({
          where: {
            workspaceId_administrator_groupNumber: {
              workspaceId:
                this.workspaceId,
              administrator:
                normalizedAdministrator,
              groupNumber:
                normalizedGroupNumber,
            },
          },
        })
  
      if (!consortium) {
        return undefined
      }
  
      return ConsortiumMapper.toDomain(
        consortium,
      )
    }
  
    async create(
      consortium: Consortium,
    ): Promise<Consortium> {
      const createdConsortium =
        await this.database.consortium.create({
          data: ConsortiumMapper.toPersistence({
            workspaceId:
              this.workspaceId,
            consortium,
          }),
        })
  
      return ConsortiumMapper.toDomain(
        createdConsortium,
      )
    }
  
    async update(
      consortium: Consortium,
    ): Promise<Consortium | undefined> {
      const existingConsortium =
        await this.database.consortium.findFirst({
          where: {
            id: consortium.id,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!existingConsortium) {
        return undefined
      }
  
      const updatedConsortium =
        await this.database.consortium.update({
          where: {
            id: existingConsortium.id,
          },
          data: ConsortiumMapper.toPersistence({
            workspaceId:
              this.workspaceId,
            consortium,
          }),
        })
  
      return ConsortiumMapper.toDomain(
        updatedConsortium,
      )
    }
  
    async delete(
      consortiumId: string,
    ): Promise<boolean> {
      if (!consortiumId.trim()) {
        return false
      }
  
      const result =
        await this.database.consortium.deleteMany({
          where: {
            id: consortiumId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  }