import type {
    CommercialEventUseCaseDependencies,
    ExecuteCommercialEventUseCaseResult,
  } from "@/application/use-cases/common/commercial-event-use-case"
  
  import {
    executeCommercialEventUseCase,
  } from "@/application/use-cases/common/commercial-event-use-case"
  
  import type {
    CloseSaleInput as CloseSaleDomainInput,
  } from "@/application/sale/close-sale"
  
  import {
    closeSale as closeSaleDomain,
  } from "@/application/sale/close-sale"
  
  import type {
    WorkflowTransitionOrigin,
  } from "@/engine/decision/workflow/types"
  
  import type {
    CommercialRepository,
  } from "@/repositories/commercial/commercial-repository"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  import type {
    DecisionAutomationRepository,
  } from "@/repositories/decision/decision-automation-repository"
  
  import type {
    CommercialActorType,
    Sale,
  } from "@/types/domain"
  
  export type CloseSaleDependencies =
    CommercialEventUseCaseDependencies
  
  export type CloseSaleInput =
    CloseSaleDomainInput & {
      commercialRepository:
        CommercialRepository
  
      crmRepository:
        CrmRepository
  
      decisionAutomationRepository:
        DecisionAutomationRepository
  
      workspaceId: string
  
      actorType:
        CommercialActorType
  
      actorId:
        string | null
  
      origin?:
        WorkflowTransitionOrigin
  
      payload?: Record<string, unknown>
  
      expectedVersion?: number
  
      now?: Date
  
      executionLimit?: number
  
      generateSaleId?: () => string
  
      generateEventId?: () => string
  
      dependencies?:
        Partial<CloseSaleDependencies>
    }
  
  export type CloseSaleResult =
    ExecuteCommercialEventUseCaseResult & {
      sale: Sale
    }
  
  function normalizeRequiredId(
    value: string,
    fieldName: string,
  ): string {
    const normalizedValue =
      value.trim()
  
    if (!normalizedValue) {
      throw new Error(
        `${fieldName} é obrigatório.`,
      )
    }
  
    return normalizedValue
  }
  
  function resolveWonStateId(
    commercialRepository:
      CommercialRepository,
  ): string {
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
  
    return wonState.id
  }
  
  export function closeSale({
    commercialRepository,
    crmRepository,
    decisionAutomationRepository,
    workspaceId,
    journeyId,
    proposalId,
    contractNumber,
    quotaNumber,
    paymentMethod,
    firstInstallmentDate,
    commissionPercent,
    status,
    notes,
    actorType,
    actorId,
    origin = "SYSTEM",
    payload = {},
    expectedVersion,
    now = new Date(),
    executionLimit,
    generateSaleId,
    generateEventId,
    dependencies,
  }: CloseSaleInput): CloseSaleResult {
    const normalizedWorkspaceId =
      normalizeRequiredId(
        workspaceId,
        "O ID do workspace",
      )
  
    const normalizedJourneyId =
      normalizeRequiredId(
        journeyId,
        "O ID da jornada comercial",
      )
  
    const normalizedProposalId =
      normalizeRequiredId(
        proposalId,
        "O ID da proposta",
      )
  
    const saleDate =
      new Date(now)
  
    if (
      Number.isNaN(
        saleDate.getTime(),
      )
    ) {
      throw new Error(
        "A data da venda é inválida.",
      )
    }
  
    const journeyBeforeSale =
      commercialRepository
        .getJourneyById(
          normalizedJourneyId,
        )
  
    if (!journeyBeforeSale) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${normalizedJourneyId}".`,
      )
    }
  
    if (
      journeyBeforeSale.workspaceId !==
      normalizedWorkspaceId
    ) {
      throw new Error(
        `A jornada comercial "${normalizedJourneyId}" não pertence ao workspace "${normalizedWorkspaceId}".`,
      )
    }
  
    if (
      expectedVersion !== undefined &&
      journeyBeforeSale.version !==
        expectedVersion
    ) {
      throw new Error(
        `A jornada comercial "${normalizedJourneyId}" foi modificada por outro processo. Versão esperada: ${expectedVersion}. Versão atual: ${journeyBeforeSale.version}.`,
      )
    }
  
    const wonStateId =
      resolveWonStateId(
        commercialRepository,
      )
  
    const sale =
      closeSaleDomain(
        {
          proposalId:
            normalizedProposalId,
          journeyId:
            normalizedJourneyId,
          contractNumber,
          quotaNumber,
          paymentMethod,
          firstInstallmentDate,
          commissionPercent,
          status,
          notes,
        },
        {
          crmRepository,
          commercialRepository,
          now:
            saleDate,
          generateId:
            generateSaleId,
  
          /**
           * A jornada será encerrada abaixo pelo Workflow Engine.
           */
          updateJourney:
            false,
        },
      )
  
    try {
      const result =
        executeCommercialEventUseCase({
          commercialRepository,
          crmRepository,
          decisionAutomationRepository,
          workspaceId:
            normalizedWorkspaceId,
          journeyId:
            normalizedJourneyId,
  
          eventType:
            "SALE_COMPLETED",
  
          actorType,
          actorId,
  
          targetStateId:
            wonStateId,
  
          origin,
  
          payload: {
            ...payload,
  
            saleId:
              sale.id,
  
            proposalId:
              sale.proposalId,
  
            clientId:
              sale.clientId,
  
            consultantId:
              sale.consultantId,
  
            consortiumId:
              sale.consortiumId,
  
            contractNumber:
              sale.contractNumber,
  
            groupNumber:
              sale.groupNumber,
  
            quotaNumber:
              sale.quotaNumber,
  
            creditValue:
              sale.creditValue,
  
            installmentValue:
              sale.installmentValue,
  
            commissionValue:
              sale.commissionValue,
  
            commissionPercent:
              sale.commissionPercent,
  
            paymentMethod:
              sale.paymentMethod,
  
            saleStatus:
              sale.status,
  
            saleDate:
              sale.saleDate,
  
            firstInstallmentDate:
              sale.firstInstallmentDate,
          },
  
          /**
           * A versão foi validada antes da criação da venda.
           *
           * Não repetimos expectedVersion aqui porque o registro do evento
           * toca a jornada e incrementa sua versão antes da transição.
           */
          now:
            saleDate,
  
          executionLimit,
          generateEventId,
          dependencies,
  
          messages: {
            operationDescription:
              "concluir a venda",
  
            eventRegistered:
              (event) =>
                `A conclusão da venda foi registrada no evento "${event.id}".`,
  
            journeyTransitioned:
              (journey) =>
                `A jornada comercial "${journey.id}" foi encerrada como ganha após a conclusão da venda.`,
  
            journeyNotTransitioned:
              (journey) =>
                `A jornada comercial "${journey.id}" permaneceu no estado atual após a conclusão da venda.`,
  
            journeyMissingAfterEvent:
              (resolvedJourneyId) =>
                `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o registro da conclusão da venda.`,
  
            journeyMissingAfterProcessing:
              (resolvedJourneyId) =>
                `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o processamento da conclusão da venda.`,
          },
        })
  
      return {
        ...result,
        sale,
      }
    } catch (error) {
      crmRepository.deleteSale(
        sale.id,
      )
  
      throw error
    }
  }