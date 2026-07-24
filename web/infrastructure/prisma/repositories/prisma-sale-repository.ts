import type {
    PrismaClient,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Sale,
  } from "@/types/domain/sale"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    SaleMapper,
  } from "@/infrastructure/prisma/mappers/sale-mapper"
  
  type SaleTransactionClient =
    Prisma.TransactionClient
  
  export class PrismaSaleRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de vendas não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Sale[]> {
      const sales =
        await this.database.sale.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            saleDate: "desc",
          },
        })
  
      return sales.map((sale) =>
        SaleMapper.toDomain(sale),
      )
    }
  
    async findById(
      saleId: string,
    ): Promise<Sale | undefined> {
      if (!saleId.trim()) {
        return undefined
      }
  
      const sale =
        await this.database.sale.findFirst({
          where: {
            id: saleId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!sale) {
        return undefined
      }
  
      return SaleMapper.toDomain(sale)
    }
  
    async create(
      sale: Sale,
    ): Promise<Sale> {
      return this.database.$transaction(
        async (transaction) => {
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            sale,
          })
  
          const createdSale =
            await transaction.sale.create({
              data: SaleMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                sale,
              }),
            })
  
          return SaleMapper.toDomain(
            createdSale,
          )
        },
      )
    }
  
    async update(
      sale: Sale,
    ): Promise<Sale | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingSale =
            await transaction.sale.findFirst({
              where: {
                id: sale.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingSale) {
            return undefined
          }
  
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            sale,
          })
  
          const updatedSale =
            await transaction.sale.update({
              where: {
                id: existingSale.id,
              },
              data: SaleMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                sale,
              }),
            })
  
          return SaleMapper.toDomain(
            updatedSale,
          )
        },
      )
    }
  
    async delete(
      saleId: string,
    ): Promise<boolean> {
      if (!saleId.trim()) {
        return false
      }
  
      const result =
        await this.database.sale.deleteMany({
          where: {
            id: saleId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private async ensureRelationshipsBelongToWorkspace({
      transaction,
      sale,
    }: {
      transaction: SaleTransactionClient
      sale: Sale
    }): Promise<void> {
      await Promise.all([
        this.ensureProposalBelongsToWorkspace({
          transaction,
          proposalId:
            sale.proposalId,
        }),
  
        this.ensureClientBelongsToWorkspace({
          transaction,
          clientId:
            sale.clientId,
        }),
  
        this.ensureConsultantBelongsToWorkspace({
          transaction,
          consultantId:
            sale.consultantId,
        }),
  
        this.ensureConsortiumBelongsToWorkspace({
          transaction,
          consortiumId:
            sale.consortiumId,
        }),
      ])
    }
  
    private async ensureProposalBelongsToWorkspace({
      transaction,
      proposalId,
    }: {
      transaction: SaleTransactionClient
      proposalId: string
    }): Promise<void> {
      if (!proposalId.trim()) {
        throw new Error(
          "O proposalId da venda não pode estar vazio.",
        )
      }
  
      const proposal =
        await transaction.proposal.findFirst({
          where: {
            id: proposalId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!proposal) {
        throw new Error(
          "A proposta informada não pertence ao workspace da venda.",
        )
      }
    }
  
    private async ensureClientBelongsToWorkspace({
      transaction,
      clientId,
    }: {
      transaction: SaleTransactionClient
      clientId: string
    }): Promise<void> {
      if (!clientId.trim()) {
        throw new Error(
          "O clientId da venda não pode estar vazio.",
        )
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
          "O cliente informado não pertence ao workspace da venda.",
        )
      }
    }
  
    private async ensureConsultantBelongsToWorkspace({
      transaction,
      consultantId,
    }: {
      transaction: SaleTransactionClient
      consultantId: string
    }): Promise<void> {
      if (!consultantId.trim()) {
        throw new Error(
          "O consultantId da venda não pode estar vazio.",
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
          "O consultor informado não pertence ao workspace da venda.",
        )
      }
    }
  
    private async ensureConsortiumBelongsToWorkspace({
      transaction,
      consortiumId,
    }: {
      transaction: SaleTransactionClient
      consortiumId: string
    }): Promise<void> {
      if (!consortiumId.trim()) {
        throw new Error(
          "O consortiumId da venda não pode estar vazio.",
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
          "O consórcio informado não pertence ao workspace da venda.",
        )
      }
    }
  }