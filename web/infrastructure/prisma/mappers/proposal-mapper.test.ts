import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    Prisma,
    ProposalStatus as PrismaProposalStatus,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Proposal as PrismaProposal,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Proposal,
  } from "@/types/domain"
  
  import {
    ProposalMapper,
  } from "./proposal-mapper"
  
  function assertDefined<T>(
    value: T | undefined,
    fieldName: string,
  ): asserts value is T {
    if (value === undefined) {
      throw new Error(
        `O campo obrigatório "${fieldName}" não foi preenchido pelo mapper.`,
      )
    }
  }
  
  describe("ProposalMapper", () => {
    const domainProposal: Proposal = {
      id: "proposal-1",
      code: "PROP-2026-001",
      clientId: "client-1",
      leadId: undefined,
      consultantId: "consultant-1",
      consortiumId: "consortium-1",
      creditValue: 500000,
      installmentValue: 1397.5,
      termMonths: 220,
      administrationFeePercent: 18,
      reserveFundPercent: 2,
      status: "sent",
      sentAt:
        "2026-07-23T15:00:00.000Z",
      validUntil:
        "2026-07-30T23:59:59.000Z",
      acceptedAt: undefined,
      rejectedAt: undefined,
      rejectionReason: undefined,
      notes:
        "Proposta de consórcio imobiliário.",
      createdAt:
        "2026-07-23T14:00:00.000Z",
      updatedAt:
        "2026-07-23T15:00:00.000Z",
    }
  
    const prismaProposal: PrismaProposal = {
      id: "proposal-1",
      workspaceId: "workspace-1",
      code: "PROP-2026-001",
      clientId: "client-1",
      leadId: null,
      consultantId: "consultant-1",
      consortiumId: "consortium-1",
      creditValue:
        new Prisma.Decimal("500000"),
      installmentValue:
        new Prisma.Decimal("1397.50"),
      termMonths: 220,
      administrationFeePercent:
        new Prisma.Decimal("18"),
      reserveFundPercent:
        new Prisma.Decimal("2"),
      status: PrismaProposalStatus.SENT,
      sentAt:
        new Date(
          "2026-07-23T15:00:00.000Z",
        ),
      validUntil:
        new Date(
          "2026-07-30T23:59:59.000Z",
        ),
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      notes:
        "Proposta de consórcio imobiliário.",
      createdAt:
        new Date(
          "2026-07-23T14:00:00.000Z",
        ),
      updatedAt:
        new Date(
          "2026-07-23T15:00:00.000Z",
        ),
    }
  
    it("deve converter uma proposta do Prisma para o domínio", () => {
      const result =
        ProposalMapper.toDomain(
          prismaProposal,
        )
  
      expect(result).toEqual(
        domainProposal,
      )
    })
  
    it("deve converter uma proposta do domínio para persistência", () => {
      const result =
        ProposalMapper.toPersistence({
          workspaceId: "workspace-1",
          proposal: domainProposal,
        })
  
      expect(result).toEqual({
        id: "proposal-1",
        workspaceId: "workspace-1",
        code: "PROP-2026-001",
        clientId: "client-1",
        leadId: null,
        consultantId: "consultant-1",
        consortiumId: "consortium-1",
        creditValue: 500000,
        installmentValue: 1397.5,
        termMonths: 220,
        administrationFeePercent: 18,
        reserveFundPercent: 2,
        status:
          PrismaProposalStatus.SENT,
        sentAt:
          new Date(
            "2026-07-23T15:00:00.000Z",
          ),
        validUntil:
          new Date(
            "2026-07-30T23:59:59.000Z",
          ),
        acceptedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        notes:
          "Proposta de consórcio imobiliário.",
        createdAt:
          new Date(
            "2026-07-23T14:00:00.000Z",
          ),
        updatedAt:
          new Date(
            "2026-07-23T15:00:00.000Z",
          ),
      })
    })
  
    it("deve converter valores nulos do Prisma para campos opcionais", () => {
      const result =
        ProposalMapper.toDomain({
          ...prismaProposal,
          clientId: null,
          leadId: null,
          sentAt: null,
          acceptedAt: null,
          rejectedAt: null,
          rejectionReason: null,
          notes: null,
        })
  
      expect(
        result.clientId,
      ).toBeUndefined()
  
      expect(
        result.leadId,
      ).toBeUndefined()
  
      expect(
        result.sentAt,
      ).toBeUndefined()
  
      expect(
        result.acceptedAt,
      ).toBeUndefined()
  
      expect(
        result.rejectedAt,
      ).toBeUndefined()
  
      expect(
        result.rejectionReason,
      ).toBeUndefined()
  
      expect(
        result.notes,
      ).toBeUndefined()
    })
  
    it("deve converter campos opcionais ausentes para null na persistência", () => {
      const result =
        ProposalMapper.toPersistence({
          workspaceId: "workspace-1",
          proposal: {
            ...domainProposal,
            clientId: undefined,
            leadId: undefined,
            sentAt: undefined,
            acceptedAt: undefined,
            rejectedAt: undefined,
            rejectionReason: undefined,
            notes: undefined,
          },
        })
  
      expect(
        result.clientId,
      ).toBeNull()
  
      expect(
        result.leadId,
      ).toBeNull()
  
      expect(
        result.sentAt,
      ).toBeNull()
  
      expect(
        result.acceptedAt,
      ).toBeNull()
  
      expect(
        result.rejectedAt,
      ).toBeNull()
  
      expect(
        result.rejectionReason,
      ).toBeNull()
  
      expect(
        result.notes,
      ).toBeNull()
    })
  
    it("deve preservar corretamente todos os status suportados", () => {
      const statuses: Proposal["status"][] = [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
      ]
  
      for (const status of statuses) {
        const persistence =
          ProposalMapper.toPersistence({
            workspaceId: "workspace-1",
            proposal: {
              ...domainProposal,
              status,
            },
          })
  
        assertDefined(
          persistence.status,
          "status",
        )
  
        const restored =
          ProposalMapper.toDomain({
            ...prismaProposal,
            status: persistence.status,
          })
  
        expect(
          restored.status,
        ).toBe(status)
      }
    })
  
    it("deve preservar corretamente os valores decimais", () => {
      const result =
        ProposalMapper.toDomain({
          ...prismaProposal,
          creditValue:
            new Prisma.Decimal(
              "987654.32",
            ),
          installmentValue:
            new Prisma.Decimal(
              "2789.45",
            ),
          administrationFeePercent:
            new Prisma.Decimal(
              "19.7500",
            ),
          reserveFundPercent:
            new Prisma.Decimal(
              "2.5000",
            ),
        })
  
      expect(
        result.creditValue,
      ).toBe(987654.32)
  
      expect(
        result.installmentValue,
      ).toBe(2789.45)
  
      expect(
        result.administrationFeePercent,
      ).toBe(19.75)
  
      expect(
        result.reserveFundPercent,
      ).toBe(2.5)
    })
  
    it("deve preservar uma proposta vinculada somente ao lead", () => {
      const result =
        ProposalMapper.toDomain({
          ...prismaProposal,
          clientId: null,
          leadId: "lead-1",
        })
  
      expect(
        result.clientId,
      ).toBeUndefined()
  
      expect(
        result.leadId,
      ).toBe("lead-1")
    })
  
    it("deve preservar as datas de aceite e rejeição", () => {
      const acceptedAt =
        new Date(
          "2026-07-24T10:00:00.000Z",
        )
  
      const rejectedAt =
        new Date(
          "2026-07-25T11:00:00.000Z",
        )
  
      const result =
        ProposalMapper.toDomain({
          ...prismaProposal,
          acceptedAt,
          rejectedAt,
          rejectionReason:
            "Cliente decidiu aguardar.",
        })
  
      expect(
        result.acceptedAt,
      ).toBe(
        acceptedAt.toISOString(),
      )
  
      expect(
        result.rejectedAt,
      ).toBe(
        rejectedAt.toISOString(),
      )
  
      expect(
        result.rejectionReason,
      ).toBe(
        "Cliente decidiu aguardar.",
      )
    })
  })