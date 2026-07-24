import type {
    PrismaClient,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Proposal,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    ProposalMapper,
  } from "@/infrastructure/prisma/mappers/proposal-mapper"
  
  type ProposalTransactionClient =
    Prisma.TransactionClient
  
  export class PrismaProposalRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de propostas não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Proposal[]> {
      const proposals =
        await this.database.proposal.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
  
      return proposals.map((proposal) =>
        ProposalMapper.toDomain(proposal),
      )
    }
  
    async findById(
      proposalId: string,
    ): Promise<Proposal | undefined> {
      if (!proposalId.trim()) {
        return undefined
      }
  
      const proposal =
        await this.database.proposal.findFirst({
          where: {
            id: proposalId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!proposal) {
        return undefined
      }
  
      return ProposalMapper.toDomain(
        proposal,
      )
    }
  
    async create(
      proposal: Proposal,
    ): Promise<Proposal> {
      return this.database.$transaction(
        async (transaction) => {
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            proposal,
          })
  
          const createdProposal =
            await transaction.proposal.create({
              data: ProposalMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                proposal,
              }),
            })
  
          return ProposalMapper.toDomain(
            createdProposal,
          )
        },
      )
    }
  
    async update(
      proposal: Proposal,
    ): Promise<Proposal | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingProposal =
            await transaction.proposal.findFirst({
              where: {
                id: proposal.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingProposal) {
            return undefined
          }
  
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            proposal,
          })
  
          const updatedProposal =
            await transaction.proposal.update({
              where: {
                id: existingProposal.id,
              },
              data: ProposalMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                proposal,
              }),
            })
  
          return ProposalMapper.toDomain(
            updatedProposal,
          )
        },
      )
    }
  
    async delete(
      proposalId: string,
    ): Promise<boolean> {
      if (!proposalId.trim()) {
        return false
      }
  
      const result =
        await this.database.proposal.deleteMany({
          where: {
            id: proposalId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private async ensureRelationshipsBelongToWorkspace({
      transaction,
      proposal,
    }: {
      transaction: ProposalTransactionClient
      proposal: Proposal
    }): Promise<void> {
      await Promise.all([
        this.ensureLeadBelongsToWorkspace({
          transaction,
          leadId: proposal.leadId,
        }),
  
        this.ensureClientBelongsToWorkspace({
          transaction,
          clientId: proposal.clientId,
        }),
  
        this.ensureConsultantBelongsToWorkspace({
          transaction,
          consultantId:
            proposal.consultantId,
        }),
  
        this.ensureConsortiumBelongsToWorkspace({
          transaction,
          consortiumId:
            proposal.consortiumId,
        }),
      ])
    }
  
    private async ensureLeadBelongsToWorkspace({
      transaction,
      leadId,
    }: {
      transaction: ProposalTransactionClient
      leadId: string | undefined
    }): Promise<void> {
      if (!leadId) {
        return
      }
  
      const lead =
        await transaction.lead.findFirst({
          where: {
            id: leadId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!lead) {
        throw new Error(
          "O lead informado não pertence ao workspace da proposta.",
        )
      }
    }
  
    private async ensureClientBelongsToWorkspace({
      transaction,
      clientId,
    }: {
      transaction: ProposalTransactionClient
      clientId: string | undefined
    }): Promise<void> {
      if (!clientId) {
        return
      }
  
      const client =
        await transaction.client.findFirst({
          where: {
            id: clientId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!client) {
        throw new Error(
          "O cliente informado não pertence ao workspace da proposta.",
        )
      }
    }
  
    private async ensureConsultantBelongsToWorkspace({
      transaction,
      consultantId,
    }: {
      transaction: ProposalTransactionClient
      consultantId: string
    }): Promise<void> {
      if (!consultantId.trim()) {
        throw new Error(
          "O consultantId da proposta não pode estar vazio.",
        )
      }
  
      const consultant =
        await transaction.consultant.findFirst({
          where: {
            id: consultantId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!consultant) {
        throw new Error(
          "O consultor informado não pertence ao workspace da proposta.",
        )
      }
    }
  
    private async ensureConsortiumBelongsToWorkspace({
      transaction,
      consortiumId,
    }: {
      transaction: ProposalTransactionClient
      consortiumId: string
    }): Promise<void> {
      if (!consortiumId.trim()) {
        throw new Error(
          "O consortiumId da proposta não pode estar vazio.",
        )
      }
  
      const consortium =
        await transaction.consortium.findFirst({
          where: {
            id: consortiumId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!consortium) {
        throw new Error(
          "O consórcio informado não pertence ao workspace da proposta.",
        )
      }
    }
  }