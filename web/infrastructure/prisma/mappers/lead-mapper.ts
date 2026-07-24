import {
    ConsortiumType as PrismaConsortiumType,
    LeadSource as PrismaLeadSource,
    LeadStatus as PrismaLeadStatus,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Lead as PrismaLead,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    ConsortiumType,
    Lead,
    LeadSource,
    LeadStatus,
  } from "@/types/domain"
  
  const leadSourceToPrisma: Record<
    LeadSource,
    PrismaLeadSource
  > = {
    referral: PrismaLeadSource.REFERRAL,
    website: PrismaLeadSource.WEBSITE,
    social_media: PrismaLeadSource.SOCIAL_MEDIA,
    cold_call: PrismaLeadSource.COLD_CALL,
    event: PrismaLeadSource.EVENT,
    partner: PrismaLeadSource.PARTNER,
    walk_in: PrismaLeadSource.WALK_IN,
    other: PrismaLeadSource.OTHER,
  }
  
  const leadSourceToDomain: Record<
    PrismaLeadSource,
    LeadSource
  > = {
    [PrismaLeadSource.REFERRAL]: "referral",
    [PrismaLeadSource.WEBSITE]: "website",
    [PrismaLeadSource.SOCIAL_MEDIA]: "social_media",
    [PrismaLeadSource.COLD_CALL]: "cold_call",
    [PrismaLeadSource.EVENT]: "event",
    [PrismaLeadSource.PARTNER]: "partner",
    [PrismaLeadSource.WALK_IN]: "walk_in",
    [PrismaLeadSource.OTHER]: "other",
  }
  
  const leadStatusToPrisma: Record<
    LeadStatus,
    PrismaLeadStatus
  > = {
    new: PrismaLeadStatus.NEW,
    contacted: PrismaLeadStatus.CONTACTED,
    qualified: PrismaLeadStatus.QUALIFIED,
    negotiating: PrismaLeadStatus.NEGOTIATING,
    converted: PrismaLeadStatus.CONVERTED,
    lost: PrismaLeadStatus.LOST,
  }
  
  const leadStatusToDomain: Record<
    PrismaLeadStatus,
    LeadStatus
  > = {
    [PrismaLeadStatus.NEW]: "new",
    [PrismaLeadStatus.CONTACTED]: "contacted",
    [PrismaLeadStatus.QUALIFIED]: "qualified",
    [PrismaLeadStatus.NEGOTIATING]: "negotiating",
    [PrismaLeadStatus.CONVERTED]: "converted",
    [PrismaLeadStatus.LOST]: "lost",
  }
  
  const consortiumTypeToPrisma: Record<
    ConsortiumType,
    PrismaConsortiumType
  > = {
    real_estate:
      PrismaConsortiumType.REAL_ESTATE,
    vehicle:
      PrismaConsortiumType.VEHICLE,
    heavy_vehicle:
      PrismaConsortiumType.HEAVY_VEHICLE,
    services:
      PrismaConsortiumType.SERVICES,
    other:
      PrismaConsortiumType.OTHER,
  }
  
  const consortiumTypeToDomain: Record<
    PrismaConsortiumType,
    ConsortiumType
  > = {
    [PrismaConsortiumType.REAL_ESTATE]:
      "real_estate",
    [PrismaConsortiumType.VEHICLE]:
      "vehicle",
    [PrismaConsortiumType.HEAVY_VEHICLE]:
      "heavy_vehicle",
    [PrismaConsortiumType.SERVICES]:
      "services",
    [PrismaConsortiumType.OTHER]:
      "other",
  }
  
  export type LeadPersistenceInput = {
    workspaceId: string
    lead: Lead
  }
  
  export class LeadMapper {
    static toDomain(
      raw: PrismaLead,
    ): Lead {
      return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        document:
          raw.document ?? undefined,
        companyName:
          raw.companyName ?? undefined,
        source:
          leadSourceToDomain[raw.source],
        status:
          leadStatusToDomain[raw.status],
        consortiumType:
          consortiumTypeToDomain[
            raw.consortiumType
          ],
        desiredCreditValue:
          Number(raw.desiredCreditValue),
        desiredTermMonths:
          raw.desiredTermMonths,
        consultantId:
          raw.consultantId,
        pipelineStageId:
          raw.pipelineStageId,
        score:
          raw.score,
        lostReason:
          raw.lostReason ?? undefined,
        notes:
          raw.notes ?? undefined,
        convertedClientId:
          raw.convertedClientId ?? undefined,
        lastContactAt:
          raw.lastContactAt?.toISOString(),
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      lead,
    }: LeadPersistenceInput): Prisma.LeadUncheckedCreateInput {
      return {
        id: lead.id,
        workspaceId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        document:
          lead.document ?? null,
        companyName:
          lead.companyName ?? null,
        source:
          leadSourceToPrisma[lead.source],
        status:
          leadStatusToPrisma[lead.status],
        consortiumType:
          consortiumTypeToPrisma[
            lead.consortiumType
          ],
        desiredCreditValue:
          lead.desiredCreditValue,
        desiredTermMonths:
          lead.desiredTermMonths,
        consultantId:
          lead.consultantId,
        pipelineStageId:
          lead.pipelineStageId,
        score:
          lead.score,
        lostReason:
          lead.lostReason ?? null,
        notes:
          lead.notes ?? null,
        convertedClientId:
          lead.convertedClientId ?? null,
        lastContactAt:
          lead.lastContactAt
            ? new Date(lead.lastContactAt)
            : null,
        createdAt:
          new Date(lead.createdAt),
        updatedAt:
          new Date(lead.updatedAt),
      }
    }
  }