// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

afterEach(() => vi.unstubAllGlobals())

import type {
  OpportunityDetailsView,
} from "@/types/opportunity-details"

import {
  OpportunityDetails,
} from "./opportunity-details"

const opportunity: OpportunityDetailsView = {
  id: "journey-1",
  workspaceId: "workspace-1",
  title: "Oportunidade real",
  originName: "Janaina Rodrigues",
  contactContext: {
    isReactivated: true,
    phone: "5541999999999",
    email: "janaina@example.com",
    sourceLabel:
      "Data Crazy · Inbound",
    importedAt:
      "2026-08-04T04:41:14.000Z",
    objective: "Comprar imóvel",
    currentSituation:
      "pesquisando opções",
    originalInformation: null,
  },
  suggestedMessage:
    "Olá, Janaina! Tudo bem?",
  consultantId: "consultant-1",
  consultantName: "Rafael",
  priority: "HIGH",
  score: 87,
  consortiumType: "real_estate",
  phaseId: "phase-1",
  phaseName: "Negociação",
  stateId: "state-1",
  stateName: "Contato inicial",
  outcome: null,
  status: "open",
  stateEnteredAt:
    "2026-08-04T04:41:14.000Z",
  lastInteractionAt: null,
  closedAt: null,
  version: 1,
  createdAt:
    "2026-08-04T04:41:14.000Z",
  updatedAt:
    "2026-08-04T04:41:14.000Z",
  timeline: [],
  origin: "lead",
  leadId: "lead-1",
  clientId: null,
}

describe(
  "OpportunityDetails Suggested Message",
  () => {
    it(
      "renderiza a mensagem depois do contexto aprovado",
      async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            mode: "MANUAL_MESSAGING_MODE",
            activity: {
              id: "activity-1",
              title: "Executar abordagem de reativacao",
              description: null,
              executionType: "REACTIVATION_CONTACT",
              channel: "WHATSAPP",
              dueAt: "2026-08-04T04:41:14.000Z",
              due: true,
              impactNumber: 1,
              cadenceInstanceId: "cycle-1",
              reason: "Contexto atual confirmado.",
            },
            commitments: [],
            reactivation: {
              contextRequired: false,
              canRecommendMessage: true,
            },
          }),
        }))

        render(
          <OpportunityDetails
            opportunity={opportunity}
          />,
        )

        expect(
          await screen.findByTestId(
            "opportunity-contact-context",
          ),
        ).toBeInTheDocument()
        expect(
          await screen.findByTestId(
            "opportunity-suggested-message",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("region", {
            name: "Mensagem sugerida pelo R2",
          }),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("textbox", {
            name: "Texto da mensagem",
          }),
        ).toHaveValue(
          "Olá, Janaina! Tudo bem?",
        )
      },
    )

    it(
      "oculta toda mensagem enquanto o gate de reativacao exige contexto",
      async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            mode: "MANUAL_MESSAGING_MODE",
            activity: {
              id: "gate-1",
              title: "Informar contexto atual da reativacao",
              description: null,
              executionType: "REACTIVATION_CONTEXT_REQUIRED",
              channel: "SYSTEM",
              dueAt: "2026-08-04T04:41:14.000Z",
              due: true,
              impactNumber: null,
              cadenceInstanceId: "cycle-2",
              reason: "Antes de reativar este contato, preciso saber onde a conversa parou.",
            },
            commitments: [],
            reactivation: {
              contextRequired: true,
              canRecommendMessage: false,
            },
          }),
        }))

        render(
          <OpportunityDetails
            opportunity={{
              ...opportunity,
              contactContext: {
                ...opportunity.contactContext!,
                approachType: "reactivation",
              },
            }}
          />,
        )

        expect(await screen.findByRole("button", { name: "Nunca respondeu" })).toBeInTheDocument()
        expect(screen.queryByTestId("opportunity-suggested-message")).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "Mensagem enviada" })).not.toBeInTheDocument()
      },
    )
  },
)
