import {
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import {
    mockCommercialData,
  } from "@/data/mock-commercial"
  
  import {
    mockCrmData,
  } from "@/data/mock-crm"
  
  import type {
    CommercialJourney,
    JourneyPhase,
    JourneyState,
    Lead,
    PipelineStage,
  } from "@/types/domain"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    synchronizeCommercialJourneyWithCrm,
  } from "./crm-synchronizer"
  
  const NOW = new Date(
    "2026-07-23T18:00:00.000Z",
  )
  
  function getStateByCode(
    code: string,
  ): JourneyState {
    const state =
      mockCommercialData.journeyStates.find(
        (currentState) =>
          currentState.code === code,
      )
  
    if (!state) {
      throw new Error(
        `Estado de teste não encontrado para o código "${code}".`,
      )
    }
  
    return {
      ...state,
    }
  }
  
  function getPhaseById(
    phaseId: string,
  ): JourneyPhase {
    const phase =
      mockCommercialData.journeyPhases.find(
        (currentPhase) =>
          currentPhase.id === phaseId,
      )
  
    if (!phase) {
      throw new Error(
        `Fase de teste não encontrada para o ID "${phaseId}".`,
      )
    }
  
    return {
      ...phase,
    }
  }
  
  function createLead(
    overrides: Partial<Lead> = {},
  ): Lead {
    const sourceLead =
      mockCrmData.leads[0]
  
    if (!sourceLead) {
      throw new Error(
        "Nenhum lead mock foi encontrado.",
      )
    }
  
    return {
      ...sourceLead,
      id: "crm-sync-lead",
      status: "new",
      pipelineStageId: "stage-1",
      score: 10,
      lostReason: undefined,
      convertedClientId: undefined,
      lastContactAt: undefined,
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
      ...overrides,
    }
  }
  
  function createJourney(
    state: JourneyState,
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    const sourceJourney =
      mockCommercialData.commercialJourneys[0]
  
    if (!sourceJourney) {
      throw new Error(
        "Nenhuma jornada comercial mock foi encontrada.",
      )
    }
  
    return {
      ...sourceJourney,
      id: "crm-sync-journey",
      workspaceId: state.workspaceId,
      leadId: "crm-sync-lead",
      clientId: null,
      currentPhaseId: state.phaseId,
      currentStateId: state.id,
      score: 82,
      outcome: null,
      lastInteractionAt:
        "2026-07-23T17:30:00.000Z",
      createdAt:
        "2026-07-01T10:00:00.000Z",
      updatedAt:
        "2026-07-23T17:30:00.000Z",
      ...overrides,
    }
  }
  
  function createCommercialRepository(
    journey: CommercialJourney,
    states: JourneyState[] =
      mockCommercialData.journeyStates,
    phases: JourneyPhase[] =
      mockCommercialData.journeyPhases,
  ) {
    return new MockCommercialRepository({
      commercialJourneys: [journey],
      journeyPhases: [...phases],
      journeyStates: [...states],
      commercialEvents: [],
      commercialActions: [],
      nextBestActions: [],
      workflowRules: [],
    })
  }
  
  function createCrmRepository(
    lead: Lead | null,
    pipelineStages: PipelineStage[] =
      mockCrmData.pipelineStages,
  ) {
    return new MockCrmRepository({
      leads: lead ? [lead] : [],
      clients: [...mockCrmData.clients],
      consultants: [...mockCrmData.consultants],
      pipelineStages: [...pipelineStages],
      meetings: [],
      consortiums: [...mockCrmData.consortiums],
      proposals: [],
      sales: [],
    })
  }
  
  function createScenario(
    stateCode: string,
    options: {
      lead?: Lead | null
      journeyOverrides?: Partial<CommercialJourney>
      states?: JourneyState[]
      phases?: JourneyPhase[]
      pipelineStages?: PipelineStage[]
    } = {},
  ) {
    const state =
      getStateByCode(stateCode)
  
    const journey =
      createJourney(
        state,
        options.journeyOverrides,
      )
  
    const lead =
      options.lead === undefined
        ? createLead()
        : options.lead
  
    const commercialRepository =
      createCommercialRepository(
        journey,
        options.states,
        options.phases,
      )
  
    const crmRepository =
      createCrmRepository(
        lead,
        options.pipelineStages,
      )
  
    return {
      state,
      journey,
      lead,
      commercialRepository,
      crmRepository,
    }
  }
  
  describe(
    "synchronizeCommercialJourneyWithCrm",
    () => {
      it(
        "deve manter um novo lead no status new",
        () => {
          const scenario =
            createScenario("NEW_LEAD")
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.lead).toMatchObject({
            status: "new",
            pipelineStageId: "stage-1",
            score: 82,
          })
  
          expect(result.changed).toBe(true)
        },
      )
  
      it(
        "deve sincronizar uma jornada contactada com o status contacted",
        () => {
          const scenario =
            createScenario("CONTACTED")
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.lead).toMatchObject({
            status: "contacted",
            pipelineStageId: "stage-2",
            lastContactAt:
              scenario.journey.lastInteractionAt,
          })
        },
      )
  
      it(
        "deve sincronizar uma jornada qualificada com o status qualified",
        () => {
          const scenario =
            createScenario("QUALIFIED")
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.lead).toMatchObject({
            status: "qualified",
            pipelineStageId: "stage-2",
            score: scenario.journey.score,
          })
        },
      )
  
      it.each([
        "SIMULATION_PREPARATION",
        "PROPOSAL_PREPARATION",
        "PROPOSAL_SENT",
      ])(
        "deve manter o lead qualificado durante o estado %s",
        (stateCode) => {
          const scenario =
            createScenario(stateCode)
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.status,
          ).toBe("qualified")
  
          expect(
            result.lead?.pipelineStageId,
          ).toBe("stage-3")
        },
      )
  
      it.each([
        "IN_NEGOTIATION",
        "AWAITING_DECISION",
      ])(
        "deve sincronizar o estado %s com o status negotiating",
        (stateCode) => {
          const scenario =
            createScenario(stateCode)
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.status,
          ).toBe("negotiating")
  
          expect(
            result.lead?.pipelineStageId,
          ).toBe("stage-4")
        },
      )
  
      it.each([
        "AWAITING_DOCUMENTS",
        "AWAITING_SIGNATURE",
      ])(
        "deve manter o lead em negociação durante o estado %s",
        (stateCode) => {
          const scenario =
            createScenario(stateCode)
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.status,
          ).toBe("negotiating")
  
          expect(
            result.lead?.pipelineStageId,
          ).toBe("stage-5")
        },
      )
  
      it(
        "deve converter o lead quando a jornada estiver ganha e possuir cliente",
        () => {
          const scenario =
            createScenario(
              "WON",
              {
                journeyOverrides: {
                  clientId: "client-1",
                  outcome: "WON",
                },
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.changed).toBe(true)
  
          expect(result.lead).toMatchObject({
            status: "converted",
            convertedClientId: "client-1",
            pipelineStageId: "stage-6",
            lostReason: undefined,
          })
        },
      )
  
      it(
        "não deve converter o lead ganho quando a jornada não possuir cliente",
        () => {
          const scenario =
            createScenario(
              "WON",
              {
                lead: createLead({
                  status: "negotiating",
                  pipelineStageId:
                    "stage-5",
                }),
                journeyOverrides: {
                  clientId: null,
                  outcome: "WON",
                },
              },
            )
  
          const updateLeadSpy =
            vi.spyOn(
              scenario.crmRepository,
              "updateLead",
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.changed).toBe(false)
          expect(
            result.lead?.status,
          ).toBe("negotiating")
  
          expect(result.warnings).toEqual([
            `O lead "${scenario.lead?.id}" não foi marcado como convertido porque a jornada ainda não possui um cliente vinculado.`,
          ])
  
          expect(
            updateLeadSpy,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve marcar o lead como perdido",
        () => {
          const scenario =
            createScenario(
              "LOST",
              {
                journeyOverrides: {
                  outcome: "NO_RESPONSE",
                },
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.lead).toMatchObject({
            status: "lost",
            pipelineStageId: "stage-7",
            lostReason:
              "O lead não respondeu às tentativas de contato.",
          })
        },
      )
  
      it(
        "deve usar o motivo genérico quando uma jornada perdida não possuir outcome",
        () => {
          const scenario =
            createScenario(
              "LOST",
              {
                journeyOverrides: {
                  outcome: null,
                },
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.lostReason,
          ).toBe(
            "A oportunidade foi encerrada sem conversão.",
          )
        },
      )
  
      it(
        "não deve alterar o lead quando a jornada estiver adiada",
        () => {
          const lead =
            createLead({
              status: "qualified",
              pipelineStageId: "stage-3",
              score: 82,
            })
  
          const scenario =
            createScenario(
              "POSTPONED",
              {
                lead,
              },
            )
  
          const updateLeadSpy =
            vi.spyOn(
              scenario.crmRepository,
              "updateLead",
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.changed).toBe(false)
          expect(result.lead).toEqual(lead)
  
          expect(
            updateLeadSpy,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve retornar um aviso quando o lead não existir",
        () => {
          const scenario =
            createScenario(
              "CONTACTED",
              {
                lead: null,
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.lead).toBeNull()
          expect(
            result.previousLead,
          ).toBeNull()
          expect(result.changed).toBe(false)
  
          expect(result.warnings).toEqual([
            `O lead "${scenario.journey.leadId}" vinculado à jornada comercial não foi encontrado no CRM.`,
          ])
        },
      )
  
      it(
        "deve rejeitar uma jornada cujo estado não exista",
        () => {
          const state =
            getStateByCode("CONTACTED")
  
          const journey =
            createJourney(
              state,
              {
                currentStateId:
                  "missing-state",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            createCrmRepository(
              createLead(),
            )
  
          expect(() =>
            synchronizeCommercialJourneyWithCrm({
              journey,
              commercialRepository,
              crmRepository,
              now: NOW,
            }),
          ).toThrow(
            `Estado comercial não encontrado para o ID "missing-state".`,
          )
        },
      )
  
      it(
        "deve rejeitar um estado pertencente a outro workspace",
        () => {
          const originalState =
            getStateByCode("CONTACTED")
  
          const foreignState: JourneyState = {
            ...originalState,
            id: "foreign-state",
            workspaceId:
              "another-workspace",
          }
  
          const journey =
            createJourney(
              foreignState,
              {
                workspaceId:
                  "workspace-1",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [foreignState],
            )
  
          const crmRepository =
            createCrmRepository(
              createLead(),
            )
  
          expect(() =>
            synchronizeCommercialJourneyWithCrm({
              journey,
              commercialRepository,
              crmRepository,
              now: NOW,
            }),
          ).toThrow(
            `O estado comercial "${foreignState.id}" não pertence ao workspace da jornada "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve rejeitar um estado cuja fase não exista",
        () => {
          const originalState =
            getStateByCode("CONTACTED")
  
          const invalidState: JourneyState = {
            ...originalState,
            id: "state-without-phase",
            phaseId: "missing-phase",
          }
  
          const journey =
            createJourney(invalidState)
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [invalidState],
            )
  
          const crmRepository =
            createCrmRepository(
              createLead(),
            )
  
          expect(() =>
            synchronizeCommercialJourneyWithCrm({
              journey,
              commercialRepository,
              crmRepository,
              now: NOW,
            }),
          ).toThrow(
            `Fase comercial não encontrada para o ID "missing-phase".`,
          )
        },
      )
  
      it(
        "deve rejeitar uma fase pertencente a outro workspace",
        () => {
          const state =
            getStateByCode("CONTACTED")
  
          const originalPhase =
            getPhaseById(state.phaseId)
  
          const foreignPhase: JourneyPhase = {
            ...originalPhase,
            workspaceId:
              "another-workspace",
          }
  
          const journey =
            createJourney(state)
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [state],
              [foreignPhase],
            )
  
          const crmRepository =
            createCrmRepository(
              createLead(),
            )
  
          expect(() =>
            synchronizeCommercialJourneyWithCrm({
              journey,
              commercialRepository,
              crmRepository,
              now: NOW,
            }),
          ).toThrow(
            `A fase comercial "${foreignPhase.id}" não pertence ao workspace da jornada "${journey.id}".`,
          )
        },
      )
  
      it(
        "deve rejeitar a sincronização quando o estágio compatível não existir",
        () => {
          const scenario =
            createScenario(
              "QUALIFIED",
              {
                pipelineStages:
                  mockCrmData.pipelineStages.filter(
                    (pipelineStage) =>
                      pipelineStage.order !== 2,
                  ),
              },
            )
  
          expect(() =>
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            }),
          ).toThrow(
            `Nenhum estágio de pipeline compatível foi encontrado para sincronizar o lead "${scenario.lead?.id}" com o estado comercial "${scenario.state.code}".`,
          )
        },
      )
  
      it(
        "deve atualizar o score do lead com o score da jornada",
        () => {
          const scenario =
            createScenario(
              "QUALIFIED",
              {
                lead: createLead({
                  score: 15,
                }),
                journeyOverrides: {
                  score: 96,
                },
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.previousLead?.score,
          ).toBe(15)
  
          expect(
            result.lead?.score,
          ).toBe(96)
        },
      )
  
      it(
        "deve usar updatedAt da jornada quando lastInteractionAt não existir",
        () => {
          const scenario =
            createScenario(
              "CONTACTED",
              {
                journeyOverrides: {
                  lastInteractionAt: null,
                  updatedAt:
                    "2026-07-23T16:45:00.000Z",
                },
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.lastContactAt,
          ).toBe(
            "2026-07-23T16:45:00.000Z",
          )
        },
      )
  
      it(
        "deve atualizar updatedAt do lead com a data da sincronização",
        () => {
          const scenario =
            createScenario("QUALIFIED")
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.updatedAt,
          ).toBe(NOW.toISOString())
        },
      )
  
      it(
        "deve persistir o lead atualizado no repositório CRM",
        () => {
          const scenario =
            createScenario("QUALIFIED")
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            scenario.crmRepository.getLeadById(
              scenario.journey.leadId,
            ),
          ).toEqual(result.lead)
        },
      )
  
      it(
        "deve chamar updateLead apenas uma vez em uma sincronização com alteração",
        () => {
          const scenario =
            createScenario("QUALIFIED")
  
          const updateLeadSpy =
            vi.spyOn(
              scenario.crmRepository,
              "updateLead",
            )
  
          synchronizeCommercialJourneyWithCrm({
            journey: scenario.journey,
            commercialRepository:
              scenario.commercialRepository,
            crmRepository:
              scenario.crmRepository,
            now: NOW,
          })
  
          expect(
            updateLeadSpy,
          ).toHaveBeenCalledTimes(1)
        },
      )
  
      it(
        "não deve atualizar novamente um lead que já esteja sincronizado",
        () => {
          const scenario =
            createScenario(
              "QUALIFIED",
              {
                lead: createLead({
                  status: "qualified",
                  pipelineStageId:
                    "stage-2",
                  score: 82,
                  lastContactAt:
                    "2026-07-23T17:30:00.000Z",
                }),
              },
            )
  
          const updateLeadSpy =
            vi.spyOn(
              scenario.crmRepository,
              "updateLead",
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(result.changed).toBe(false)
  
          expect(result.diagnostics).toEqual([
            `O lead "${scenario.lead?.id}" já está sincronizado com a jornada comercial "${scenario.journey.id}".`,
          ])
  
          expect(
            updateLeadSpy,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve remover lostReason quando o lead perdido voltar para uma etapa ativa",
        () => {
          const scenario =
            createScenario(
              "QUALIFIED",
              {
                lead: createLead({
                  status: "lost",
                  pipelineStageId:
                    "stage-7",
                  lostReason:
                    "Motivo anterior.",
                }),
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.status,
          ).toBe("qualified")
  
          expect(
            result.lead?.lostReason,
          ).toBeUndefined()
        },
      )
  
      it(
        "deve preservar convertedClientId enquanto o lead estiver em uma etapa não convertida",
        () => {
          const scenario =
            createScenario(
              "QUALIFIED",
              {
                lead: createLead({
                  convertedClientId:
                    "client-existing",
                }),
              },
            )
  
          const result =
            synchronizeCommercialJourneyWithCrm({
              journey: scenario.journey,
              commercialRepository:
                scenario.commercialRepository,
              crmRepository:
                scenario.crmRepository,
              now: NOW,
            })
  
          expect(
            result.lead?.convertedClientId,
          ).toBe("client-existing")
        },
      )
    },
  )