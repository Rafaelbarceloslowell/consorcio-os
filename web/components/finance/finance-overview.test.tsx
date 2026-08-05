// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
} from "vitest"

import {
  FinanceOverview,
} from "./finance-overview"

describe(
  "FinanceOverview",
  () => {
    it(
      "exibe somente indicadores financeiros explícitos",
      () => {
        render(
          <FinanceOverview
            view={{
              summary: {
                confirmedSalesCount: 1,
                pendingSignatureCount: 1,
                cancelledSalesCount: 0,
                confirmedCreditValueLabel:
                  "R$ 500.000,00",
                pendingCreditValueLabel:
                  "R$ 200.000,00",
                confirmedCommissionValueLabel:
                  "R$ 10.000,00",
                forecastCommissionValueLabel:
                  "R$ 4.000,00",
              },
              sales: [],
              receiptTrackingAvailable:
                false,
            }}
          />,
        )

        expect(
          screen.getByText(
            "Crédito confirmado",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Comissão prevista",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Recebimentos não são presumidos",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Nenhuma venda fechada registrada.",
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "renderiza uma venda real",
      () => {
        render(
          <FinanceOverview
            view={{
              summary: {
                confirmedSalesCount: 1,
                pendingSignatureCount: 0,
                cancelledSalesCount: 0,
                confirmedCreditValueLabel:
                  "R$ 500.000,00",
                pendingCreditValueLabel:
                  "R$ 0,00",
                confirmedCommissionValueLabel:
                  "R$ 10.000,00",
                forecastCommissionValueLabel:
                  "R$ 0,00",
              },
              receiptTrackingAvailable:
                false,
              sales: [
                {
                  id: "sale-1",
                  contractNumber:
                    "CTR-001",
                  proposalCode:
                    "PROP-001",
                  clientName:
                    "Cliente Real",
                  consultantName:
                    "Rafael Ramos",
                  administratorName:
                    "HS",
                  consortiumName:
                    "Imóveis",
                  groupNumber:
                    "320",
                  quotaNumber: 7342,
                  creditValue:
                    500_000,
                  installmentValue:
                    1_397.5,
                  commissionValue:
                    10_000,
                  commissionPercent: 2,
                  status: "ACTIVE",
                  statusLabel:
                    "Ativa",
                  quotaStatusLabel:
                    "Não contemplada",
                  paymentMethodLabel:
                    "Boleto",
                  saleDateLabel:
                    "03/08/2026",
                  firstInstallmentDateLabel:
                    "10/08/2026",
                },
              ],
            }}
          />,
        )

        expect(
          screen.getByText(
            "Cliente Real",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Contrato CTR-001/,
          ),
        ).toBeInTheDocument()
      },
    )
  },
)
