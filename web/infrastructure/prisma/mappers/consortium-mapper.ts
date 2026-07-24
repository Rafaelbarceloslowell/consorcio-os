import {
    ConsortiumStatus as PrismaConsortiumStatus,
    ConsortiumType as PrismaConsortiumType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Consortium as PrismaConsortium,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Consortium,
    ConsortiumStatus,
  } from "@/types/domain/consortium"
  
  import type {
    ConsortiumType,
  } from "@/types/domain/common"
  
  type ConsortiumPersistenceInput = {
    workspaceId: string
    consortium: Consortium
  }
  
  export class ConsortiumMapper {
    static toDomain(
      raw: PrismaConsortium,
    ): Consortium {
      return {
        id: raw.id,
        name: raw.name,
        administrator: raw.administrator,
        type: ConsortiumMapper.toDomainType(
          raw.type,
        ),
        groupNumber: raw.groupNumber,
        minCreditValue:
          raw.minCreditValue.toNumber(),
        maxCreditValue:
          raw.maxCreditValue.toNumber(),
        defaultTermMonths:
          raw.defaultTermMonths,
        administrationFeePercent:
          raw.administrationFeePercent.toNumber(),
        reserveFundPercent:
          raw.reserveFundPercent.toNumber(),
        totalQuotas:
          raw.totalQuotas,
        availableQuotas:
          raw.availableQuotas,
        status:
          ConsortiumMapper.toDomainStatus(
            raw.status,
          ),
        description:
          raw.description ?? undefined,
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      consortium,
    }: ConsortiumPersistenceInput): Prisma.ConsortiumUncheckedCreateInput {
      return {
        id: consortium.id,
        workspaceId,
        name: consortium.name,
        administrator:
          consortium.administrator,
        type:
          ConsortiumMapper.toPersistenceType(
            consortium.type,
          ),
        groupNumber:
          consortium.groupNumber,
        minCreditValue:
          consortium.minCreditValue,
        maxCreditValue:
          consortium.maxCreditValue,
        defaultTermMonths:
          consortium.defaultTermMonths,
        administrationFeePercent:
          consortium.administrationFeePercent,
        reserveFundPercent:
          consortium.reserveFundPercent,
        totalQuotas:
          consortium.totalQuotas,
        availableQuotas:
          consortium.availableQuotas,
        status:
          ConsortiumMapper.toPersistenceStatus(
            consortium.status,
          ),
        description:
          consortium.description ?? null,
        createdAt:
          consortium.createdAt,
        updatedAt:
          consortium.updatedAt,
      }
    }
  
    private static toDomainType(
      type: PrismaConsortiumType,
    ): ConsortiumType {
      switch (type) {
        case PrismaConsortiumType.REAL_ESTATE:
          return "real_estate"
  
        case PrismaConsortiumType.VEHICLE:
          return "vehicle"
  
        case PrismaConsortiumType.HEAVY_VEHICLE:
          return "heavy_vehicle"
  
        case PrismaConsortiumType.SERVICES:
          return "services"
  
        case PrismaConsortiumType.OTHER:
          return "other"
  
        default:
          return ConsortiumMapper.assertNever(
            type,
            "tipo de consórcio do Prisma",
          )
      }
    }
  
    private static toPersistenceType(
      type: ConsortiumType,
    ): PrismaConsortiumType {
      switch (type) {
        case "real_estate":
          return PrismaConsortiumType.REAL_ESTATE
  
        case "vehicle":
          return PrismaConsortiumType.VEHICLE
  
        case "heavy_vehicle":
          return PrismaConsortiumType.HEAVY_VEHICLE
  
        case "services":
          return PrismaConsortiumType.SERVICES
  
        case "other":
          return PrismaConsortiumType.OTHER
  
        default:
          return ConsortiumMapper.assertNever(
            type,
            "tipo de consórcio do domínio",
          )
      }
    }
  
    private static toDomainStatus(
      status: PrismaConsortiumStatus,
    ): ConsortiumStatus {
      switch (status) {
        case PrismaConsortiumStatus.FORMING:
          return "forming"
  
        case PrismaConsortiumStatus.ACTIVE:
          return "active"
  
        case PrismaConsortiumStatus.CLOSED:
          return "closed"
  
        default:
          return ConsortiumMapper.assertNever(
            status,
            "status de consórcio do Prisma",
          )
      }
    }
  
    private static toPersistenceStatus(
      status: ConsortiumStatus,
    ): PrismaConsortiumStatus {
      switch (status) {
        case "forming":
          return PrismaConsortiumStatus.FORMING
  
        case "active":
          return PrismaConsortiumStatus.ACTIVE
  
        case "closed":
          return PrismaConsortiumStatus.CLOSED
  
        default:
          return ConsortiumMapper.assertNever(
            status,
            "status de consórcio do domínio",
          )
      }
    }
  
    private static assertNever(
      value: never,
      context: string,
    ): never {
      throw new Error(
        `Valor inválido para ${context}: ${String(value)}`,
      )
    }
  }