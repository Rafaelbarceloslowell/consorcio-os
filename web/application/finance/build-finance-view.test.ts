import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  FinanceSaleRecord,
} from "@/types/finance-operational"

import {
  buildFinanceView,
  summarizeFinanceSales,
} from "./build-finance-view"

function sale(
  status:
    FinanceSaleRecord["status"],
  overrides:
    Partial<FinanceSaleRecord> = {},
): FinanceSaleRecord {
  return {
    id: `sale-${status}`,
    contractNumber: "CTR-001",
    proposalCode: "PROP-001",
    clientName: "Cliente",
    consultantName:
      "Rafael Ramos",
    administratorName:
      "Administradora",
    consortiumName:
      "Grupo",
    groupNumber: "001",
    quotaNumber: 10,
    creditValue: 500_000,
    installmentValue: 1_500,
    commissionValue: 10_000,
    commissionPercent: 2,
    status,
    statusLabel: status,
    quotaStatusLabel:
      "Não contemplada",
    paymentMethodLabel:
      "Boleto",
    saleDateLabel:
      "03/08/2026",
    firstInstallmentDateLabel:
      "10/08/2026",
    ...overrides,
  }
}

describe(
  "buildFinanceView",
  () => {
    it(
      "separa venda confirmada, assinatura pendente e cancelamento",
      () => {
        const summary =
          summarizeFinanceSales([
            sale("ACTIVE"),
            sale(
              "PENDING_SIGNATURE",
              {
                creditValue:
                  200_000,
                commissionValue:
                  4_000,
              },
            ),
            sale("CANCELLED"),
          ])

        expect(summary).toEqual({
          confirmedSalesCount: 1,
          pendingSignatureCount: 1,
          cancelledSalesCount: 1,
          confirmedCreditValue:
            500_000,
          pendingCreditValue:
            200_000,
          confirmedCommissionValue:
            10_000,
          forecastCommissionValue:
            4_000,
        })
      },
    )

    it(
      "não inclui venda cancelada nos totais confirmados",
      () => {
        const view =
          buildFinanceView([
            sale("CANCELLED", {
              creditValue:
                1_000_000,
              commissionValue:
                20_000,
            }),
          ])

        expect(
          view.summary
            .confirmedCreditValueLabel,
        ).toContain("0,00")
        expect(
          view.summary
            .confirmedCommissionValueLabel,
        ).toContain("0,00")
        expect(
          view.receiptTrackingAvailable,
        ).toBe(false)
      },
    )
  },
)
