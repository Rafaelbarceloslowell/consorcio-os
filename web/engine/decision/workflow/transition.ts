import type {
    CommercialEvent,
    CommercialJourney,
    WorkflowRule,
    WorkflowRuleAction,
  } from "@/types/domain"
  
  import type {
    CreateStateChangedEventInput,
    ExecuteWorkflowTransitionInput,
    ExecuteWorkflowTransitionOutput,
  } from "./types"
  
  function cloneJourney(
    journey: CommercialJourney,
  ): CommercialJourney {
    return {
      ...journey,
    }
  }
  
  function resolveJourneyOutcome(
    targetState: NonNullable<
      ExecuteWorkflowTransitionInput[
        "validation"
      ]["targetState"]
    >,
  ): CommercialJourney["outcome"] {
    if (targetState.isWon) {
      return "WON"
    }
  
    if (targetState.isLost) {
      return "OTHER"
    }
  
    return null
  }
  
  function resolveClosedAt(
    targetState: NonNullable<
      ExecuteWorkflowTransitionInput[
        "validation"
      ]["targetState"]
    >,
    now: Date,
  ): CommercialJourney["closedAt"] {
    if (!targetState.isFinal) {
      return null
    }
  
    return now.toISOString()
  }
  
  function createUpdatedJourney(
    input: ExecuteWorkflowTransitionInput,
  ): CommercialJourney | null {
    const {
      validation,
      journey,
      now,
    } = input
  
    const targetState =
      validation.targetState
  
    const targetPhase =
      validation.targetPhase
  
    if (
      targetState === null ||
      targetPhase === null
    ) {
      return null
    }
  
    return {
      ...journey,
      currentStateId: targetState.id,
      currentPhaseId: targetPhase.id,
      outcome:
        resolveJourneyOutcome(
          targetState,
        ),
      closedAt:
        resolveClosedAt(
          targetState,
          now,
        ),
      version: journey.version + 1,
      updatedAt: now.toISOString(),
    }
  }
  
  function createEventId(
    journeyId: string,
    now: Date,
  ): string {
    return [
      "journey-state-changed",
      journeyId,
      now.getTime().toString(),
    ].join("-")
  }
  
  export function createStateChangedEvent(
    input: CreateStateChangedEventInput,
  ): CommercialEvent {
    const {
      journey,
      sourceState,
      targetState,
      sourcePhase,
      targetPhase,
      actorType,
      actorId,
      origin,
      now,
      payload,
    } = input
  
    const occurredAt =
      now.toISOString()
  
    const eventPayload: Record<
      string,
      unknown
    > = {
      previousStateId:
        sourceState.id,
      previousStateCode:
        sourceState.code,
      previousPhaseId:
        sourcePhase.id,
      previousPhaseCode:
        sourcePhase.code,
      targetStateId:
        targetState.id,
      targetStateCode:
        targetState.code,
      targetPhaseId:
        targetPhase.id,
      targetPhaseCode:
        targetPhase.code,
      origin,
      ...payload,
    }
  
    return {
      id: createEventId(
        journey.id,
        now,
      ),
      workspaceId:
        journey.workspaceId,
      journeyId:
        journey.id,
      type:
        "STATE_CHANGED",
      actorType,
      actorId,
      payload:
        eventPayload,
      occurredAt,
      createdAt:
        occurredAt,
      updatedAt:
        occurredAt,
    }
  }
  
  function readRuleActions(
    rule: WorkflowRule,
  ): WorkflowRuleAction[] {
    const candidate =
      rule as WorkflowRule & {
        actions?:
          | WorkflowRuleAction[]
          | null
      }
  
    if (
      !Array.isArray(
        candidate.actions,
      )
    ) {
      return []
    }
  
    return candidate.actions
  }
  
  function collectRequestedActions(
    rules: WorkflowRule[],
  ): WorkflowRuleAction[] {
    return rules.flatMap(
      (rule) =>
        readRuleActions(rule),
    )
  }
  
  function createRejectedOutput(
    input: ExecuteWorkflowTransitionInput,
  ): ExecuteWorkflowTransitionOutput {
    const previousJourney =
      cloneJourney(input.journey)
  
    return {
      journey:
        cloneJourney(
          input.journey,
        ),
      previousJourney,
      event: null,
      matchedRules:
        input.validation
          .matchedRules,
      requestedActions: [],
      changed: false,
      diagnostics: [
        ...input.validation
          .diagnostics,
        `A transição da jornada "${input.journey.id}" não foi executada porque a validação foi rejeitada.`,
      ],
      warnings: [
        ...input.validation
          .warnings,
      ],
    }
  }
  
  function createIncompleteOutput(
    input: ExecuteWorkflowTransitionInput,
  ): ExecuteWorkflowTransitionOutput {
    const previousJourney =
      cloneJourney(input.journey)
  
    return {
      journey:
        cloneJourney(
          input.journey,
        ),
      previousJourney,
      event: null,
      matchedRules:
        input.validation
          .matchedRules,
      requestedActions: [],
      changed: false,
      diagnostics: [
        ...input.validation
          .diagnostics,
        `A transição da jornada "${input.journey.id}" não foi executada porque os dados de origem ou destino estão incompletos.`,
      ],
      warnings: [
        ...input.validation
          .warnings,
      ],
    }
  }
  
  export function executeWorkflowTransition(
    input: ExecuteWorkflowTransitionInput,
  ): ExecuteWorkflowTransitionOutput {
    const {
      validation,
      journey,
      actorType,
      actorId,
      origin,
      now,
      payload,
    } = input
  
    if (!validation.allowed) {
      return createRejectedOutput(
        input,
      )
    }
  
    const sourceState =
      validation.sourceState
  
    const targetState =
      validation.targetState
  
    const sourcePhase =
      validation.sourcePhase
  
    const targetPhase =
      validation.targetPhase
  
    if (
      sourceState === null ||
      targetState === null ||
      sourcePhase === null ||
      targetPhase === null
    ) {
      return createIncompleteOutput(
        input,
      )
    }
  
    const previousJourney =
      cloneJourney(journey)
  
    const updatedJourney =
      createUpdatedJourney(
        input,
      )
  
    if (updatedJourney === null) {
      return createIncompleteOutput(
        input,
      )
    }
  
    const event =
      createStateChangedEvent({
        journey:
          updatedJourney,
        sourceState,
        targetState,
        sourcePhase,
        targetPhase,
        actorType,
        actorId,
        origin,
        now,
        payload,
      })
  
    const matchedRules = [
      ...validation.matchedRules,
    ]
  
    const requestedActions =
      collectRequestedActions(
        matchedRules,
      )
  
    const diagnostics = [
      ...validation.diagnostics,
      `A jornada "${journey.id}" foi movida do estado "${sourceState.id}" para "${targetState.id}".`,
      `A versão da jornada "${journey.id}" foi atualizada de ${journey.version} para ${updatedJourney.version}.`,
      `O evento de mudança de estado da jornada "${journey.id}" foi criado com sucesso.`,
    ]
  
    if (targetState.isFinal) {
      diagnostics.push(
        `A jornada "${journey.id}" foi encerrada com o resultado "${String(updatedJourney.outcome)}".`,
      )
    }
  
    if (
      sourceState.isFinal &&
      !targetState.isFinal
    ) {
      diagnostics.push(
        `A jornada "${journey.id}" foi reaberta e voltou para um estado não final.`,
      )
    }
  
    return {
      journey:
        updatedJourney,
      previousJourney,
      event,
      matchedRules,
      requestedActions,
      changed: true,
      diagnostics,
      warnings: [
        ...validation.warnings,
      ],
    }
  }