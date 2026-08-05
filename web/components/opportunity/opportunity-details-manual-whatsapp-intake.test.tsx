// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
} from "vitest"

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
    sourceLabel: "Data Crazy Â· Inbound",
    importedAt: "2026-08-04T04:41:14.000Z",
    objective: "Comprar imÃ³vel",
    currentSituation: "pesquisando opÃ§Ãµes",
    originalInformation: null,
  },
  briefing: {
    summary: "Janaina Rodrigues Ã© um lead reativado de Data Crazy Â· Inbound, com objetivo registrado de comprar imÃ³vel.",
    attentionPoint: "SituaÃ§Ã£o atual registrada: pesquisando opÃ§Ãµes.",
    conversationFocus: "Entender prioridade, prazo e seguranÃ§a necessÃ¡rios para avanÃ§ar em comprar imÃ³vel.",
    recommendedNextStep: "Comece por: O que mudou no seu planejamento desde o Ãºltimo atendimento?",
  },
  suggestedMessage: "OlÃ¡, Janaina! Tudo bem?",
  suggestedQuestions: [
    {
      kind: "situation",
      label: "SituaÃ§Ã£o",
      question: "O que mudou no seu planejamento desde o Ãºltimo atendimento?",
    },
    {
      kind: "problem",
      label: "Problema",
      question: "Qual Ã© hoje o principal obstÃ¡culo para avanÃ§ar?",
    },
    {
      kind: "implication",
      label: "ImplicaÃ§Ã£o",
      question: "Qual impacto esse adiamento teria para vocÃª?",
    },
    {
      kind: "need_payoff",
      label: "PrÃ³ximo passo",
      question: "O que precisa acontecer para vocÃª avanÃ§ar com seguranÃ§a?",
    },
  ],
  consultantId: "consultant-1",
  consultantName: "Rafael",
  priority: "HIGH",
  score: 87,
  consortiumType: "real_estate",
  phaseId: "phase-1",
  phaseName: "NegociaÃ§Ã£o",
  stateId: "state-1",
  stateName: "Contato inicial",
  outcome: null,
  status: "open",
  stateEnteredAt: "2026-08-04T04:41:14.000Z",
  lastInteractionAt: null,
  closedAt: null,
  version: 1,
  createdAt: "2026-08-04T04:41:14.000Z",
  updatedAt: "2026-08-04T04:41:14.000Z",
  timeline: [],
  origin: "lead",
  leadId: "lead-1",
  clientId: null,
}

describe(
  "OpportunityDetails Manual WhatsApp Intake",
  () => {
    it(
      "renderiza modo assistido depois das perguntas e sem envio automÃ¡tico",
      () => {
        render(
          <OpportunityDetails
            opportunity={opportunity}
          />,
        )

        const questions = screen.getByTestId(
          "opportunity-suggested-questions",
        )
        const intake = screen.getByTestId(
          "opportunity-manual-whatsapp-intake",
        )

        expect(intake).toBeInTheDocument()
        expect(
          screen.getByRole("region", {
            name: "Analisar mensagem recebida",
          }),
        ).toBeInTheDocument()
        expect(
          questions.compareDocumentPosition(intake) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(
          screen.queryByRole("button", {
            name: /enviar/i,
          }),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "preserva o detalhe somente leitura quando nÃ£o hÃ¡ contexto de contato",
      () => {
        render(
          <OpportunityDetails
            opportunity={{
              ...opportunity,
              contactContext: null,
              briefing: null,
              suggestedMessage: null,
              suggestedQuestions: null,
            }}
          />,
        )

        expect(
          screen.queryByTestId(
            "opportunity-manual-whatsapp-intake",
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Analisar mensagem",
            },
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.getByRole("link", {
            name: "Editar oportunidade",
          }),
        ).toBeInTheDocument()
      },
    )
  },
)
