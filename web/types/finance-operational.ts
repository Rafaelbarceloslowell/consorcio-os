export type FinanceSaleStatus =
  | "ACTIVE"
  | "PENDING_SIGNATURE"
  | "CANCELLED"

export type FinanceSaleRecord = Readonly<{
  id: string
  contractNumber: string
  proposalCode: string
  clientName: string
  consultantName: string
  administratorName: string
  consortiumName: string
  groupNumber: string
  quotaNumber: number
  creditValue: number
  installmentValue: number
  commissionValue: number
  commissionPercent: number
  status: FinanceSaleStatus
  statusLabel: string
  quotaStatusLabel: string
  paymentMethodLabel: string
  saleDateLabel: string
  firstInstallmentDateLabel: string
}>

export type FinanceSummary = Readonly<{
  confirmedSalesCount: number
  pendingSignatureCount: number
  cancelledSalesCount: number
  confirmedCreditValue: number
  pendingCreditValue: number
  confirmedCommissionValue: number
  forecastCommissionValue: number
}>

export type FinanceView = Readonly<{
  summary: Readonly<{
    confirmedSalesCount: number
    pendingSignatureCount: number
    cancelledSalesCount: number
    confirmedCreditValueLabel: string
    pendingCreditValueLabel: string
    confirmedCommissionValueLabel: string
    forecastCommissionValueLabel: string
  }>
  sales: readonly FinanceSaleRecord[]
  receiptTrackingAvailable: false
}>
