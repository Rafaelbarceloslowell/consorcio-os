import {
    PaymentMethod as PrismaPaymentMethod,
    QuotaStatus as PrismaQuotaStatus,
    SaleStatus as PrismaSaleStatus,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Prisma,
    Sale as PrismaSale,
  } from "@/lib/generated/prisma/client"
  
  import type {
    PaymentMethod,
    QuotaStatus,
    Sale,
    SaleStatus,
  } from "@/types/domain/sale"
  
  const saleStatusToPrisma: Record<
    SaleStatus,
    PrismaSaleStatus
  > = {
    pending_signature:
      PrismaSaleStatus.PENDING_SIGNATURE,
    active:
      PrismaSaleStatus.ACTIVE,
    cancelled:
      PrismaSaleStatus.CANCELLED,
  }
  
  const saleStatusToDomain: Record<
    PrismaSaleStatus,
    SaleStatus
  > = {
    [PrismaSaleStatus.PENDING_SIGNATURE]:
      "pending_signature",
    [PrismaSaleStatus.ACTIVE]:
      "active",
    [PrismaSaleStatus.CANCELLED]:
      "cancelled",
  }
  
  const quotaStatusToPrisma: Record<
    QuotaStatus,
    PrismaQuotaStatus
  > = {
    not_contemplated:
      PrismaQuotaStatus.NOT_CONTEMPLATED,
    contemplated:
      PrismaQuotaStatus.CONTEMPLATED,
    paid_off:
      PrismaQuotaStatus.PAID_OFF,
    cancelled:
      PrismaQuotaStatus.CANCELLED,
  }
  
  const quotaStatusToDomain: Record<
    PrismaQuotaStatus,
    QuotaStatus
  > = {
    [PrismaQuotaStatus.NOT_CONTEMPLATED]:
      "not_contemplated",
    [PrismaQuotaStatus.CONTEMPLATED]:
      "contemplated",
    [PrismaQuotaStatus.PAID_OFF]:
      "paid_off",
    [PrismaQuotaStatus.CANCELLED]:
      "cancelled",
  }
  
  const paymentMethodToPrisma: Record<
    PaymentMethod,
    PrismaPaymentMethod
  > = {
    bank_slip:
      PrismaPaymentMethod.BANK_SLIP,
    direct_debit:
      PrismaPaymentMethod.DIRECT_DEBIT,
    credit_card:
      PrismaPaymentMethod.CREDIT_CARD,
    pix:
      PrismaPaymentMethod.PIX,
  }
  
  const paymentMethodToDomain: Record<
    PrismaPaymentMethod,
    PaymentMethod
  > = {
    [PrismaPaymentMethod.BANK_SLIP]:
      "bank_slip",
    [PrismaPaymentMethod.DIRECT_DEBIT]:
      "direct_debit",
    [PrismaPaymentMethod.CREDIT_CARD]:
      "credit_card",
    [PrismaPaymentMethod.PIX]:
      "pix",
  }
  
  export type SalePersistenceInput = {
    workspaceId: string
    sale: Sale
  }
  
  export class SaleMapper {
    static toDomain(
      raw: PrismaSale,
    ): Sale {
      return {
        id: raw.id,
        contractNumber:
          raw.contractNumber,
        proposalId:
          raw.proposalId,
        clientId:
          raw.clientId,
        consultantId:
          raw.consultantId,
        consortiumId:
          raw.consortiumId,
        groupNumber:
          raw.groupNumber,
        quotaNumber:
          raw.quotaNumber,
        creditValue:
          Number(raw.creditValue),
        installmentValue:
          Number(raw.installmentValue),
        termMonths:
          raw.termMonths,
        administrationFeePercent:
          Number(
            raw.administrationFeePercent,
          ),
        reserveFundPercent:
          Number(
            raw.reserveFundPercent,
          ),
        commissionValue:
          Number(raw.commissionValue),
        commissionPercent:
          Number(raw.commissionPercent),
        status:
          saleStatusToDomain[
            raw.status
          ],
        quotaStatus:
          quotaStatusToDomain[
            raw.quotaStatus
          ],
        paymentMethod:
          paymentMethodToDomain[
            raw.paymentMethod
          ],
        saleDate:
          raw.saleDate.toISOString(),
        firstInstallmentDate:
          raw.firstInstallmentDate.toISOString(),
        contemplatedAt:
          raw.contemplatedAt?.toISOString(),
        paidOffAt:
          raw.paidOffAt?.toISOString(),
        cancelledAt:
          raw.cancelledAt?.toISOString(),
        cancellationReason:
          raw.cancellationReason ??
          undefined,
        notes:
          raw.notes ?? undefined,
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      sale,
    }: SalePersistenceInput): Prisma.SaleUncheckedCreateInput {
      return {
        id: sale.id,
        workspaceId,
        contractNumber:
          sale.contractNumber,
        proposalId:
          sale.proposalId,
        clientId:
          sale.clientId,
        consultantId:
          sale.consultantId,
        consortiumId:
          sale.consortiumId,
        groupNumber:
          sale.groupNumber,
        quotaNumber:
          sale.quotaNumber,
        creditValue:
          sale.creditValue,
        installmentValue:
          sale.installmentValue,
        termMonths:
          sale.termMonths,
        administrationFeePercent:
          sale.administrationFeePercent,
        reserveFundPercent:
          sale.reserveFundPercent,
        commissionValue:
          sale.commissionValue,
        commissionPercent:
          sale.commissionPercent,
        status:
          saleStatusToPrisma[
            sale.status
          ],
        quotaStatus:
          quotaStatusToPrisma[
            sale.quotaStatus
          ],
        paymentMethod:
          paymentMethodToPrisma[
            sale.paymentMethod
          ],
        saleDate:
          new Date(sale.saleDate),
        firstInstallmentDate:
          new Date(
            sale.firstInstallmentDate,
          ),
        contemplatedAt:
          sale.contemplatedAt
            ? new Date(
                sale.contemplatedAt,
              )
            : null,
        paidOffAt:
          sale.paidOffAt
            ? new Date(
                sale.paidOffAt,
              )
            : null,
        cancelledAt:
          sale.cancelledAt
            ? new Date(
                sale.cancelledAt,
              )
            : null,
        cancellationReason:
          sale.cancellationReason ??
          null,
        notes:
          sale.notes ?? null,
        createdAt:
          new Date(sale.createdAt),
        updatedAt:
          new Date(sale.updatedAt),
      }
    }
  }