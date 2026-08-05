import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import {
    ConsortiumType as PrismaConsortiumType,
    LeadSource as PrismaLeadSource,
    LeadStatus as PrismaLeadStatus,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Lead as PrismaLead,
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Lead,
  } from "@/types/domain"
  
  vi.mock(
    "@/infrastructure/prisma/client",
    () => ({
      prisma: {},
    }),
  )
  
  import {
    PrismaLeadRepository,
  } from "./prisma-lead-repository"
  
  type LeadDelegateMock = {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  
  type TransactionMock = {
    lead: LeadDelegateMock
  }
  
  type DatabaseMock = {
    lead: LeadDelegateMock
    $transaction: ReturnType<typeof vi.fn>
  }
  
  const workspaceId = "workspace-1"
  
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
    notes: "Lead interessado em imÃƒÆ’Ã‚Â³vel.",
    convertedClientId: undefined,
    lastContactAt: "2026-07-23T15:00:00.000Z",
    createdAt: "2026-07-23T14:00:00.000Z",
    updatedAt: "2026-07-23T15:00:00.000Z",
  }
  
  const prismaLead: PrismaLead = {
    id: "lead-1",
    workspaceId,
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
    notes: "Lead interessado em imÃƒÆ’Ã‚Â³vel.",
    convertedClientId: null,
    lastContactAt:
      new Date("2026-07-23T15:00:00.000Z"),
    createdAt:
      new Date("2026-07-23T14:00:00.000Z"),
    updatedAt:
      new Date("2026-07-23T15:00:00.000Z"),
  }
  
  function createLeadDelegateMock(): LeadDelegateMock {
    return {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    }
  }
  
  function createDatabaseMock(): {
    database: PrismaClient
    databaseMock: DatabaseMock
    transactionMock: TransactionMock
  } {
    const lead = createLeadDelegateMock()
  
    const transactionMock: TransactionMock = {
      lead: createLeadDelegateMock(),
    }
  
    const databaseMock: DatabaseMock = {
      lead,
      $transaction: vi.fn(
        async (
          operation: (
            transaction: TransactionMock,
          ) => unknown,
        ) => operation(transactionMock),
      ),
    }
  
    return {
      database:
        databaseMock as unknown as PrismaClient,
      databaseMock,
      transactionMock,
    }
  }
  
  describe("PrismaLeadRepository", () => {
    let database: PrismaClient
    let databaseMock: DatabaseMock
    let transactionMock: TransactionMock
    let repository: PrismaLeadRepository
  
    beforeEach(() => {
      const mocks = createDatabaseMock()
  
      database = mocks.database
      databaseMock = mocks.databaseMock
      transactionMock = mocks.transactionMock
  
      repository =
        new PrismaLeadRepository(
          workspaceId,
          database,
        )
    })
  
    it("deve rejeitar um workspaceId vazio", () => {
      expect(
        () =>
          new PrismaLeadRepository(
            "   ",
            database,
          ),
      ).toThrowError(
        "O workspaceId do repositório de leads não pode estar vazio.",
      )
    })
  
    it("deve listar apenas os leads do workspace", async () => {
      databaseMock.lead.findMany.mockResolvedValue([
        prismaLead,
      ])
  
      const result =
        await repository.findAll()
  
      expect(result).toEqual([
        domainLead,
      ])
  
      expect(
        databaseMock.lead.findMany,
      ).toHaveBeenCalledWith({
        where: {
          workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    })
  
    it("deve localizar um lead pelo ID e workspace", async () => {
      databaseMock.lead.findFirst.mockResolvedValue(
        prismaLead,
      )
  
      const result =
        await repository.findById("lead-1")
  
      expect(result).toEqual(domainLead)
  
      expect(
        databaseMock.lead.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: "lead-1",
          workspaceId,
        },
      })
    })
  
    it("deve retornar undefined quando o ID estiver vazio", async () => {
      const result =
        await repository.findById("   ")
  
      expect(result).toBeUndefined()
  
      expect(
        databaseMock.lead.findFirst,
      ).not.toHaveBeenCalled()
    })
  
    it("deve retornar undefined quando o lead nÃƒÆ’Ã‚Â£o existir", async () => {
      databaseMock.lead.findFirst.mockResolvedValue(
        null,
      )
  
      const result =
        await repository.findById(
          "lead-inexistente",
        )
  
      expect(result).toBeUndefined()
    })
  
    it("deve criar um lead no workspace do repositÃƒÆ’Ã‚Â³rio", async () => {
      databaseMock.lead.create.mockResolvedValue(
        prismaLead,
      )
  
      const result =
        await repository.create(domainLead)
  
      expect(result).toEqual(domainLead)
  
      expect(
        databaseMock.lead.create,
      ).toHaveBeenCalledWith({
        data: {
          id: "lead-1",
          workspaceId,
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
          pipelineStageId:
            "pipeline-stage-1",
          score: 85,
          lostReason: null,
          notes:
            "Lead interessado em imÃƒÆ’Ã‚Â³vel.",
          convertedClientId: null,
          lastContactAt:
            new Date(
              "2026-07-23T15:00:00.000Z",
            ),
          createdAt:
            new Date(
              "2026-07-23T14:00:00.000Z",
            ),
          updatedAt:
            new Date(
              "2026-07-23T15:00:00.000Z",
            ),
        },
      })
    })
  
    it("deve atualizar um lead existente no mesmo workspace", async () => {
      transactionMock.lead.findFirst.mockResolvedValue(
        {
          id: "lead-1",
        },
      )
  
      transactionMock.lead.update.mockResolvedValue(
        prismaLead,
      )
  
      const result =
        await repository.update(domainLead)
  
      expect(result).toEqual(domainLead)
  
      expect(
        transactionMock.lead.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: "lead-1",
          workspaceId,
        },
        select: {
          id: true,
        },
      })
  
      expect(
        transactionMock.lead.update,
      ).toHaveBeenCalledWith({
        where: {
          id: "lead-1",
        },
        data: expect.objectContaining({
          id: "lead-1",
          workspaceId,
          name: "Rafael Barcelos",
        }),
      })
    })
  
    it("deve retornar undefined ao atualizar um lead inexistente", async () => {
      transactionMock.lead.findFirst.mockResolvedValue(
        null,
      )
  
      const result =
        await repository.update(domainLead)
  
      expect(result).toBeUndefined()
  
      expect(
        transactionMock.lead.update,
      ).not.toHaveBeenCalled()
    })
  
    it("deve excluir somente o lead pertencente ao workspace", async () => {
      databaseMock.lead.deleteMany.mockResolvedValue({
        count: 1,
      })
  
      const result =
        await repository.delete("lead-1")
  
      expect(result).toBe(true)
  
      expect(
        databaseMock.lead.deleteMany,
      ).toHaveBeenCalledWith({
        where: {
          id: "lead-1",
          workspaceId,
        },
      })
    })
  
    it("deve retornar false quando nenhum lead for excluÃƒÆ’Ã‚Â­do", async () => {
      databaseMock.lead.deleteMany.mockResolvedValue({
        count: 0,
      })
  
      const result =
        await repository.delete(
          "lead-inexistente",
        )
  
      expect(result).toBe(false)
    })
  
    it("deve retornar false sem consultar o banco quando o ID de exclusÃƒÆ’Ã‚Â£o estiver vazio", async () => {
      const result =
        await repository.delete("   ")
  
      expect(result).toBe(false)
  
      expect(
        databaseMock.lead.deleteMany,
      ).not.toHaveBeenCalled()
    })
  })