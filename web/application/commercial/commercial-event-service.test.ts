import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    recordCommercialEvent,
  } from "./commercial-event-service"
  
  describe(
    "recordCommercialEvent",
    () => {
      function createRepository(): MockCommercialRepository {
        return new MockCommercialRepository(
          mockCommercialData,
        )
      }
  
      it(
        "deve registrar um evento comercial",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          expect(journey).toBeDefined()
  
          const now =
            new Date(
              "2026-07-22T12:00:00.000Z",
            )
  
          const event =
            recordCommercialEvent(
              {
                workspaceId:
                  journey.workspaceId,
                journeyId:
                  journey.id,
                type: "NOTE_ADDED",
                actorType: "CONSULTANT",
                actorId:
                  journey.consultantId,
                payload: {
                  note:
                    "Cliente demonstrou interesse.",
                },
              },
              {
                commercialRepository,
                now,
                generateId: () =>
                  "commercial-event-test-1",
              },
            )
  
          expect(event).toEqual({
            id: "commercial-event-test-1",
            workspaceId:
              journey.workspaceId,
            journeyId:
              journey.id,
            type: "NOTE_ADDED",
            actorType: "CONSULTANT",
            actorId:
              journey.consultantId,
            payload: {
              note:
                "Cliente demonstrou interesse.",
            },
            occurredAt:
              "2026-07-22T12:00:00.000Z",
            createdAt:
              "2026-07-22T12:00:00.000Z",
            updatedAt:
              "2026-07-22T12:00:00.000Z",
          })
        },
      )
  
      it(
        "deve persistir o evento no repositório",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          const event =
            recordCommercialEvent(
              {
                workspaceId:
                  journey.workspaceId,
                journeyId:
                  journey.id,
                type: "LEAD_REPLIED",
                actorType: "LEAD",
                actorId:
                  journey.leadId,
              },
              {
                commercialRepository,
                now: new Date(
                  "2026-07-22T13:00:00.000Z",
                ),
                generateId: () =>
                  "commercial-event-test-2",
              },
            )
  
          const persistedEvents =
            commercialRepository
              .getEventsByJourneyId(
                journey.id,
              )
  
          expect(
            persistedEvents,
          ).toContainEqual(event)
        },
      )
  
      it(
        "deve utilizar payload vazio quando ele não for informado",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          const event =
            recordCommercialEvent(
              {
                workspaceId:
                  journey.workspaceId,
                journeyId:
                  journey.id,
                type: "MEETING_COMPLETED",
                actorType: "CONSULTANT",
                actorId:
                  journey.consultantId,
              },
              {
                commercialRepository,
                generateId: () =>
                  "commercial-event-test-3",
              },
            )
  
          expect(event.payload).toEqual({})
        },
      )
  
      it(
        "deve atualizar a última interação da jornada",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          const timestamp =
            "2026-07-22T14:00:00.000Z"
  
          recordCommercialEvent(
            {
              workspaceId:
                journey.workspaceId,
              journeyId:
                journey.id,
              type: "NOTE_ADDED",
              actorType: "CONSULTANT",
              actorId:
                journey.consultantId,
            },
            {
              commercialRepository,
              now: new Date(timestamp),
              generateId: () =>
                "commercial-event-test-4",
            },
          )
  
          const updatedJourney =
            commercialRepository
              .getJourneyById(
                journey.id,
              )
  
          expect(
            updatedJourney
              ?.lastInteractionAt,
          ).toBe(timestamp)
  
          expect(
            updatedJourney?.updatedAt,
          ).toBe(timestamp)
        },
      )
  
      it(
        "deve incrementar a versão da jornada",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          recordCommercialEvent(
            {
              workspaceId:
                journey.workspaceId,
              journeyId:
                journey.id,
              type: "TASK_CREATED",
              actorType: "SYSTEM",
              actorId: null,
            },
            {
              commercialRepository,
              generateId: () =>
                "commercial-event-test-5",
            },
          )
  
          const updatedJourney =
            commercialRepository
              .getJourneyById(
                journey.id,
              )
  
          expect(
            updatedJourney?.version,
          ).toBe(
            journey.version + 1,
          )
        },
      )
  
      it(
        "deve rejeitar uma jornada inexistente",
        () => {
          const commercialRepository =
            createRepository()
  
          expect(() =>
            recordCommercialEvent(
              {
                workspaceId:
                  "workspace-test",
                journeyId:
                  "journey-inexistente",
                type: "NOTE_ADDED",
                actorType: "SYSTEM",
                actorId: null,
              },
              {
                commercialRepository,
                generateId: () =>
                  "commercial-event-test-6",
              },
            ),
          ).toThrow(
            'Jornada comercial não encontrada para o ID "journey-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar um workspace diferente do workspace da jornada",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          expect(() =>
            recordCommercialEvent(
              {
                workspaceId:
                  "outro-workspace",
                journeyId:
                  journey.id,
                type: "NOTE_ADDED",
                actorType: "SYSTEM",
                actorId: null,
              },
              {
                commercialRepository,
                generateId: () =>
                  "commercial-event-test-7",
              },
            ),
          ).toThrow(
            `A jornada comercial "${journey.id}" pertence a outro workspace.`,
          )
        },
      )
  
      it(
        "não deve alterar a jornada quando a criação do evento falhar",
        () => {
          const commercialRepository =
            createRepository()
  
          const journey =
            commercialRepository
              .getJourneys()[0]
  
          const duplicatedEvent =
            commercialRepository
              .getEventsByJourneyId(
                journey.id,
              )[0]
  
          expect(
            duplicatedEvent,
          ).toBeDefined()
  
          const previousVersion =
            journey.version
  
          const previousInteraction =
            journey.lastInteractionAt
  
          expect(() =>
            recordCommercialEvent(
              {
                workspaceId:
                  journey.workspaceId,
                journeyId:
                  journey.id,
                type: "NOTE_ADDED",
                actorType: "SYSTEM",
                actorId: null,
              },
              {
                commercialRepository,
                now: new Date(
                  "2026-07-22T15:00:00.000Z",
                ),
                generateId: () =>
                  duplicatedEvent.id,
              },
            ),
          ).toThrow(
            `Já existe um evento comercial com o ID "${duplicatedEvent.id}".`,
          )
  
          const persistedJourney =
            commercialRepository
              .getJourneyById(
                journey.id,
              )
  
          expect(
            persistedJourney?.version,
          ).toBe(previousVersion)
  
          expect(
            persistedJourney
              ?.lastInteractionAt,
          ).toBe(
            previousInteraction,
          )
        },
      )
    },
  )