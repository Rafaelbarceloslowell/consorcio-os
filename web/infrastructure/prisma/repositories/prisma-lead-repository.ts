import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Lead,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    LeadMapper,
  } from "@/infrastructure/prisma/mappers/lead-mapper"
  
  export class PrismaLeadRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de leads não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Lead[]> {
      const leads =
        await this.database.lead.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
  
      return leads.map((lead) =>
        LeadMapper.toDomain(lead),
      )
    }
  
    async findById(
      leadId: string,
    ): Promise<Lead | undefined> {
      if (!leadId.trim()) {
        return undefined
      }
  
      const lead =
        await this.database.lead.findFirst({
          where: {
            id: leadId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!lead) {
        return undefined
      }
  
      return LeadMapper.toDomain(lead)
    }
  
    async create(
      lead: Lead,
    ): Promise<Lead> {
      const createdLead =
        await this.database.lead.create({
          data: LeadMapper.toPersistence({
            workspaceId: this.workspaceId,
            lead,
          }),
        })
  
      return LeadMapper.toDomain(
        createdLead,
      )
    }
  
    async update(
      lead: Lead,
    ): Promise<Lead | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingLead =
            await transaction.lead.findFirst({
              where: {
                id: lead.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingLead) {
            return undefined
          }
  
          const updatedLead =
            await transaction.lead.update({
              where: {
                id: existingLead.id,
              },
              data: LeadMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                lead,
              }),
            })
  
          return LeadMapper.toDomain(
            updatedLead,
          )
        },
      )
    }
  
    async delete(
      leadId: string,
    ): Promise<boolean> {
      if (!leadId.trim()) {
        return false
      }
  
      const result =
        await this.database.lead.deleteMany({
          where: {
            id: leadId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  }