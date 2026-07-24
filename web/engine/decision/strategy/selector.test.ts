import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CommercialJourney,
    NextBestAction,
  } from "@/types/domain"
  
  import {
    selectStrategyType,
  } from "./selector"
  
  const NOW =
    new Date("2026-07-21T15:00:00.000Z")
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id: "journey-1",
  
      workspaceId: "workspace-1",
  
      leadId: "lead-1",
  
      clientId: null,
  
      consultantId: "consultant-1",
  
      title: "Consórcio imobiliário",
  
      consortiumType: "real_estate",
  
      currentPhaseId: "phase-1",
  
      currentStateId: "state-1",
  
      priority: "NORMAL",
  
      score: 50,
  
      outcome: null,
  
      stateEnteredAt:
        "2026-07-20T15:00:00.000Z",
  
      lastInteractionAt:
        "2026-07-20T15:00:00.000Z",
  
      closedAt: null,
  
      version: 1,
  
      createdAt:
        "2026-07-01T15:00:00.000Z",
  
      updatedAt:
        "2026-07-20T15:00:00.000Z",
  
      ...overrides,
    }
  }
  
  function createRecommendation(
    actionType: NextBestAction["actionType"],
    overrides: Partial<NextBestAction> = {},
  ): NextBestAction {
    return {
      id: "recommendation-1",
  
      workspaceId: "workspace-1",
  
      journeyId: "journey-1",
  
      actionType,
  
      title: "Próxima ação comercial",
  
      description:
        "Descrição da próxima ação.",
  
      reason:
        "A oportunidade precisa avançar.",
  
      confidence: 0.85,
  
      priority: "HIGH",
  
      source: "RULE_ENGINE",
  
      expiresAt: null,
  
      acceptedAt: null,
  
      rejectedAt: null,
  
      executedActionId: null,
  
      createdAt:
        "2026-07-21T14:00:00.000Z",
  
      updatedAt:
        "2026-07-21T14:00:00.000Z",
  
      ...overrides,
    }
  }
  
  describe(
    "selectStrategyType",
    () => {
      it(
        "seleciona INITIAL_CONTACT para envio de mensagem com score baixo",
        () => {
          const journey =
            createJourney({
              score: 40,
            })
  
          const recommendations = [
            createRecommendation(
              "SEND_MESSAGE",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "INITIAL_CONTACT",
          )
        },
      )
  
      it(
        "seleciona MEETING_CONVERSION para envio de mensagem com score igual a 60",
        () => {
          const journey =
            createJourney({
              score: 60,
            })
  
          const recommendations = [
            createRecommendation(
              "SEND_MESSAGE",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "MEETING_CONVERSION",
          )
        },
      )
  
      it(
        "seleciona MEETING_CONVERSION para envio de mensagem com score acima de 60",
        () => {
          const journey =
            createJourney({
              score: 85,
            })
  
          const recommendations = [
            createRecommendation(
              "SEND_MESSAGE",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "MEETING_CONVERSION",
          )
        },
      )
  
      it(
        "seleciona QUALIFICATION quando existe recomendação CREATE_TASK",
        () => {
          const journey =
            createJourney()
  
          const recommendations = [
            createRecommendation(
              "CREATE_TASK",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "QUALIFICATION",
          )
        },
      )
  
      it(
        "seleciona NEGOTIATION quando existe recomendação CREATE_PROPOSAL",
        () => {
          const journey =
            createJourney()
  
          const recommendations = [
            createRecommendation(
              "CREATE_PROPOSAL",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "NEGOTIATION",
          )
        },
      )
  
      it(
        "seleciona CLOSING quando existe recomendação REQUEST_DOCUMENT",
        () => {
          const journey =
            createJourney()
  
          const recommendations = [
            createRecommendation(
              "REQUEST_DOCUMENT",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "CLOSING",
          )
        },
      )
  
      it(
        "prioriza CLOSING sobre NEGOTIATION",
        () => {
          const journey =
            createJourney()
  
          const recommendations = [
            createRecommendation(
              "CREATE_PROPOSAL",
              {
                id: "recommendation-proposal",
              },
            ),
  
            createRecommendation(
              "REQUEST_DOCUMENT",
              {
                id: "recommendation-document",
              },
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "CLOSING",
          )
        },
      )
  
      it(
        "prioriza NEGOTIATION sobre QUALIFICATION",
        () => {
          const journey =
            createJourney()
  
          const recommendations = [
            createRecommendation(
              "CREATE_TASK",
              {
                id: "recommendation-task",
              },
            ),
  
            createRecommendation(
              "CREATE_PROPOSAL",
              {
                id: "recommendation-proposal",
              },
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "NEGOTIATION",
          )
        },
      )
  
      it(
        "prioriza QUALIFICATION sobre envio de mensagem",
        () => {
          const journey =
            createJourney({
              score: 90,
            })
  
          const recommendations = [
            createRecommendation(
              "SEND_MESSAGE",
              {
                id: "recommendation-message",
              },
            ),
  
            createRecommendation(
              "CREATE_TASK",
              {
                id: "recommendation-task",
              },
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "QUALIFICATION",
          )
        },
      )
  
      it(
        "seleciona RECOVERY para jornada inativa com score alto",
        () => {
          const journey =
            createJourney({
              score: 70,
  
              lastInteractionAt:
                "2026-07-14T15:00:00.000Z",
            })
  
          const recommendations = [
            createRecommendation(
              "CREATE_TASK",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "RECOVERY",
          )
        },
      )
  
      it(
        "seleciona RECOVERY para jornada inativa com recomendação SEND_MESSAGE",
        () => {
          const journey =
            createJourney({
              score: 30,
  
              lastInteractionAt:
                "2026-07-10T15:00:00.000Z",
            })
  
          const recommendations = [
            createRecommendation(
              "SEND_MESSAGE",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "RECOVERY",
          )
        },
      )
  
      it(
        "considera sete dias sem interação como jornada inativa",
        () => {
          const journey =
            createJourney({
              score: 70,
  
              lastInteractionAt:
                "2026-07-14T15:00:00.000Z",
            })
  
          const recommendations = [
            createRecommendation(
              "CREATE_PROPOSAL",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "RECOVERY",
          )
        },
      )
  
      it(
        "não considera seis dias sem interação como jornada inativa",
        () => {
          const journey =
            createJourney({
              score: 80,
  
              lastInteractionAt:
                "2026-07-15T15:00:00.000Z",
            })
  
          const recommendations = [
            createRecommendation(
              "CREATE_PROPOSAL",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "NEGOTIATION",
          )
        },
      )
  
      it(
        "não seleciona RECOVERY quando não existe data da última interação",
        () => {
          const journey =
            createJourney({
              score: 90,
  
              lastInteractionAt: null,
            })
  
          const recommendations = [
            createRecommendation(
              "CREATE_TASK",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "QUALIFICATION",
          )
        },
      )
  
      it(
        "ignora data inválida da última interação",
        () => {
          const journey =
            createJourney({
              score: 90,
  
              lastInteractionAt:
                "data-invalida",
            })
  
          const recommendations = [
            createRecommendation(
              "CREATE_PROPOSAL",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "NEGOTIATION",
          )
        },
      )
  
      it(
        "não considera uma interação futura como inatividade",
        () => {
          const journey =
            createJourney({
              score: 90,
  
              lastInteractionAt:
                "2026-07-25T15:00:00.000Z",
            })
  
          const recommendations = [
            createRecommendation(
              "CREATE_PROPOSAL",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "NEGOTIATION",
          )
        },
      )
  
      it(
        "seleciona NURTURE quando a lista de recomendações está vazia",
        () => {
          const journey =
            createJourney({
              score: 50,
            })
  
          const result =
            selectStrategyType({
              journey,
              recommendations: [],
              now: NOW,
            })
  
          expect(result).toBe(
            "NURTURE",
          )
        },
      )
  
      it(
        "seleciona NURTURE quando existe apenas uma recomendação sem regra específica",
        () => {
          const journey =
            createJourney({
              score: 50,
            })
  
          const recommendations = [
            createRecommendation(
              "ADD_NOTE",
            ),
          ]
  
          const result =
            selectStrategyType({
              journey,
              recommendations,
              now: NOW,
            })
  
          expect(result).toBe(
            "NURTURE",
          )
        },
      )
    },
  )