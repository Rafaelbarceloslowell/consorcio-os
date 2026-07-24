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
    runWorkflowEngine,
  } from "./engine"
  
  const NOW =
    new Date(
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
  
  function createWorkflowData() {
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
        phaseId: "phase-target",
        code: "proposal_sent",
        name: "Proposta enviada",
        order: 2,
        isInitial: false,
      })
  
    return {
      sourcePhase,
      targetPhase,
      sourceState,
      targetState,
    }
  }
  
  describe(
    "runWorkflowEngine",
    () => {
      it(
        "deve validar e executar uma transição permitida",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney(),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [],
              targetStateId:
                targetState.id,
              origin:
                "MANUAL",
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              now:
                NOW,
            })
  
          expect(
            result.validation.allowed,
          ).toBe(true)
  
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
        "deve incrementar a versão da jornada",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney({
                  version: 8,
                }),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [],
              targetStateId:
                targetState.id,
              origin:
                "SYSTEM",
              actorType:
                "SYSTEM",
              actorId:
                null,
              now:
                NOW,
            })
  
          expect(
            result.journey.version,
          ).toBe(9)
  
          expect(
            result.journey.updatedAt,
          ).toBe(
            NOW_ISO,
          )
        },
      )
  
      it(
        "não deve modificar a jornada original",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const journey =
            createJourney()
  
          const originalSnapshot =
            structuredClone(
              journey,
            )
  
          const result =
            runWorkflowEngine({
              journey,
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [],
              targetStateId:
                targetState.id,
              origin:
                "MANUAL",
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
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
        },
      )
  
      it(
        "deve rejeitar uma transição para o mesmo estado",
        () => {
          const sourcePhase =
            createPhase()
  
          const sourceState =
            createState()
  
          const journey =
            createJourney()
  
          const result =
            runWorkflowEngine({
              journey,
              phases: [
                sourcePhase,
              ],
              states: [
                sourceState,
              ],
              rules: [],
              targetStateId:
                sourceState.id,
              origin:
                "MANUAL",
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              now:
                NOW,
            })
  
          expect(
            result.validation.allowed,
          ).toBe(false)
  
          expect(
            result.validation.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "SAME_STATE",
              }),
            ]),
          )
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
  
          expect(
            result.journey,
          ).toEqual(
            journey,
          )
        },
      )
  
      it(
        "deve rejeitar uma transição quando a versão esperada estiver desatualizada",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney({
                  version: 5,
                }),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [],
              targetStateId:
                targetState.id,
              origin:
                "SYSTEM",
              actorType:
                "SYSTEM",
              actorId:
                null,
              now:
                NOW,
              expectedVersion:
                4,
            })
  
          expect(
            result.validation.allowed,
          ).toBe(false)
  
          expect(
            result.validation.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "VERSION_CONFLICT",
              }),
            ]),
          )
  
          expect(
            result.changed,
          ).toBe(false)
  
          expect(
            result.event,
          ).toBeNull()
        },
      )
  
      it(
        "deve encontrar regras compatíveis e solicitar suas ações",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const firstAction =
            createAction({
              type:
                "CREATE_TASK",
              payload: {
                title:
                  "Entrar em contato com o lead",
              },
            })
  
          const secondAction =
            createAction({
              type:
                "ADD_NOTE",
              payload: {
                content:
                  "Lead avançou para negociação.",
              },
            })
  
          const firstRule =
            createRule({
              id:
                "rule-first",
              priority:
                10,
              actions: [
                firstAction,
              ],
            })
  
          const secondRule =
            createRule({
              id:
                "rule-second",
              priority:
                20,
              actions: [
                secondAction,
              ],
            })
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney(),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [
                secondRule,
                firstRule,
              ],
              targetStateId:
                targetState.id,
              origin:
                "COMMERCIAL_EVENT",
              actorType:
                "AUTOMATION",
              actorId:
                "automation-test",
              now:
                NOW,
              eventType:
                "STATE_CHANGED",
            })
  
          expect(
            result.validation.allowed,
          ).toBe(true)
  
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
        "deve ignorar regras inativas ou incompatíveis",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const inactiveRule =
            createRule({
              id:
                "rule-inactive",
              isActive:
                false,
            })
  
          const wrongSourceRule =
            createRule({
              id:
                "rule-wrong-source",
              sourceStateId:
                "another-state",
            })
  
          const wrongTargetRule =
            createRule({
              id:
                "rule-wrong-target",
              targetStateId:
                "another-target",
            })
  
          const wrongEventRule =
            createRule({
              id:
                "rule-wrong-event",
              eventType:
                "LEAD_REPLIED",
            })
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney(),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [
                inactiveRule,
                wrongSourceRule,
                wrongTargetRule,
                wrongEventRule,
              ],
              targetStateId:
                targetState.id,
              origin:
                "COMMERCIAL_EVENT",
              actorType:
                "AUTOMATION",
              actorId:
                "automation-test",
              now:
                NOW,
              eventType:
                "STATE_CHANGED",
            })
  
          expect(
            result.validation.allowed,
          ).toBe(true)
  
          expect(
            result.matchedRules,
          ).toEqual([])
  
          expect(
            result.requestedActions,
          ).toEqual([])
        },
      )
  
      it(
        "deve encerrar a jornada quando o estado de destino for ganho",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
          } = createWorkflowData()
  
          const wonState =
            createState({
              id:
                "state-won",
              phaseId:
                targetPhase.id,
              code:
                "sale_completed",
              name:
                "Venda concluída",
              order:
                3,
              isInitial:
                false,
              isFinal:
                true,
              isWon:
                true,
              isLost:
                false,
            })
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney(),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                wonState,
              ],
              rules: [],
              targetStateId:
                wonState.id,
              origin:
                "MANUAL",
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              now:
                NOW,
            })
  
          expect(
            result.validation.allowed,
          ).toBe(true)
  
          expect(
            result.changed,
          ).toBe(true)
  
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
        },
      )
  
      it(
        "deve repassar o payload personalizado para o evento gerado",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney(),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [],
              targetStateId:
                targetState.id,
              origin:
                "MANUAL",
              actorType:
                "CONSULTANT",
              actorId:
                "consultant-test",
              now:
                NOW,
              payload: {
                reason:
                  "Cliente solicitou o envio da proposta.",
                channel:
                  "whatsapp",
              },
            })
  
          expect(
            result.event?.payload,
          ).toMatchObject({
            reason:
              "Cliente solicitou o envio da proposta.",
            channel:
              "whatsapp",
          })
        },
      )
  
      it(
        "deve devolver os diagnósticos produzidos pela validação e pela transição",
        () => {
          const {
            sourcePhase,
            targetPhase,
            sourceState,
            targetState,
          } = createWorkflowData()
  
          const result =
            runWorkflowEngine({
              journey:
                createJourney(),
              phases: [
                sourcePhase,
                targetPhase,
              ],
              states: [
                sourceState,
                targetState,
              ],
              rules: [],
              targetStateId:
                targetState.id,
              origin:
                "SYSTEM",
              actorType:
                "SYSTEM",
              actorId:
                null,
              now:
                NOW,
            })
  
          expect(
            result.diagnostics.length,
          ).toBeGreaterThan(0)
  
          expect(
            result.diagnostics.some(
              (diagnostic) =>
                diagnostic.includes(
                  "journey-test",
                ),
            ),
          ).toBe(true)
  
          expect(
            result.warnings,
          ).toEqual([])
        },
      )
    },
  )