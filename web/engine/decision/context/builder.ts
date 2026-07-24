import type {
    BuildCommercialContextInput,
    CommercialContext,
  } from "./types"
  
  export function buildCommercialContext(
    input: BuildCommercialContextInput,
  ): CommercialContext {
    const {
      now,
      journey,
      lead,
      client,
      phase,
      state,
      events,
      workflowRules,
      actions,
      recommendations,
    } = input
  
    const journeyEvents = events
      .filter((event) => event.journeyId === journey.id)
      .sort((firstEvent, secondEvent) => {
        return (
          new Date(firstEvent.occurredAt).getTime() -
          new Date(secondEvent.occurredAt).getTime()
        )
      })
  
    const journeyActions = actions
      .filter((action) => action.journeyId === journey.id)
      .sort((firstAction, secondAction) => {
        return (
          new Date(firstAction.createdAt).getTime() -
          new Date(secondAction.createdAt).getTime()
        )
      })
  
    const journeyRecommendations = recommendations
      .filter(
        (recommendation) =>
          recommendation.journeyId === journey.id,
      )
      .sort((firstRecommendation, secondRecommendation) => {
        return (
          new Date(firstRecommendation.createdAt).getTime() -
          new Date(secondRecommendation.createdAt).getTime()
        )
      })
  
    return {
      now,
      journey,
      lead,
      client,
      phase,
      state,
      events: journeyEvents,
      workflowRules,
      actions: journeyActions,
      recommendations: journeyRecommendations,
    }
  }