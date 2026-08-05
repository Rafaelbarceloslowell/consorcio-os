import type {
  FinanceSaleRecord,
  FinanceSummary,
  FinanceView,
} from "@/types/finance-operational"

const currencyFormatter =
  new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  )

export function summarizeFinanceSales(
  sales: readonly FinanceSaleRecord[],
): FinanceSummary {
  return sales.reduce<FinanceSummary>(
    (summary, sale) => {
      if (
        sale.status ===
        "ACTIVE"
      ) {
        return {
          ...summary,
          confirmedSalesCount:
            summary
              .confirmedSalesCount +
            1,
          confirmedCreditValue:
            summary
              .confirmedCreditValue +
            sale.creditValue,
          confirmedCommissionValue:
            summary
              .confirmedCommissionValue +
            sale.commissionValue,
        }
      }

      if (
        sale.status ===
        "PENDING_SIGNATURE"
      ) {
        return {
          ...summary,
          pendingSignatureCount:
            summary
              .pendingSignatureCount +
            1,
          pendingCreditValue:
            summary
              .pendingCreditValue +
            sale.creditValue,
          forecastCommissionValue:
            summary
              .forecastCommissionValue +
            sale.commissionValue,
        }
      }

      return {
        ...summary,
        cancelledSalesCount:
          summary.cancelledSalesCount +
          1,
      }
    },
    {
      confirmedSalesCount: 0,
      pendingSignatureCount: 0,
      cancelledSalesCount: 0,
      confirmedCreditValue: 0,
      pendingCreditValue: 0,
      confirmedCommissionValue: 0,
      forecastCommissionValue: 0,
    },
  )
}

export function buildFinanceView(
  sales: readonly FinanceSaleRecord[],
): FinanceView {
  const summary =
    summarizeFinanceSales(
      sales,
    )

  return {
    summary: {
      confirmedSalesCount:
        summary
          .confirmedSalesCount,
      pendingSignatureCount:
        summary
          .pendingSignatureCount,
      cancelledSalesCount:
        summary
          .cancelledSalesCount,
      confirmedCreditValueLabel:
        currencyFormatter.format(
          summary
            .confirmedCreditValue,
        ),
      pendingCreditValueLabel:
        currencyFormatter.format(
          summary
            .pendingCreditValue,
        ),
      confirmedCommissionValueLabel:
        currencyFormatter.format(
          summary
            .confirmedCommissionValue,
        ),
      forecastCommissionValueLabel:
        currencyFormatter.format(
          summary
            .forecastCommissionValue,
        ),
    },
    sales,
    receiptTrackingAvailable:
      false,
  }
}
