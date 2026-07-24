import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  
  import type {
    CommercialDomain,
    CommercialJourney,
    JourneyPhase,
    JourneyState,
  } from "@/types/domain"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    advanceJourney,
  } from "./advance-journey"
  
  type RepositoryData = Pick<
    CommercialDomain,
    | "commercialJourneys"
    | "journeyPhases"
    | "journeyStates"
    | "commercialEvents"
    | "commercialActions"
    | "nextBestActions"
    | "workflowRules"
  >
  
  describe(
    "advanceJourney",
    () => {
      function createRepository(
        overrides: Partial<RepositoryData> = {},
      ): MockCommercialRepository {
        return new MockCommercialRepository({
          ...mockCommercialData,
          ...overrides,
        })
      }
  
      function getJourneyAndDifferentState(
        repository: MockCommercialRepository,
      ): {
        journey: CommercialJourney
        targetState: JourneyState
      } {
        const journey =
          repository.getJourneys()[0]
  
        expect(journey).toBeDefined()
  
        const targetState =
          repository
            .getStates()
            .find(
              (state) =>
                state.id !==
                  journey.currentStateId &&
                state.isActive &&
                !state.isFinal,
            )
  
        expect(targetState).toBeDefined()
  
        return {
          journey,
          targetState:
            targetState as JourneyState,
        }
      }
  
      it(
        "deve avançar a jornada para o estado informado",
        () => {
          const repository =
            createRepository()
  
          const {
            journey,
            targetState,
          } =
            getJourneyAndDifferentState(
              repository,
            )
  
          const now =
            new Date(
              "2026-07-22T14:00:00.000Z",
            )
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  targetState.id,
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  journey.consultantId,
  
                reason:
                  "Lead avançou no processo comercial.",
  
                metadata: {
                  source:
                    "manual_test",
                },
              },
              {
                commercialRepository:
                  repository,
  
                now,
  
                generateEventId: () =>
                  "state-change-event-1",
              },
            )
  
          expect(
            result.journey.currentStateId,
          ).toBe(targetState.id)
  
          expect(
            result.journey.currentPhaseId,
          ).toBe(targetState.phaseId)
  
          expect(
            result.journey.stateEnteredAt,
          ).toBe(
            "2026-07-22T14:00:00.000Z",
          )
  
          expect(
            result.targetState,
          ).toEqual(targetState)
        },
      )
  
      it(
        "deve persistir a jornada atualizada no repositório",
        () => {
          const repository =
            createRepository()
  
          const {
            journey,
            targetState,
          } =
            getJourneyAndDifferentState(
              repository,
            )
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  targetState.id,
  
                actorType:
                  "SYSTEM",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                now: new Date(
                  "2026-07-22T14:30:00.000Z",
                ),
  
                generateEventId: () =>
                  "state-change-event-2",
              },
            )
  
          expect(
            repository.getJourneyById(
              journey.id,
            ),
          ).toEqual(result.journey)
        },
      )
  
      it(
        "deve incrementar a versão da jornada apenas uma vez",
        () => {
          const repository =
            createRepository()
  
          const {
            journey,
            targetState,
          } =
            getJourneyAndDifferentState(
              repository,
            )
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  targetState.id,
  
                actorType:
                  "SYSTEM",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "state-change-event-3",
              },
            )
  
          expect(
            result.journey.version,
          ).toBe(
            journey.version + 1,
          )
        },
      )
  
      it(
        "deve registrar um evento STATE_CHANGED",
        () => {
          const repository =
            createRepository()
  
          const {
            journey,
            targetState,
          } =
            getJourneyAndDifferentState(
              repository,
            )
  
          const previousStateId =
            journey.currentStateId
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  targetState.id,
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  journey.consultantId,
  
                reason:
                  "Estado atualizado pelo consultor.",
  
                metadata: {
                  channel:
                    "dashboard",
                },
              },
              {
                commercialRepository:
                  repository,
  
                now: new Date(
                  "2026-07-22T15:00:00.000Z",
                ),
  
                generateEventId: () =>
                  "state-change-event-4",
              },
            )
  
          expect(result.event).toEqual({
            id:
              "state-change-event-4",
  
            workspaceId:
              journey.workspaceId,
  
            journeyId:
              journey.id,
  
            type:
              "STATE_CHANGED",
  
            actorType:
              "CONSULTANT",
  
            actorId:
              journey.consultantId,
  
            payload: {
              previousStateId,
  
              targetStateId:
                targetState.id,
  
              previousPhaseId:
                journey.currentPhaseId,
  
              targetPhaseId:
                targetState.phaseId,
  
              reason:
                "Estado atualizado pelo consultor.",
  
              metadata: {
                channel:
                  "dashboard",
              },
            },
  
            occurredAt:
              "2026-07-22T15:00:00.000Z",
  
            createdAt:
              "2026-07-22T15:00:00.000Z",
  
            updatedAt:
              "2026-07-22T15:00:00.000Z",
          })
  
          expect(
            repository
              .getEventsByJourneyId(
                journey.id,
              ),
          ).toContainEqual(
            result.event,
          )
        },
      )
  
      it(
        "deve atualizar lastInteractionAt e updatedAt",
        () => {
          const repository =
            createRepository()
  
          const {
            journey,
            targetState,
          } =
            getJourneyAndDifferentState(
              repository,
            )
  
          const timestamp =
            "2026-07-22T15:30:00.000Z"
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  targetState.id,
  
                actorType:
                  "AUTOMATION",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                now:
                  new Date(timestamp),
  
                generateEventId: () =>
                  "state-change-event-5",
              },
            )
  
          expect(
            result.journey
              .lastInteractionAt,
          ).toBe(timestamp)
  
          expect(
            result.journey.updatedAt,
          ).toBe(timestamp)
        },
      )
  
      it(
        "deve definir closedAt quando o estado de destino for final",
        () => {
          const repository =
            createRepository()
  
          const journey =
            repository.getJourneys()[0]
  
          const finalState =
            repository
              .getStates()
              .find(
                (state) =>
                  state.isFinal &&
                  state.isActive &&
                  state.id !==
                    journey.currentStateId,
              )
  
          expect(finalState).toBeDefined()
  
          const timestamp =
            "2026-07-22T16:00:00.000Z"
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  finalState!.id,
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  journey.consultantId,
              },
              {
                commercialRepository:
                  repository,
  
                now:
                  new Date(timestamp),
  
                generateEventId: () =>
                  "state-change-event-6",
              },
            )
  
          expect(
            result.journey.closedAt,
          ).toBe(timestamp)
        },
      )
  
      it(
        "deve limpar closedAt quando uma jornada encerrada for reaberta",
        () => {
          const baseJourney =
            mockCommercialData
              .commercialJourneys[0]
  
          const baseCurrentState =
            mockCommercialData
              .journeyStates
              .find(
                (state) =>
                  state.id ===
                  baseJourney.currentStateId,
              )
  
          expect(
            baseCurrentState,
          ).toBeDefined()
  
          const reopenedSourceState: JourneyState = {
            ...baseCurrentState!,
  
            id:
              "reopen-source-state",
  
            isFinal:
              true,
  
            isWon:
              false,
  
            isLost:
              true,
  
            allowReopen:
              true,
          }
  
          const reopenerTargetState =
            mockCommercialData
              .journeyStates
              .find(
                (state) =>
                  state.isActive &&
                  !state.isFinal,
              )
  
          expect(
            reopenerTargetState,
          ).toBeDefined()
  
          const closedJourney: CommercialJourney = {
            ...baseJourney,
  
            currentStateId:
              reopenedSourceState.id,
  
            currentPhaseId:
              reopenedSourceState.phaseId,
  
            closedAt:
              "2026-07-21T18:00:00.000Z",
          }
  
          const repository =
            createRepository({
              commercialJourneys: [
                closedJourney,
              ],
  
              journeyStates: [
                ...mockCommercialData
                  .journeyStates,
  
                reopenedSourceState,
              ],
            })
  
          const result =
            advanceJourney(
              {
                workspaceId:
                  closedJourney.workspaceId,
  
                journeyId:
                  closedJourney.id,
  
                targetStateId:
                  reopenerTargetState!.id,
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  closedJourney
                    .consultantId,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "state-change-event-7",
              },
            )
  
          expect(
            result.journey.closedAt,
          ).toBeNull()
        },
      )
  
      it(
        "deve bloquear a reabertura quando o estado final não permitir",
        () => {
          const baseJourney =
            mockCommercialData
              .commercialJourneys[0]
  
          const baseState =
            mockCommercialData
              .journeyStates[0]
  
          const closedState: JourneyState = {
            ...baseState,
  
            id:
              "closed-no-reopen-state",
  
            isInitial:
              false,
  
            isFinal:
              true,
  
            isWon:
              false,
  
            isLost:
              true,
  
            allowReopen:
              false,
          }
  
          const targetState =
            mockCommercialData
              .journeyStates
              .find(
                (state) =>
                  state.isActive &&
                  !state.isFinal,
              )
  
          expect(targetState).toBeDefined()
  
          const closedJourney: CommercialJourney = {
            ...baseJourney,
  
            currentStateId:
              closedState.id,
  
            currentPhaseId:
              closedState.phaseId,
  
            closedAt:
              "2026-07-21T18:00:00.000Z",
          }
  
          const repository =
            createRepository({
              commercialJourneys: [
                closedJourney,
              ],
  
              journeyStates: [
                ...mockCommercialData
                  .journeyStates,
  
                closedState,
              ],
            })
  
          expect(() =>
            advanceJourney(
              {
                workspaceId:
                  closedJourney.workspaceId,
  
                journeyId:
                  closedJourney.id,
  
                targetStateId:
                  targetState!.id,
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  closedJourney
                    .consultantId,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "state-change-event-8",
              },
            ),
          ).toThrow(
            `A jornada comercial "${closedJourney.id}" está encerrada no estado "${closedState.id}" e não permite reabertura.`,
          )
        },
      )
  
      it(
        "deve rejeitar uma transição para o estado atual",
        () => {
          const repository =
            createRepository()
  
          const journey =
            repository.getJourneys()[0]
  
          expect(
            journey.currentStateId,
          ).not.toBeNull()
  
          expect(() =>
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  journey.currentStateId!,
  
                actorType:
                  "SYSTEM",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "state-change-event-9",
              },
            ),
          ).toThrow(
            `A jornada comercial "${journey.id}" já está no estado "${journey.currentStateId}".`,
          )
        },
      )
  
      it(
        "deve rejeitar um estado de destino inativo",
        () => {
          const baseJourney =
            mockCommercialData
              .commercialJourneys[0]
  
          const activeTargetState =
            mockCommercialData
              .journeyStates
              .find(
                (state) =>
                  state.id !==
                    baseJourney
                      .currentStateId,
              )
  
          expect(
            activeTargetState,
          ).toBeDefined()
  
          const inactiveState: JourneyState = {
            ...activeTargetState!,
  
            id:
              "inactive-target-state",
  
            isActive:
              false,
          }
  
          const repository =
            createRepository({
              journeyStates: [
                ...mockCommercialData
                  .journeyStates,
  
                inactiveState,
              ],
            })
  
          expect(() =>
            advanceJourney(
              {
                workspaceId:
                  baseJourney.workspaceId,
  
                journeyId:
                  baseJourney.id,
  
                targetStateId:
                  inactiveState.id,
  
                actorType:
                  "SYSTEM",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "state-change-event-10",
              },
            ),
          ).toThrow(
            `O estado "${inactiveState.id}" está inativo e não pode receber jornadas.`,
          )
        },
      )
  
      it(
        "deve rejeitar uma fase de destino inativa",
        () => {
          const baseJourney =
            mockCommercialData
              .commercialJourneys[0]
  
          const targetState =
            mockCommercialData
              .journeyStates
              .find(
                (state) =>
                  state.id !==
                    baseJourney
                      .currentStateId,
              )
  
          expect(targetState).toBeDefined()
  
          const currentPhase =
            mockCommercialData
              .journeyPhases
              .find(
                (phase) =>
                  phase.id ===
                  targetState!.phaseId,
              )
  
          expect(currentPhase).toBeDefined()
  
          const inactivePhase: JourneyPhase = {
            ...currentPhase!,
  
            isActive:
              false,
          }
  
          const repository =
            createRepository({
              journeyPhases:
                mockCommercialData
                  .journeyPhases
                  .map(
                    (phase) =>
                      phase.id ===
                      inactivePhase.id
                        ? inactivePhase
                        : phase,
                  ),
            })
  
          expect(() =>
            advanceJourney(
              {
                workspaceId:
                  baseJourney.workspaceId,
  
                journeyId:
                  baseJourney.id,
  
                targetStateId:
                  targetState!.id,
  
                actorType:
                  "SYSTEM",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "state-change-event-11",
              },
            ),
          ).toThrow(
            `A fase "${inactivePhase.id}" está inativa e não pode receber jornadas.`,
          )
        },
      )
  
      it(
        "não deve alterar a jornada quando o evento possuir ID duplicado",
        () => {
          const repository =
            createRepository()
  
          const {
            journey,
            targetState,
          } =
            getJourneyAndDifferentState(
              repository,
            )
  
          const existingEvent =
            repository
              .getEventsByJourneyId(
                journey.id,
              )[0] ??
            mockCommercialData
              .commercialEvents[0]
  
          expect(
            existingEvent,
          ).toBeDefined()
  
          const previousJourney = {
            ...repository
              .getJourneyById(
                journey.id,
              )!,
          }
  
          const previousEvents =
            repository
              .getEventsByJourneyId(
                journey.id,
              )
  
          expect(() =>
            advanceJourney(
              {
                workspaceId:
                  journey.workspaceId,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  targetState.id,
  
                actorType:
                  "SYSTEM",
  
                actorId:
                  null,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  existingEvent.id,
              },
            ),
          ).toThrow(
            `Já existe um evento comercial com o ID "${existingEvent.id}".`,
          )
  
          expect(
            repository.getJourneyById(
              journey.id,
            ),
          ).toEqual(
            previousJourney,
          )
  
          expect(
            repository
              .getEventsByJourneyId(
                journey.id,
              ),
          ).toEqual(
            previousEvents,
          )
        },
      )
    },
  )