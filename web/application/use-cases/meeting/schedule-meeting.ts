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
  
  export type ScheduleMeetingDependencies =
    CommercialEventUseCaseDependencies
  
  export type ScheduleMeetingInput = {
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
      Partial<ScheduleMeetingDependencies>
  }
  
  export type ScheduleMeetingResult =
    ExecuteCommercialEventUseCaseResult
  
  export function scheduleMeeting({
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
  }: ScheduleMeetingInput): ScheduleMeetingResult {
    return executeCommercialEventUseCase({
      commercialRepository,
      crmRepository,
      decisionAutomationRepository,
      workspaceId,
      journeyId,
      eventType:
        "MEETING_SCHEDULED",
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
          "agendar a reunião",
  
        eventRegistered:
          (event) =>
            `O agendamento da reunião foi registrado no evento comercial "${event.id}".`,
  
        journeyTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" avançou após o agendamento da reunião.`,
  
        journeyNotTransitioned:
          (journey) =>
            `A jornada comercial "${journey.id}" permaneceu no estado atual após o agendamento da reunião.`,
  
        journeyMissingAfterEvent:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o registro do agendamento da reunião.`,
  
        journeyMissingAfterProcessing:
          (resolvedJourneyId) =>
            `A jornada comercial "${resolvedJourneyId}" não foi encontrada após o processamento do agendamento da reunião.`,
      },
    })
  }