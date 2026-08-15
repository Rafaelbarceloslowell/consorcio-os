import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  createMockAsyncCommercialRepositories,
} from "@/repositories/commercial/mock-async-commercial-repositories"

import type {
  AsyncEntityRepository,
  AsyncReadOnlyEntityRepository,
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  Client,
  CommercialAction,
  CommercialConversationMemory,
  CommercialJourney,
  Consortium,
  Consultant,
  JourneyPhase,
  JourneyState,
  Lead,
  Meeting,
  NextBestAction,
  PipelineStage,
  Proposal,
  Sale,
  Task,
} from "@/types/domain"

import {
  getAsyncDashboardData,
} from "./get-async-dashboard-data"

const TIMESTAMP =
  "2026-07-26T18:00:00.000Z"

function createEntityRepository<
  Entity extends {
    id: string
  },
>(
  values: Entity[] = [],
): AsyncEntityRepository<Entity> {
  return {
    findAll:
      vi.fn(async () => [
        ...values,
      ]),
    findById:
      vi.fn(async (id: string) =>
        values.find(
          (value) =>
            value.id === id,
        ),
      ),
    create:
      vi.fn(async (value) =>
        value,
      ),
    update:
      vi.fn(async (value) =>
        value,
      ),
    delete:
      vi.fn(async () =>
        false,
      ),
  }
}

function createReadOnlyRepository<
  Entity extends {
    id: string
  },
>(
  values: Entity[] = [],
): AsyncReadOnlyEntityRepository<Entity> {
  return {
    findAll:
      vi.fn(async () => [
        ...values,
      ]),
    findById:
      vi.fn(async (id: string) =>
        values.find(
          (value) =>
            value.id === id,
        ),
      ),
  }
}

