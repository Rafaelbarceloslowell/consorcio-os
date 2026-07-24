import {
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import type {
    ProcessCommercialTransitionResult,
  } from "@/application/commercial/process-commercial-transition"
  
  import type {
    RunCommercialDecisionCycleResult,
  } from "@/application/decision/run-commercial-decision-cycle"
  
  import type {
    CommercialRepository,
  } from "@/repositories/commercial/commercial-repository"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  import type {
    DecisionAutomationRepository,
  } from "@/repositories/decision/decision-automation-repository"
  
  import type {
    CommercialEvent,
    CommercialJourney,
  } from "@/types/domain"
  
  import {
    scheduleMeeting,
  } from "./schedule-meeting"
  
  const NOW =
    new Date(
      "2026-07-22T20:00:00.000Z",
    )
  
  function createJourney(
    overrides:
      Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id:
        "journey-test",
  
      workspaceId:
        "workspace-test",
  
      leadId:
        "lead-test",
  
      clientId:
        null,
  
      consultantId:
        "consultant-test",
  
      title:
        "Jornada comercial de teste",
  
      consortiumType:
        "real_estate",
  
      currentPhaseId:
        "phase-current",
  
      currentStateId:
        "state-current",
  
      priority:
        "NORMAL",
  
      score:
        50,
  
      outcome:
        null,
  
      stateEnteredAt:
        "2026-07-20T12:00:00.000Z",
  
      lastInteractionAt:
        null,
  
      closedAt:
        null,
  
      version:
        1,
  
      createdAt:
        "2026-07-20T12:00:00.000Z",
  
      updatedAt:
        "2026-07-20T12:00:00.000Z",
  
      ...overrides,
    }
  }
  
  function createEvent(
    journey: CommercialJourney,
  ): CommercialEvent {
    return {
      id:
        "event-meeting-scheduled",
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
      type:
        "MEETING_SCHEDULED",
  
      actorType:
        "CONSULTANT",
  
      actorId:
        journey.consultantId,
  
      payload: {
        scheduledAt:
          "2026-07-23T15:00:00.000Z",
  
        channel:
          "GOOGLE_MEET",
      },
  
      occurredAt:
        NOW.toISOString(),
  
      createdAt:
        NOW.toISOString(),
  
      updatedAt:
        NOW.toISOString(),
    }
  }
  
  function createCommercialRepository(
    journeys:
      CommercialJourney[],
  ): CommercialRepository {
    return {
      getJourneyById:
        vi.fn(
          (
            journeyId: string,
          ) =>
            journeys.find(
              (journey) =>
                journey.id === journeyId,
            ),
        ),
    } as unknown as CommercialRepository
  }
  
  function createDecisionCycleResult(
    journey: CommercialJourney,
  ): RunCommercialDecisionCycleResult {
    return {
      journeyId:
        journey.id,
  
      workspaceId:
        journey.workspaceId,
  
      journey,
  
      diagnostics: [
        "Ciclo comercial executado.",
      ],
  
      warnings: [],
    } as unknown as RunCommercialDecisionCycleResult
  }
  
  function createTransitionResult(
    journey: CommercialJourney,
    decisionCycle:
      RunCommercialDecisionCycleResult,
    changed = true,
  ): ProcessCommercialTransitionResult {
    return {
      journeyId:
        journey.id,
  
      workspaceId:
        journey.workspaceId,
  
      changed,
  
      committedTransition:
        changed
          ? (
              {} as ProcessCommercialTransitionResult[
                "committedTransition"
              ]
            )
          : null,

  
      crmSynchronization:
  
        null,
  
      decisionCycle:
        changed
          ? decisionCycle
          : null,
  
      diagnostics: [
        changed
          ? "Transição executada."
          : "Transição rejeitada.",
      ],
  
      warnings: [],
  
      workflow:
        {} as ProcessCommercialTransitionResult[
          "workflow"
        ],
    }
  }
  
  describe(
    "scheduleMeeting",
    () => {
      it(
        "deve registrar o agendamento da reunião e executar o ciclo comercial sem transição",
        () => {
          const initialJourney =
            createJourney()
  
          const journeyAfterEvent =
            createJourney({
              lastInteractionAt:
                NOW.toISOString(),
  
              version:
                2,
  
              updatedAt:
                NOW.toISOString(),
            })
  
          const journeys = [
            initialJourney,
          ]
  
          const commercialRepository =
            createCommercialRepository(
              journeys,
            )
  
          const event =
            createEvent(
              initialJourney,
            )
  
          const decisionCycle =
            createDecisionCycleResult(
              journeyAfterEvent,
            )
  
          const recordCommercialEvent =
            vi.fn(
              () => {
                journeys[0] =
                  journeyAfterEvent
  
                return event
              },
            )
  
          const runCommercialDecisionCycle =
            vi.fn(
              () =>
                decisionCycle,
            )
  
          const processCommercialTransition =
            vi.fn()
  
          const result =
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                initialJourney.workspaceId,
  
              journeyId:
                initialJourney.id,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                initialJourney.consultantId,
  
              payload: {
                scheduledAt:
                  "2026-07-23T15:00:00.000Z",
  
                channel:
                  "GOOGLE_MEET",
              },
  
              now:
                NOW,
  
              dependencies: {
                recordCommercialEvent,
                runCommercialDecisionCycle,
                processCommercialTransition,
              },
            })
  
          expect(
            recordCommercialEvent,
          ).toHaveBeenCalledWith(
            {
              workspaceId:
                initialJourney.workspaceId,
  
              journeyId:
                initialJourney.id,
  
              type:
                "MEETING_SCHEDULED",
  
              actorType:
                "CONSULTANT",
  
              actorId:
                initialJourney.consultantId,
  
              payload: {
                scheduledAt:
                  "2026-07-23T15:00:00.000Z",
  
                channel:
                  "GOOGLE_MEET",
              },
            },
            {
              commercialRepository,
              now:
                NOW,
              generateId:
                undefined,
              touchJourney:
                true,
            },
          )
  
          expect(
            processCommercialTransition,
          ).not.toHaveBeenCalled()
  
          expect(
            runCommercialDecisionCycle,
          ).toHaveBeenCalledWith({
            commercialRepository,
  
            crmRepository:
              expect.any(Object),
  
            decisionAutomationRepository:
              expect.any(Object),
  
            journeyId:
              initialJourney.id,
  
            workspaceId:
              initialJourney.workspaceId,
  
            now:
              NOW,
  
            executionLimit:
              undefined,
          })
  
          expect(
            result.event,
          ).toEqual(
            event,
          )
  
          expect(
            result.transition,
          ).toBeNull()
  
          expect(
            result.transitioned,
          ).toBe(
            false,
          )
  
          expect(
            result.decisionCycle,
          ).toBe(
            decisionCycle,
          )
        },
      )
  
      it(
        "deve delegar a mudança de estado ao processador de transição",
        () => {
          const initialJourney =
            createJourney()
  
          const journeyAfterEvent =
            createJourney({
              lastInteractionAt:
                NOW.toISOString(),
  
              version:
                2,
  
              updatedAt:
                NOW.toISOString(),
            })
  
          const finalJourney =
            createJourney({
              currentPhaseId:
                "phase-meeting",
  
              currentStateId:
                "state-meeting-scheduled",
  
              stateEnteredAt:
                NOW.toISOString(),
  
              lastInteractionAt:
                NOW.toISOString(),
  
              version:
                3,
  
              updatedAt:
                NOW.toISOString(),
            })
  
          const journeys = [
            initialJourney,
          ]
  
          const commercialRepository =
            createCommercialRepository(
              journeys,
            )
  
          const event =
            createEvent(
              initialJourney,
            )
  
          const decisionCycle =
            createDecisionCycleResult(
              finalJourney,
            )
  
          const transition =
            createTransitionResult(
              finalJourney,
              decisionCycle,
            )
  
          const recordCommercialEvent =
            vi.fn(
              () => {
                journeys[0] =
                  journeyAfterEvent
  
                return event
              },
            )
  
          const processCommercialTransition =
            vi.fn(
              () => {
                journeys[0] =
                  finalJourney
  
                return transition
              },
            )
  
          const runCommercialDecisionCycle =
            vi.fn()
  
          const result =
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                initialJourney.workspaceId,
  
              journeyId:
                initialJourney.id,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                initialJourney.consultantId,
  
              targetStateId:
                "state-meeting-scheduled",
  
              payload: {
                scheduledAt:
                  "2026-07-23T15:00:00.000Z",
  
                channel:
                  "GOOGLE_MEET",
  
                meetingId:
                  "meeting-test",
              },
  
              expectedVersion:
                1,
  
              now:
                NOW,
  
              executionLimit:
                5,
  
              dependencies: {
                recordCommercialEvent,
                processCommercialTransition,
                runCommercialDecisionCycle,
              },
            })
  
          expect(
            processCommercialTransition,
          ).toHaveBeenCalledWith({
            commercialRepository,
  
            crmRepository:
              expect.any(Object),
  
            decisionAutomationRepository:
              expect.any(Object),
  
            journeyId:
              initialJourney.id,
  
            targetStateId:
              "state-meeting-scheduled",
  
            actorType:
              "CONSULTANT",
  
            actorId:
              initialJourney.consultantId,
  
            origin:
              "SYSTEM",
  
            workspaceId:
              initialJourney.workspaceId,
  
            eventType:
              "MEETING_SCHEDULED",
  
            payload: {
              scheduledAt:
                "2026-07-23T15:00:00.000Z",
  
              channel:
                "GOOGLE_MEET",
  
              meetingId:
                "meeting-test",
  
              sourceEventId:
                event.id,
            },
  
            expectedVersion:
              journeyAfterEvent.version,
  
            now:
              NOW,
  
            executionLimit:
              5,
          })
  
          expect(
            runCommercialDecisionCycle,
          ).not.toHaveBeenCalled()
  
          expect(
            result.transition,
          ).toBe(
            transition,
          )
  
          expect(
            result.transitioned,
          ).toBe(
            true,
          )
  
          expect(
            result.journey,
          ).toEqual(
            finalJourney,
          )
  
          expect(
            result.decisionCycle,
          ).toBe(
            decisionCycle,
          )
        },
      )
  
      it(
        "deve executar o ciclo comercial quando a transição for rejeitada",
        () => {
          const initialJourney =
            createJourney()
  
          const journeyAfterEvent =
            createJourney({
              lastInteractionAt:
                NOW.toISOString(),
  
              version:
                2,
  
              updatedAt:
                NOW.toISOString(),
            })
  
          const journeys = [
            initialJourney,
          ]
  
          const commercialRepository =
            createCommercialRepository(
              journeys,
            )
  
          const event =
            createEvent(
              initialJourney,
            )
  
          const decisionCycle =
            createDecisionCycleResult(
              journeyAfterEvent,
            )
  
          const rejectedTransition =
            createTransitionResult(
              journeyAfterEvent,
              decisionCycle,
              false,
            )
  
          const recordCommercialEvent =
            vi.fn(
              () => {
                journeys[0] =
                  journeyAfterEvent
  
                return event
              },
            )
  
          const processCommercialTransition =
            vi.fn(
              () =>
                rejectedTransition,
            )
  
          const runCommercialDecisionCycle =
            vi.fn(
              () =>
                decisionCycle,
            )
  
          const result =
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                initialJourney.workspaceId,
  
              journeyId:
                initialJourney.id,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                initialJourney.consultantId,
  
              targetStateId:
                "state-meeting-scheduled",
  
              now:
                NOW,
  
              dependencies: {
                recordCommercialEvent,
                processCommercialTransition,
                runCommercialDecisionCycle,
              },
            })
  
          expect(
            runCommercialDecisionCycle,
          ).toHaveBeenCalledTimes(
            1,
          )
  
          expect(
            result.transition,
          ).toBe(
            rejectedTransition,
          )
  
          expect(
            result.transitioned,
          ).toBe(
            false,
          )
  
          expect(
            result.decisionCycle,
          ).toBe(
            decisionCycle,
          )
        },
      )
  
      it(
        "deve rejeitar um ID de workspace vazio",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository([
              journey,
            ])
  
          const recordCommercialEvent =
            vi.fn()
  
          expect(() =>
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                "   ",
  
              journeyId:
                journey.id,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                journey.consultantId,
  
              dependencies: {
                recordCommercialEvent,
              },
            }),
          ).toThrow(
            "O ID do workspace é obrigatório para agendar a reunião.",
          )
  
          expect(
            recordCommercialEvent,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar um ID de jornada vazio",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository([
              journey,
            ])
  
          const recordCommercialEvent =
            vi.fn()
  
          expect(() =>
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                journey.workspaceId,
  
              journeyId:
                "   ",
  
              actorType:
                "CONSULTANT",
  
              actorId:
                journey.consultantId,
  
              dependencies: {
                recordCommercialEvent,
              },
            }),
          ).toThrow(
            "O ID da jornada comercial é obrigatório para agendar a reunião.",
          )
  
          expect(
            recordCommercialEvent,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma jornada inexistente",
        () => {
          const commercialRepository =
            createCommercialRepository([])
  
          const recordCommercialEvent =
            vi.fn()
  
          expect(() =>
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                "workspace-test",
  
              journeyId:
                "journey-inexistente",
  
              actorType:
                "CONSULTANT",
  
              actorId:
                "consultant-test",
  
              dependencies: {
                recordCommercialEvent,
              },
            }),
          ).toThrow(
            'Jornada comercial não encontrada para o ID "journey-inexistente".',
          )
  
          expect(
            recordCommercialEvent,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma jornada pertencente a outro workspace",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository([
              journey,
            ])
  
          const recordCommercialEvent =
            vi.fn()
  
          expect(() =>
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                "outro-workspace",
  
              journeyId:
                journey.id,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                journey.consultantId,
  
              dependencies: {
                recordCommercialEvent,
              },
            }),
          ).toThrow(
            `A jornada comercial "${journey.id}" não pertence ao workspace "outro-workspace".`,
          )
  
          expect(
            recordCommercialEvent,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma versão desatualizada antes de registrar o evento",
        () => {
          const journey =
            createJourney({
              version:
                4,
            })
  
          const commercialRepository =
            createCommercialRepository([
              journey,
            ])
  
          const recordCommercialEvent =
            vi.fn()
  
          expect(() =>
            scheduleMeeting({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              workspaceId:
                journey.workspaceId,
  
              journeyId:
                journey.id,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                journey.consultantId,
  
              expectedVersion:
                3,
  
              dependencies: {
                recordCommercialEvent,
              },
            }),
          ).toThrow(
            `Conflito de versão na jornada comercial "${journey.id}": esperado 3, atual 4.`,
          )
  
          expect(
            recordCommercialEvent,
          ).not.toHaveBeenCalled()
        },
      )
    },
  )