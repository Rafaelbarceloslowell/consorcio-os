import {
  ConsortiumRuleSource as PrismaConsortiumRuleSource,
  ConsortiumRuleStatus as PrismaConsortiumRuleStatus,
  ConsortiumStatus as PrismaConsortiumStatus,
    ConsortiumType as PrismaConsortiumType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Consortium as PrismaConsortium,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
  Consortium,
  ConsortiumRuleSource,
  ConsortiumRuleStatus,
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
        ruleStatus:
          ConsortiumMapper.toDomainRuleStatus(
            raw.ruleStatus,
          ),
        ruleSource:
          raw.ruleSource
            ? ConsortiumMapper.toDomainRuleSource(
                raw.ruleSource,
              )
            : undefined,
        sourceReference:
          raw.sourceReference ?? undefined,
        verifiedAt:
          raw.verifiedAt?.toISOString(),
        effectiveFrom:
          raw.effectiveFrom?.toISOString(),
        effectiveUntil:
          raw.effectiveUntil?.toISOString(),
        ruleVersion:
          raw.ruleVersion,
        minInstallmentValue:
          raw.minInstallmentValue
            ?.toNumber(),
        maxInstallmentValue:
          raw.maxInstallmentValue
            ?.toNumber(),
        embeddedBidAllowed:
          raw.embeddedBidAllowed ??
          undefined,
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
        ruleStatus:
          ConsortiumMapper.toPersistenceRuleStatus(
            consortium.ruleStatus ??
              "unverified",
          ),
        ruleSource:
          consortium.ruleSource
            ? ConsortiumMapper.toPersistenceRuleSource(
                consortium.ruleSource,
              )
            : null,
        sourceReference:
          consortium.sourceReference ??
          null,
        verifiedAt:
          consortium.verifiedAt ?? null,
        effectiveFrom:
          consortium.effectiveFrom ??
          null,
        effectiveUntil:
          consortium.effectiveUntil ??
          null,
        ruleVersion:
          consortium.ruleVersion ?? 1,
        minInstallmentValue:
          consortium.minInstallmentValue ??
          null,
        maxInstallmentValue:
          consortium.maxInstallmentValue ??
          null,
        embeddedBidAllowed:
          consortium.embeddedBidAllowed ??
          null,
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

    private static toDomainRuleStatus(
      status: PrismaConsortiumRuleStatus,
    ): ConsortiumRuleStatus {
      switch (status) {
        case PrismaConsortiumRuleStatus.VERIFIED:
          return "verified"
        case PrismaConsortiumRuleStatus.STALE:
          return "stale"
        case PrismaConsortiumRuleStatus.UNVERIFIED:
          return "unverified"
        default:
          return ConsortiumMapper.assertNever(
            status,
            "status de verificação da regra",
          )
      }
    }

    private static toPersistenceRuleStatus(
      status: ConsortiumRuleStatus,
    ): PrismaConsortiumRuleStatus {
      switch (status) {
        case "verified":
          return PrismaConsortiumRuleStatus.VERIFIED
        case "stale":
          return PrismaConsortiumRuleStatus.STALE
        case "unverified":
          return PrismaConsortiumRuleStatus.UNVERIFIED
        default:
          return ConsortiumMapper.assertNever(
            status,
            "status de verificação da regra",
          )
      }
    }

    private static toDomainRuleSource(
      source: PrismaConsortiumRuleSource,
    ): ConsortiumRuleSource {
      switch (source) {
        case PrismaConsortiumRuleSource.MANUAL_VERIFIED:
          return "manual_verified"
        case PrismaConsortiumRuleSource.OFFICIAL_DOCUMENT:
          return "official_document"
        case PrismaConsortiumRuleSource.OFFICIAL_API:
          return "official_api"
        case PrismaConsortiumRuleSource.OPERATOR_VERIFIED:
          return "operator_verified"
        default:
          return ConsortiumMapper.assertNever(
            source,
            "fonte da regra",
          )
      }
    }

    private static toPersistenceRuleSource(
      source: ConsortiumRuleSource,
    ): PrismaConsortiumRuleSource {
      switch (source) {
        case "manual_verified":
          return PrismaConsortiumRuleSource.MANUAL_VERIFIED
        case "official_document":
          return PrismaConsortiumRuleSource.OFFICIAL_DOCUMENT
        case "official_api":
          return PrismaConsortiumRuleSource.OFFICIAL_API
        case "operator_verified":
          return PrismaConsortiumRuleSource.OPERATOR_VERIFIED
        default:
          return ConsortiumMapper.assertNever(
            source,
            "fonte da regra",
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
