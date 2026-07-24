import type {
    NextBestAction,
  } from "@/types/domain"
  
  import type {
    CommercialStrategyType,
    StrategyEngineInput,
  } from "./types"
  
  const MILLISECONDS_PER_DAY =
    1000 * 60 * 60 * 24
  
  const INACTIVITY_THRESHOLD_IN_DAYS = 7
  const RECOVERY_SCORE_THRESHOLD = 70
  const MEETING_CONVERSION_SCORE_THRESHOLD = 60
  
  function getDaysSinceLastInteraction(
    lastInteractionAt: string | null,
    now: Date,
  ): number | null {
    if (!lastInteractionAt) {
      return null
    }
  
    const lastInteractionDate =
      new Date(lastInteractionAt)
  
    if (
      Number.isNaN(
        lastInteractionDate.getTime(),
      )
    ) {
      return null
    }
  
    const differenceInMilliseconds =
      now.getTime() -
      lastInteractionDate.getTime()
  
    if (differenceInMilliseconds <= 0) {
      return 0
    }
  
    return Math.floor(
      differenceInMilliseconds /
        MILLISECONDS_PER_DAY,
    )
  }
  
  function hasActionType(
    recommendations: NextBestAction[],
    actionType: NextBestAction["actionType"],
  ): boolean {
    return recommendations.some(
      (recommendation) =>
        recommendation.actionType === actionType,
    )
  }
  
  export function selectStrategyType({
    journey,
    recommendations,
    now,
  }: StrategyEngineInput): CommercialStrategyType {
    const daysSinceLastInteraction =
      getDaysSinceLastInteraction(
        journey.lastInteractionAt,
        now,
      )
  
    const isInactive =
      daysSinceLastInteraction !== null &&
      daysSinceLastInteraction >=
        INACTIVITY_THRESHOLD_IN_DAYS
  
    const hasSendMessageRecommendation =
      hasActionType(
        recommendations,
        "SEND_MESSAGE",
      )
  
    if (
      isInactive &&
      (
        journey.score >=
          RECOVERY_SCORE_THRESHOLD ||
        hasSendMessageRecommendation
      )
    ) {
      return "RECOVERY"
    }
  
    if (
      hasActionType(
        recommendations,
        "REQUEST_DOCUMENT",
      )
    ) {
      return "CLOSING"
    }
  
    if (
      hasActionType(
        recommendations,
        "CREATE_PROPOSAL",
      )
    ) {
      return "NEGOTIATION"
    }
  
    if (
      hasActionType(
        recommendations,
        "CREATE_TASK",
      )
    ) {
      return "QUALIFICATION"
    }
  
    if (hasSendMessageRecommendation) {
      return journey.score >=
        MEETING_CONVERSION_SCORE_THRESHOLD
        ? "MEETING_CONVERSION"
        : "INITIAL_CONTACT"
    }
  
    return "NURTURE"
  }