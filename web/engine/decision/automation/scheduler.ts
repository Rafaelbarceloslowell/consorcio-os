import type {
    EntityId,
  } from "@/types/domain"
  
  import type {
    StrategyStep,
  } from "../strategy/types"
  
  import type {
    AutomationJob,
    CreateAutomationJobInput,
  } from "./types"
  
  function createAutomationJobId(
    strategyId: EntityId,
    stepId: EntityId,
  ): EntityId {
    return `${strategyId}:automation-job:${stepId}`
  }
  
  function normalizeScheduledFor(
    step: StrategyStep,
    now: Date,
  ): string {
    if (
      step.scheduledFor === null
    ) {
      return now.toISOString()
    }
  
    const scheduledFor =
      new Date(
        step.scheduledFor,
      )
  
    if (
      Number.isNaN(
        scheduledFor.getTime(),
      )
    ) {
      return now.toISOString()
    }
  
    return scheduledFor.toISOString()
  }
  
  function validateAutomationJobInput({
    strategy,
    step,
    journey,
  }: CreateAutomationJobInput): void {
    if (
      strategy.workspaceId !==
      journey.workspaceId
    ) {
      throw new Error(
        `A estratégia "${strategy.id}" não pertence ao workspace da jornada "${journey.id}".`,
      )
    }
  
    if (
      strategy.journeyId !==
      journey.id
    ) {
      throw new Error(
        `A estratégia "${strategy.id}" não pertence à jornada "${journey.id}".`,
      )
    }
  
    if (
      step.strategyId !==
      strategy.id
    ) {
      throw new Error(
        `O passo "${step.id}" não pertence à estratégia "${strategy.id}".`,
      )
    }
  }
  
  /**
   * Transforma um passo explicitamente escolhido em um trabalho de automação.
   *
   * O Scheduler não decide qual passo deve ser executado.
   * Essa responsabilidade pertence à Cadence.
   */
  export function createAutomationJob({
    strategy,
    step,
    journey,
    now,
  }: CreateAutomationJobInput): AutomationJob {
    validateAutomationJobInput({
      strategy,
      step,
      journey,
      now,
    })
  
    const timestamp =
      now.toISOString()
  
    const scheduledFor =
      normalizeScheduledFor(
        step,
        now,
      )
  
    return {
      id:
        createAutomationJobId(
          strategy.id,
          step.id,
        ),
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
      strategyId:
        strategy.id,
  
      strategyStepId:
        step.id,
  
      source:
        "STRATEGY_STEP",
  
      actionType:
        step.actionType,
  
      channel:
        step.channel,
  
      title:
        step.title,
  
      description:
        step.description,
  
      status:
        scheduledFor <= timestamp
          ? "READY"
          : "PENDING",
  
      priority:
        step.priority,
  
      scheduledFor,
  
      availableAt:
        scheduledFor,
  
      startedAt:
        null,
  
      completedAt:
        null,
  
      failedAt:
        null,
  
      cancelledAt:
        null,
  
      attemptCount:
        0,
  
      maxAttempts:
        strategy.maxAttempts,
  
      lastFailureReason:
        null,
  
      payload: {
        ...step.payload,
  
        strategyType:
          strategy.type,
  
        strategyObjective:
          strategy.objective,
  
        strategyReason:
          strategy.reason,
  
        strategyStepPosition:
          step.position,
  
        sourceRecommendationId:
          step.sourceRecommendationId,
      },
  
      createdActionId:
        null,
  
      createdAt:
        timestamp,
  
      updatedAt:
        timestamp,
    }
  }