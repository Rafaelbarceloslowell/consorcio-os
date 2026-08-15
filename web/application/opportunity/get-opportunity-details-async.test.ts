import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  Client,
  CommercialConversationMemory,
  CommercialJourney,
  Consultant,
  JourneyPhase,
  JourneyState,
  Lead,
} from "@/types/domain"

import {
  GetOpportunityDetailsAsync,
} from "./get-opportunity-details-async"

import type {
  GetOpportunityDetailsAsyncDependencies,
} from "./get-opportunity-details-async"

const TIMESTAMP =
  "2026-07-27T12:00:00.000Z"

function createJourney(
  values: {
    id?: string
    workspaceId?: string
    leadId?: string | null
    clientId?: string | null
    outcome?:
      CommercialJourney["outcome"]
    closedAt?: string | null
    lastInteractionAt?: string | null
  } = {},
): CommercialJourney {
  return {
    id: values.id ?? "journey-1",
    workspaceId:
      values.workspaceId ??
      "workspace-1",
    leadId:
      values.leadId ?? null,
    clientId:
      values.clientId ===
        undefined
        ? "client-1"
        : values.clientId,
    consultantId:
      "consultant-1",
    title: "Oportunidade",
    consortiumType:
      "real_estate",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "HIGH",
    score: 87,
    outcome:
      values.outcome ?? null,
    stateEnteredAt: TIMESTAMP,
    lastInteractionAt:
      values.lastInteractionAt ===
        undefined
        ? "2026-07-27T13:00:00.000Z"
        : values.lastInteractionAt,
    closedAt:
      values.closedAt ?? null,
    version: 3,
    createdAt:
      "2026-07-26T12:00:00.000Z",
    updatedAt:
      "2026-07-27T14:00:00.000Z",
  }
}

