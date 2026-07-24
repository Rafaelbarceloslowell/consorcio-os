import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Consultant,
  } from "@/types/domain/consultant"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    ConsultantMapper,
  } from "@/infrastructure/prisma/mappers/consultant-mapper"
  
  export class PrismaConsultantRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de consultores não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Consultant[]> {
      const consultants =
        await this.database.consultant.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            name: "asc",
          },
        })
  
      return consultants.map((consultant) =>
        ConsultantMapper.toDomain(
          consultant,
        ),
      )
    }
  
    async findById(
      consultantId: string,
    ): Promise<Consultant | undefined> {
      if (!consultantId.trim()) {
        return undefined
      }
  
      const consultant =
        await this.database.consultant.findFirst({
          where: {
            id: consultantId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!consultant) {
        return undefined
      }
  
      return ConsultantMapper.toDomain(
        consultant,
      )
    }
  
    async findByEmail(
      email: string,
    ): Promise<Consultant | undefined> {
      const normalizedEmail =
        email.trim().toLowerCase()
  
      if (!normalizedEmail) {
        return undefined
      }
  
      const consultant =
        await this.database.consultant.findFirst({
          where: {
            workspaceId: this.workspaceId,
            email: normalizedEmail,
          },
        })
  
      if (!consultant) {
        return undefined
      }
  
      return ConsultantMapper.toDomain(
        consultant,
      )
    }
  
    async findByDocument(
      document: string,
    ): Promise<Consultant | undefined> {
      const normalizedDocument =
        document.trim()
  
      if (!normalizedDocument) {
        return undefined
      }
  
      const consultant =
        await this.database.consultant.findFirst({
          where: {
            workspaceId: this.workspaceId,
            document: normalizedDocument,
          },
        })
  
      if (!consultant) {
        return undefined
      }
  
      return ConsultantMapper.toDomain(
        consultant,
      )
    }
  
    async create(
      consultant: Consultant,
    ): Promise<Consultant> {
      const createdConsultant =
        await this.database.consultant.create({
          data: ConsultantMapper.toPersistence({
            workspaceId:
              this.workspaceId,
            consultant,
          }),
        })
  
      return ConsultantMapper.toDomain(
        createdConsultant,
      )
    }
  
    async update(
      consultant: Consultant,
    ): Promise<Consultant | undefined> {
      const existingConsultant =
        await this.database.consultant.findFirst({
          where: {
            id: consultant.id,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!existingConsultant) {
        return undefined
      }
  
      const updatedConsultant =
        await this.database.consultant.update({
          where: {
            id: existingConsultant.id,
          },
          data: ConsultantMapper.toPersistence({
            workspaceId:
              this.workspaceId,
            consultant,
          }),
        })
  
      return ConsultantMapper.toDomain(
        updatedConsultant,
      )
    }
  
    async delete(
      consultantId: string,
    ): Promise<boolean> {
      if (!consultantId.trim()) {
        return false
      }
  
      const result =
        await this.database.consultant.deleteMany({
          where: {
            id: consultantId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  }