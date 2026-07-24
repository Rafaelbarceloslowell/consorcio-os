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
  
  export type ReceiveLeadReplyDependencies =
    CommercialEventUseCaseDependencies
  
  export type ReceiveLeadReplyInput = {
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
      Partial<ReceiveLeadReplyDependencies>
  }
  
  export type ReceiveLeadReplyResult =
    ExecuteCommercialEventUseCaseResult
  
  export function receiveLeadReply({
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
  }: ReceiveLeadReplyInput): ReceiveLeadReplyResult {
    return executeCommercialEventUseCase({
      commercialRepository,
      crmRepository,
      decisionAutomationRepository,
      workspaceId,
      journeyId,
      eventType:
        "LEAD_REPLIED",
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
          "processar a resposta do lead",
  
        eventRegistered:
          (event) =>
            `A resposta do lead foi registrada no evento comercial "${event.id}".`,
  
        journeyTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" avançou após a resposta do lead.`,
  
        journeyNotTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" permaneceu no estado atual após a resposta do lead.`,
  
        journeyMissingAfterEvent:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o registro da resposta do lead.`,
  
        journeyMissingAfterProcessing:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o processamento da resposta do lead.`,
      },
    })
  }