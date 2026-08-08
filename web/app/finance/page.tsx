import {
  PaymentMethod,
  QuotaStatus,
  SaleStatus,
} from "@/lib/generated/prisma/client"

import {
  buildFinanceView,
} from "@/application/finance/build-finance-view"
import {
  FinanceOverview,
} from "@/components/finance/finance-overview"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  FinanceSaleRecord,
} from "@/types/finance-operational"

const dateFormatter =
  new Intl.DateTimeFormat(
    "pt-BR",
  )

function saleStatusLabel(
  status: SaleStatus,
): string {
  switch (status) {
    case SaleStatus.ACTIVE:
      return "Ativa"
    case SaleStatus.PENDING_SIGNATURE:
      return "Aguardando assinatura"
    case SaleStatus.CANCELLED:
      return "Cancelada"
    default:
      return "Desconhecida"
  }
}

function quotaStatusLabel(
  status: QuotaStatus,
): string {
  switch (status) {
    case QuotaStatus.CONTEMPLATED:
      return "Contemplada"
    case QuotaStatus.PAID_OFF:
      return "Quitada"
    case QuotaStatus.CANCELLED:
      return "Cancelada"
    case QuotaStatus.NOT_CONTEMPLATED:
      return "Não contemplada"
    default:
      return "Desconhecida"
  }
}

function paymentMethodLabel(
  method: PaymentMethod,
): string {
  switch (method) {
    case PaymentMethod.PIX:
      return "Pix"
    case PaymentMethod.CREDIT_CARD:
      return "Cartão de crédito"
    case PaymentMethod.DIRECT_DEBIT:
      return "Débito automático"
    case PaymentMethod.BANK_SLIP:
      return "Boleto"
    default:
      return "Não informado"
  }
}

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  const workspace =
    await prisma.workspace.findUnique({
      where: {
        slug: "consorcio-os",
      },
      select: {
        id: true,
      },
    })

  if (!workspace) {
    throw new Error(
      'Workspace "consorcio-os" não encontrado.',
    )
  }

  const sales =
    await prisma.sale.findMany({
      where: {
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        contractNumber: true,
        groupNumber: true,
        quotaNumber: true,
        creditValue: true,
        installmentValue: true,
        commissionValue: true,
        commissionPercent: true,
        status: true,
        quotaStatus: true,
        paymentMethod: true,
        saleDate: true,
        firstInstallmentDate: true,
        client: {
          select: {
            name: true,
          },
        },
        consultant: {
          select: {
            name: true,
          },
        },
        consortium: {
          select: {
            name: true,
            administrator: true,
          },
        },
        proposal: {
          select: {
            code: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    })

  const records:
    FinanceSaleRecord[] =
    sales.map((sale) => ({
      id: sale.id,
      contractNumber:
        sale.contractNumber,
      proposalCode:
        sale.proposal.code,
      clientName:
        sale.client.name,
      consultantName:
        sale.consultant.name,
      administratorName:
        sale.consortium
          .administrator,
      consortiumName:
        sale.consortium.name,
      groupNumber:
        sale.groupNumber,
      quotaNumber:
        sale.quotaNumber,
      creditValue:
        Number(
          sale.creditValue,
        ),
      installmentValue:
        Number(
          sale.installmentValue,
        ),
      commissionValue:
        Number(
          sale.commissionValue,
        ),
      commissionPercent:
        Number(
          sale.commissionPercent,
        ),
      status:
        sale.status,
      statusLabel:
        saleStatusLabel(
          sale.status,
        ),
      quotaStatusLabel:
        quotaStatusLabel(
          sale.quotaStatus,
        ),
      paymentMethodLabel:
        paymentMethodLabel(
          sale.paymentMethod,
        ),
      saleDateLabel:
        dateFormatter.format(
          sale.saleDate,
        ),
      firstInstallmentDateLabel:
        dateFormatter.format(
          sale.firstInstallmentDate,
        ),
    }))

  return (
    <FinanceOverview
      view={buildFinanceView(
        records,
      )}
    />
  )
}
