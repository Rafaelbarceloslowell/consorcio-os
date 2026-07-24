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
  } from "@/types/domain"
  
  export type AcceptProposalDependencies =
    CommercialEventUseCaseDependencies
  
  export type AcceptProposalInput = {
    commercialRepository:
      CommercialRepository
  
    crmRepository:
      CrmRepository
  
    decisionAutomationRepository:
      DecisionAutomationRepository
  
    workspaceId: string
  
    journeyId: string
  
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
      Partial<AcceptProposalDependencies>
  }
  
  export type AcceptProposalResult =
    ExecuteCommercialEventUseCaseResult
  
  export function acceptProposal({
    commercialRepository,
    crmRepository,
    decisionAutomationRepository,
    workspaceId,
    journeyId,
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
  }: AcceptProposalInput): AcceptProposalResult {
    return executeCommercialEventUseCase({
      commercialRepository,
      crmRepository,
      decisionAutomationRepository,
      workspaceId,
      journeyId,
      eventType:
        "PROPOSAL_ACCEPTED",
      actorType,
      actorId,
      targetStateId,
      origin,
      payload,
      expectedVersion,
      now,
      executionLimit,
      generateEventId,
      dependencies,
  
      messages: {
        operationDescription:
          "aceitar a proposta comercial",
  
        eventRegistered:
          (event) =>
            `A aceitação da proposta comercial foi registrada no evento "${event.id}".`,
  
        journeyTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" avançou após a aceitação da proposta.`,
  
        journeyNotTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" permaneceu no estado atual após a aceitação da proposta.`,
  
        journeyMissingAfterEvent:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o registro da aceitação da proposta.`,
  
        journeyMissingAfterProcessing:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o processamento da aceitação da proposta.`,
      },
    })
  }