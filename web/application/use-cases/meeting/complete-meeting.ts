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
  
  export type CompleteMeetingDependencies =
    CommercialEventUseCaseDependencies
  
  export type CompleteMeetingInput = {
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
      Partial<CompleteMeetingDependencies>
  }
  
  export type CompleteMeetingResult =
    ExecuteCommercialEventUseCaseResult
  
  export function completeMeeting({
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
  }: CompleteMeetingInput): CompleteMeetingResult {
    return executeCommercialEventUseCase({
      commercialRepository,
      crmRepository,
      decisionAutomationRepository,
      workspaceId,
      journeyId,
      eventType:
        "MEETING_COMPLETED",
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
          "concluir a reunião",
  
        eventRegistered:
          (event) =>
            `A conclusão da reunião foi registrada no evento comercial "${event.id}".`,
  
        journeyTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" avançou após a conclusão da reunião.`,
  
        journeyNotTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" permaneceu no estado atual após a conclusão da reunião.`,
  
        journeyMissingAfterEvent:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o registro da conclusão da reunião.`,
  
        journeyMissingAfterProcessing:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o processamento da conclusão da reunião.`,
      },
    })
  }