import type {
  PaymentMethod,
  Sale,
  SaleStatus,
} from "@/types/domain"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

export type CloseSaleInput = {
  proposalId: string
  journeyId: string
  contractNumber: string
  quotaNumber: number
  paymentMethod: PaymentMethod
  firstInstallmentDate: string
  commissionPercent: number
  status?: SaleStatus
  notes?: string
}

export type CloseSaleDependencies = {
  crmRepository: CrmRepository
  commercialRepository: CommercialRepository
  now?: Date
  generateId?: () => string

  /**
   * Define se este serviço de domínio deve encerrar diretamente
   * a jornada comercial.
   *
   * Mantém `true` como padrão para preservar compatibilidade com
   * os usos anteriores. A camada de use case utiliza `false` para
   * delegar a transição ao Workflow Engine.
   */
  updateJourney?: boolean
}

function generateDefaultId(): string {
  return `sale-${globalThis.crypto.randomUUID()}`
}

function parseDate(
  value: string,
  fieldName: string,
): Date {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} deve possuir uma data válida.`,
    )
  }

  return date
}

function normalizeContractNumber(
  contractNumber: string,
): string {
  return contractNumber
    .trim()
    .toUpperCase()
}

function roundCurrency(
  value: number,
): number {
  return Math.round(value * 100) / 100
}

function validateInput(
  input: CloseSaleInput,
): void {
  if (!input.proposalId.trim()) {
    throw new Error(
      "O ID da proposta é obrigatório.",
    )
  }

  if (!input.journeyId.trim()) {
    throw new Error(
      "O ID da jornada comercial é obrigatório.",
    )
  }

  if (!input.contractNumber.trim()) {
    throw new Error(
      "O número do contrato é obrigatório.",
    )
  }

  if (
    !Number.isInteger(
      input.quotaNumber,
    ) ||
    input.quotaNumber <= 0
  ) {
    throw new Error(
      "O número da cota deve ser um número inteiro maior que zero.",
    )
  }

  if (
    !Number.isFinite(
      input.commissionPercent,
    ) ||
    input.commissionPercent < 0 ||
    input.commissionPercent > 100
  ) {
    throw new Error(
      "O percentual de comissão deve estar entre 0 e 100.",
    )
  }
}

export function closeSale(
  input: CloseSaleInput,
  {
    crmRepository,
    commercialRepository,
    now = new Date(),
    generateId = generateDefaultId,
    updateJourney = true,
  }: CloseSaleDependencies,
): Sale {
  validateInput(input)

  const proposal =
    crmRepository.getProposalById(
      input.proposalId,
    )

  if (!proposal) {
    throw new Error(
      `Proposta não encontrada para o ID "${input.proposalId}".`,
    )
  }

  if (proposal.status !== "accepted") {
    throw new Error(
      `A proposta "${proposal.id}" precisa estar aceita antes do fechamento da venda.`,
    )
  }

  if (!proposal.clientId) {
    throw new Error(
      `A proposta "${proposal.id}" não possui um cliente vinculado.`,
    )
  }

  const duplicatedProposalSale =
    crmRepository
      .getSales()
      .find(
        (sale) =>
          sale.proposalId ===
          proposal.id,
      )

  if (duplicatedProposalSale) {
    throw new Error(
      `A proposta "${proposal.id}" já possui uma venda registrada.`,
    )
  }

  const contractNumber =
    normalizeContractNumber(
      input.contractNumber,
    )

  const duplicatedContract =
    crmRepository
      .getSales()
      .find(
        (sale) =>
          normalizeContractNumber(
            sale.contractNumber,
          ) === contractNumber,
      )

  if (duplicatedContract) {
    throw new Error(
      `O contrato "${contractNumber}" já está vinculado a outra venda.`,
    )
  }

  const client =
    crmRepository.getClientById(
      proposal.clientId,
    )

  if (!client) {
    throw new Error(
      `Cliente não encontrado para o ID "${proposal.clientId}".`,
    )
  }

  if (client.status !== "active") {
    throw new Error(
      `O cliente "${client.id}" não está ativo e não pode concluir uma venda.`,
    )
  }

  const consultant =
    crmRepository.getConsultantById(
      proposal.consultantId,
    )

  if (!consultant) {
    throw new Error(
      `Consultor não encontrado para o ID "${proposal.consultantId}".`,
    )
  }

  if (consultant.status !== "active") {
    throw new Error(
      `O consultor "${consultant.id}" não está ativo e não pode concluir uma venda.`,
    )
  }

  if (
    client.consultantId !==
    consultant.id
  ) {
    throw new Error(
      `O cliente "${client.id}" não pertence ao consultor "${consultant.id}".`,
    )
  }

  const consortium =
    crmRepository.getConsortiumById(
      proposal.consortiumId,
    )

  if (!consortium) {
    throw new Error(
      `Consórcio não encontrado para o ID "${proposal.consortiumId}".`,
    )
  }

  if (consortium.status !== "active") {
    throw new Error(
      `O consórcio "${consortium.id}" não está ativo para novas vendas.`,
    )
  }

  if (
    consortium.availableQuotas <= 0
  ) {
    throw new Error(
      `O consórcio "${consortium.id}" não possui cotas disponíveis.`,
    )
  }

  const duplicatedQuota =
    crmRepository
      .getSales()
      .find(
        (sale) =>
          sale.consortiumId ===
            consortium.id &&
          sale.quotaNumber ===
            input.quotaNumber &&
          sale.status !== "cancelled",
      )

  if (duplicatedQuota) {
    throw new Error(
      `A cota "${input.quotaNumber}" já está vinculada a uma venda ativa neste consórcio.`,
    )
  }

  const journey =
    commercialRepository.getJourneyById(
      input.journeyId,
    )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${input.journeyId}".`,
    )
  }

  if (journey.closedAt) {
    throw new Error(
      `A jornada comercial "${journey.id}" já está encerrada.`,
    )
  }

  if (
    journey.clientId !== client.id
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" não pertence ao cliente "${client.id}".`,
    )
  }

  if (
    journey.consultantId !==
    consultant.id
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" não pertence ao consultor "${consultant.id}".`,
    )
  }

  if (
    proposal.leadId &&
    journey.leadId !==
      proposal.leadId
  ) {
    throw new Error(
      `A proposta "${proposal.id}" não pertence à jornada comercial "${journey.id}".`,
    )
  }

  const wonState =
    commercialRepository
      .getStates()
      .find(
        (state) =>
          state.code === "WON" &&
          state.isWon &&
          state.isFinal &&
          state.isActive,
      )

  if (!wonState) {
    throw new Error(
      'O estado final de jornada com código "WON" não foi encontrado.',
    )
  }

  const closedPhase =
    commercialRepository.getPhaseById(
      wonState.phaseId,
    )

  if (
    !closedPhase ||
    !closedPhase.isActive
  ) {
    throw new Error(
      "A fase de encerramento da jornada não foi encontrada ou está inativa.",
    )
  }

  const saleDate = new Date(now)

  if (
    Number.isNaN(
      saleDate.getTime(),
    )
  ) {
    throw new Error(
      "A data da venda é inválida.",
    )
  }

  const firstInstallmentDate =
    parseDate(
      input.firstInstallmentDate,
      "A data da primeira parcela",
    )

  if (
    firstInstallmentDate.getTime() <
    saleDate.getTime()
  ) {
    throw new Error(
      "A data da primeira parcela não pode ser anterior à data da venda.",
    )
  }

  const timestamp =
    saleDate.toISOString()

  const commissionValue =
    roundCurrency(
      proposal.creditValue *
        (
          input.commissionPercent /
          100
        ),
    )

  const sale: Sale = {
    id: generateId(),
    contractNumber,
    proposalId:
      proposal.id,
    clientId:
      client.id,
    consultantId:
      consultant.id,
    consortiumId:
      consortium.id,
    groupNumber:
      consortium.groupNumber,
    quotaNumber:
      input.quotaNumber,
    creditValue:
      proposal.creditValue,
    installmentValue:
      proposal.installmentValue,
    termMonths:
      proposal.termMonths,
    administrationFeePercent:
      proposal.administrationFeePercent,
    reserveFundPercent:
      proposal.reserveFundPercent,
    commissionValue,
    commissionPercent:
      input.commissionPercent,
    status:
      input.status ??
      "pending_signature",
    quotaStatus:
      "not_contemplated",
    paymentMethod:
      input.paymentMethod,
    saleDate:
      timestamp,
    firstInstallmentDate:
      firstInstallmentDate.toISOString(),
    notes:
      input.notes?.trim() ||
      undefined,
    createdAt:
      timestamp,
    updatedAt:
      timestamp,
  }

  const createdSale =
    crmRepository.createSale(
      sale,
    )

  if (updateJourney) {
    commercialRepository.updateJourney({
      ...journey,
      currentPhaseId:
        closedPhase.id,
      currentStateId:
        wonState.id,
      outcome:
        "WON",
      stateEnteredAt:
        timestamp,
      lastInteractionAt:
        timestamp,
      closedAt:
        timestamp,
      version:
        journey.version + 1,
      updatedAt:
        timestamp,
    })
  }

  return createdSale
}