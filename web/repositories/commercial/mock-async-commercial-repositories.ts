import type {
  CommercialAction,
  CommercialEvent,
  CommercialJourney,
  JourneyPhase,
  JourneyState,
  NextBestAction,
  WorkflowRule,
} from "@/types/domain"

import type {
  AsyncCommercialRepositories,
} from "./async-commercial-repositories"

export type MockAsyncCommercialRepositoriesData = {
  journeys?: CommercialJourney[]
  events?: CommercialEvent[]
  actions?: CommercialAction[]
  nextBestActions?: NextBestAction[]
  phases?: JourneyPhase[]
  states?: JourneyState[]
  workflowRules?: WorkflowRule[]
}

function isOpenNextBestAction(
  recommendation: NextBestAction,
): boolean {
  return (
    recommendation.acceptedAt === null &&
    recommendation.rejectedAt === null &&
    recommendation.executedActionId === null
  )
}

export function createMockAsyncCommercialRepositories(
  data: MockAsyncCommercialRepositoriesData = {},
): AsyncCommercialRepositories {
  const journeys =
    [...(data.journeys ?? [])]

  const events =
    [...(data.events ?? [])]

  const actions =
    [...(data.actions ?? [])]

  const nextBestActions =
    [...(data.nextBestActions ?? [])]

  const phases =
    [...(data.phases ?? [])]

  const states =
    [...(data.states ?? [])]

  const workflowRules =
    [...(data.workflowRules ?? [])]

  const repositories = {
    journeys: {
      async findAll() {
        return [...journeys]
      },

      async findById(
        id: string,
      ) {
        return journeys.find(
          (journey) =>
            journey.id === id,
        )
      },

      async findByLeadId(
        leadId: string,
      ) {
        return journeys.filter(
          (journey) =>
            journey.leadId === leadId,
        )
      },

      async findByClientId(
        clientId: string,
      ) {
        return journeys.filter(
          (journey) =>
            journey.clientId === clientId,
        )
      },

      async findByConsultantId(
        consultantId: string,
      ) {
        return journeys.filter(
          (journey) =>
            journey.consultantId ===
            consultantId,
        )
      },

      async create(
        journey: CommercialJourney,
      ) {
        journeys.push(journey)
        return journey
      },

      async update(
        journey: CommercialJourney,
      ) {
        const index =
          journeys.findIndex(
            (item) =>
              item.id === journey.id,
          )

        if (index === -1) {
          return undefined
        }

        journeys[index] = journey
        return journey
      },

      async delete(
        id: string,
      ) {
        const index =
          journeys.findIndex(
            (journey) =>
              journey.id === id,
          )

        if (index === -1) {
          return false
        }

        journeys.splice(index, 1)
        return true
      },
    },

    events: {
      async findAll() {
        return [...events]
      },

      async findById(
        id: string,
      ) {
        return events.find(
          (event) =>
            event.id === id,
        )
      },

      async findByJourneyId(
        journeyId: string,
      ) {
        return events.filter(
          (event) =>
            event.journeyId ===
            journeyId,
        )
      },

      async create(
        event: CommercialEvent,
      ) {
        events.push(event)
        return event
      },

      async delete(
        id: string,
      ) {
        const index =
          events.findIndex(
            (event) =>
              event.id === id,
          )

        if (index === -1) {
          return false
        }

        events.splice(index, 1)
        return true
      },
    },

    actions: {
      async findAll() {
        return [...actions]
      },

      async findById(
        id: string,
      ) {
        return actions.find(
          (action) =>
            action.id === id,
        )
      },

      async findByJourneyId(
        journeyId: string,
      ) {
        return actions.filter(
          (action) =>
            action.journeyId ===
            journeyId,
        )
      },

      async findOpen() {
        return actions.filter(
          (action) =>
            action.status ===
              "PENDING" ||
            action.status ===
              "IN_PROGRESS",
        )
      },

      async findOpenByJourneyId(
        journeyId: string,
      ) {
        return actions.filter(
          (action) =>
            action.journeyId ===
              journeyId &&
            (
              action.status ===
                "PENDING" ||
              action.status ===
                "IN_PROGRESS"
            ),
        )
      },

      async create(
        action: CommercialAction,
      ) {
        actions.push(action)
        return action
      },

      async update(
        action: CommercialAction,
      ) {
        const index =
          actions.findIndex(
            (item) =>
              item.id === action.id,
          )

        if (index === -1) {
          return undefined
        }

        actions[index] = action
        return action
      },

      async delete(
        id: string,
      ) {
        const index =
          actions.findIndex(
            (action) =>
              action.id === id,
          )

        if (index === -1) {
          return false
        }

        actions.splice(index, 1)
        return true
      },
    },

    nextBestActions: {
      async findAll() {
        return [...nextBestActions]
      },

      async findById(
        id: string,
      ) {
        return nextBestActions.find(
          (recommendation) =>
            recommendation.id === id,
        )
      },

      async findByJourneyId(
        journeyId: string,
      ) {
        return nextBestActions.filter(
          (recommendation) =>
            recommendation.journeyId ===
            journeyId,
        )
      },

      async findOpen() {
        return nextBestActions.filter(
          isOpenNextBestAction,
        )
      },

      async findOpenByJourneyId(
        journeyId: string,
      ) {
        return nextBestActions.filter(
          (recommendation) =>
            recommendation.journeyId ===
              journeyId &&
            isOpenNextBestAction(
              recommendation,
            ),
        )
      },

      async create(
        recommendation: NextBestAction,
      ) {
        nextBestActions.push(
          recommendation,
        )

        return recommendation
      },

      async update(
        recommendation: NextBestAction,
      ) {
        const index =
          nextBestActions.findIndex(
            (item) =>
              item.id ===
              recommendation.id,
          )

        if (index === -1) {
          return undefined
        }

        nextBestActions[index] =
          recommendation

        return recommendation
      },

      async delete(
        id: string,
      ) {
        const index =
          nextBestActions.findIndex(
            (recommendation) =>
              recommendation.id === id,
          )

        if (index === -1) {
          return false
        }

        nextBestActions.splice(
          index,
          1,
        )

        return true
      },
    },

    phases: {
      async findAll() {
        return [...phases]
      },

      async findById(
        id: string,
      ) {
        return phases.find(
          (phase) =>
            phase.id === id,
        )
      },

      async create(
        phase: JourneyPhase,
      ) {
        phases.push(phase)
        return phase
      },

      async update(
        phase: JourneyPhase,
      ) {
        const index =
          phases.findIndex(
            (item) =>
              item.id === phase.id,
          )

        if (index === -1) {
          return undefined
        }

        phases[index] = phase
        return phase
      },

      async delete(
        id: string,
      ) {
        const index =
          phases.findIndex(
            (phase) =>
              phase.id === id,
          )

        if (index === -1) {
          return false
        }

        phases.splice(index, 1)
        return true
      },
    },

    states: {
      async findAll() {
        return [...states]
      },

      async findById(
        id: string,
      ) {
        return states.find(
          (state) =>
            state.id === id,
        )
      },

      async create(
        state: JourneyState,
      ) {
        states.push(state)
        return state
      },

      async update(
        state: JourneyState,
      ) {
        const index =
          states.findIndex(
            (item) =>
              item.id === state.id,
          )

        if (index === -1) {
          return undefined
        }

        states[index] = state
        return state
      },

      async delete(
        id: string,
      ) {
        const index =
          states.findIndex(
            (state) =>
              state.id === id,
          )

        if (index === -1) {
          return false
        }

        states.splice(index, 1)
        return true
      },
    },

    workflowRules: {
      async findAll() {
        return [...workflowRules]
      },

      async findActive() {
        return workflowRules.filter(
          (rule) =>
            rule.isActive,
        )
      },

      async findById(
        id: string,
      ) {
        return workflowRules.find(
          (rule) =>
            rule.id === id,
        )
      },

      async create(
        rule: WorkflowRule,
      ) {
        workflowRules.push(rule)
        return rule
      },

      async update(
        rule: WorkflowRule,
      ) {
        const index =
          workflowRules.findIndex(
            (item) =>
              item.id === rule.id,
          )

        if (index === -1) {
          return undefined
        }

        workflowRules[index] = rule
        return rule
      },

      async delete(
        id: string,
      ) {
        const index =
          workflowRules.findIndex(
            (rule) =>
              rule.id === id,
          )

        if (index === -1) {
          return false
        }

        workflowRules.splice(index, 1)
        return true
      },
    },

    transactions: {
      async commitJourneyTransition(
        input: {
          journey: CommercialJourney
          event: CommercialEvent
        },
      ) {
        const index =
          journeys.findIndex(
            (journey) =>
              journey.id ===
              input.journey.id,
          )

        if (index === -1) {
          throw new Error(
            `Jornada não encontrada: ${input.journey.id}`,
          )
        }

        journeys[index] =
          input.journey

        events.push(
          input.event,
        )

        return {
          journey:
            input.journey,
          event:
            input.event,
        }
      },

      async replaceOpenNextBestActions(
        input: {
          journeyId: string
          nextBestActions:
            NextBestAction[]
        },
      ) {
        const removed =
          nextBestActions.filter(
            (recommendation) =>
              recommendation.journeyId ===
                input.journeyId &&
              isOpenNextBestAction(
                recommendation,
              ),
          )

        for (
          let index =
            nextBestActions.length - 1;
          index >= 0;
          index -= 1
        ) {
          const recommendation =
            nextBestActions[index]

          if (
            recommendation.journeyId ===
              input.journeyId &&
            isOpenNextBestAction(
              recommendation,
            )
          ) {
            nextBestActions.splice(
              index,
              1,
            )
          }
        }

        nextBestActions.push(
          ...input.nextBestActions,
        )

        return {
          removedNextBestActions:
            removed,
          createdNextBestActions:
            [...input.nextBestActions],
          nextBestActions:
            nextBestActions.filter(
              (recommendation) =>
                recommendation.journeyId ===
                input.journeyId,
            ),
        }
      },
    },
  }

  return repositories as unknown as
    AsyncCommercialRepositories
}
