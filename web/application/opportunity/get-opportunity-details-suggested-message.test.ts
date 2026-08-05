import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  Client,
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
  "2026-08-04T04:41:14.000Z"

function buildDependencies(): GetOpportunityDetailsAsyncDependencies {
  const journey: CommercialJourney = {
    id: "journey-1",
    workspaceId: "workspace-1",
    leadId: "lead-1",
    clientId: null,
    consultantId: "consultant-1",
    title:
      "Reativação - Janaina Rodrigues",
    consortiumType:
      "real_estate",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "HIGH",
    score: 87,
    outcome: null,
    stateEnteredAt: TIMESTAMP,
    lastInteractionAt: null,
    closedAt: null,
    version: 1,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }

  const lead: Lead = {
    id:
      "dc_reactivation_janaina",
    consultantId:
      "consultant-1",
    name:
      "Janaina Rodrigues",
    email:
      "janaina@example.com",
    phone:
      "5541999999999",
    source:
      "other",
    status:
      "new",
    approachType:
      "reactivation",
    consortiumType:
      "real_estate",
    desiredCreditValue:
      500000,
    desiredTermMonths:
      180,
    pipelineStageId:
      "pipeline-1",
    score:
      50,
    notes: [
      "Objetivo: Comprar imóvel",
      "Situação atual: pesquisando opções",
    ].join("\n"),
    createdAt:
      TIMESTAMP,
    updatedAt:
      TIMESTAMP,
  }

  const client =
    null as Client | null

  const consultant: Consultant = {
    id:
      "consultant-1",
    name:
      "Rafael Barcelos",
    email:
      "rafael@example.com",
    phone:
      "11999999999",
    document:
      "12345678901",
    role:
      "consultant",
    team:
      "Equipe A",
    region:
      "Curitiba",
    status:
      "active",
    monthlySalesTarget:
      1000000,
    monthlyLeadsTarget:
      50,
    createdAt:
      TIMESTAMP,
    updatedAt:
      TIMESTAMP,
  }

  const phase: JourneyPhase = {
    id:
      "phase-1",
    workspaceId:
      "workspace-1",
    code:
      "NEGOTIATION",
    name:
      "Negociação",
    order:
      2,
    isActive:
      true,
    createdAt:
      TIMESTAMP,
    updatedAt:
      TIMESTAMP,
  }

  const state: JourneyState = {
    id:
      "state-1",
    workspaceId:
      "workspace-1",
    phaseId:
      "phase-1",
    code:
      "CONTACT",
    name:
      "Contato inicial",
    order:
      1,
    isInitial:
      false,
    isFinal:
      false,
    isWon:
      false,
    isLost:
      false,
    allowReopen:
      false,
    isActive:
      true,
    createdAt:
      TIMESTAMP,
    updatedAt:
      TIMESTAMP,
  }

  return {
    journeys: {
      findById:
        vi.fn(async () => journey),
    },
    events: {
      findByJourneyId:
        vi.fn(async () => []),
    },
    leads: {
      findById:
        vi.fn(async () => lead),
    },
    clients: {
      findById:
        vi.fn(async () => client),
    },
    consultants: {
      findById:
        vi.fn(async () => consultant),
    },
    phases: {
      findById:
        vi.fn(async () => phase),
    },
    states: {
      findById:
        vi.fn(async () => state),
    },
  } as unknown as GetOpportunityDetailsAsyncDependencies
}

describe(
  "GetOpportunityDetailsAsync Suggested Message",
  () => {
    it(
      "entrega a nova mensagem humana de reativação",
      async () => {
        const result =
          await new GetOpportunityDetailsAsync(
            buildDependencies(),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        expect(
          result.opportunity
            .suggestedMessage,
        ).toBe(
          "Olá, Janaina! Tudo bem? Aqui é o Rafael. Passei pelo seu cadastro hoje e lembrei da nossa conversa sobre comprar imóvel. Fiquei curioso para saber como esse projeto evoluiu. Você conseguiu avançar ou ainda está estudando as possibilidades?",
        )
      },
    )
  },
)