function createLead(): Lead {
  return {
    id: "lead-1",
    consultantId:
      "consultant-1",
    name: "Lead real",
    email: "lead@example.com",
    phone: "11999999999",
    source: "referral",
    status: "new",
    consortiumType:
      "real_estate",
    desiredCreditValue: 500000,
    desiredTermMonths: 180,
    pipelineStageId:
      "pipeline-1",
    score: 50,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createClient(): Client {
  return {
    id: "client-1",
    consultantId:
      "consultant-1",
    type: "individual",
    name: "Cliente real",
    document: "12345678901",
    email: "cliente@example.com",
    phone: "11999999999",
    address: {
      street: "Rua A",
      number: "10",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01001000",
    },
    status: "active",
    tags: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
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
    team: "Equipe A",
    region: "São Paulo",
    status: "active",
    monthlySalesTarget:
      1000000,
    monthlyLeadsTarget: 50,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createPhase(): JourneyPhase {
  return {
    id: "phase-1",
    workspaceId: "workspace-1",
    code: "NEGOTIATION",
    name: "Negociação",
    order: 2,
    isActive: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function createState(): JourneyState {
  return {
    id: "state-1",
    workspaceId: "workspace-1",
    phaseId: "phase-1",
    code: "PROPOSAL",
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

function createDependencies({
  journey = createJourney(),
  lead = createLead(),
  client = createClient(),
  consultant = createConsultant(),
  phase = createPhase(),
  state = createState(),
  conversationMemory = null,
}: {
  journey?: CommercialJourney | null
  lead?: Lead | null
  client?: Client | null
  consultant?: Consultant | null
  phase?: JourneyPhase | null
  state?: JourneyState | null
  conversationMemory?:
    | CommercialConversationMemory
    | null
} = {}) {
  const entityRepository = <
    Entity,
  >(
    entity: Entity | undefined,
  ) => ({
    findAll: vi.fn(async () =>
      entity ? [entity] : [],
    ),
    findById:
      vi.fn(async () => entity),
    create:
      vi.fn(async (value: Entity) =>
        value,
      ),
    update:
      vi.fn(async (value: Entity) =>
        value,
      ),
    delete:
      vi.fn(async () => false),
  })

  const readOnlyRepository = <
    Entity,
  >(
    entity: Entity | undefined,
  ) => ({
    findAll: vi.fn(async () =>
      entity ? [entity] : [],
    ),
    findById:
      vi.fn(async () => entity),
  })

  const dependencies = {
    journeys: {
      ...entityRepository(
        journey ?? undefined,
      ),
      findByLeadId:
        vi.fn(async () => []),
      findByClientId:
        vi.fn(async () => []),
      findByConsultantId:
        vi.fn(async () => []),
    },
    events: {
      findByJourneyId:
        vi.fn(async () => []),
    },
    conversationMemories: {
      findByJourneyId:
        vi.fn(async () =>
          conversationMemory ??
          undefined,
        ),
    },
    leads:
      entityRepository(
        lead ?? undefined,
      ),
    clients:
      entityRepository(
        client ?? undefined,
      ),
    consultants:
      readOnlyRepository(
        consultant ?? undefined,
      ),
    phases:
      readOnlyRepository(
        phase ?? undefined,
      ),
    states:
      readOnlyRepository(
        state ?? undefined,
      ),
  } satisfies
    GetOpportunityDetailsAsyncDependencies

  return dependencies
}

describe(
  "GetOpportunityDetailsAsync",
  () => {
    it.each([
      {
        origin: "lead",
        journey: createJourney({
          leadId: "lead-1",
          clientId: null,
        }),
        originName: "Lead real",
      },
      {
        origin: "client",
        journey: createJourney(),
        originName: "Cliente real",
      },
    ] as const)(
      "monta detalhes para origem $origin",
      async ({
        origin,
        journey,
        originName,
      }) => {
        const dependencies =
          createDependencies({
            journey,
          })

        const result =
          await new GetOpportunityDetailsAsync(
            dependencies,
          ).execute({
            workspaceId:
              " workspace-1 ",
            opportunityId:
              " journey-1 ",
          })

        expect(
          result.opportunity,
        ).toMatchObject({
          id: "journey-1",
          workspaceId:
            "workspace-1",
          origin,
          originName,
          consultantName: "Rafael",
          phaseName: "Negociação",
          stateName:
            "Proposta enviada",
          outcome: null,
          status: "open",
        })
        expect(
          dependencies.journeys
            .findById,
        ).toHaveBeenCalledExactlyOnceWith(
          "journey-1",
        )
        expect(
          dependencies.consultants
            .findById,
        ).toHaveBeenCalledExactlyOnceWith(
          "consultant-1",
        )
        expect(
          dependencies.phases.findById,
        ).toHaveBeenCalledExactlyOnceWith(
          "phase-1",
        )
        expect(
          dependencies.states.findById,
        ).toHaveBeenCalledExactlyOnceWith(
          "state-1",
        )

        if (origin === "lead") {
          expect(
            dependencies.leads.findById,
          ).toHaveBeenCalledExactlyOnceWith(
            "lead-1",
          )
          expect(
            dependencies.clients
              .findById,
          ).not.toHaveBeenCalled()
        } else {
          expect(
            dependencies.clients
              .findById,
          ).toHaveBeenCalledExactlyOnceWith(
            "client-1",
          )
          expect(
            dependencies.leads.findById,
          ).not.toHaveBeenCalled()
        }
      },
    )

    it(
      "normaliza falso inbound histórico somente quando a provenance comprova contexto manual",
      async () => {
        const result =
          await new GetOpportunityDetailsAsync(
            createDependencies({
              conversationMemory: {
                id: "memory-1",
                workspaceId:
                  "workspace-1",
                journeyId: "journey-1",
                stage: "opening",
                goal:
                  "get_first_response",
                lastIntent:
                  "no_previous_response",
                lastIncomingMessage:
                  "Cliente nunca respondeu",
                lastSuggestedReply:
                  "Oi, tudo bem?",
                analyzedAt: TIMESTAMP,
                structuredFacts: {},
                factProvenance: {
                  lastIncomingMessage:
                    "manual_context",
                },
                observedAt: TIMESTAMP,
                createdAt: TIMESTAMP,
                updatedAt: TIMESTAMP,
              },
            }),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        expect(
          result.opportunity
            .conversationMemory,
        ).toMatchObject({
          lastIncomingMessage: null,
          customerHasReplied: false,
          responseStatus:
            "NEVER_RESPONDED",
          consultantContext:
            "Cliente nunca respondeu",
        })
      },
    )

    it.each([
      {
        name: "aberta",
        journey: createJourney(),
        status: "open",
        outcome: null,
      },
      {
        name: "fechada por data",
        journey: createJourney({
          closedAt:
            "2026-07-27T15:00:00.000Z",
        }),
        status: "closed",
        outcome: null,
      },
      {
        name: "fechada por outcome",
        journey: createJourney({
          outcome: "WON",
        }),
        status: "closed",
        outcome: "WON",
      },
      {
        name:
          "fechada por data e outcome",
        journey: createJourney({
          closedAt:
            "2026-07-27T15:00:00.000Z",
          outcome: "NO_RESPONSE",
        }),
        status: "closed",
        outcome: "NO_RESPONSE",
      },
    ] as const)(
      "calcula oportunidade $name",
      async ({
        journey,
        status,
        outcome,
      }) => {
        const result =
          await new GetOpportunityDetailsAsync(
            createDependencies({
              journey,
            }),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        expect(
          result.opportunity.status,
        ).toBe(status)
        expect(
          result.opportunity.outcome,
        ).toBe(outcome)
      },
    )

    it.each([
      {
        missing: "consultant",
        expected:
          "Consultor não identificado",
      },
      {
        missing: "phase",
        expected:
          "Fase indisponível",
      },
      {
        missing: "state",
        expected:
          "Estado indisponível",
      },
      {
        missing: "lead",
        expected:
          "Lead não identificado",
      },
      {
        missing: "client",
        expected:
          "Cliente não identificado",
      },
    ] as const)(
      "aplica fallback isolado para $missing ausente",
      async ({
        missing,
        expected,
      }) => {
        const journey =
          missing === "lead"
            ? createJourney({
                leadId: "lead-1",
                clientId: null,
              })
            : createJourney()
        const dependencies =
          createDependencies({
            journey,
            lead:
              missing === "lead"
                ? null
                : createLead(),
            client:
              missing === "client"
                ? null
                : createClient(),
            consultant:
              missing ===
              "consultant"
                ? null
                : createConsultant(),
            phase:
              missing === "phase"
                ? null
                : createPhase(),
            state:
              missing === "state"
                ? null
                : createState(),
          })

        const result =
          await new GetOpportunityDetailsAsync(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        expect(
          Object.values(
            result.opportunity,
          ),
        ).toContain(expected)
        expect(
          result.opportunity,
        ).toMatchObject({
          consultantName:
            missing === "consultant"
              ? expected
              : "Rafael",
          phaseName:
            missing === "phase"
              ? expected
              : "Negociação",
          stateName:
            missing === "state"
              ? expected
              : "Proposta enviada",
          originName:
            missing === "lead" ||
            missing === "client"
              ? expected
              : "Cliente real",
        })
      },
    )

    it(
      "preserva datas serializáveis sem mutar repositories",
      async () => {
        const journey =
          createJourney()
        const consultant =
          createConsultant()
        const phase = createPhase()
        const state = createState()
        const client = createClient()
        const snapshots =
          structuredClone({
            journey,
            consultant,
            phase,
            state,
            client,
          })

        const result =
          await new GetOpportunityDetailsAsync(
            createDependencies({
              journey,
              consultant,
              phase,
              state,
              client,
            }),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        expect({
          journey,
          consultant,
          phase,
          state,
          client,
        }).toEqual(snapshots)
        expect(
          result.opportunity.createdAt,
        ).toBe(
          "2026-07-26T12:00:00.000Z",
        )
        expect(
          result.opportunity.updatedAt,
        ).toBe(
          "2026-07-27T14:00:00.000Z",
        )
        expect(
          result.opportunity
            .stateEnteredAt,
        ).toBe(
          "2026-07-27T12:00:00.000Z",
        )
        expect(
          result.opportunity
            .lastInteractionAt,
        ).toBe(
          "2026-07-27T13:00:00.000Z",
        )
        expect(
          result.opportunity.closedAt,
        ).toBeNull()
        expect(() =>
          JSON.stringify(
            result.opportunity,
          ),
        ).not.toThrow()
        expect(
          JSON.parse(
            JSON.stringify(
              result.opportunity,
            ),
          ),
        ).toEqual(
          result.opportunity,
        )
      },
    )

    it(
      "preserva datas opcionais ausentes como null",
      async () => {
        const result =
          await new GetOpportunityDetailsAsync(
            createDependencies({
              journey: createJourney({
                lastInteractionAt:
                  null,
                closedAt: null,
              }),
            }),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        expect(
          result.opportunity
            .lastInteractionAt,
        ).toBeNull()
        expect(
          result.opportunity.closedAt,
        ).toBeNull()
      },
    )

    it(
      "trata oportunidade inexistente sem iniciar enriquecimento",
      async () => {
        const dependencies =
          createDependencies({
            journey: null,
          })

        await expect(
          new GetOpportunityDetailsAsync(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          }),
        ).rejects.toThrow(
          'Oportunidade comercial não encontrada para o ID "journey-1".',
        )

        expect(
          dependencies.leads.findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.clients.findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.consultants
            .findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.phases.findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.states.findById,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "trata outro workspace como inexistente antes do enriquecimento",
      async () => {
        const dependencies =
          createDependencies({
            journey: createJourney({
              workspaceId:
                "workspace-2",
            }),
          })

        await expect(
          new GetOpportunityDetailsAsync(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          }),
        ).rejects.toThrow(
          'Oportunidade comercial não encontrada para o ID "journey-1".',
        )

        expect(
          dependencies.consultants
            .findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.phases.findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.states.findById,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.clients.findById,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "propaga erro inesperado por identidade",
      async () => {
        const dependencies =
          createDependencies()
        const repositoryError =
          new Error("Falha de fase")

        dependencies.phases.findById =
          vi.fn(async () => {
            throw repositoryError
          })

        await expect(
          new GetOpportunityDetailsAsync(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          }),
        ).rejects.toBe(
          repositoryError,
        )
      },
    )
  },
)
