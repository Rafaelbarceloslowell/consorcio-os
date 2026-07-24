import {
    ConsultantRole as PrismaConsultantRole,
    ConsultantStatus as PrismaConsultantStatus,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Prisma,
    Consultant as PrismaConsultant,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Consultant,
    ConsultantRole,
    ConsultantStatus,
  } from "@/types/domain/consultant"
  
  const consultantRoleToPrisma: Record<
    ConsultantRole,
    PrismaConsultantRole
  > = {
    consultant:
      PrismaConsultantRole.CONSULTANT,
    manager:
      PrismaConsultantRole.MANAGER,
    admin:
      PrismaConsultantRole.ADMIN,
  }
  
  const consultantRoleToDomain: Record<
    PrismaConsultantRole,
    ConsultantRole
  > = {
    [PrismaConsultantRole.CONSULTANT]:
      "consultant",
  
    [PrismaConsultantRole.MANAGER]:
      "manager",
  
    [PrismaConsultantRole.ADMIN]:
      "admin",
  }
  
  const consultantStatusToPrisma: Record<
    ConsultantStatus,
    PrismaConsultantStatus
  > = {
    active:
      PrismaConsultantStatus.ACTIVE,
  
    inactive:
      PrismaConsultantStatus.INACTIVE,
  
    on_leave:
      PrismaConsultantStatus.ON_LEAVE,
  }
  
  const consultantStatusToDomain: Record<
    PrismaConsultantStatus,
    ConsultantStatus
  > = {
    [PrismaConsultantStatus.ACTIVE]:
      "active",
  
    [PrismaConsultantStatus.INACTIVE]:
      "inactive",
  
    [PrismaConsultantStatus.ON_LEAVE]:
      "on_leave",
  }
  
  export type ConsultantPersistenceInput = {
    workspaceId: string
    consultant: Consultant
  }
  
  export class ConsultantMapper {
    static toDomain(
      raw: PrismaConsultant,
    ): Consultant {
      return {
        id: raw.id,
  
        name: raw.name,
  
        email: raw.email,
  
        phone: raw.phone,
  
        document: raw.document,
  
        role:
          consultantRoleToDomain[
            raw.role
          ],
  
        team: raw.team,
  
        region: raw.region,
  
        avatarUrl:
          raw.avatarUrl ?? undefined,
  
        status:
          consultantStatusToDomain[
            raw.status
          ],
  
        monthlySalesTarget:
          Number(
            raw.monthlySalesTarget,
          ),
  
        monthlyLeadsTarget:
          raw.monthlyLeadsTarget,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      consultant,
    }: ConsultantPersistenceInput): Prisma.ConsultantUncheckedCreateInput {
      return {
        id: consultant.id,
  
        workspaceId,
  
        name:
          consultant.name,
  
        email:
          consultant.email,
  
        phone:
          consultant.phone,
  
        document:
          consultant.document,
  
        role:
          consultantRoleToPrisma[
            consultant.role
          ],
  
        team:
          consultant.team,
  
        region:
          consultant.region,
  
        avatarUrl:
          consultant.avatarUrl ??
          null,
  
        status:
          consultantStatusToPrisma[
            consultant.status
          ],
  
        monthlySalesTarget:
          consultant.monthlySalesTarget,
  
        monthlyLeadsTarget:
          consultant.monthlyLeadsTarget,
  
        createdAt:
          new Date(
            consultant.createdAt,
          ),
  
        updatedAt:
          new Date(
            consultant.updatedAt,
          ),
      }
    }
  }