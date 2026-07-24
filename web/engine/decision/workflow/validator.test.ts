import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CommercialJourney,
    JourneyPhase,
    JourneyState,
    WorkflowRule,
  } from "@/types/domain"
  
  import type {
    ValidateWorkflowTransitionInput,
  } from "./types"
  
  import {
    validateWorkflowTransition,
  } from "./validator"
  
  const NOW = new Date(
    "2026-07-22T10:00:00.000Z",
  )
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id: "journey-1",
      workspaceId: "workspace-1",
      leadId: "lead-1",
      clientId: null,
      consultantId: "consultant-1",
      title: "Jornada comercial",
      consortiumType: "real_estate",
      currentPhaseId: "phase-1",
      currentStateId: "state-new",
      priority: "medium",
      outcome: null,
      closedAt: null,
      version: 1,
      createdAt:
        "2026-07-22T10:00:00.000Z",
      updatedAt:
        "2026-07-22T10:00:00.000Z",
      ...overrides,
    } as unknown as CommercialJourney
  }
  
  function createPhase(
    overrides: Partial<JourneyPhase> = {},
  ): JourneyPhase {
    return {
      id: "phase-1",
      workspaceId: "workspace-1",
      code: "qualification",
      name: "Qualificação",
      description:
        "Fase de qualificação",
      order: 1,
      color: "#000000",
      icon: "circle",
      isActive: true,
      createdAt:
        "2026-07-22T10:00:00.000Z",
      updatedAt:
        "2026-07-22T10:00:00.000Z",
      ...overrides,
    } as unknown as JourneyPhase
  }
  
  function createState(
    overrides: Partial<JourneyState> = {},
  ): JourneyState {
    return {
      id: "state-new",
      workspaceId: "workspace-1",
      phaseId: "phase-1",
      code: "new",
      name: "Novo",
      description: "Novo lead",
      order: 1,
      color: "#000000",
      icon: "circle",
      isInitial: true,
      isFinal: false,
      isWon: false,
      isLost: false,
      allowReopen: false,
      isActive: true,
      createdAt:
        "2026-07-22T10:00:00.000Z",
      updatedAt:
        "2026-07-22T10:00:00.000Z",
      ...overrides,
    } as unknown as JourneyState
  }
  
  function createRule(
    overrides: Partial<WorkflowRule> = {},
  ): WorkflowRule {
    return {
      id: "rule-1",
      workspaceId: "workspace-1",
      name: "Regra de avanço",
      description:
        "Permite avançar a jornada",
      eventType:
        "journey_state_changed",
      sourceStateId: "state-new",
      targetStateId:
        "state-qualified",
      priority: 10,
      isActive: true,
      createdAt:
        "2026-07-22T10:00:00.000Z",
      updatedAt:
        "2026-07-22T10:00:00.000Z",
      ...overrides,
    } as unknown as WorkflowRule
  }
  
  function createValidScenario():
    ValidateWorkflowTransitionInput {
    const phaseQualification =
      createPhase({
        id: "phase-1",
        order: 1,
      })
  
    const phaseNegotiation =
      createPhase({
        id: "phase-2",
        code: "negotiation",
        name: "Negociação",
        order: 2,
      })
  
    const sourceState =
      createState({
        id: "state-new",
        phaseId: "phase-1",
        order: 1,
      })
  
    const targetState =
      createState({
        id: "state-qualified",
        phaseId: "phase-2",
        code: "qualified",
        name: "Qualificado",
        order: 1,
        isInitial: false,
      })
  
    return {
      journey: createJourney(),
      phases: [
        phaseQualification,
        phaseNegotiation,
      ],
      states: [
        sourceState,
        targetState,
      ],
      rules: [
        createRule(),
      ],
      targetStateId:
        targetState.id,
      expectedVersion: 1,
      eventType:
        "journey_state_changed" as never,
      origin: "manual" as never,
      actorType: "user" as never,
      actorId: "user-1",
      now: NOW,
    }
  }
  
  function getErrorCodes(
    result: ReturnType<
      typeof validateWorkflowTransition
    >,
  ): string[] {
    return result.errors.map(
      (error) => error.code,
    )
  }
  
  describe(
    "validateWorkflowTransition",
    () => {
      it(
        "deve permitir uma transição válida",
        () => {
          const scenario =
            createValidScenario()
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            true,
          )
  
          expect(result.errors).toEqual(
            [],
          )
  
          expect(
            result.sourceState?.id,
          ).toBe("state-new")
  
          expect(
            result.targetState?.id,
          ).toBe(
            "state-qualified",
          )
  
          expect(
            result.sourcePhase?.id,
          ).toBe("phase-1")
  
          expect(
            result.targetPhase?.id,
          ).toBe("phase-2")
  
          expect(
            result.matchedRules,
          ).toHaveLength(1)
        },
      )
  
      it(
        "deve rejeitar quando o estado atual não existe",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.states =
            scenario.states.filter(
              (state) =>
                state.id !==
                "state-new",
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "SOURCE_STATE_NOT_FOUND",
          )
        },
      )
  
      it(
        "deve rejeitar quando o estado de destino não existe",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.targetStateId =
            "state-missing"
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "TARGET_STATE_NOT_FOUND",
          )
  
          expect(
            result.targetState,
          ).toBeNull()
        },
      )
  
      it(
        "deve rejeitar quando o estado de destino está inativo",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.states =
            scenario.states.map(
              (state) =>
                state.id ===
                "state-qualified"
                  ? createState({
                      ...state,
                      isActive: false,
                    })
                  : state,
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "TARGET_STATE_INACTIVE",
          )
        },
      )
  
      it(
        "deve rejeitar quando a fase do estado atual não existe",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.phases =
            scenario.phases.filter(
              (phase) =>
                phase.id !==
                "phase-1",
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "SOURCE_PHASE_NOT_FOUND",
          )
        },
      )
  
      it(
        "deve rejeitar quando a fase do estado de destino não existe",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.phases =
            scenario.phases.filter(
              (phase) =>
                phase.id !==
                "phase-2",
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "TARGET_PHASE_NOT_FOUND",
          )
        },
      )
  
      it(
        "deve rejeitar quando a fase de destino está inativa",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.phases =
            scenario.phases.map(
              (phase) =>
                phase.id ===
                "phase-2"
                  ? createPhase({
                      ...phase,
                      isActive: false,
                    })
                  : phase,
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "TARGET_PHASE_INACTIVE",
          )
        },
      )
  
      it(
        "deve rejeitar uma transição para o mesmo estado atual",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.targetStateId =
            "state-new"
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "SAME_STATE",
          )
        },
      )
  
      it(
        "deve rejeitar quando a versão esperada é diferente da versão atual",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.expectedVersion = 2
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "VERSION_CONFLICT",
          )
        },
      )
  
      it(
        "deve ignorar a validação de versão quando a versão esperada não é informada",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.expectedVersion =
            undefined
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            getErrorCodes(result),
          ).not.toContain(
            "VERSION_CONFLICT",
          )
  
          expect(result.allowed).toBe(
            true,
          )
        },
      )
  
      it(
        "deve rejeitar quando o estado atual pertence a outro workspace",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.states =
            scenario.states.map(
              (state) =>
                state.id ===
                "state-new"
                  ? createState({
                      ...state,
                      workspaceId:
                        "workspace-2",
                    })
                  : state,
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "JOURNEY_NOT_IN_WORKSPACE",
          )
        },
      )
  
      it(
        "deve rejeitar quando o estado de destino pertence a outro workspace",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.states =
            scenario.states.map(
              (state) =>
                state.id ===
                "state-qualified"
                  ? createState({
                      ...state,
                      workspaceId:
                        "workspace-2",
                    })
                  : state,
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "WORKSPACE_MISMATCH",
          )
        },
      )
  
      it(
        "deve rejeitar uma jornada encerrada que tenta avançar para outro estado final",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.journey =
            createJourney({
              outcome: "won" as never,
              closedAt:
                "2026-07-22T12:00:00.000Z",
            })
  
          scenario.states =
            scenario.states.map(
              (state) =>
                state.id ===
                "state-qualified"
                  ? createState({
                      ...state,
                      isFinal: true,
                      isWon: true,
                    })
                  : state,
            )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "JOURNEY_ALREADY_CLOSED",
          )
        },
      )
  
      it(
        "deve rejeitar a reabertura quando o estado atual não permite reabrir",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.journey =
            createJourney({
              currentPhaseId:
                "phase-closed",
              currentStateId:
                "state-won",
              outcome: "won" as never,
              closedAt:
                "2026-07-22T12:00:00.000Z",
            })
  
          scenario.phases.push(
            createPhase({
              id: "phase-closed",
              code: "closed",
              name: "Encerrada",
              order: 3,
            }),
          )
  
          scenario.states.push(
            createState({
              id: "state-won",
              phaseId:
                "phase-closed",
              code: "won",
              name: "Ganha",
              isInitial: false,
              isFinal: true,
              isWon: true,
              allowReopen: false,
            }),
          )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            false,
          )
  
          expect(
            getErrorCodes(result),
          ).toContain(
            "REOPEN_NOT_ALLOWED",
          )
        },
      )
  
      it(
        "deve permitir a reabertura quando o estado atual permite reabrir",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.journey =
            createJourney({
              currentPhaseId:
                "phase-closed",
              currentStateId:
                "state-won",
              outcome: "won" as never,
              closedAt:
                "2026-07-22T12:00:00.000Z",
            })
  
          scenario.phases.push(
            createPhase({
              id: "phase-closed",
              code: "closed",
              name: "Encerrada",
              order: 3,
            }),
          )
  
          scenario.states.push(
            createState({
              id: "state-won",
              phaseId:
                "phase-closed",
              code: "won",
              name: "Ganha",
              isInitial: false,
              isFinal: true,
              isWon: true,
              allowReopen: true,
            }),
          )
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            getErrorCodes(result),
          ).not.toContain(
            "REOPEN_NOT_ALLOWED",
          )
  
          expect(
            getErrorCodes(result),
          ).not.toContain(
            "JOURNEY_ALREADY_CLOSED",
          )
  
          expect(result.allowed).toBe(
            true,
          )
        },
      )
  
      it(
        "deve emitir aviso quando a transição retorna para uma fase anterior",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.journey =
            createJourney({
              currentPhaseId:
                "phase-2",
              currentStateId:
                "state-negotiation",
            })
  
          scenario.states.push(
            createState({
              id: "state-negotiation",
              phaseId: "phase-2",
              code: "negotiation",
              name: "Em negociação",
              isInitial: false,
            }),
          )
  
          scenario.targetStateId =
            "state-new"
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            true,
          )
  
          expect(
            result.warnings,
          ).toHaveLength(1)
  
          expect(
            result.warnings[0],
          ).toContain(
            "fase anterior",
          )
        },
      )
  
      it(
        "deve emitir aviso quando a transição pula fases",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.phases.push(
            createPhase({
              id: "phase-3",
              code: "closing",
              name: "Fechamento",
              order: 3,
            }),
          )
  
          scenario.states.push(
            createState({
              id: "state-closing",
              phaseId: "phase-3",
              code: "closing",
              name: "Em fechamento",
              isInitial: false,
            }),
          )
  
          scenario.targetStateId =
            "state-closing"
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(result.allowed).toBe(
            true,
          )
  
          expect(
            result.warnings,
          ).toHaveLength(1)
  
          expect(
            result.warnings[0],
          ).toContain("pula")
        },
      )
  
      it(
        "deve retornar apenas regras ativas e compatíveis com a transição",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.rules = [
            createRule({
              id: "rule-compatible",
            }),
            createRule({
              id: "rule-inactive",
              isActive: false,
            }),
            createRule({
              id: "rule-wrong-source",
              sourceStateId:
                "state-other",
            }),
            createRule({
              id: "rule-wrong-target",
              targetStateId:
                "state-other",
            }),
            createRule({
              id:
                "rule-wrong-workspace",
              workspaceId:
                "workspace-2",
            }),
          ]
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            result.matchedRules.map(
              (rule) => rule.id,
            ),
          ).toEqual([
            "rule-compatible",
          ])
        },
      )
  
      it(
        "deve aceitar regras globais sem workspace específico",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.rules = [
            createRule({
              id: "rule-global",
              workspaceId: null,
            }),
          ]
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            result.matchedRules.map(
              (rule) => rule.id,
            ),
          ).toEqual([
            "rule-global",
          ])
        },
      )
  
      it(
        "deve ordenar as regras por prioridade e depois pelo identificador",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.rules = [
            createRule({
              id: "rule-z",
              priority: 20,
            }),
            createRule({
              id: "rule-b",
              priority: 10,
            }),
            createRule({
              id: "rule-a",
              priority: 10,
            }),
          ]
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            result.matchedRules.map(
              (rule) => rule.id,
            ),
          ).toEqual([
            "rule-a",
            "rule-b",
            "rule-z",
          ])
        },
      )
  
      it(
        "deve retornar diagnóstico de sucesso para uma transição permitida",
        () => {
          const scenario =
            createValidScenario()
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            result.diagnostics.some(
              (diagnostic) =>
                diagnostic.includes(
                  "validada com sucesso",
                ),
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve retornar diagnóstico de rejeição com a quantidade de erros",
        () => {
          const scenario =
            createValidScenario()
  
          scenario.targetStateId =
            "state-new"
  
          scenario.expectedVersion = 99
  
          const result =
            validateWorkflowTransition(
              scenario,
            )
  
          expect(
            result.diagnostics.some(
              (diagnostic) =>
                diagnostic.includes(
                  "rejeitada com 2 erro(s)",
                ),
            ),
          ).toBe(true)
        },
      )
    },
  )