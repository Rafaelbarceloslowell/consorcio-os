import type {
    CommercialEventUseCaseDependencies,
    ExecuteCommercialEventUseCaseResult,
  } from "@/application/use-cases/common/commercial-event-use-case"
  
  import {
    executeCommercialEventUseCase,
  } from "@/application/use-cases/common/commercial-event-use-case"
  
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
    Proposal,
  } from "@/types/domain"
  
  export type SendProposalDependencies =
    CommercialEventUseCaseDependencies
  
  export type SendProposalInput = {
    commercialRepository:
      CommercialRepository
  
    crmRepository:
      CrmRepository
  
    decisionAutomationRepository:
      DecisionAutomationRepository
  
    workspaceId: string
  
    journeyId: string
  
    proposalId: string
  
    actorType:
      CommercialActorType
  
    actorId:
      string | null
  
    targetStateId?: string
  
    origin?:
      WorkflowTransitionOrigin
  
    payload?: Record<string, unknown>
  
    expectedVersion?: number
  
    now?: Date
  
    executionLimit?: number
  
    generateEventId?: () => string
  
    dependencies?:
      Partial<SendProposalDependencies>
  }
  
  export type SendProposalResult =
    ExecuteCommercialEventUseCaseResult & {
      proposal: Proposal
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
  
  function validateProposalForSending(
    proposal: Proposal,
  ): void {
    if (proposal.status !== "draft") {
      throw new Error(
        `A proposta "${proposal.id}" precisa estar em rascunho antes do envio.`,
      )
    }
  }
  
  function restoreProposal(
    crmRepository: CrmRepository,
    originalProposal: Proposal,
    originalError: unknown,
  ): never {
    try {
      crmRepository.updateProposal(
        originalProposal,
      )
    } catch (rollbackError) {
      const originalMessage =
        originalError instanceof Error
          ? originalError.message
          : String(
              originalError,
            )
  
      const rollbackMessage =
        rollbackError instanceof Error
          ? rollbackError.message
          : String(
              rollbackError,
            )
  
      throw new Error(
        `O envio da proposta falhou e não foi possível restaurar seu estado anterior. Erro original: ${originalMessage} Erro de restauração: ${rollbackMessage}`,
      )
    }
  
    throw originalError
  }
  
  export function sendProposal({
    commercialRepository,
    crmRepository,
    decisionAutomationRepository,
    workspaceId,
    journeyId,
    proposalId,
    actorType,
    actorId,
    targetStateId,
    origin = "SYSTEM",
    payload = {},
    expectedVersion,
    now = new Date(),
    executionLimit,
    generateEventId,
    dependencies,
  }: SendProposalInput): SendProposalResult {
    const normalizedProposalId =
      normalizeRequiredId(
        proposalId,
        "O ID da proposta",
      )
  
    const proposal =
      crmRepository.getProposalById(
        normalizedProposalId,
      )
  
    if (!proposal) {
      throw new Error(
        `Proposta não encontrada para o ID "${normalizedProposalId}".`,
      )
    }
  
    validateProposalForSending(
      proposal,
    )
  
    const sentAt =
      new Date(
        now,
      )
  
    if (
      Number.isNaN(
        sentAt.getTime(),
      )
    ) {
      throw new Error(
        "A data de envio da proposta é inválida.",
      )
    }
  
    const sentAtTimestamp =
      sentAt.toISOString()
  
    const updatedProposal: Proposal = {
      ...proposal,
  
      status:
        "sent",
  
      sentAt:
        sentAtTimestamp,
  
      acceptedAt:
        undefined,
  
      rejectedAt:
        undefined,
  
      rejectionReason:
        undefined,
  
      updatedAt:
        sentAtTimestamp,
    }
  
    crmRepository.updateProposal(
      updatedProposal,
    )
  
    try {
      const result =
        executeCommercialEventUseCase({
          commercialRepository,
          crmRepository,
          decisionAutomationRepository,
          workspaceId,
          journeyId,
  
          eventType:
            "PROPOSAL_SENT",
  
          actorType,
          actorId,
          targetStateId,
          origin,
  
          payload: {
            ...payload,
  
            proposalId:
              normalizedProposalId,
  
            sentAt:
              sentAtTimestamp,
          },
  
          expectedVersion,
          now:
            sentAt,
  
          executionLimit,
          generateEventId,
          dependencies,
  
          messages: {
            operationDescription:
              "enviar a proposta comercial",
  
            eventRegistered:
              (event) =>
                `O envio da proposta comercial foi registrado no evento "${event.id}".`,
  
            journeyTransitioned:
              (journey) =>
                `A jornada comercial "${journey.id}" avançou após o envio da proposta.`,
  
            journeyNotTransitioned:
              (journey) =>
                `A jornada comercial "${journey.id}" permaneceu no estado atual após o envio da proposta.`,
  
            journeyMissingAfterEvent:
              (resolvedJourneyId) =>
                `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o registro do envio da proposta.`,
  
            journeyMissingAfterProcessing:
              (resolvedJourneyId) =>
                `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o processamento do envio da proposta.`,
          },
        })
  
      return {
        ...result,
  
        proposal:
          updatedProposal,
      }
    } catch (error) {
      return restoreProposal(
        crmRepository,
        proposal,
        error,
      )
    }
  }