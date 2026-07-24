import {
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  
  import type {
    CommercialAction,
    CommercialDomain,
    CommercialJourney,
    JourneyState,
  } from "@/types/domain"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    executeCommercialAction,
  } from "./commercial-action-executor"
  
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
    "executeCommercialAction",
    () => {
      function createRepository(
        overrides: Partial<RepositoryData> = {},
      ): MockCommercialRepository {
        return new MockCommercialRepository({
          ...mockCommercialData,
          ...overrides,
        })
      }
  
      function createJourney(
        overrides: Partial<CommercialJourney> = {},
      ): CommercialJourney {
        return {
          ...mockCommercialData
            .commercialJourneys[0],
  
          id:
            "action-executor-journey",
  
          version:
            1,
  
          ...overrides,
        }
      }
  
      function createAction(
        journey: CommercialJourney,
        overrides: Partial<CommercialAction> = {},
      ): CommercialAction {
        return {
          id:
            "action-executor-action",
  
          workspaceId:
            journey.workspaceId,
  
          journeyId:
            journey.id,
  
          type:
            "CREATE_TASK",
  
          status:
            "PENDING",
  
          origin:
            "WORKFLOW_RULE",
  
          actorType:
            "AUTOMATION",
  
          actorId:
            null,
  
          title:
            "Executar ação de teste",
  
          description:
            "Ação utilizada nos testes do executor.",
  
          payload: {},
  
          scheduledFor:
            null,
  
          startedAt:
            null,
  
          completedAt:
            null,
  
          failedAt:
            null,
  
          failureReason:
            null,
  
          createdBy:
            null,
  
          createdAt:
            "2026-07-22T10:00:00.000Z",
  
          updatedAt:
            "2026-07-22T10:00:00.000Z",
  
          ...overrides,
        }
      }
  
      function getDifferentActiveState(
        journey: CommercialJourney,
      ): JourneyState {
        const targetState =
          mockCommercialData
            .journeyStates
            .find(
              (state) =>
                state.workspaceId ===
                  journey.workspaceId &&
                state.id !==
                  journey.currentStateId &&
                state.isActive &&
                !state.isFinal,
            )
  
        expect(
          targetState,
        ).toBeDefined()
  
        return targetState as JourneyState
      }
  
      it(
        "deve executar uma ação CHANGE_STATE usando advanceJourney",
        () => {
          const journey =
            createJourney()
  
          const targetState =
            getDifferentActiveState(
              journey,
            )
  
          const action =
            createAction(
              journey,
              {
                id:
                  "change-state-action",
  
                type:
                  "CHANGE_STATE",
  
                payload: {
                  targetStateId:
                    targetState.id,
  
                  reason:
                    "Avanço automático pelo workflow.",
  
                  metadata: {
                    source:
                      "commercial-action-executor-test",
                  },
                },
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const result =
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                now:
                  new Date(
                    "2026-07-22T15:00:00.000Z",
                  ),
  
                generateEventId: () =>
                  "change-state-event",
              },
            )
  
          expect(
            result.journey.currentStateId,
          ).toBe(
            targetState.id,
          )
  
          expect(
            result.journey.currentPhaseId,
          ).toBe(
            targetState.phaseId,
          )
  
          expect(
            result.event?.id,
          ).toBe(
            "change-state-event",
          )
  
          expect(
            result.event?.type,
          ).toBe(
            "STATE_CHANGED",
          )
  
          expect(
            result.handlerResult,
          ).toEqual({
            previousStateId:
              journey.currentStateId,
  
            targetStateId:
              targetState.id,
  
            eventId:
              "change-state-event",
          })
        },
      )
  
      it(
        "deve adicionar rastreabilidade da ação ao evento STATE_CHANGED",
        () => {
          const journey =
            createJourney()
  
          const targetState =
            getDifferentActiveState(
              journey,
            )
  
          const action =
            createAction(
              journey,
              {
                id:
                  "traceable-change-state-action",
  
                type:
                  "CHANGE_STATE",
  
                origin:
                  "WORKFLOW_RULE",
  
                payload: {
                  targetStateId:
                    targetState.id,
  
                  metadata: {
                    workflowRuleId:
                      "workflow-rule-1",
                  },
                },
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const result =
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "traceable-event",
              },
            )
  
          expect(
            result.event?.payload,
          ).toMatchObject({
            targetStateId:
              targetState.id,
  
            metadata: {
              workflowRuleId:
                "workflow-rule-1",
  
              commercialActionId:
                action.id,
  
              commercialActionOrigin:
                "WORKFLOW_RULE",
            },
          })
        },
      )
  
      it(
        "deve concluir a ação após uma execução bem-sucedida",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "completed-action",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const timestamp =
            "2026-07-22T16:00:00.000Z"
  
          const result =
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                now:
                  new Date(timestamp),
  
                handlers: {
                  CREATE_TASK: () => ({
                    taskId:
                      "task-1",
                  }),
                },
              },
            )
  
          expect(
            result.action.status,
          ).toBe(
            "COMPLETED",
          )
  
          expect(
            result.action.startedAt,
          ).toBe(
            timestamp,
          )
  
          expect(
            result.action.completedAt,
          ).toBe(
            timestamp,
          )
  
          expect(
            result.action.failedAt,
          ).toBeNull()
  
          expect(
            result.action.failureReason,
          ).toBeNull()
  
          expect(
            result.action.updatedAt,
          ).toBe(
            timestamp,
          )
        },
      )
  
      it(
        "deve persistir a ação concluída no repositório",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "persisted-completed-action",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const result =
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                handlers: {
                  CREATE_TASK: () => ({
                    taskId:
                      "task-2",
                  }),
                },
              },
            )
  
          expect(
            repository.getActionById(
              action.id,
            ),
          ).toEqual(
            result.action,
          )
        },
      )
  
      it(
        "deve executar o handler registrado para a ação",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "custom-handler-action",
  
                type:
                  "SEND_NOTIFICATION",
  
                payload: {
                  message:
                    "Nova oportunidade comercial.",
                },
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const handler =
            vi.fn(
              ({
                action:
                  currentAction,
                journey:
                  currentJourney,
              }) => ({
                notificationId:
                  "notification-1",
  
                actionId:
                  currentAction.id,
  
                journeyId:
                  currentJourney.id,
              }),
            )
  
          const result =
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                handlers: {
                  SEND_NOTIFICATION:
                    handler,
                },
              },
            )
  
          expect(
            handler,
          ).toHaveBeenCalledTimes(1)
  
          expect(
            handler,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              action:
                expect.objectContaining({
                  id:
                    action.id,
  
                  status:
                    "IN_PROGRESS",
                }),
  
              journey:
                expect.objectContaining({
                  id:
                    journey.id,
                }),
  
              commercialRepository:
                repository,
  
              now:
                expect.any(Date),
            }),
          )
  
          expect(
            result.handlerResult,
          ).toEqual({
            notificationId:
              "notification-1",
  
            actionId:
              action.id,
  
            journeyId:
              journey.id,
          })
  
          expect(
            result.event,
          ).toBeNull()
        },
      )
  
      it(
        "deve marcar a ação como FAILED quando não houver handler",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "missing-handler-action",
  
                type:
                  "CREATE_TASK",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const timestamp =
            "2026-07-22T17:00:00.000Z"
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                now:
                  new Date(timestamp),
              },
            ),
          ).toThrow(
            `Nenhum executor foi registrado para ações do tipo "${action.type}".`,
          )
  
          expect(
            repository.getActionById(
              action.id,
            ),
          ).toMatchObject({
            status:
              "FAILED",
  
            startedAt:
              timestamp,
  
            completedAt:
              null,
  
            failedAt:
              timestamp,
  
            failureReason:
              `Nenhum executor foi registrado para ações do tipo "${action.type}".`,
  
            updatedAt:
              timestamp,
          })
        },
      )
  
      it(
        "deve marcar a ação como FAILED quando o handler lançar um erro",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "failing-handler-action",
  
                type:
                  "TRIGGER_AUTOMATION",
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const timestamp =
            "2026-07-22T17:30:00.000Z"
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                now:
                  new Date(timestamp),
  
                handlers: {
                  TRIGGER_AUTOMATION:
                    () => {
                      throw new Error(
                        "Automação indisponível.",
                      )
                    },
                },
              },
            ),
          ).toThrow(
            "Automação indisponível.",
          )
  
          expect(
            repository.getActionById(
              action.id,
            ),
          ).toMatchObject({
            status:
              "FAILED",
  
            startedAt:
              timestamp,
  
            completedAt:
              null,
  
            failedAt:
              timestamp,
  
            failureReason:
              "Automação indisponível.",
          })
        },
      )
  
      it(
        "deve marcar CHANGE_STATE como FAILED quando o payload não possuir targetStateId",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "invalid-change-state-action",
  
                type:
                  "CHANGE_STATE",
  
                payload: {},
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
              },
            ),
          ).toThrow(
            `A ação comercial "${action.id}" exige o campo textual "targetStateId" no payload.`,
          )
  
          expect(
            repository
              .getActionById(
                action.id,
              )
              ?.status,
          ).toBe(
            "FAILED",
          )
        },
      )
  
      it(
        "deve manter a jornada inalterada quando CHANGE_STATE falhar",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  "failed-transition-action",
  
                type:
                  "CHANGE_STATE",
  
                payload: {
                  targetStateId:
                    "missing-state",
                },
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          const previousJourney = {
            ...repository.getJourneyById(
              journey.id,
            )!,
          }
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                generateEventId: () =>
                  "failed-transition-event",
              },
            ),
          ).toThrow(
            `Estado da jornada não encontrado para o ID "missing-state".`,
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
              )
              .some(
                (event) =>
                  event.id ===
                  "failed-transition-event",
              ),
          ).toBe(
            false,
          )
        },
      )
  
      it(
        "deve rejeitar uma ação inexistente",
        () => {
          const repository =
            createRepository()
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  "workspace-1",
  
                actionId:
                  "missing-action",
              },
              {
                commercialRepository:
                  repository,
              },
            ),
          ).toThrow(
            `Ação comercial não encontrada para o ID "missing-action".`,
          )
        },
      )
  
      it(
        "deve rejeitar uma ação pertencente a outro workspace",
        () => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  "another-workspace",
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
              },
            ),
          ).toThrow(
            `A ação comercial "${action.id}" pertence a outro workspace.`,
          )
  
          expect(
            repository
              .getActionById(
                action.id,
              )
              ?.status,
          ).toBe(
            "PENDING",
          )
        },
      )
  
      it.each([
        {
          status:
            "IN_PROGRESS" as const,
  
          message:
            "já está em execução",
        },
        {
          status:
            "COMPLETED" as const,
  
          message:
            "já foi concluída",
        },
        {
          status:
            "FAILED" as const,
  
          message:
            "falhou anteriormente",
        },
        {
          status:
            "CANCELLED" as const,
  
          message:
            "foi cancelada",
        },
      ])(
        "deve bloquear a execução de uma ação com status $status",
        ({
          status,
          message,
        }) => {
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id:
                  `blocked-${status.toLowerCase()}-action`,
  
                status,
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          let thrownError:
            unknown
  
          try {
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
  
                handlers: {
                  CREATE_TASK:
                    () => undefined,
                },
              },
            )
          } catch (error) {
            thrownError =
              error
          }
  
          expect(
            thrownError,
          ).toBeInstanceOf(
            Error,
          )
  
          expect(
            (
              thrownError as Error
            ).message,
          ).toContain(
            message,
          )
  
          expect(
            repository
              .getActionById(
                action.id,
              )
              ?.status,
          ).toBe(
            status,
          )
        },
      )
  
      it(
        "deve rejeitar metadata inválido em uma ação CHANGE_STATE",
        () => {
          const journey =
            createJourney()
  
          const targetState =
            getDifferentActiveState(
              journey,
            )
  
          const action =
            createAction(
              journey,
              {
                id:
                  "invalid-metadata-action",
  
                type:
                  "CHANGE_STATE",
  
                payload: {
                  targetStateId:
                    targetState.id,
  
                  metadata:
                    "invalid-metadata",
                },
              },
            )
  
          const repository =
            createRepository({
              commercialJourneys: [
                journey,
              ],
  
              commercialActions: [
                action,
              ],
            })
  
          expect(() =>
            executeCommercialAction(
              {
                workspaceId:
                  journey.workspaceId,
  
                actionId:
                  action.id,
              },
              {
                commercialRepository:
                  repository,
              },
            ),
          ).toThrow(
            `O campo "metadata" da ação comercial "${action.id}" deve ser um objeto.`,
          )
  
          expect(
            repository
              .getActionById(
                action.id,
              )
              ?.status,
          ).toBe(
            "FAILED",
          )
        },
      )
    },
  )