function createConsultant():
  Consultant {
  return {
    id: "consultant-1",
    name: "Rafael",
    email: "rafael@example.com",
    phone: "11999999999",
    document: "12345678901",
    role: "consultant",
    team: "Comercial",
    region: "Sudeste",
    status: "active",
    monthlySalesTarget: 10,
    monthlyLeadsTarget: 30,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createLead(): Lead {
  return {
    id: "lead-1",
    name: "Lead real",
    email: "lead@example.com",
    phone: "11988888888",
    source: "website",
    status: "qualified",
    consortiumType:
      "real_estate",
    desiredCreditValue: 500000,
    desiredTermMonths: 180,
    consultantId:
      "consultant-1",
    pipelineStageId:
      "pipeline-1",
    score: 80,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createClient(): Client {
  return {
    id: "client-1",
    type: "individual",
    name: "Cliente real",
    email:
      "cliente@example.com",
    phone: "11977777777",
    document: "98765432100",
    address: {
      street: "Rua A",
      number: "10",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01001000",
    },
    consultantId:
      "consultant-1",
    status: "active",
    tags: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createPhase(): JourneyPhase {
  return {
    id: "phase-1",
    workspaceId:
      "workspace-1",
    code: "negotiation",
    name: "Negociação",
    order: 1,
    isActive: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createState(): JourneyState {
  return {
    id: "state-1",
    workspaceId:
      "workspace-1",
    phaseId: "phase-1",
    code: "proposal",
    name: "Proposta enviada",
    order: 1,
    isInitial: false,
    isFinal: false,
    isWon: false,
    isLost: false,
    allowReopen: false,
    isActive: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createPipelineStage(
  overrides:
    Partial<PipelineStage> = {},
): PipelineStage {
  return {
    id: "pipeline-1",
    name: "Em atendimento",
    order: 1,
    type: "lead",
    color: "#000000",
    winProbability: 10,
    isClosedStage: false,
    isWonStage: false,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  }
}

function createJourney(
  overrides:
    Partial<CommercialJourney> = {},
): CommercialJourney {
  return {
    id: "journey-client",
    workspaceId:
      "workspace-1",
    leadId: null,
    clientId: "client-1",
    consultantId:
      "consultant-1",
    title:
      "Oportunidade do cliente",
    consortiumType:
      "real_estate",
    currentPhaseId:
      "phase-1",
    currentStateId:
      "state-1",
    priority: "HIGH",
    score: 90,
    outcome: null,
    stateEnteredAt:
      TIMESTAMP,
    lastInteractionAt:
      null,
    closedAt: null,
    version: 1,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  }
}



function createRecommendation(
  overrides:
    Partial<NextBestAction> = {},
): NextBestAction {
  return {
    id: "recommendation-1",
    workspaceId:
      "workspace-1",
    journeyId:
      "journey-reactivation",
    actionType:
      "SEND_MESSAGE",
    title:
      "Retomar contato",
    description:
      "Entre em contato e registre o resultado.",
    reason:
      "Lead reativado aguardando retomada.",
    confidence: 0.92,
    priority: "HIGH",
    source:
      "RULE_ENGINE",
    expiresAt: null,
    acceptedAt: null,
    rejectedAt: null,
    executedActionId: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  }
}

function createConversationMemory(
  overrides:
    Partial<CommercialConversationMemory> = {},
): CommercialConversationMemory {
  return {
    id: "memory-1",
    workspaceId:
      "workspace-1",
    journeyId:
      "journey-reactivation",
    stage: "follow_up",
    goal:
      "confirm_follow_up",
    lastIntent:
      "retomar conversa",
    lastIncomingMessage:
      "Cliente: Ainda tenho interesse.\nConsultor: Vou revisar e te retorno.",
    lastSuggestedReply:
      "Oi, Sarah. Revisei nosso histórico e queria retomar do ponto combinado.",
    analyzedAt:
      TIMESTAMP,
    createdAt:
      TIMESTAMP,
    updatedAt:
      TIMESTAMP,
    ...overrides,
  }
}

function createCrmRepositories({
  consultants = [
    createConsultant(),
  ],
  leads = [createLead()],
  clients = [createClient()],
  pipelineStages = [],
  tasks = [],
}: {
  consultants?: Consultant[]
  leads?: Lead[]
  clients?: Client[]
  pipelineStages?: PipelineStage[]
  tasks?: Task[]
} = {}): AsyncCrmRepositories {
  return {
    leads:
      createEntityRepository<Lead>(
        leads,
      ),
    clients:
      createEntityRepository<Client>(
        clients,
      ),
    consultants:
      createReadOnlyRepository<Consultant>(
        consultants,
      ),
    pipelineStages:
      createReadOnlyRepository<PipelineStage>(
        pipelineStages,
      ),
    meetings:
      createEntityRepository<Meeting>(),
    consortiums:
      createReadOnlyRepository<Consortium>(),
    proposals:
      createEntityRepository<Proposal>(),
    sales:
      createEntityRepository<Sale>(),
    tasks:
      createEntityRepository<Task>(
        tasks,
      ),
  }
}

describe(
  "getAsyncDashboardData opportunities",
  () => {
    it(
      "integra ListOpportunitiesAsync e cria view models sem N+1",
      async () => {
        const journeys = [
          createJourney({
            id: "journey-lead",
            leadId: "lead-1",
            clientId: null,
            title:
              "Oportunidade do lead",
            updatedAt:
              "2026-07-27T18:00:00.000Z",
          }),
          createJourney(),
          createJourney({
            id: "journey-foreign",
            workspaceId:
              "workspace-2",
          }),
        ]
        const snapshots =
          structuredClone(journeys)
        const commercialRepository =
          createMockAsyncCommercialRepositories({
            journeys,
            phases: [createPhase()],
            states: [createState()],
          })
        const crmRepository =
          createCrmRepositories()
        const journeyFindById =
          vi.spyOn(
            commercialRepository
              .journeys,
            "findById",
          )
        const leadFindAll =
          vi.spyOn(
            crmRepository.leads,
            "findAll",
          )
        const clientFindAll =
          vi.spyOn(
            crmRepository.clients,
            "findAll",
          )
        const consultantFindAll =
          vi.spyOn(
            crmRepository
              .consultants,
            "findAll",
          )
        const phaseFindAll =
          vi.spyOn(
            commercialRepository
              .phases,
            "findAll",
          )
        const stateFindAll =
          vi.spyOn(
            commercialRepository
              .states,
            "findAll",
          )
        const leadFindById =
          vi.spyOn(
            crmRepository.leads,
            "findById",
          )
        const clientFindById =
          vi.spyOn(
            crmRepository.clients,
            "findById",
          )
        const consultantFindById =
          vi.spyOn(
            crmRepository
              .consultants,
            "findById",
          )
        const phaseFindById =
          vi.spyOn(
            commercialRepository
              .phases,
            "findById",
          )
        const stateFindById =
          vi.spyOn(
            commercialRepository
              .states,
            "findById",
          )
        const createJourneyMethod =
          vi.spyOn(
            commercialRepository
              .journeys,
            "create",
          )
        const updateJourney =
          vi.spyOn(
            commercialRepository
              .journeys,
            "update",
          )
        const deleteJourney =
          vi.spyOn(
            commercialRepository
              .journeys,
            "delete",
          )

        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                " workspace-1 ",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository,
              crmRepository,
            },
          )

        expect(
          result.opportunities,
        ).toEqual([
          {
            id: "journey-lead",
            title:
              "Oportunidade do lead",
            origin: "lead",
            originName: "Lead real",
            consultantName:
              "Rafael",
            priority: "HIGH",
            score: 90,
            phaseName: "Negociação",
            stateName:
              "Proposta enviada",
            consortiumType:
              "real_estate",
            lastInteractionAt:
              null,
            updatedAt:
              "2026-07-27T18:00:00.000Z",
            status: "open",
            outcome: null,
          },
          expect.objectContaining({
            id: "journey-client",
            origin: "client",
            originName:
              "Cliente real",
            status: "open",
            outcome: null,
          }),
        ])
        expect(
          journeys,
        ).toEqual(snapshots)
        expect(
          journeyFindById,
        ).not.toHaveBeenCalled()
        expect(
          leadFindById,
        ).not.toHaveBeenCalled()
        expect(
          clientFindById,
        ).not.toHaveBeenCalled()
        expect(
          consultantFindById,
        ).not.toHaveBeenCalled()
        expect(
          phaseFindById,
        ).not.toHaveBeenCalled()
        expect(
          stateFindById,
        ).not.toHaveBeenCalled()
        expect(
          createJourneyMethod,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
        expect(
          deleteJourney,
        ).not.toHaveBeenCalled()
        expect(
          leadFindAll,
        ).toHaveBeenCalledTimes(1)
        expect(
          clientFindAll,
        ).toHaveBeenCalledTimes(1)
        expect(
          consultantFindAll,
        ).toHaveBeenCalledTimes(1)
        expect(
          phaseFindAll,
        ).toHaveBeenCalledTimes(1)
        expect(
          stateFindAll,
        ).toHaveBeenCalledTimes(1)
      },
    )

    it.each([
      "lead",
      "client",
      "consultant",
      "phase",
      "state",
    ] as const)(
      "aplica somente o fallback de $missing ausente",
      async (missing) => {
        const consultantId =
          missing === "consultant"
            ? "consultant-missing"
            : "consultant-1"
        const journey =
          createJourney({
            leadId:
              missing === "lead"
                ? "lead-missing"
                : null,
            clientId:
              missing === "lead"
                ? null
                : (
                    missing ===
                    "client"
                      ? "client-missing"
                      : "client-1"
                  ),
            consultantId,
            currentPhaseId:
              missing === "phase"
                ? "phase-missing"
                : "phase-1",
            currentStateId:
              missing === "state"
                ? "state-missing"
                : "state-1",
          })
        const commercialRepository =
          createMockAsyncCommercialRepositories({
            journeys: [journey],
            phases:
              missing === "phase"
                ? []
                : [createPhase()],
            states:
              missing === "state"
                ? []
                : [createState()],
          })
        const crmRepository =
          createCrmRepositories({
            consultants:
              missing ===
              "consultant"
                ? []
                : [
                    createConsultant(),
                  ],
            leads:
              missing === "lead"
                ? []
                : [createLead()],
            clients:
              missing === "client"
                ? []
                : [createClient()],
          })

        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              consultantId,
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository,
              crmRepository,
            },
          )

        expect(
          result.opportunities,
        ).toEqual([
          expect.objectContaining({
            origin:
              missing === "lead"
                ? "lead"
                : "client",
            originName:
              missing === "lead"
                ? "Lead não identificado"
                : (
                    missing ===
                    "client"
                      ? "Cliente não identificado"
                      : "Cliente real"
                  ),
            consultantName:
              missing === "consultant"
                ? "Consultor não identificado"
                : "Rafael",
            phaseName:
              missing === "phase"
                ? "Fase indisponível"
                : "Negociação",
            stateName:
              missing === "state"
                ? "Estado indisponível"
                : "Proposta enviada",
          }),
        ])
      },
    )

    it(
      "preserva outcome e calcula a matriz completa de status",
      async () => {
        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository:
                createMockAsyncCommercialRepositories({
                  journeys: [
                    createJourney({
                      id: "open",
                      updatedAt:
                        "2026-07-29T18:00:00.000Z",
                    }),
                    createJourney({
                      id: "closed-at",
                      closedAt:
                        "2026-07-26T19:00:00.000Z",
                      updatedAt:
                        "2026-07-28T18:00:00.000Z",
                    }),
                    createJourney({
                      id:
                        "outcome-only",
                      outcome:
                        "NO_RESPONSE",
                      updatedAt:
                        "2026-07-27T18:00:00.000Z",
                    }),
                    createJourney({
                      id: "both",
                      closedAt:
                        "2026-07-26T19:00:00.000Z",
                      outcome: "WON",
                      updatedAt:
                        "2026-07-26T18:00:00.000Z",
                    }),
                  ],
                }),
              crmRepository:
                createCrmRepositories(),
            },
          )

        expect(
          result.opportunities?.map(
            ({
              id,
              status,
              outcome,
            }) => ({
              id,
              status,
              outcome,
            }),
          ),
        ).toEqual([
          {
            id: "open",
            status: "open",
            outcome: null,
          },
          {
            id: "closed-at",
            status: "closed",
            outcome: null,
          },
          {
            id: "outcome-only",
            status: "closed",
            outcome:
              "NO_RESPONSE",
          },
          {
            id: "both",
            status: "closed",
            outcome: "WON",
          },
        ])
      },
    )

    it(
      "aplica fallbacks para relacionamentos ausentes",
      async () => {
        const fallbackJourney =
          createJourney({
            id: "journey-fallback",
            leadId: null,
            clientId:
              "client-missing",
            consultantId:
              "consultant-missing",
            currentPhaseId:
              "phase-missing",
            currentStateId:
              "state-missing",
            title:
              "Oportunidade incompleta",
            closedAt:
              "2026-07-26T19:00:00.000Z",
          })
        const missingLeadJourney =
          createJourney({
            id:
              "journey-lead-missing",
            leadId: "lead-missing",
            clientId: null,
            consultantId:
              "consultant-missing",
            title:
              "Lead incompleto",
            updatedAt:
              "2026-07-27T18:00:00.000Z",
          })

        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-missing",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository:
                createMockAsyncCommercialRepositories({
                  journeys: [
                    missingLeadJourney,
                    fallbackJourney,
                  ],
                }),
              crmRepository:
                createCrmRepositories({
                  consultants: [],
                  leads: [],
                  clients: [],
                }),
            },
          )

        expect(
          result.opportunities,
        ).toEqual([
          expect.objectContaining({
            id:
              "journey-lead-missing",
            originName:
              "Lead não identificado",
          }),
          expect.objectContaining({
            id:
              "journey-fallback",
            originName:
              "Cliente não identificado",
            consultantName:
              "Consultor não identificado",
            phaseName:
              "Fase indisponível",
            stateName:
              "Estado indisponível",
            status: "closed",
          }),
        ])
      },
    )

    it(
      "retorna lista vazia",
      async () => {
        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository:
                createMockAsyncCommercialRepositories(),
              crmRepository:
                createCrmRepositories(),
            },
          )

        expect(
          result.opportunities,
        ).toEqual([])
      },
    )

    it(
      "rejeita workspace vazio antes de consultar repositories",
      async () => {
        const commercialRepository =
          createMockAsyncCommercialRepositories()
        const crmRepository =
          createCrmRepositories()
        const findConsultants =
          vi.spyOn(
            crmRepository
              .consultants,
            "findAll",
          )

        await expect(
          getAsyncDashboardData(
            {
              workspaceId: " ",
            },
            {
              commercialRepository,
              crmRepository,
            },
          ),
        ).rejects.toThrow(
          "O workspace é obrigatório para carregar o Mission Control.",
        )

        expect(
          findConsultants,
        ).not.toHaveBeenCalled()
      },
    )



    it(
      "mantém a ação aceita do R2 visível até a conclusão",
      async () => {
        const commercialRepository =
          createMockAsyncCommercialRepositories({
            journeys: [
              createJourney({
                id:
                  "journey-pending-action",
                title:
                  "Teste funcional R2",
              }),
            ],
            phases: [
              createPhase(),
            ],
            states: [
              createState(),
            ],
          })

        const pendingAction:
          CommercialAction = {
            id:
              "action-pending-1",
            workspaceId:
              "workspace-1",
            journeyId:
              "journey-pending-action",
            type:
              "SEND_MESSAGE",
            status:
              "PENDING",
            origin:
              "NEXT_BEST_ACTION",
            actorType:
              "CONSULTANT",
            actorId:
              "consultant-1",
            title:
              "Retomar contato com Rosecleia",
            description:
              "Entre em contato e registre o resultado.",
            payload: {},
            scheduledFor:
              TIMESTAMP,
            startedAt: null,
            completedAt: null,
            failedAt: null,
            failureReason: null,
            createdBy:
              "consultant-1",
            createdAt:
              TIMESTAMP,
            updatedAt:
              TIMESTAMP,
          }

        commercialRepository
          .actions
          .findOpen =
          vi.fn(async () => [
            pendingAction,
          ])

        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-1",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository,
              crmRepository:
                createCrmRepositories(),
            },
          )

        expect(
          result.gorilaR2,
        ).toMatchObject({
          recommendation:
            "Retomar contato com Rosecleia",
          pendingAction: {
            actionId:
              "action-pending-1",
            journeyId:
              "journey-pending-action",
            journeyTitle:
              "Teste funcional R2",
            status:
              "PENDING",
          },
          actionContext: {
            actionId:
              "action-pending-1",
            opportunityId:
              "journey-pending-action",
            personName:
              "Cliente real",
            contextLabel:
              "Negociação · Proposta enviada",
            actionTitle:
              "Retomar contato com Rosecleia",
            actionReason:
              "Você aceitou esta ação para Teste funcional R2. O R2 vai mantê-la em foco até a conclusão.",
            r2Recommendation:
              "Retomar contato com Rosecleia",
            href:
              "/opportunities/journey-pending-action",
          },
        })

        expect(
          result.gorilaR2
            ?.pilotAction,
        ).toBeUndefined()
      },
    )

    it(
      "propaga erro de enriquecimento por identidade sem escrever",
      async () => {
        const commercialRepository =
          createMockAsyncCommercialRepositories({
            journeys: [
              createJourney(),
            ],
          })
        const repositoryError =
          new Error(
            "repository failure",
          )
        commercialRepository.phases
          .findAll =
          vi.fn(async () => {
            throw repositoryError
          })
        const createJourneySpy =
          vi.spyOn(
            commercialRepository
              .journeys,
            "create",
          )
        const updateJourneySpy =
          vi.spyOn(
            commercialRepository
              .journeys,
            "update",
          )

        await expect(
          getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository,
              crmRepository:
                createCrmRepositories(),
            },
          ),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          createJourneySpy,
        ).not.toHaveBeenCalled()
        expect(
          updateJourneySpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "informa ao R2 o próximo retorno futuro vinculado ao lead",
      async () => {
        const futureFollowUp:
          Task = {
          id: "task-follow-up-1",
          title:
            "Retornar contato com Lead real",
          type: "follow_up",
          status: "pending",
          priority: "medium",
          dueAt:
            "2026-07-27T16:10:00.000Z",
          assignedToId:
            "consultant-1",
          leadId: "lead-1",
          createdAt: TIMESTAMP,
          updatedAt: TIMESTAMP,
        }

        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-1",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository:
                createMockAsyncCommercialRepositories({
                  phases: [
                    createPhase(),
                  ],
                  states: [
                    createState(),
                  ],
                }),
              crmRepository:
                createCrmRepositories({
                  tasks: [
                    futureFollowUp,
                  ],
                }),
            },
          )

        expect(
          result.intelligence
            ?.scheduledFollowUp,
        ).toEqual({
          taskId:
            "task-follow-up-1",
          title:
            "Retornar contato com Lead real",
          contactName:
            "Lead real",
          dueAt:
            "2026-07-27T16:10:00.000Z",
          dateLabel: "amanhã",
          time: "13:10",
        })

        expect(
          result.gorilaR2,
        ).toMatchObject({
          greeting:
            "Retorno agendado. O R2 está acompanhando o horário.",
          analysis:
            "Próximo contato com Lead real marcado para amanhã às 13:10.",
          recommendation:
            "Retornar contato com Lead real",
        })
      },
    )

    it(
      "exige contexto antes da reativação e libera a retomada depois da memória analisada",
      async () => {
        const reactivationStage =
          createPipelineStage({
            id:
              "pipeline-reactivation",
            name:
              "Reativação Data Crazy",
          })

        const reactivatedLead = {
          ...createLead(),
          id: "lead-reactivation",
          name: "Sarah",
          approachType:
            "reactivation" as const,
          pipelineStageId:
            reactivationStage.id,
        }

        const journey =
          createJourney({
            id:
              "journey-reactivation",
            leadId:
              reactivatedLead.id,
            clientId: null,
          })

        const commercialRepository =
          createMockAsyncCommercialRepositories({
            journeys: [journey],
            nextBestActions: [
              createRecommendation(),
            ],
            phases: [
              createPhase(),
            ],
            states: [
              createState(),
            ],
          })

        const findConversationMemory =
          vi.fn<
            (
              journeyId: string,
            ) => Promise<
              CommercialConversationMemory |
              undefined
            >
          >()
            .mockResolvedValueOnce(
              undefined,
            )
            .mockResolvedValueOnce(
              createConversationMemory(),
            )

        commercialRepository
          .conversationMemories = {
            findByJourneyId:
              findConversationMemory,
          }

        const input = {
          workspaceId:
            "workspace-1",
          consultantId:
            "consultant-1",
          now:
            new Date(TIMESTAMP),
        }

        const dependencies = {
          commercialRepository,
          crmRepository:
            createCrmRepositories({
              leads: [
                reactivatedLead,
              ],
              pipelineStages: [
                reactivationStage,
              ],
            }),
        }

        const withoutContext =
          await getAsyncDashboardData(
            input,
            dependencies,
          )

        expect(
          withoutContext.gorilaR2,
        ).toMatchObject({
          recommendation:
            "Informar contexto recente de Sarah",
          pilotAction: {
            requiresConversationContext:
              true,
          },
        })

        const withContext =
          await getAsyncDashboardData(
            input,
            dependencies,
          )

        expect(
          withContext.gorilaR2,
        ).toMatchObject({
          recommendation:
            "Revisar retomada com Sarah",
          pilotAction: {
            requiresConversationContext:
              false,
          },
        })

        expect(
          findConversationMemory,
        ).toHaveBeenNthCalledWith(
          1,
          "journey-reactivation",
        )
        expect(
          findConversationMemory,
        ).toHaveBeenNthCalledWith(
          2,
          "journey-reactivation",
        )
      },
    )

    it(
      "separa leads reativados da captação nova e apresenta o cargo operacional real",
      async () => {
        const reactivationStage =
          createPipelineStage({
            id: "pipeline-reactivation",
            name:
              "Reativação Data Crazy",
          })
        const reactivatedLead =
          createLead()

        reactivatedLead.pipelineStageId =
          reactivationStage.id
        reactivatedLead.createdAt =
          TIMESTAMP
        reactivatedLead.lastContactAt =
          "2026-07-20T12:00:00.000Z"

        const result =
          await getAsyncDashboardData(
            {
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-1",
              now:
                new Date(TIMESTAMP),
            },
            {
              commercialRepository:
                createMockAsyncCommercialRepositories({
                  journeys: [
                    createJourney({
                      id:
                        "journey-reactivation",
                      leadId:
                        reactivatedLead.id,
                      clientId: null,
                      consultantId:
                        "consultant-1",
                    }),
                  ],
                  phases: [
                    createPhase(),
                  ],
                  states: [
                    createState(),
                  ],
                }),
              crmRepository:
                createCrmRepositories({
                  leads: [
                    reactivatedLead,
                  ],
                  pipelineStages: [
                    reactivationStage,
                  ],
                }),
            },
          )

        expect(
          result.user.positionTitle,
        ).toBe("Consultor Sênior")
        expect(
          result.metrics.newLeads,
        ).toBe(0)
        expect(
          result.intelligence
            ?.reactivatedLeads,
        ).toBe(1)
        expect(
          result.intelligence
            ?.staleOpportunities,
        ).toBe(0)
      },
    )

  },
)
