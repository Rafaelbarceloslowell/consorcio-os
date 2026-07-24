import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  
  import type {
    CommercialAction,
    CommercialEvent,
    CommercialJourney,
    NextBestAction,
  } from "@/types/domain"
  
  import {
    MockCommercialRepository,
  } from "./mock-commercial-repository"
  
  describe(
    "MockCommercialRepository",
    () => {
      function createRepository(): MockCommercialRepository {
        return new MockCommercialRepository(
          mockCommercialData,
        )
      }
  
      function createJourney(
        overrides: Partial<CommercialJourney> = {},
      ): CommercialJourney {
        return {
          id: "journey-test",
          workspaceId: "workspace-test",
          leadId: "lead-test",
          clientId: null,
          consultantId: "consultant-test",
          title: "Jornada comercial de teste",
          consortiumType: "real_estate",
          currentPhaseId: "phase-test",
          currentStateId: "state-test",
          priority: "NORMAL",
          score: 50,
          outcome: null,
          stateEnteredAt:
            "2026-07-22T12:00:00.000Z",
          lastInteractionAt: null,
          closedAt: null,
          version: 1,
          createdAt:
            "2026-07-22T12:00:00.000Z",
          updatedAt:
            "2026-07-22T12:00:00.000Z",
          ...overrides,
        }
      }
  
      function createEvent(
        journey: CommercialJourney,
        overrides: Partial<CommercialEvent> = {},
      ): CommercialEvent {
        return {
          id: "event-test",
          workspaceId: journey.workspaceId,
          journeyId: journey.id,
          type: "NOTE_ADDED",
          actorType: "SYSTEM",
          actorId: null,
          payload: {},
          occurredAt:
            "2026-07-22T13:00:00.000Z",
          createdAt:
            "2026-07-22T13:00:00.000Z",
          updatedAt:
            "2026-07-22T13:00:00.000Z",
          ...overrides,
        }
      }
  
      function createAction(
        journey: CommercialJourney,
        overrides: Partial<CommercialAction> = {},
      ): CommercialAction {
        return {
          id: "action-test",
          workspaceId: journey.workspaceId,
          journeyId: journey.id,
          type: "CREATE_TASK",
          status: "PENDING",
          origin: "SYSTEM",
          actorType: "SYSTEM",
          actorId: null,
          title: "Executar tarefa comercial",
          payload: {},
          scheduledFor: null,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          failureReason: null,
          createdBy: null,
          createdAt:
            "2026-07-22T14:00:00.000Z",
          updatedAt:
            "2026-07-22T14:00:00.000Z",
          ...overrides,
        }
      }

      function createNextBestAction(
        journey: CommercialJourney,
        overrides: Partial<NextBestAction> = {},
      ): NextBestAction {
        return {
          id: "next-best-action-test",
          workspaceId: journey.workspaceId,
          journeyId: journey.id,
          actionType: "CREATE_TASK",
          title: "Próxima melhor ação",
          description:
            "Executar a melhor ação comercial disponível.",
          reason:
            "A jornada exige uma nova interação comercial.",
          confidence: 0.9,
          priority: "HIGH",
          source: "RULE_ENGINE",
          expiresAt:
            "2026-07-24T14:00:00.000Z",
          acceptedAt: null,
          rejectedAt: null,
          executedActionId: null,
          createdAt:
            "2026-07-22T14:00:00.000Z",
          updatedAt:
            "2026-07-22T14:00:00.000Z",
          ...overrides,
        }
      }
  
      it(
        "deve criar e recuperar uma jornada comercial",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          const createdJourney =
            repository.createJourney(
              journey,
            )
  
          expect(createdJourney).toEqual(
            journey,
          )
  
          expect(
            repository.getJourneyById(
              journey.id,
            ),
          ).toEqual(journey)
        },
      )
  
      it(
        "deve rejeitar uma jornada com ID duplicado",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          expect(() =>
            repository.createJourney(
              journey,
            ),
          ).toThrow(
            `Já existe uma jornada comercial com o ID "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve atualizar uma jornada existente",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const updatedJourney: CommercialJourney = {
            ...journey,
            title:
              "Jornada comercial atualizada",
            score: 75,
            version:
              journey.version + 1,
            updatedAt:
              "2026-07-22T15:00:00.000Z",
          }
  
          const persistedJourney =
            repository.updateJourney(
              updatedJourney,
            )
  
          expect(
            persistedJourney,
          ).toEqual(updatedJourney)
  
          expect(
            repository.getJourneyById(
              journey.id,
            ),
          ).toEqual(updatedJourney)
        },
      )
  
      it(
        "deve rejeitar a atualização de uma jornada inexistente",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney({
              id: "journey-inexistente",
            })
  
          expect(() =>
            repository.updateJourney(
              journey,
            ),
          ).toThrow(
            `Jornada comercial não encontrada para o ID "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve impedir que uma jornada seja movida para outro workspace",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const invalidJourney: CommercialJourney = {
            ...journey,
            workspaceId:
              "outro-workspace",
          }
  
          expect(() =>
            repository.updateJourney(
              invalidJourney,
            ),
          ).toThrow(
            `A jornada comercial "${journey.id}" não pode ser movida para outro workspace.`,
          )
        },
      )
  
      it(
        "deve criar e persistir um evento comercial",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const event =
            createEvent(journey)
  
          const createdEvent =
            repository.createEvent(
              event,
            )
  
          expect(createdEvent).toEqual(
            event,
          )
  
          expect(
            repository
              .getEventsByJourneyId(
                journey.id,
              ),
          ).toContainEqual(event)
        },
      )
  
      it(
        "deve rejeitar um evento comercial com ID duplicado",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const event =
            createEvent(journey)
  
          repository.createEvent(event)
  
          expect(() =>
            repository.createEvent(
              event,
            ),
          ).toThrow(
            `Já existe um evento comercial com o ID "${event.id}".`,
          )
        },
      )
  
      it(
        "deve rejeitar um evento vinculado a uma jornada inexistente",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney({
              id: "journey-inexistente",
            })
  
          const event =
            createEvent(journey)
  
          expect(() =>
            repository.createEvent(
              event,
            ),
          ).toThrow(
            `Jornada comercial não encontrada para o ID "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve rejeitar um evento de outro workspace",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const event =
            createEvent(
              journey,
              {
                workspaceId:
                  "outro-workspace",
              },
            )
  
          expect(() =>
            repository.createEvent(
              event,
            ),
          ).toThrow(
            `O evento comercial "${event.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve criar e persistir uma ação comercial",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const action =
            createAction(journey)
  
          const createdAction =
            repository.createAction(
              action,
            )
  
          expect(createdAction).toEqual(
            action,
          )
  
          expect(
            repository
              .getActionsByJourneyId(
                journey.id,
              ),
          ).toContainEqual(action)
        },
      )
  
      it(
        "deve rejeitar uma ação comercial com ID duplicado",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const action =
            createAction(journey)
  
          repository.createAction(
            action,
          )
  
          expect(() =>
            repository.createAction(
              action,
            ),
          ).toThrow(
            `Já existe uma ação comercial com o ID "${action.id}".`,
          )
        },
      )
  
      it(
        "deve rejeitar uma ação vinculada a uma jornada inexistente",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney({
              id: "journey-inexistente",
            })
  
          const action =
            createAction(journey)
  
          expect(() =>
            repository.createAction(
              action,
            ),
          ).toThrow(
            `Jornada comercial não encontrada para o ID "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve rejeitar uma ação de outro workspace",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const action =
            createAction(
              journey,
              {
                workspaceId:
                  "outro-workspace",
              },
            )
  
          expect(() =>
            repository.createAction(
              action,
            ),
          ).toThrow(
            `A ação comercial "${action.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve atualizar uma ação comercial existente",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const action =
            createAction(journey)
  
          repository.createAction(
            action,
          )
  
          const updatedAction: CommercialAction = {
            ...action,
            status: "COMPLETED",
            startedAt:
              "2026-07-22T15:00:00.000Z",
            completedAt:
              "2026-07-22T15:10:00.000Z",
            updatedAt:
              "2026-07-22T15:10:00.000Z",
          }
  
          const persistedAction =
            repository.updateAction(
              updatedAction,
            )
  
          expect(
            persistedAction,
          ).toEqual(updatedAction)
  
          expect(
            repository
              .getActionsByJourneyId(
                journey.id,
              ),
          ).toContainEqual(
            updatedAction,
          )
        },
      )
  
      it(
        "deve rejeitar a atualização de uma ação inexistente",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          const action =
            createAction(
              journey,
              {
                id: "action-inexistente",
              },
            )
  
          expect(() =>
            repository.updateAction(
              action,
            ),
          ).toThrow(
            `Ação comercial não encontrada para o ID "${action.id}".`,
          )
        },
      )
  
      it(
        "deve impedir que uma ação seja movida para outro workspace",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const action =
            createAction(journey)
  
          repository.createAction(
            action,
          )
  
          const invalidAction: CommercialAction = {
            ...action,
            workspaceId:
              "outro-workspace",
          }
  
          expect(() =>
            repository.updateAction(
              invalidAction,
            ),
          ).toThrow(
            `A ação comercial "${action.id}" não pode ser movida para outro workspace.`,
          )
        },
      )
  
      it(
        "deve impedir que uma ação seja movida para outra jornada",
        () => {
          const repository =
            createRepository()
  
          const journey =
            createJourney()
  
          repository.createJourney(
            journey,
          )
  
          const action =
            createAction(journey)
  
          repository.createAction(
            action,
          )
  
          const invalidAction: CommercialAction = {
            ...action,
            journeyId:
              "outra-jornada",
          }
  
          expect(() =>
            repository.updateAction(
              invalidAction,
            ),
          ).toThrow(
            `A ação comercial "${action.id}" não pode ser movida para outra jornada.`,
          )
        },
      )

      it(
        "deve criar e recuperar uma recomendação comercial",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const nextBestAction =
            createNextBestAction(
              journey,
            )

          const createdNextBestAction =
            repository.createNextBestAction(
              nextBestAction,
            )

          expect(
            createdNextBestAction,
          ).toEqual(nextBestAction)

          expect(
            repository.getNextBestActionById(
              nextBestAction.id,
            ),
          ).toEqual(nextBestAction)

          expect(
            repository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toContainEqual(
            nextBestAction,
          )
        },
      )

      it(
        "deve rejeitar uma recomendação comercial com ID duplicado",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const nextBestAction =
            createNextBestAction(
              journey,
            )

          repository.createNextBestAction(
            nextBestAction,
          )

          expect(() =>
            repository.createNextBestAction(
              nextBestAction,
            ),
          ).toThrow(
            `Já existe uma recomendação comercial com o ID "${nextBestAction.id}".`,
          )
        },
      )

      it(
        "deve rejeitar uma recomendação vinculada a uma jornada inexistente",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney({
              id: "journey-inexistente",
            })

          const nextBestAction =
            createNextBestAction(
              journey,
            )

          expect(() =>
            repository.createNextBestAction(
              nextBestAction,
            ),
          ).toThrow(
            `Jornada comercial não encontrada para o ID "${journey.id}".`,
          )
        },
      )

      it(
        "deve rejeitar uma recomendação de outro workspace",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const nextBestAction =
            createNextBestAction(
              journey,
              {
                workspaceId:
                  "outro-workspace",
              },
            )

          expect(() =>
            repository.createNextBestAction(
              nextBestAction,
            ),
          ).toThrow(
            `A recomendação comercial "${nextBestAction.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
          )
        },
      )

      it(
        "deve atualizar uma recomendação comercial existente",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const nextBestAction =
            createNextBestAction(
              journey,
            )

          repository.createNextBestAction(
            nextBestAction,
          )

          const updatedNextBestAction: NextBestAction = {
            ...nextBestAction,
            acceptedAt:
              "2026-07-22T15:00:00.000Z",
            updatedAt:
              "2026-07-22T15:00:00.000Z",
          }

          const persistedNextBestAction =
            repository.updateNextBestAction(
              updatedNextBestAction,
            )

          expect(
            persistedNextBestAction,
          ).toEqual(
            updatedNextBestAction,
          )

          expect(
            repository.getNextBestActionById(
              nextBestAction.id,
            ),
          ).toEqual(
            updatedNextBestAction,
          )
        },
      )

      it(
        "deve substituir recomendações abertas por novas recomendações",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const currentOpenNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-open-old",
              },
            )

          repository.createNextBestAction(
            currentOpenNextBestAction,
          )

          const newNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-open-new",
                title:
                  "Nova recomendação comercial",
              },
            )

          const result =
            repository.replaceOpenNextBestActions({
              workspaceId:
                journey.workspaceId,
              journeyId: journey.id,
              nextBestActions: [
                newNextBestAction,
              ],
            })

          expect(
            result.removedNextBestActions,
          ).toEqual([
            currentOpenNextBestAction,
          ])

          expect(
            result.createdNextBestActions,
          ).toEqual([
            newNextBestAction,
          ])

          expect(
            result.nextBestActions,
          ).toContainEqual(
            newNextBestAction,
          )

          expect(
            result.nextBestActions,
          ).not.toContainEqual(
            currentOpenNextBestAction,
          )
        },
      )

      it(
        "deve preservar recomendações aceitas, rejeitadas e executadas durante a substituição",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const acceptedNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-accepted",
                acceptedAt:
                  "2026-07-22T15:00:00.000Z",
              },
            )

          const rejectedNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-rejected",
                rejectedAt:
                  "2026-07-22T15:10:00.000Z",
              },
            )

          const executedNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-executed",
                executedActionId:
                  "action-executed",
              },
            )

          repository.createNextBestAction(
            acceptedNextBestAction,
          )

          repository.createNextBestAction(
            rejectedNextBestAction,
          )

          repository.createNextBestAction(
            executedNextBestAction,
          )

          const newNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-new",
              },
            )

          const result =
            repository.replaceOpenNextBestActions({
              workspaceId:
                journey.workspaceId,
              journeyId: journey.id,
              nextBestActions: [
                newNextBestAction,
              ],
            })

          expect(
            result.preservedNextBestActions,
          ).toEqual([
            acceptedNextBestAction,
            rejectedNextBestAction,
            executedNextBestAction,
          ])

          expect(
            result.removedNextBestActions,
          ).toEqual([])

          expect(
            result.nextBestActions,
          ).toEqual([
            acceptedNextBestAction,
            rejectedNextBestAction,
            executedNextBestAction,
            newNextBestAction,
          ])
        },
      )

      it(
        "deve remover todas as recomendações abertas quando a nova lista estiver vazia",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const openNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-open",
              },
            )

          repository.createNextBestAction(
            openNextBestAction,
          )

          const result =
            repository.replaceOpenNextBestActions({
              workspaceId:
                journey.workspaceId,
              journeyId: journey.id,
              nextBestActions: [],
            })

          expect(
            result.removedNextBestActions,
          ).toEqual([
            openNextBestAction,
          ])

          expect(
            result.createdNextBestActions,
          ).toEqual([])

          expect(
            result.nextBestActions,
          ).toEqual([])
        },
      )

      it(
        "deve rejeitar IDs duplicados na substituição sem alterar as recomendações existentes",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          const currentOpenNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-current",
              },
            )

          repository.createNextBestAction(
            currentOpenNextBestAction,
          )

          const duplicatedNextBestAction =
            createNextBestAction(
              journey,
              {
                id: "next-best-action-duplicated",
              },
            )

          expect(() =>
            repository.replaceOpenNextBestActions({
              workspaceId:
                journey.workspaceId,
              journeyId: journey.id,
              nextBestActions: [
                duplicatedNextBestAction,
                {
                  ...duplicatedNextBestAction,
                },
              ],
            }),
          ).toThrow(
            "Existem recomendações duplicadas na substituição: next-best-action-duplicated.",
          )

          expect(
            repository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toContainEqual(
            currentOpenNextBestAction,
          )
        },
      )

      it(
        "deve rejeitar a substituição para uma jornada inexistente",
        () => {
          const repository =
            createRepository()

          expect(() =>
            repository.replaceOpenNextBestActions({
              workspaceId:
                "workspace-test",
              journeyId:
                "journey-inexistente",
              nextBestActions: [],
            }),
          ).toThrow(
            'Jornada comercial não encontrada para o ID "journey-inexistente".',
          )
        },
      )

      it(
        "deve rejeitar a substituição feita por outro workspace",
        () => {
          const repository =
            createRepository()

          const journey =
            createJourney()

          repository.createJourney(
            journey,
          )

          expect(() =>
            repository.replaceOpenNextBestActions({
              workspaceId:
                "outro-workspace",
              journeyId: journey.id,
              nextBestActions: [],
            }),
          ).toThrow(
            `A jornada comercial "${journey.id}" pertence a outro workspace.`,
          )
        },
      )

    },
  )