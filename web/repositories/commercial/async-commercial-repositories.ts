import type {
    CommercialAction,
    CommercialConversationMemory,
    CommercialEvent,
    CommercialEventType,
    CommercialJourney,
    JourneyPhase,
    JourneyState,
    NextBestAction,
    WorkflowRule,
  } from "@/types/domain"

  import type {
    CommitJourneyCreationInput,
    CommitJourneyCreationResult,
    CommitJourneyTransitionInput,
    CommitJourneyTransitionResult,
    ReplaceOpenNextBestActionsInput,
    ReplaceOpenNextBestActionsResult,
  } from "./commercial-repository"

  export interface AsyncCommercialConversationMemoryRepository {
    findByJourneyId(
      journeyId: string,
    ): Promise<CommercialConversationMemory | undefined>
  }

  export interface AsyncCommercialJourneyRepository {
    findAll(): Promise<CommercialJourney[]>

    findById(
      journeyId: string,
    ): Promise<CommercialJourney | undefined>

    findByLeadId(
      leadId: string,
    ): Promise<CommercialJourney[]>

    findByClientId(
      clientId: string,
    ): Promise<CommercialJourney[]>

    findByConsultantId(
      consultantId: string,
    ): Promise<CommercialJourney[]>

    create(
      journey: CommercialJourney,
    ): Promise<CommercialJourney>

    update(
      journey: CommercialJourney,
    ): Promise<CommercialJourney | undefined>

    delete(
      journeyId: string,
    ): Promise<boolean>
  }

  export interface AsyncCommercialEventRepository {
    findAll(): Promise<CommercialEvent[]>

    findById(
      eventId: string,
    ): Promise<CommercialEvent | undefined>

    findByJourneyId(
      journeyId: string,
    ): Promise<CommercialEvent[]>

    findByType(
      type: CommercialEventType,
    ): Promise<CommercialEvent[]>

    create(
      event: CommercialEvent,
    ): Promise<CommercialEvent>

    delete(
      eventId: string,
    ): Promise<boolean>
  }

  export interface AsyncCommercialActionRepository {
    findAll(): Promise<CommercialAction[]>

    findById(
      actionId: string,
    ): Promise<CommercialAction | undefined>

    findByJourneyId(
      journeyId: string,
    ): Promise<CommercialAction[]>

    findOpen(): Promise<CommercialAction[]>

    findOpenByJourneyId(
      journeyId: string,
    ): Promise<CommercialAction[]>

    create(
      action: CommercialAction,
    ): Promise<CommercialAction>

    update(
      action: CommercialAction,
    ): Promise<CommercialAction | undefined>

    delete(
      actionId: string,
    ): Promise<boolean>
  }

  export interface AsyncNextBestActionRepository {
    findAll(): Promise<NextBestAction[]>

    findById(
      nextBestActionId: string,
    ): Promise<NextBestAction | undefined>

    findByJourneyId(
      journeyId: string,
    ): Promise<NextBestAction[]>

    findOpen(): Promise<NextBestAction[]>

    findOpenByJourneyId(
      journeyId: string,
    ): Promise<NextBestAction[]>

    create(
      nextBestAction: NextBestAction,
    ): Promise<NextBestAction>

    update(
      nextBestAction: NextBestAction,
    ): Promise<NextBestAction | undefined>

    delete(
      nextBestActionId: string,
    ): Promise<boolean>
  }

  export interface AsyncJourneyPhaseRepository {
    findAll(): Promise<JourneyPhase[]>

    findById(
      phaseId: string,
    ): Promise<JourneyPhase | undefined>

    create(
      phase: JourneyPhase,
    ): Promise<JourneyPhase>

    update(
      phase: JourneyPhase,
    ): Promise<JourneyPhase | undefined>

    delete(
      phaseId: string,
    ): Promise<boolean>
  }

  export interface AsyncJourneyStateRepository {
    findAll(): Promise<JourneyState[]>

    findById(
      stateId: string,
    ): Promise<JourneyState | undefined>

    create(
      state: JourneyState,
    ): Promise<JourneyState>

    update(
      state: JourneyState,
    ): Promise<JourneyState | undefined>

    delete(
      stateId: string,
    ): Promise<boolean>
  }

  export interface AsyncWorkflowRuleRepository {
    findAll(): Promise<WorkflowRule[]>

    findActive(): Promise<WorkflowRule[]>

    findById(
      ruleId: string,
    ): Promise<WorkflowRule | undefined>

    create(
      rule: WorkflowRule,
    ): Promise<WorkflowRule>

    update(
      rule: WorkflowRule,
    ): Promise<WorkflowRule | undefined>

    delete(
      ruleId: string,
    ): Promise<boolean>
  }

  export interface AsyncCommercialTransactionRepository {
    commitJourneyCreation(
      input: CommitJourneyCreationInput,
    ): Promise<CommitJourneyCreationResult>

    commitJourneyTransition(
      input: CommitJourneyTransitionInput,
    ): Promise<CommitJourneyTransitionResult>

    replaceOpenNextBestActions(
      input: ReplaceOpenNextBestActionsInput,
    ): Promise<ReplaceOpenNextBestActionsResult>
  }

  export interface AsyncCommercialRepositories {
    conversationMemories: AsyncCommercialConversationMemoryRepository
    journeys: AsyncCommercialJourneyRepository
    events: AsyncCommercialEventRepository
    actions: AsyncCommercialActionRepository
    nextBestActions: AsyncNextBestActionRepository
    phases: AsyncJourneyPhaseRepository
    states: AsyncJourneyStateRepository
    workflowRules: AsyncWorkflowRuleRepository
    transactions: AsyncCommercialTransactionRepository
  }
