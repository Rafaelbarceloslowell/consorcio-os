import { describe, expect, it } from "vitest"

import {
  ConsortiumType as PrismaConsortiumType,
  LeadSource as PrismaLeadSource,
  LeadStatus as PrismaLeadStatus,
  Prisma,
} from "@/lib/generated/prisma/client"

import type {
  Lead as PrismaLead,
} from "@/lib/generated/prisma/client"

import type {
  Lead,
} from "@/types/domain"

import {
  LeadMapper,
} from "./lead-mapper"

function assertDefined<T>(
  value: T | undefined,
  fieldName: string,
): asserts value is T {
  if (value === undefined) {
    throw new Error(
      `O campo obrigatorio "${fieldName}" nao foi preenchido pelo mapper.`,
    )
  }
}

describe("LeadMapper", () => {
  const domainLead: Lead = {
    id: "lead-1",
    name: "Rafael Barcelos",
    email: "rafael@example.com",
    phone: "41999999999",
    document: "12345678900",
    companyName: "Seals Consultoria",
    source: "social_media",
    status: "qualified",
    consortiumType: "real_estate",
    desiredCreditValue: 350000,
    desiredTermMonths: 220,
    consultantId: "consultant-1",
    pipelineStageId: "pipeline-stage-1",
    score: 85,
    lostReason: undefined,
    notes: "Lead interessado em imÃƒÂ³vel.",
    convertedClientId: undefined,
    lastContactAt: "2026-07-23T15:00:00.000Z",
    createdAt: "2026-07-23T14:00:00.000Z",
    updatedAt: "2026-07-23T15:00:00.000Z",
  }

  const prismaLead: PrismaLead = {
    id: "lead-1",
    workspaceId: "workspace-1",
    name: "Rafael Barcelos",
    email: "rafael@example.com",
    phone: "41999999999",
    document: "12345678900",
    companyName: "Seals Consultoria",
    source: PrismaLeadSource.SOCIAL_MEDIA,
    status: PrismaLeadStatus.QUALIFIED,
    approachType: null,
    consortiumType:
      PrismaConsortiumType.REAL_ESTATE,
    desiredCreditValue:
      new Prisma.Decimal("350000"),
    desiredTermMonths: 220,
    consultantId: "consultant-1",
    pipelineStageId: "pipeline-stage-1",
    score: 85,
    lostReason: null,
    notes: "Lead interessado em imÃƒÂ³vel.",
    convertedClientId: null,
    lastContactAt:
      new Date("2026-07-23T15:00:00.000Z"),
    createdAt:
      new Date("2026-07-23T14:00:00.000Z"),
    updatedAt:
      new Date("2026-07-23T15:00:00.000Z"),
  }

  it("deve converter um lead do Prisma para o dominio", () => {
    const result =
      LeadMapper.toDomain(prismaLead)

    expect(result).toEqual(domainLead)
  })

  it("deve converter um lead do dominio para persistencia", () => {
    const result =
      LeadMapper.toPersistence({
        workspaceId: "workspace-1",
        lead: domainLead,
      })

    expect(result).toEqual({
      id: "lead-1",
      workspaceId: "workspace-1",
      name: "Rafael Barcelos",
      email: "rafael@example.com",
      phone: "41999999999",
      document: "12345678900",
      companyName: "Seals Consultoria",
      source:
        PrismaLeadSource.SOCIAL_MEDIA,
      status:
        PrismaLeadStatus.QUALIFIED,
    approachType: null,
      consortiumType:
        PrismaConsortiumType.REAL_ESTATE,
      desiredCreditValue: 350000,
      desiredTermMonths: 220,
      consultantId: "consultant-1",
      pipelineStageId: "pipeline-stage-1",
      score: 85,
      lostReason: null,
      notes: "Lead interessado em imÃƒÂ³vel.",
      convertedClientId: null,
      lastContactAt:
        new Date("2026-07-23T15:00:00.000Z"),
      createdAt:
        new Date("2026-07-23T14:00:00.000Z"),
      updatedAt:
        new Date("2026-07-23T15:00:00.000Z"),
    })
  })

  it("deve converter valores nulos do Prisma para campos opcionais", () => {
    const result =
      LeadMapper.toDomain({
        ...prismaLead,
        document: null,
        companyName: null,
        lostReason: null,
        notes: null,
        convertedClientId: null,
        lastContactAt: null,
      })

    expect(result.document).toBeUndefined()
    expect(result.companyName).toBeUndefined()
    expect(result.lostReason).toBeUndefined()
    expect(result.notes).toBeUndefined()
    expect(
      result.convertedClientId,
    ).toBeUndefined()
    expect(
      result.lastContactAt,
    ).toBeUndefined()
  })

  it("deve converter campos opcionais ausentes para null na persistencia", () => {
    const result =
      LeadMapper.toPersistence({
        workspaceId: "workspace-1",
        lead: {
          ...domainLead,
          document: undefined,
          companyName: undefined,
          lostReason: undefined,
          notes: undefined,
          convertedClientId: undefined,
          lastContactAt: undefined,
        },
      })

    expect(result.document).toBeNull()
    expect(result.companyName).toBeNull()
    expect(result.lostReason).toBeNull()
    expect(result.notes).toBeNull()
    expect(
      result.convertedClientId,
    ).toBeNull()
    expect(result.lastContactAt).toBeNull()
  })

  it("deve preservar corretamente todos os enums suportados", () => {
    const sources: Lead["source"][] = [
      "referral",
      "website",
      "social_media",
      "cold_call",
      "event",
      "partner",
      "walk_in",
      "other",
    ]

    const statuses: Lead["status"][] = [
      "new",
      "contacted",
      "qualified",
      "negotiating",
      "converted",
      "lost",
    ]

    const consortiumTypes: Lead["consortiumType"][] = [
      "real_estate",
      "vehicle",
      "heavy_vehicle",
      "services",
      "other",
    ]

    for (const source of sources) {
      const persistence =
        LeadMapper.toPersistence({
          workspaceId: "workspace-1",
          lead: {
            ...domainLead,
            source,
          },
        })

      assertDefined(
        persistence.source,
        "source",
      )

      const restored =
        LeadMapper.toDomain({
          ...prismaLead,
          source: persistence.source,
        })

      expect(restored.source).toBe(source)
    }

    for (const status of statuses) {
      const persistence =
        LeadMapper.toPersistence({
          workspaceId: "workspace-1",
          lead: {
            ...domainLead,
            status,
          },
        })

      assertDefined(
        persistence.status,
        "status",
      )

      const restored =
        LeadMapper.toDomain({
          ...prismaLead,
          status: persistence.status,
        })

      expect(restored.status).toBe(status)
    }

    for (
      const consortiumType
      of consortiumTypes
    ) {
      const persistence =
        LeadMapper.toPersistence({
          workspaceId: "workspace-1",
          lead: {
            ...domainLead,
            consortiumType,
          },
        })

      assertDefined(
        persistence.consortiumType,
        "consortiumType",
      )

      const restored =
        LeadMapper.toDomain({
          ...prismaLead,
          consortiumType:
            persistence.consortiumType,
        })

      expect(
        restored.consortiumType,
      ).toBe(consortiumType)
    }
  })
})