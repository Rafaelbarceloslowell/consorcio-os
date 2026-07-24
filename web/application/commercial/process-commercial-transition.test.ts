import {
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import type {
    WorkflowEngineInput,
    WorkflowEngineOutput,
  } from "@/engine/decision/workflow/types"
  
  import type {
    CommercialRepository,
    CommitJourneyTransitionInput,
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
  
  import type {
    RunCommercialDecisionCycleInput,
    RunCommercialDecisionCycleResult,
  } from "@/application/decision/run-commercial-decision-cycle"
  
  import type {
    SynchronizeCommercialJourneyWithCrmInput,
    SynchronizeCommercialJourneyWithCrmResult,
  } from "./crm-synchronizer"
  
  import {
    processCommercialTransition,
  } from "./process-commercial-transition"
  
  function createJourney(
    overrides:
      Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id:
        "journey-1",
  
      workspaceId:
        "workspace-1",
  
      leadId:
        "lead-1",
  
      clientId:
        null,
  
      consultantId:
        "consultant-1",
  
      title:
        "Jornada comercial de teste",
  
      consortiumType:
        "real_estate",
  
      currentPhaseId:
        "phase-1",
  
      currentStateId:
        "state-1",
  
      priority:
        "NORMAL",
  
      score:
        70,
  
      outcome:
        null,
  
      stateEnteredAt:
        "2026-07-22T18:00:00.000Z",
  
      lastInteractionAt:
        null,
  
      closedAt:
        null,
  
      version:
        1,
  
      createdAt:
        "2026-07-22T18:00:00.000Z",
  
      updatedAt:
        "2026-07-22T18:00:00.000Z",
  
      ...overrides,
    }
  }
  
  function createEvent(
    journey:
      CommercialJourney,
  ): CommercialEvent {
    return {
      id:
        "journey-state-changed-journey-1-1",
  
      workspaceId:
        journey.workspaceId,
  
      journeyId:
        journey.id,
  
      type:
        "STATE_CHANGED",
  
      actorType:
        "CONSULTANT",
  
      actorId:
        "consultant-1",
  
      payload: {
        previousStateId:
          "state-1",
  
        targetStateId:
          "state-2",
      },
  
      occurredAt:
        "2026-07-22T19:00:00.000Z",
  
      createdAt:
        "2026-07-22T19:00:00.000Z",
  
      updatedAt:
        "2026-07-22T19:00:00.000Z",
    }
  }
  
  function createChangedWorkflow(
    journey:
      CommercialJourney,
  ): WorkflowEngineOutput {
    const updatedJourney =
      createJourney({
        ...journey,
  
        currentStateId:
          "state-2",
  
        version:
          journey.version + 1,
  
        updatedAt:
          "2026-07-22T19:00:00.000Z",
      })
  
    return {
      journey:
        updatedJourney,
  
      previousJourney:
        journey,
  
      event:
        createEvent(
          updatedJourney,
        ),
  
      validation: {
        allowed:
          true,
  
        sourceState:
          null,
  
        targetState:
          null,
  
        sourcePhase:
          null,
  
        targetPhase:
          null,
  
        matchedRules: [],
  
        errors: [],
  
        warnings: [],
  
        diagnostics: [
          "Transição validada.",
        ],
      },
  
      matchedRules: [],
  
      requestedActions: [],
  
      changed:
        true,
  
      diagnostics: [
        "Transição executada.",
      ],
  
      warnings: [],
    }
  }
  
  function createUnchangedWorkflow(
    journey:
      CommercialJourney,
  ): WorkflowEngineOutput {
    return {
      journey,
  
      previousJourney:
        journey,
  
      event:
        null,
  
      validation: {
        allowed:
          false,
  
        sourceState:
          null,
  
        targetState:
          null,
  
        sourcePhase:
          null,
  
        targetPhase:
          null,
  
        matchedRules: [],
  
        errors: [
          {
            code:
              "SAME_STATE",
  
            message:
              "A jornada já está no estado informado.",
          },
        ],
  
        warnings: [],
  
        diagnostics: [
          "Transição rejeitada.",
        ],
      },
  
      matchedRules: [],
  
      requestedActions: [],
  
      changed:
        false,
  
      diagnostics: [
        "Transição não executada.",
      ],
  
      warnings: [
        "A jornada permaneceu no estado atual.",
      ],
    }
  }
  
  function createDecisionCycleResult(
    journey:
      CommercialJourney,
  ): RunCommercialDecisionCycleResult {
    return {
      journeyId:
        journey.id,
  
      workspaceId:
        journey.workspaceId,
  
      journey,
  
      decision:
        {} as RunCommercialDecisionCycleResult[
          "decision"
        ],
  
      generatedNextBestActions: [],
  
      preservedNextBestActions: [],
  
      removedNextBestActions: [],
  
      createdNextBestActions: [],
  
      nextBestActions: [],
  
      automation:
        {} as RunCommercialDecisionCycleResult[
          "automation"
        ],
  
      persistedActions: [],
  
      existingActions: [],
  
      diagnostics: [
        "Ciclo comercial executado.",
      ],
  
      warnings: [],
    }
  }
  
  function createCrmSynchronizationResult(
    journey:
      CommercialJourney,
  ): SynchronizeCommercialJourneyWithCrmResult {
    return {
      journey,
  
      lead:
        null,
  
      previousLead:
        null,
  
      state:
        {} as SynchronizeCommercialJourneyWithCrmResult[
          "state"
        ],
  
      phase:
        {} as SynchronizeCommercialJourneyWithCrmResult[
          "phase"
        ],
  
      pipelineStage:
        null,
  
      changed:
        true,
  
      diagnostics: [
        "CRM sincronizado.",
      ],
  
      warnings: [],
    }
  }
  
  function createCommercialRepository(
    journey:
      CommercialJourney,
  ) {
    const commitJourneyTransition =
      vi.fn(
        ({
          journey:
            updatedJourney,
  
          event,
        }: CommitJourneyTransitionInput) => ({
          journey:
            updatedJourney,
  
          event,
        }),
      )
  
    const repository = {
      getJourneyById:
        vi.fn(
          (
            journeyId: string,
          ) =>
            journeyId ===
            journey.id
              ? journey
              : undefined,
        ),
  
      getPhases:
        vi.fn(
          () => [],
        ),
  
      getStates:
        vi.fn(
          () => [],
        ),
  
      getWorkflowRules:
        vi.fn(
          () => [],
        ),
  
      commitJourneyTransition,
    } as unknown as CommercialRepository
  
    return {
      repository,
      commitJourneyTransition,
    }
  }
  
  describe(
    "processCommercialTransition",
    () => {
      it(
        "deve executar, persistir, sincronizar o CRM e recalcular o ciclo comercial após uma transição válida",
        () => {
          const journey =
            createJourney()
  
          const workflow =
            createChangedWorkflow(
              journey,
            )
  
          const {
            repository:
              commercialRepository,
  
            commitJourneyTransition,
          } =
            createCommercialRepository(
              journey,
            )
  
          const runWorkflow =
            vi.fn(
              (
                _input:
                  WorkflowEngineInput,
              ) => workflow,
            )
  
          const crmSynchronization =
            createCrmSynchronizationResult(
              workflow.journey,
            )
  
          const synchronizeCrm =
            vi.fn(
              (
                _input:
                  SynchronizeCommercialJourneyWithCrmInput,
              ) => crmSynchronization,
            )
  
          const decisionCycle =
            createDecisionCycleResult(
              workflow.journey,
            )
  
          const runDecisionCycle =
            vi.fn(
              (
                _input:
                  RunCommercialDecisionCycleInput,
              ) => decisionCycle,
            )
  
          const crmRepository =
            {} as CrmRepository
  
          const result =
            processCommercialTransition({
              commercialRepository,
  
              crmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              journeyId:
                journey.id,
  
              targetStateId:
                "state-2",
  
              actorType:
                "CONSULTANT",
  
              actorId:
                "consultant-1",
  
              origin:
                "MANUAL",
  
              now:
                new Date(
                  "2026-07-22T19:00:00.000Z",
                ),
  
              dependencies: {
                runWorkflowEngine:
                  runWorkflow,
  
                synchronizeCommercialJourneyWithCrm:
                  synchronizeCrm,
  
                runCommercialDecisionCycle:
                  runDecisionCycle,
              },
            })
  
          expect(
            result.changed,
          ).toBe(true)
  
          expect(
            result.committedTransition,
          ).not.toBeNull()
  
          expect(
            result.crmSynchronization,
          ).toBe(
            crmSynchronization,
          )
  
          expect(
            result.decisionCycle,
          ).toBe(
            decisionCycle,
          )
  
          expect(
            commitJourneyTransition,
          ).toHaveBeenCalledTimes(1)
  
          expect(
            commitJourneyTransition,
          ).toHaveBeenCalledWith({
            journey:
              workflow.journey,
  
            event:
              workflow.event,
          })
  
          expect(
            synchronizeCrm,
          ).toHaveBeenCalledTimes(1)
  
          expect(
            synchronizeCrm,
          ).toHaveBeenCalledWith({
            journey:
              workflow.journey,
  
            commercialRepository,
  
            crmRepository,
  
            now:
              new Date(
                "2026-07-22T19:00:00.000Z",
              ),
          })
  
          expect(
            runDecisionCycle,
          ).toHaveBeenCalledTimes(1)
  
          expect(
            runDecisionCycle,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              journeyId:
                journey.id,
  
              workspaceId:
                journey.workspaceId,
            }),
          )
        },
      )
  
      it(
        "deve executar o workflow com os dados fornecidos pelo repositório",
        () => {
          const journey =
            createJourney()
  
          const workflow =
            createUnchangedWorkflow(
              journey,
            )
  
          const {
            repository:
              commercialRepository,
          } =
            createCommercialRepository(
              journey,
            )
  
          const runWorkflow =
            vi.fn(
              (
                _input:
                  WorkflowEngineInput,
              ) => workflow,
            )
  
          processCommercialTransition({
            commercialRepository,
  
            crmRepository:
              {} as CrmRepository,
  
            decisionAutomationRepository:
              {} as DecisionAutomationRepository,
  
            journeyId:
              ` ${journey.id} `,
  
            targetStateId:
              " state-2 ",
  
            actorType:
              "CONSULTANT",
  
            actorId:
              "consultant-1",
  
            origin:
              "COMMERCIAL_EVENT",
  
            eventType:
              "LEAD_REPLIED",
  
            payload: {
              channel:
                "WHATSAPP",
            },
  
            expectedVersion:
              1,
  
            now:
              new Date(
                "2026-07-22T19:00:00.000Z",
              ),
  
            dependencies: {
              runWorkflowEngine:
                runWorkflow,
            },
          })
  
          expect(
            runWorkflow,
          ).toHaveBeenCalledWith({
            journey,
  
            phases: [],
  
            states: [],
  
            rules: [],
  
            targetStateId:
              "state-2",
  
            origin:
              "COMMERCIAL_EVENT",
  
            actorType:
              "CONSULTANT",
  
            actorId:
              "consultant-1",
  
            now:
              new Date(
                "2026-07-22T19:00:00.000Z",
              ),
  
            eventType:
              "LEAD_REPLIED",
  
            payload: {
              channel:
                "WHATSAPP",
            },
  
            expectedVersion:
              1,
          })
        },
      )
  
      it(
        "não deve persistir, sincronizar o CRM nem executar o ciclo quando a transição for rejeitada",
        () => {
          const journey =
            createJourney()
  
          const workflow =
            createUnchangedWorkflow(
              journey,
            )
  
          const {
            repository:
              commercialRepository,
  
            commitJourneyTransition,
          } =
            createCommercialRepository(
              journey,
            )
  
          const synchronizeCrm =
            vi.fn()
  
          const runDecisionCycle =
            vi.fn()
  
          const result =
            processCommercialTransition({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              journeyId:
                journey.id,
  
              targetStateId:
                journey.currentStateId,
  
              actorType:
                "CONSULTANT",
  
              actorId:
                "consultant-1",
  
              origin:
                "MANUAL",
  
              dependencies: {
                runWorkflowEngine:
                  () => workflow,
  
                synchronizeCommercialJourneyWithCrm:
                  synchronizeCrm,
  
                runCommercialDecisionCycle:
                  runDecisionCycle,
              },
            })
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.committedTransition,
          ).toBeNull()
  
          expect(
            result.crmSynchronization,
          ).toBeNull()
  
          expect(
            result.decisionCycle,
          ).toBeNull()
  
          expect(
            commitJourneyTransition,
          ).not.toHaveBeenCalled()
  
          expect(
            synchronizeCrm,
          ).not.toHaveBeenCalled()
  
          expect(
            runDecisionCycle,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar um ID de jornada vazio",
        () => {
          const journey =
            createJourney()
  
          const {
            repository:
              commercialRepository,
          } =
            createCommercialRepository(
              journey,
            )
  
          expect(
            () =>
              processCommercialTransition({
                commercialRepository,
  
                crmRepository:
                  {} as CrmRepository,
  
                decisionAutomationRepository:
                  {} as DecisionAutomationRepository,
  
                journeyId:
                  "   ",
  
                targetStateId:
                  "state-2",
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  null,
  
                origin:
                  "SYSTEM",
              }),
          ).toThrow(
            "O ID da jornada comercial é obrigatório",
          )
        },
      )
  
      it(
        "deve rejeitar um ID de estado de destino vazio",
        () => {
          const journey =
            createJourney()
  
          const {
            repository:
              commercialRepository,
          } =
            createCommercialRepository(
              journey,
            )
  
          expect(
            () =>
              processCommercialTransition({
                commercialRepository,
  
                crmRepository:
                  {} as CrmRepository,
  
                decisionAutomationRepository:
                  {} as DecisionAutomationRepository,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  "   ",
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  null,
  
                origin:
                  "SYSTEM",
              }),
          ).toThrow(
            "O ID do estado de destino é obrigatório",
          )
        },
      )
  
      it(
        "deve rejeitar uma jornada inexistente",
        () => {
          const journey =
            createJourney()
  
          const {
            repository:
              commercialRepository,
          } =
            createCommercialRepository(
              journey,
            )
  
          expect(
            () =>
              processCommercialTransition({
                commercialRepository,
  
                crmRepository:
                  {} as CrmRepository,
  
                decisionAutomationRepository:
                  {} as DecisionAutomationRepository,
  
                journeyId:
                  "journey-inexistente",
  
                targetStateId:
                  "state-2",
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  null,
  
                origin:
                  "SYSTEM",
              }),
          ).toThrow(
            'Jornada comercial não encontrada para o ID "journey-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar uma jornada pertencente a outro workspace",
        () => {
          const journey =
            createJourney()
  
          const {
            repository:
              commercialRepository,
          } =
            createCommercialRepository(
              journey,
            )
  
          expect(
            () =>
              processCommercialTransition({
                commercialRepository,
  
                crmRepository:
                  {} as CrmRepository,
  
                decisionAutomationRepository:
                  {} as DecisionAutomationRepository,
  
                journeyId:
                  journey.id,
  
                targetStateId:
                  "state-2",
  
                workspaceId:
                  "workspace-2",
  
                actorType:
                  "CONSULTANT",
  
                actorId:
                  null,
  
                origin:
                  "SYSTEM",
              }),
          ).toThrow(
            `A jornada comercial "${journey.id}" não pertence ao workspace "workspace-2".`,
          )
        },
      )
  
      it(
        "deve combinar diagnósticos e avisos do workflow, CRM e ciclo comercial",
        () => {
          const journey =
            createJourney()
  
          const workflow =
            createChangedWorkflow(
              journey,
            )
  
          workflow.warnings.push(
            "Aviso do workflow.",
          )
  
          const {
            repository:
              commercialRepository,
          } =
            createCommercialRepository(
              journey,
            )
  
          const crmSynchronization =
            createCrmSynchronizationResult(
              workflow.journey,
            )
  
          crmSynchronization.warnings.push(
            "Aviso do CRM.",
          )
  
          const decisionCycle =
            createDecisionCycleResult(
              workflow.journey,
            )
  
          decisionCycle.warnings.push(
            "Aviso do ciclo comercial.",
          )
  
          const result =
            processCommercialTransition({
              commercialRepository,
  
              crmRepository:
                {} as CrmRepository,
  
              decisionAutomationRepository:
                {} as DecisionAutomationRepository,
  
              journeyId:
                journey.id,
  
              targetStateId:
                "state-2",
  
              actorType:
                "CONSULTANT",
  
              actorId:
                "consultant-1",
  
              origin:
                "MANUAL",
  
              dependencies: {
                runWorkflowEngine:
                  () => workflow,
  
                synchronizeCommercialJourneyWithCrm:
                  () => crmSynchronization,
  
                runCommercialDecisionCycle:
                  () => decisionCycle,
              },
            })
  
          expect(
            result.diagnostics,
          ).toContain(
            "Transição executada.",
          )
  
          expect(
            result.diagnostics,
          ).toContain(
            "CRM sincronizado.",
          )
  
          expect(
            result.diagnostics,
          ).toContain(
            "Ciclo comercial executado.",
          )
  
          expect(
            result.warnings,
          ).toContain(
            "Aviso do workflow.",
          )
  
          expect(
            result.warnings,
          ).toContain(
            "Aviso do CRM.",
          )
  
          expect(
            result.warnings,
          ).toContain(
            "Aviso do ciclo comercial.",
          )
        },
      )
    },
  )