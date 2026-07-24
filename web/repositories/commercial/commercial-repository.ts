import type {
    CommercialAction,
    CommercialEvent,
    CommercialJourney,
    JourneyPhase,
    JourneyState,
    NextBestAction,
    WorkflowRule,
  } from "@/types/domain"
  
  export type CommitJourneyTransitionInput = {
    journey: CommercialJourney
    event: CommercialEvent
  }
  
  export type CommitJourneyTransitionResult = {
    journey: CommercialJourney
    event: CommercialEvent
  }
  
  export type ReplaceOpenNextBestActionsInput = {
    workspaceId: string
    journeyId: string
    nextBestActions: NextBestAction[]
  }
  
  export type ReplaceOpenNextBestActionsResult = {
    preservedNextBestActions: NextBestAction[]
    removedNextBestActions: NextBestAction[]
    createdNextBestActions: NextBestAction[]
    nextBestActions: NextBestAction[]
  }
  
  export interface CommercialRepository {
    getJourneys(): CommercialJourney[]
  
    getJourneyById(
      journeyId: string,
    ): CommercialJourney | undefined
  
    createJourney(
      journey: CommercialJourney,
    ): CommercialJourney
  
    updateJourney(
      journey: CommercialJourney,
    ): CommercialJourney
  
    commitJourneyTransition(
      input: CommitJourneyTransitionInput,
    ): CommitJourneyTransitionResult
  
    getPhases(): JourneyPhase[]
  
    getPhaseById(
      phaseId: string,
    ): JourneyPhase | undefined
  
    getStates(): JourneyState[]
  
    getStateById(
      stateId: string,
    ): JourneyState | undefined
  
    getEventsByJourneyId(
      journeyId: string,
    ): CommercialEvent[]
  
    createEvent(
      event: CommercialEvent,
    ): CommercialEvent
  
    getActionsByJourneyId(
      journeyId: string,
    ): CommercialAction[]
  
    getActionById(
      actionId: string,
    ): CommercialAction | undefined
  
    createAction(
      action: CommercialAction,
    ): CommercialAction
  
    updateAction(
      action: CommercialAction,
    ): CommercialAction
  
    getNextBestActionsByJourneyId(
      journeyId: string,
    ): NextBestAction[]
  
    getNextBestActionById(
      nextBestActionId: string,
    ): NextBestAction | undefined
  
    createNextBestAction(
      nextBestAction: NextBestAction,
    ): NextBestAction
  
    updateNextBestAction(
      nextBestAction: NextBestAction,
    ): NextBestAction
  
    replaceOpenNextBestActions(
      input: ReplaceOpenNextBestActionsInput,
    ): ReplaceOpenNextBestActionsResult
  
    getWorkflowRules(): WorkflowRule[]
  }