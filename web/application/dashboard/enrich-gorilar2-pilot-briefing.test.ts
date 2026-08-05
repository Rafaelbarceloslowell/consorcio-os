import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  OperationalNextBestAction,
} from "@/application/decision/get-next-best-actions"

import type {
  GorilaR2Briefing,
} from "@/types/dashboard"

import type {
  CommercialAction,
} from "@/types/domain"

import {
  enrichGorilaR2PilotBriefing,
} from "./enrich-gorilar2-pilot-briefing"

const baseBriefing: GorilaR2Briefing = {
  greeting: "Boa noite, Rafael",
  analysis: "O R2 analisou sua operaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.",
  recommendation: "Revise as prioridades.",
  reason: "Existem aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes abertas.",
  confidence: "medium",
  generatedAt: "2026-08-03T23:00:00.000Z",
}

function operationalAction(
  confidence = 0.92,
): OperationalNextBestAction {
  return {
    recommendation: {
      id: "recommendation-1",
      workspaceId: "workspace-1",
      journeyId: "journey-1",
      actionType: "SEND_MESSAGE",
      title: "Retomar contato com o cliente",
      description: "Enviar uma mensagem objetiva.",
      reason: "O cliente estÃƒÆ’Ã‚Â¡ hÃƒÆ’Ã‚Â¡ 48 horas sem retorno.",
      confidence,
      priority: "HIGH",
      source: "RULE_ENGINE",
      expiresAt: null,
      acceptedAt: null,
      rejectedAt: null,
      executedActionId: null,
      createdAt: "2026-08-03T22:00:00.000Z",
      updatedAt: "2026-08-03T22:00:00.000Z",
    },
    journeyId: "journey-1",
    journeyTitle: "ConsÃƒÆ’Ã‚Â³rcio imobiliÃƒÆ’Ã‚Â¡rio de Marina",
    leadId: "lead-1",
    clientId: null,
    contactName: "Marina",
    approachType: null,
  }
}

function pendingAction(): CommercialAction {
  return {
    id: "action-1",
    workspaceId: "workspace-1",
    journeyId: "journey-1",
    type: "SEND_MESSAGE",
    status: "PENDING",
    origin: "NEXT_BEST_ACTION",
    actorType: "CONSULTANT",
    actorId: "consultant-1",
    title: "Retomar contato com Rosecleia",
    description:
      "Entre em contato e registre o resultado.",
    payload: {},
    scheduledFor:
      "2026-08-04T00:34:35.923Z",
    startedAt: null,
    completedAt: null,
    failedAt: null,
    failureReason: null,
    createdBy: "consultant-1",
    createdAt:
      "2026-08-04T00:34:36.150Z",
    updatedAt:
      "2026-08-04T00:34:36.150Z",
  }
}


describe(
  "enrichGorilaR2PilotBriefing",
  () => {
    it(
      "conecta a principal recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o real ao briefing do R2",
      () => {
        const result =
          enrichGorilaR2PilotBriefing(
            baseBriefing,
            [operationalAction()],
          )

        expect(result).toMatchObject({
          recommendation:
            "Classificar atendimento de Marina",
          reason:
            "O cliente estÃƒÆ’Ã‚Â¡ hÃƒÆ’Ã‚Â¡ 48 horas sem retorno.",
          confidence: "high",
          nextAction: {
            title:
              "Classificar atendimento de Marina",
            priority: "high",
          },
          pilotAction: {
            recommendationId:
              "recommendation-1",
            journeyId: "journey-1",
            opportunityHref:
              "/opportunities/journey-1",
            actionType: "SEND_MESSAGE",
          },
        })
      },
    )

    it(
      "apresenta a fila de reativaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do Data Crazy sem mensagem genÃƒÆ’Ã‚Â©rica",
      () => {
        const action =
          operationalAction()

        action.recommendation.id =
          "dc_reactivation_nba_123"
        action.recommendation.title =
          "Retomar contato com Sarah"
        action.recommendation.description =
          "Entre em contato com Sarah e registre o resultado."
        action.recommendation.reason =
          "Lead reativado do Data Crazy Ãƒâ€šÃ‚Â· Inbound."
        action.journeyTitle =
          "ReativaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o - Sarah"
        action.contactName =
          "Sarah"
        action.approachType =
          "reactivation"

        const result =
          enrichGorilaR2PilotBriefing(
            baseBriefing,
            [action],
          )

        expect(result).toMatchObject({
          greeting:
            "Fila de reativa\u00e7\u00e3o pronta. O R2 selecionou o pr\u00f3ximo contato.",
          analysis:
            "Entre em contato com Sarah e registre o resultado.",
          recommendation:
            "Retomar contato com Sarah",
          reason:
            "Lead reativado do Data Crazy Ãƒâ€šÃ‚Â· Inbound.",
        })
      },
    )

    it(
      "mantÃƒÆ’Ã‚Â©m a aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o aceita em foco atÃƒÆ’Ã‚Â© a conclusÃƒÆ’Ã‚Â£o",
      () => {
        const result =
          enrichGorilaR2PilotBriefing(
            baseBriefing,
            [],
            {
              action:
                pendingAction(),
              journeyTitle:
                "Teste funcional R2",
            },
          )

        expect(result).toMatchObject({
          greeting:
            "A\u00e7\u00e3o em andamento. Vamos concluir o pr\u00f3ximo passo.",
          recommendation:
            "Retomar contato com Rosecleia",
          analysis:
            "Entre em contato e registre o resultado.",
          confidence: "high",
          nextAction: {
            title:
              "Retomar contato com Rosecleia",
            priority: "high",
          },
          pendingAction: {
            actionId:
              "action-1",
            journeyId:
              "journey-1",
            opportunityHref:
              "/opportunities/journey-1",
            status:
              "PENDING",
          },
        })

        expect(
          result.pilotAction,
        ).toBeUndefined()
      },
    )

    it(
      "prioriza a aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o jÃƒÆ’Ã‚Â¡ aceita sobre uma nova recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o",
      () => {
        const result =
          enrichGorilaR2PilotBriefing(
            baseBriefing,
            [operationalAction()],
            {
              action:
                pendingAction(),
              journeyTitle:
                "Teste funcional R2",
            },
          )

        expect(
          result.pendingAction?.actionId,
        ).toBe("action-1")
        expect(
          result.pilotAction,
        ).toBeUndefined()
      },
    )

    it(
      "preserva o briefing quando nÃƒÆ’Ã‚Â£o hÃƒÆ’Ã‚Â¡ recomendaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o aberta",
      () => {
        expect(
          enrichGorilaR2PilotBriefing(
            baseBriefing,
            [],
          ),
        ).toBe(baseBriefing)
      },
    )

    it.each([
      [0.8, "high"],
      [0.79, "medium"],
      [0.55, "medium"],
      [0.54, "low"],
    ] as const)(
      "mapeia confianÃƒÆ’Ã‚Â§a %s para %s",
      (confidence, expected) => {
        const result =
          enrichGorilaR2PilotBriefing(
            baseBriefing,
            [operationalAction(confidence)],
          )

        expect(result.confidence).toBe(expected)
      },
    )
  },
)
