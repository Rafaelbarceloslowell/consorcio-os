import type {
    CommercialActionType,
    EntityId,
    NextBestAction,
  } from "@/types/domain"
  
  import type {
    StrategyStep,
    StrategyStepChannel,
  } from "./types"
  
  export type CreateStrategyStepsInput = {
    strategyId: EntityId
    recommendations: NextBestAction[]
    now: Date
  }
  
  function getChannelForAction(
    actionType: CommercialActionType,
  ): StrategyStepChannel {
    switch (actionType) {
      case "SEND_MESSAGE":
        return "WHATSAPP"
  
      case "CREATE_PROPOSAL":
      case "REQUEST_DOCUMENT":
        return "EMAIL"
  
      case "CREATE_TASK":
      case "COMPLETE_TASK":
      case "ADD_NOTE":
      case "UPDATE_PRIORITY":
      case "UPDATE_SCORE":
      case "ASSIGN_CONSULTANT":
      case "CHANGE_STATE":
        return "INTERNAL"
  
      case "SEND_NOTIFICATION":
        return "AUTOMATION"
  
      case "TRIGGER_AUTOMATION":
        return "AUTOMATION"
  
      default:
        return "OTHER"
    }
  }
  
  function getWaitBeforeMinutes(
    position: number,
    actionType: CommercialActionType,
  ): number {
    if (position === 1) {
      return 0
    }
  
    switch (actionType) {
      case "SEND_MESSAGE":
        return 24 * 60
  
      case "SEND_NOTIFICATION":
        return 60
  
      case "REQUEST_DOCUMENT":
        return 24 * 60
  
      case "CREATE_PROPOSAL":
        return 4 * 60
  
      case "CREATE_TASK":
        return 30
  
      case "TRIGGER_AUTOMATION":
        return 15
  
      default:
        return 0
    }
  }
  
  function addMinutes(
    date: Date,
    minutes: number,
  ): Date {
    return new Date(date.getTime() + minutes * 60_000)
  }
  
  function createStepId(
    strategyId: EntityId,
    recommendationId: EntityId,
    position: number,
  ): EntityId {
    return `${strategyId}:step:${position}:${recommendationId}`
  }
  
  function createStrategyStep(
    strategyId: EntityId,
    recommendation: NextBestAction,
    position: number,
    scheduledFor: Date,
    waitBeforeMinutes: number,
  ): StrategyStep {
    return {
      id: createStepId(
        strategyId,
        recommendation.id,
        position,
      ),
  
      strategyId,
  
      position,
  
      title: recommendation.title,
  
      description: recommendation.description,
  
      actionType: recommendation.actionType,
  
      channel: getChannelForAction(
        recommendation.actionType,
      ),
  
      status: position === 1
        ? "READY"
        : "PENDING",
  
      priority: recommendation.priority,
  
      waitBeforeMinutes,
  
      scheduledFor: scheduledFor.toISOString(),
  
      startedAt: null,
  
      completedAt: null,
  
      failedAt: null,
  
      failureReason: null,
  
      sourceRecommendationId: recommendation.id,
  
      payload: {
        reason: recommendation.reason,
        confidence: recommendation.confidence,
        source: recommendation.source,
        recommendationExpiresAt: recommendation.expiresAt,
      },
    }
  }
  
  function sortRecommendations(
    recommendations: NextBestAction[],
  ): NextBestAction[] {
    const priorityWeight: Record<
      NextBestAction["priority"],
      number
    > = {
      URGENT: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    }
  
    return [...recommendations].sort(
      (firstRecommendation, secondRecommendation) => {
        const priorityDifference =
          priorityWeight[secondRecommendation.priority] -
          priorityWeight[firstRecommendation.priority]
  
        if (priorityDifference !== 0) {
          return priorityDifference
        }
  
        const confidenceDifference =
          secondRecommendation.confidence -
          firstRecommendation.confidence
  
        if (confidenceDifference !== 0) {
          return confidenceDifference
        }
  
        return firstRecommendation.createdAt.localeCompare(
          secondRecommendation.createdAt,
        )
      },
    )
  }
  
  export function createStrategySteps({
    strategyId,
    recommendations,
    now,
  }: CreateStrategyStepsInput): StrategyStep[] {
    const sortedRecommendations =
      sortRecommendations(recommendations)
  
    let accumulatedMinutes = 0
  
    return sortedRecommendations.map(
      (recommendation, index) => {
        const position = index + 1
  
        const waitBeforeMinutes =
          getWaitBeforeMinutes(
            position,
            recommendation.actionType,
          )
  
        accumulatedMinutes += waitBeforeMinutes
  
        const scheduledFor = addMinutes(
          now,
          accumulatedMinutes,
        )
  
        return createStrategyStep(
          strategyId,
          recommendation,
          position,
          scheduledFor,
          waitBeforeMinutes,
        )
      },
    )
  }