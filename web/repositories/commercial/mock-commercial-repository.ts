import { mockCommercialData } from "@/data/mock-commercial"

import type {
  CommercialAction,
  CommercialDomain,
  CommercialEvent,
  CommercialJourney,
  JourneyPhase,
  JourneyState,
  NextBestAction,
  WorkflowRule,
} from "@/types/domain"

import type {
  CommercialRepository,
  CommitJourneyTransitionInput,
  CommitJourneyTransitionResult,
  ReplaceOpenNextBestActionsInput,
  ReplaceOpenNextBestActionsResult,
} from "./commercial-repository"

type MockCommercialRepositoryData = Pick<
  CommercialDomain,
  | "commercialJourneys"
  | "journeyPhases"
  | "journeyStates"
  | "commercialEvents"
  | "commercialActions"
  | "nextBestActions"
  | "workflowRules"
>

function isOpenNextBestAction(
  nextBestAction: NextBestAction,
): boolean {
  return (
    nextBestAction.acceptedAt === null &&
    nextBestAction.rejectedAt === null &&
    nextBestAction.executedActionId === null
  )
}

export class MockCommercialRepository
  implements CommercialRepository
{
  private readonly journeys: CommercialJourney[]
  private readonly phases: JourneyPhase[]
  private readonly states: JourneyState[]
  private readonly events: CommercialEvent[]
  private readonly actions: CommercialAction[]
  private readonly nextBestActions: NextBestAction[]
  private readonly workflowRules: WorkflowRule[]

  constructor(
    data: MockCommercialRepositoryData =
      mockCommercialData,
  ) {
    this.journeys = [
      ...data.commercialJourneys,
    ]

    this.phases = [
      ...data.journeyPhases,
    ]

    this.states = [
      ...data.journeyStates,
    ]

    this.events = [
      ...data.commercialEvents,
    ]

    this.actions = [
      ...data.commercialActions,
    ]

    this.nextBestActions = [
      ...data.nextBestActions,
    ]

    this.workflowRules = [
      ...data.workflowRules,
    ]
  }

  getJourneys(): CommercialJourney[] {
    return [...this.journeys]
  }

  getJourneyById(
    journeyId: string,
  ): CommercialJourney | undefined {
    return this.journeys.find(
      (journey) =>
        journey.id === journeyId,
    )
  }

  createJourney(
    journey: CommercialJourney,
  ): CommercialJourney {
    const duplicatedJourney =
      this.journeys.some(
        (currentJourney) =>
          currentJourney.id ===
          journey.id,
      )

    if (duplicatedJourney) {
      throw new Error(
        `Já existe uma jornada comercial com o ID "${journey.id}".`,
      )
    }

    this.journeys.push(
      journey,
    )

    return journey
  }

  updateJourney(
    journey: CommercialJourney,
  ): CommercialJourney {
    const journeyIndex =
      this.journeys.findIndex(
        (currentJourney) =>
          currentJourney.id ===
          journey.id,
      )

    if (journeyIndex === -1) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${journey.id}".`,
      )
    }

    const currentJourney =
      this.journeys[journeyIndex]

    if (
      currentJourney.workspaceId !==
      journey.workspaceId
    ) {
      throw new Error(
        `A jornada comercial "${journey.id}" não pode ser movida para outro workspace.`,
      )
    }

    this.journeys[journeyIndex] =
      journey

    return journey
  }

  commitJourneyTransition(
    {
      journey,
      event,
    }: CommitJourneyTransitionInput,
  ): CommitJourneyTransitionResult {
    const journeyIndex =
      this.journeys.findIndex(
        (currentJourney) =>
          currentJourney.id ===
          journey.id,
      )

    if (journeyIndex === -1) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${journey.id}".`,
      )
    }

    const currentJourney =
      this.journeys[journeyIndex]

    if (
      currentJourney.workspaceId !==
      journey.workspaceId
    ) {
      throw new Error(
        `A jornada comercial "${journey.id}" não pode ser movida para outro workspace.`,
      )
    }

    const duplicatedEvent =
      this.events.some(
        (currentEvent) =>
          currentEvent.id ===
          event.id,
      )

    if (duplicatedEvent) {
      throw new Error(
        `Já existe um evento comercial com o ID "${event.id}".`,
      )
    }

    if (
      event.journeyId !==
      journey.id
    ) {
      throw new Error(
        `O evento comercial "${event.id}" não pertence à jornada "${journey.id}".`,
      )
    }

    if (
      event.workspaceId !==
      journey.workspaceId
    ) {
      throw new Error(
        `O evento comercial "${event.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
      )
    }

    /*
     * Todas as validações são concluídas antes das mutações.
     *
     * Em uma implementação com banco de dados, este método deverá
     * executar a atualização da jornada e a criação do evento dentro
     * da mesma transação.
     */
    this.journeys[journeyIndex] =
      journey

    this.events.push(
      event,
    )

    return {
      journey,
      event,
    }
  }

  getPhases(): JourneyPhase[] {
    return [...this.phases]
  }

  getPhaseById(
    phaseId: string,
  ): JourneyPhase | undefined {
    return this.phases.find(
      (phase) =>
        phase.id === phaseId,
    )
  }

  getStates(): JourneyState[] {
    return [...this.states]
  }

  getStateById(
    stateId: string,
  ): JourneyState | undefined {
    return this.states.find(
      (state) =>
        state.id === stateId,
    )
  }

  getEventsByJourneyId(
    journeyId: string,
  ): CommercialEvent[] {
    return this.events.filter(
      (event) =>
        event.journeyId ===
        journeyId,
    )
  }

  createEvent(
    event: CommercialEvent,
  ): CommercialEvent {
    const duplicatedEvent =
      this.events.some(
        (currentEvent) =>
          currentEvent.id ===
          event.id,
      )

    if (duplicatedEvent) {
      throw new Error(
        `Já existe um evento comercial com o ID "${event.id}".`,
      )
    }

    const journey =
      this.getJourneyById(
        event.journeyId,
      )

    if (!journey) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${event.journeyId}".`,
      )
    }

    if (
      journey.workspaceId !==
      event.workspaceId
    ) {
      throw new Error(
        `O evento comercial "${event.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
      )
    }

    this.events.push(
      event,
    )

    return event
  }

  getActionsByJourneyId(
    journeyId: string,
  ): CommercialAction[] {
    return this.actions.filter(
      (action) =>
        action.journeyId ===
        journeyId,
    )
  }

  getActionById(
    actionId: string,
  ): CommercialAction | undefined {
    return this.actions.find(
      (action) =>
        action.id === actionId,
    )
  }

  createAction(
    action: CommercialAction,
  ): CommercialAction {
    const duplicatedAction =
      this.actions.some(
        (currentAction) =>
          currentAction.id ===
          action.id,
      )

    if (duplicatedAction) {
      throw new Error(
        `Já existe uma ação comercial com o ID "${action.id}".`,
      )
    }

    const journey =
      this.getJourneyById(
        action.journeyId,
      )

    if (!journey) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${action.journeyId}".`,
      )
    }

    if (
      journey.workspaceId !==
      action.workspaceId
    ) {
      throw new Error(
        `A ação comercial "${action.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
      )
    }

    this.actions.push(
      action,
    )

    return action
  }

  updateAction(
    action: CommercialAction,
  ): CommercialAction {
    const actionIndex =
      this.actions.findIndex(
        (currentAction) =>
          currentAction.id ===
          action.id,
      )

    if (actionIndex === -1) {
      throw new Error(
        `Ação comercial não encontrada para o ID "${action.id}".`,
      )
    }

    const currentAction =
      this.actions[actionIndex]

    if (
      currentAction.workspaceId !==
      action.workspaceId
    ) {
      throw new Error(
        `A ação comercial "${action.id}" não pode ser movida para outro workspace.`,
      )
    }

    if (
      currentAction.journeyId !==
      action.journeyId
    ) {
      throw new Error(
        `A ação comercial "${action.id}" não pode ser movida para outra jornada.`,
      )
    }

    this.actions[actionIndex] =
      action

    return action
  }

  getNextBestActionsByJourneyId(
    journeyId: string,
  ): NextBestAction[] {
    return this.nextBestActions.filter(
      (nextBestAction) =>
        nextBestAction.journeyId ===
        journeyId,
    )
  }

  getNextBestActionById(
    nextBestActionId: string,
  ): NextBestAction | undefined {
    return this.nextBestActions.find(
      (nextBestAction) =>
        nextBestAction.id ===
        nextBestActionId,
    )
  }

  createNextBestAction(
    nextBestAction: NextBestAction,
  ): NextBestAction {
    const duplicatedNextBestAction =
      this.nextBestActions.some(
        (currentNextBestAction) =>
          currentNextBestAction.id ===
          nextBestAction.id,
      )

    if (duplicatedNextBestAction) {
      throw new Error(
        `Já existe uma recomendação comercial com o ID "${nextBestAction.id}".`,
      )
    }

    const journey =
      this.getJourneyById(
        nextBestAction.journeyId,
      )

    if (!journey) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${nextBestAction.journeyId}".`,
      )
    }

    if (
      journey.workspaceId !==
      nextBestAction.workspaceId
    ) {
      throw new Error(
        `A recomendação comercial "${nextBestAction.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
      )
    }

    this.nextBestActions.push(
      nextBestAction,
    )

    return nextBestAction
  }

  updateNextBestAction(
    nextBestAction: NextBestAction,
  ): NextBestAction {
    const nextBestActionIndex =
      this.nextBestActions.findIndex(
        (currentNextBestAction) =>
          currentNextBestAction.id ===
          nextBestAction.id,
      )

    if (
      nextBestActionIndex === -1
    ) {
      throw new Error(
        `Recomendação comercial não encontrada para o ID "${nextBestAction.id}".`,
      )
    }

    const currentNextBestAction =
      this.nextBestActions[
        nextBestActionIndex
      ]

    if (
      currentNextBestAction.workspaceId !==
      nextBestAction.workspaceId
    ) {
      throw new Error(
        `A recomendação comercial "${nextBestAction.id}" não pode ser movida para outro workspace.`,
      )
    }

    if (
      currentNextBestAction.journeyId !==
      nextBestAction.journeyId
    ) {
      throw new Error(
        `A recomendação comercial "${nextBestAction.id}" não pode ser movida para outra jornada.`,
      )
    }

    this.nextBestActions[
      nextBestActionIndex
    ] = nextBestAction

    return nextBestAction
  }

  replaceOpenNextBestActions(
    {
      workspaceId,
      journeyId,
      nextBestActions,
    }: ReplaceOpenNextBestActionsInput,
  ): ReplaceOpenNextBestActionsResult {
    const journey =
      this.getJourneyById(
        journeyId,
      )

    if (!journey) {
      throw new Error(
        `Jornada comercial não encontrada para o ID "${journeyId}".`,
      )
    }

    if (
      journey.workspaceId !==
      workspaceId
    ) {
      throw new Error(
        `A jornada comercial "${journey.id}" pertence a outro workspace.`,
      )
    }

    const duplicatedInputIds =
      nextBestActions
        .map(
          (nextBestAction) =>
            nextBestAction.id,
        )
        .filter(
          (
            nextBestActionId,
            index,
            ids,
          ) =>
            ids.indexOf(
              nextBestActionId,
            ) !== index,
        )

    if (
      duplicatedInputIds.length > 0
    ) {
      throw new Error(
        `Existem recomendações duplicadas na substituição: ${[
          ...new Set(
            duplicatedInputIds,
          ),
        ].join(", ")}.`,
      )
    }

    for (
      const nextBestAction of
      nextBestActions
    ) {
      if (
        nextBestAction.workspaceId !==
        workspaceId
      ) {
        throw new Error(
          `A recomendação comercial "${nextBestAction.id}" pertence a outro workspace.`,
        )
      }

      if (
        nextBestAction.journeyId !==
        journeyId
      ) {
        throw new Error(
          `A recomendação comercial "${nextBestAction.id}" não pertence à jornada "${journeyId}".`,
        )
      }

      const duplicatedNextBestAction =
        this.nextBestActions.some(
          (currentNextBestAction) =>
            currentNextBestAction.id ===
            nextBestAction.id,
        )

      if (
        duplicatedNextBestAction
      ) {
        throw new Error(
          `Já existe uma recomendação comercial com o ID "${nextBestAction.id}".`,
        )
      }
    }

    const currentJourneyNextBestActions =
      this.nextBestActions.filter(
        (nextBestAction) =>
          nextBestAction.journeyId ===
          journeyId,
      )

    const preservedNextBestActions =
      currentJourneyNextBestActions.filter(
        (nextBestAction) =>
          !isOpenNextBestAction(
            nextBestAction,
          ),
      )

    const removedNextBestActions =
      currentJourneyNextBestActions.filter(
        (nextBestAction) =>
          isOpenNextBestAction(
            nextBestAction,
          ),
      )

    /*
     * Todas as validações são executadas antes da mutação.
     *
     * Em uma implementação com banco de dados, a remoção das
     * recomendações abertas e a criação das novas recomendações
     * deverão ocorrer na mesma transação.
     */
    for (
      let index =
        this.nextBestActions.length - 1;
      index >= 0;
      index -= 1
    ) {
      const nextBestAction =
        this.nextBestActions[index]

      if (
        nextBestAction.journeyId ===
          journeyId &&
        isOpenNextBestAction(
          nextBestAction,
        )
      ) {
        this.nextBestActions.splice(
          index,
          1,
        )
      }
    }

    this.nextBestActions.push(
      ...nextBestActions,
    )

    const resultingNextBestActions =
      this.getNextBestActionsByJourneyId(
        journeyId,
      )

    return {
      preservedNextBestActions:
        [...preservedNextBestActions],

      removedNextBestActions:
        [...removedNextBestActions],

      createdNextBestActions:
        [...nextBestActions],

      nextBestActions:
        resultingNextBestActions,
    }
  }

  getWorkflowRules(): WorkflowRule[] {
    return [...this.workflowRules]
  }
}

export const mockCommercialRepository =
  new MockCommercialRepository()