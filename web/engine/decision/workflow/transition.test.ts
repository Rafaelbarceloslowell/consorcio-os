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
    WorkflowRuleAction,
  } from "@/types/domain"
  
  import {
    createStateChangedEvent,
    executeWorkflowTransition,
  } from "./transition"
  
  import type {
    ValidateWorkflowTransitionOutput,
  } from "./types"
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
  const NOW_ISO =
    "2026-07-22T15:00:00.000Z"
  
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
      currentPhaseId: "phase-source",
      currentStateId: "state-source",
      priority: "HIGH",
      score: 80,
      outcome: null,
      stateEnteredAt:
        "2026-07-20T12:00:00.000Z",
      lastInteractionAt:
        "2026-07-21T12:00:00.000Z",
      closedAt: null,
      version: 3,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-21T12:00:00.000Z",
      ...overrides,
    }
  }
  
  function createPhase(
    overrides: Partial<JourneyPhase> = {},
  ): JourneyPhase {
    return {
      id: "phase-source",
      workspaceId: "workspace-test",
      code: "qualification",
      name: "Qualificação",
      description:
        "Fase de qualificação comercial.",
      order: 1,
      isActive: true,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-20T12:00:00.000Z",
      ...overrides,
    } as JourneyPhase
  }
  
  function createState(
    overrides: Partial<JourneyState> = {},
  ): JourneyState {
    return {
      id: "state-source",
      workspaceId: "workspace-test",
      phaseId: "phase-source",
      code: "new_lead",
      name: "Novo lead",
      description:
        "Lead recém-criado.",
      order: 1,
      color: null,
      icon: null,
      isInitial: true,
      isFinal: false,
      isWon: false,
      isLost: false,
      allowReopen: true,
      isActive: true,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-20T12:00:00.000Z",
      ...overrides,
    } as JourneyState
  }
  
  function createAction(
    overrides: Partial<WorkflowRuleAction> = {},
  ): WorkflowRuleAction {
    return {
      type: "CREATE_TASK",
      payload: {
        title:
          "Realizar acompanhamento",
      },
      ...overrides,
    }
  }
  
  function createRule(
    overrides: Partial<WorkflowRule> = {},
  ): WorkflowRule {
    return {
      id: "rule-test",
      workspaceId: "workspace-test",
      name: "Regra de acompanhamento",
      description:
        "Cria uma tarefa após a mudança de estado.",
      eventType: "STATE_CHANGED",
      sourceStateId: "state-source",
      targetStateId: "state-target",
      conditions: [],
      actions: [
        createAction(),
      ],
      priority: 100,
      stopProcessingAfterMatch: false,
      isActive: true,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-20T12:00:00.000Z",
      ...overrides,
    }
  }
  
  function createValidation(
    overrides:
      Partial<ValidateWorkflowTransitionOutput> = {},
  ): ValidateWorkflowTransitionOutput {
    const sourcePhase =
      createPhase()
  
    const targetPhase =
      createPhase({
        id: "phase-target",
        code: "negotiation",
        name: "Negociação",
        order: 2,
      })
  
    const sourceState =
      createState()
  
    const targetState =
      createState({
        id: "state-target",
        phaseId:
          targetPhase.id,
        code: "proposal_sent",
        name: "Proposta enviada",
        order: 2,
        isInitial: false,
      })
  
    return {
      allowed: true,
      sourceState,
      targetState,
      sourcePhase,
      targetPhase,
      matchedRules: [],
      errors: [],
      warnings: [],
      diagnostics: [],
      ...overrides,
    }
  }
  
  describe(
    "createStateChangedEvent",
    () => {
      it(
        "deve criar um evento de mudança de estado",
        () => {
          const event =
            createStateChangedEvent({
              journey:
                createJourney(),
              sourceState:
                createState(),
              targetState:
                createState({
                  id:
                    "state-target",
                  phaseId:
                    "phase-target",
                  code:
                    "proposal_sent",
                }),
              sourcePhase:
                createPhase(),
              targetPhase:
                createPhase({
                  id:
                    "phase-target",
                  code:
                    "negotiation",
                }),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            event,
          ).toMatchObject({
            id:
              `journey-state-changed-journey-test-${NOW.getTime()}`,
            workspaceId:
              "workspace-test",
            journeyId:
              "journey-test",
            type:
              "STATE_CHANGED",
            actorType:
              "CONSULTANT",
            actorId:
              "consultant-test",
            occurredAt:
              NOW_ISO,
            createdAt:
              NOW_ISO,
          })
        },
      )
  
      it(
        "deve registrar os estados e as fases no payload",
        () => {
          const event =
            createStateChangedEvent({
              journey:
                createJourney(),
              sourceState:
                createState(),
              targetState:
                createState({
                  id:
                    "state-target",
                  phaseId:
                    "phase-target",
                  code:
                    "proposal_sent",
                }),
              sourcePhase:
                createPhase(),
              targetPhase:
                createPhase({
                  id:
                    "phase-target",
                  code:
                    "negotiation",
                }),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            event.payload,
          ).toMatchObject({
            previousStateId:
              "state-source",
            previousStateCode:
              "new_lead",
            previousPhaseId:
              "phase-source",
            previousPhaseCode:
              "qualification",
            targetStateId:
              "state-target",
            targetStateCode:
              "proposal_sent",
            targetPhaseId:
              "phase-target",
            targetPhaseCode:
              "negotiation",
            origin:
              "SYSTEM",
          })
        },
      )
  
      it(
        "deve incorporar o payload personalizado",
        () => {
          const event =
            createStateChangedEvent({
              journey:
                createJourney(),
              sourceState:
                createState(),
              targetState:
                createState({
                  id:
                    "state-target",
                  phaseId:
                    "phase-target",
                }),
              sourcePhase:
                createPhase(),
              targetPhase:
                createPhase({
                  id:
                    "phase-target",
                }),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
              payload: {
                reason:
                  "Cliente solicitou proposta.",
                source:
                  "whatsapp",
              },
            })
  
          expect(
            event.payload,
          ).toMatchObject({
            reason:
              "Cliente solicitou proposta.",
            source:
              "whatsapp",
          })
        },
      )
    },
  )
  
  describe(
    "executeWorkflowTransition",
    () => {
      it(
        "deve executar uma transição válida",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation(),
              journey:
                createJourney(),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            result.changed,
          ).toBe(true)
  
          expect(
            result.journey.currentStateId,
          ).toBe(
            "state-target",
          )
  
          expect(
            result.journey.currentPhaseId,
          ).toBe(
            "phase-target",
          )
  
          expect(
            result.event,
          ).not.toBeNull()
        },
      )
  
      it(
        "deve incrementar a versão e atualizar a data da jornada",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation(),
              journey:
                createJourney({
                  version: 7,
                }),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.journey.version,
          ).toBe(8)
  
          expect(
            result.journey.updatedAt,
          ).toBe(
            NOW_ISO,
          )
        },
      )
  
      it(
        "não deve alterar a jornada original",
        () => {
          const journey =
            createJourney()
  
          const originalSnapshot =
            structuredClone(
              journey,
            )
  
          const result =
            executeWorkflowTransition({
              validation:
                createValidation(),
              journey,
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            journey,
          ).toEqual(
            originalSnapshot,
          )
  
          expect(
            result.previousJourney,
          ).toEqual(
            originalSnapshot,
          )
  
          expect(
            result.journey,
          ).not.toBe(
            journey,
          )
  
          expect(
            result.previousJourney,
          ).not.toBe(
            journey,
          )
        },
      )
  
      it(
        "deve encerrar uma jornada em estado final ganho",
        () => {
          const validation =
            createValidation({
              targetState:
                createState({
                  id:
                    "state-won",
                  phaseId:
                    "phase-target",
                  code:
                    "sale_completed",
                  isInitial:
                    false,
                  isFinal:
                    true,
                  isWon:
                    true,
                  isLost:
                    false,
                }),
            })
  
          const result =
            executeWorkflowTransition({
              validation,
              journey:
                createJourney(),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            result.journey.outcome,
          ).toBe(
            "WON",
          )
  
          expect(
            result.journey.closedAt,
          ).toBe(
            NOW_ISO,
          )
  
          expect(
            result.changed,
          ).toBe(true)
        },
      )
  
      it(
        "deve encerrar uma jornada em estado final perdido",
        () => {
          const validation =
            createValidation({
              targetState:
                createState({
                  id:
                    "state-lost",
                  phaseId:
                    "phase-target",
                  code:
                    "opportunity_lost",
                  isInitial:
                    false,
                  isFinal:
                    true,
                  isWon:
                    false,
                  isLost:
                    true,
                }),
            })
  
          const result =
            executeWorkflowTransition({
              validation,
              journey:
                createJourney(),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            result.journey.outcome,
          ).toBe(
            "OTHER",
          )
  
          expect(
            result.journey.closedAt,
          ).toBe(
            NOW_ISO,
          )
        },
      )
  
      it(
        "deve manter a jornada aberta quando o destino não for final",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation(),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.journey.outcome,
          ).toBeNull()
  
          expect(
            result.journey.closedAt,
          ).toBeNull()
        },
      )
  
      it(
        "deve reabrir uma jornada ao sair de um estado final",
        () => {
          const sourceState =
            createState({
              id:
                "state-closed",
              code:
                "opportunity_lost",
              isInitial:
                false,
              isFinal:
                true,
              isWon:
                false,
              isLost:
                true,
              allowReopen:
                true,
            })
  
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  sourceState,
                }),
              journey:
                createJourney({
                  currentStateId:
                    "state-closed",
                  outcome:
                    "NO_RESPONSE",
                  closedAt:
                    "2026-07-21T15:00:00.000Z",
                }),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            result.journey.outcome,
          ).toBeNull()
  
          expect(
            result.journey.closedAt,
          ).toBeNull()
  
          expect(
            result.diagnostics.some(
              (diagnostic) =>
                diagnostic.includes(
                  "foi reaberta",
                ),
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve coletar as ações das regras correspondentes",
        () => {
          const firstAction =
            createAction({
              type:
                "CREATE_TASK",
              payload: {
                title:
                  "Primeira tarefa",
              },
            })
  
          const secondAction =
            createAction({
              type:
                "ADD_NOTE",
              payload: {
                content:
                  "Segunda ação",
              },
            })
  
          const firstRule =
            createRule({
              id:
                "rule-first",
              actions: [
                firstAction,
              ],
            })
  
          const secondRule =
            createRule({
              id:
                "rule-second",
              actions: [
                secondAction,
              ],
            })
  
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  matchedRules: [
                    firstRule,
                    secondRule,
                  ],
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "RULE",
              now:
                NOW,
            })
  
          expect(
            result.matchedRules,
          ).toEqual([
            firstRule,
            secondRule,
          ])
  
          expect(
            result.requestedActions,
          ).toEqual([
            firstAction,
            secondAction,
          ])
        },
      )
  
      it(
        "deve ignorar regras sem ações",
        () => {
          const ruleWithoutActions =
            createRule({
              id:
                "rule-without-actions",
              actions: [],
            })
  
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  matchedRules: [
                    ruleWithoutActions,
                  ],
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "RULE",
              now:
                NOW,
            })
  
          expect(
            result.matchedRules,
          ).toHaveLength(1)
  
          expect(
            result.requestedActions,
          ).toEqual([])
        },
      )
  
      it(
        "deve preservar warnings e diagnostics da validação",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  warnings: [
                    "Aviso original.",
                  ],
                  diagnostics: [
                    "Diagnóstico original.",
                  ],
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.warnings,
          ).toContain(
            "Aviso original.",
          )
  
          expect(
            result.diagnostics,
          ).toContain(
            "Diagnóstico original.",
          )
        },
      )
  
      it(
        "não deve executar uma transição rejeitada",
        () => {
          const journey =
            createJourney()
  
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  allowed:
                    false,
                  errors: [
                    {
                      code:
                        "SAME_STATE",
                      message:
                        "O estado de destino é igual ao atual.",
                    },
                  ],
                  warnings: [
                    "Aviso de validação.",
                  ],
                  diagnostics: [
                    "Validação executada.",
                  ],
                }),
              journey,
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
            })
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
  
          expect(
            result.requestedActions,
          ).toEqual([])
  
          expect(
            result.journey,
          ).toEqual(
            journey,
          )
  
          expect(
            result.previousJourney,
          ).toEqual(
            journey,
          )
  
          expect(
            result.warnings,
          ).toContain(
            "Aviso de validação.",
          )
        },
      )
  
      it(
        "não deve executar quando o estado de origem estiver ausente",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  sourceState:
                    null,
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
  
          expect(
            result.requestedActions,
          ).toEqual([])
        },
      )
  
      it(
        "não deve executar quando o estado de destino estiver ausente",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  targetState:
                    null,
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
        },
      )
  
      it(
        "não deve executar quando a fase de origem estiver ausente",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  sourcePhase:
                    null,
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
        },
      )
  
      it(
        "não deve executar quando a fase de destino estiver ausente",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  targetPhase:
                    null,
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
        },
      )
  
      it(
        "deve manter as regras correspondentes em uma transição rejeitada",
        () => {
          const matchedRule =
            createRule()
  
          const result =
            executeWorkflowTransition({
              validation:
                createValidation({
                  allowed:
                    false,
                  matchedRules: [
                    matchedRule,
                  ],
                }),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "RULE",
              now:
                NOW,
            })
  
          expect(
            result.matchedRules,
          ).toEqual([
            matchedRule,
          ])
  
          expect(
            result.requestedActions,
          ).toEqual([])
        },
      )
  
      it(
        "deve criar diagnósticos para uma transição bem-sucedida",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation(),
              journey:
                createJourney(),
              actorType:
                "SYSTEM",
              actorId:
                null,
              origin:
                "SYSTEM",
              now:
                NOW,
            })
  
          expect(
            result.diagnostics.some(
              (diagnostic) =>
                diagnostic.includes(
                  "state-source",
                ) &&
                diagnostic.includes(
                  "state-target",
                ),
            ),
          ).toBe(true)
  
          expect(
            result.diagnostics.some(
              (diagnostic) =>
                diagnostic.includes(
                  "3",
                ) &&
                diagnostic.includes(
                  "4",
                ),
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve repassar o payload personalizado para o evento",
        () => {
          const result =
            executeWorkflowTransition({
              validation:
                createValidation(),
              journey:
                createJourney(),
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              origin:
                "MANUAL",
              now:
                NOW,
              payload: {
                reason:
                  "Proposta aprovada pelo cliente.",
                channel:
                  "whatsapp",
              },
            })
  
          expect(
            result.event?.payload,
          ).toMatchObject({
            reason:
              "Proposta aprovada pelo cliente.",
            channel:
              "whatsapp",
          })
        },
      )
    },
  )