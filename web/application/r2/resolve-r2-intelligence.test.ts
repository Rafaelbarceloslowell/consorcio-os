import {
  describe,
  expect,
  it,
} from "vitest"

import {
  analyzeManualWhatsAppMessage,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import type {
  R2CommercialTechniqueId,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  CommercialEvent,
  Consortium,
} from "@/types/domain"

import {
  resolveR2Intelligence,
} from "./resolve-r2-intelligence"

function analysis(
  message: string,
  approachType:
    | "new"
    | "reactivation",
) {
  const result =
    analyzeManualWhatsAppMessage(
      message,
      { approachType },
    )

  if (!result) {
    throw new Error(
      "analysis required",
    )
  }

  return result
}

function catalog(
  overrides:
    Partial<Consortium> = {},
): Consortium {
  return {
    id: "catalog-verified",
    name: "Produto verificado",
    administrator:
      "Operador verificado",
    type: "real_estate",
    groupNumber: "group-verified",
    minCreditValue: 100000,
    maxCreditValue: 600000,
    defaultTermMonths: 180,
    administrationFeePercent: 0,
    reserveFundPercent: 0,
    totalQuotas: 0,
    availableQuotas: 0,
    status: "active",
    ruleStatus: "verified",
    ruleSource:
      "operator_verified",
    sourceReference:
      "Fonte controlada do teste",
    verifiedAt:
      "2026-08-01T12:00:00.000Z",
    effectiveFrom:
      "2026-08-01T12:00:00.000Z",
    effectiveUntil:
      "2026-12-01T12:00:00.000Z",
    ruleVersion: 1,
    createdAt:
      "2026-08-01T12:00:00.000Z",
    updatedAt:
      "2026-08-01T12:00:00.000Z",
    ...overrides,
  }
}

function learningEvents({
  techniqueId,
  count,
  outcome,
}: {
  techniqueId:
    R2CommercialTechniqueId
  count: number
  outcome:
    "SALE_COMPLETED" | "LOST"
}): CommercialEvent[] {
  return Array.from(
    { length: count },
    (_, index) => ({
      id:
        `${techniqueId}-${outcome}-${index}`,
      workspaceId: "workspace-1",
      journeyId:
        `journey-${techniqueId}-${outcome}-${index}`,
      type:
        "NOTE_ADDED" as const,
      actorType:
        "CONSULTANT" as const,
      actorId: "consultant-1",
      payload: {
        category:
          "r2_learning_observation_recorded",
        recommendedPrimaryTechnique:
          techniqueId,
        outcome,
        approachType: "new",
        stage: "qualification",
        intent: "pricing_question",
        assetCategory:
          "real_estate",
      },
      occurredAt:
        "2026-08-02T12:00:00.000Z",
      createdAt:
        "2026-08-02T12:00:00.000Z",
      updatedAt:
        "2026-08-02T12:00:00.000Z",
      }),
  )
}

const PROFILE = {
  assetCategory:
    "real_estate" as const,
  desiredCredit: 400000,
  comfortableInstallment: 3000,
  targetTimelineMonths: 180,
}

describe(
  "R2 Intelligence Orchestrator",
  () => {
    it(
      "cenário 1: mantém recomendação comercial e não inventa produto sem catálogo",
      () => {
        const result =
          resolveR2Intelligence({
            recommendationId: "rec-1",
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType: "new",
            analysis: analysis(
              "Qual o valor da parcela?",
              "new",
            ),
            profile: PROFILE,
            candidates: [],
            commercialEvents: [],
            now:
              new Date(
                "2026-08-08T12:00:00.000Z",
              ),
          })

        expect(result).toMatchObject({
          recommendationId: "rec-1",
          commercialStrategy: {
            effectivePrimaryTechnique:
              "spin",
          },
          consortiumRecommendation: {
            status: "NO_CATALOG",
            topOptions: [],
          },
          learningApplied: false,
        })
      },
    )

    it(
      "cenário 2: bloqueia reativação sem contexto recente",
      () => {
        const result =
          resolveR2Intelligence({
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType:
              "reactivation",
            analysis: analysis(
              "Oi",
              "reactivation",
            ),
            profile: PROFILE,
            candidates: [catalog()],
            commercialEvents: [],
          })

        expect(result).toMatchObject({
          confidence:
            "INSUFFICIENT_DATA",
          commercialStrategy: {
            requiresRecentContext: true,
          },
        })
        expect(result.missingData).toContain(
          "recentConversationContext",
        )
        expect(result.explanation).toContain(
          "Peça o contexto recente",
        )
      },
    )

    it(
      "cenário 3: combina produto verificado e aprendizado suficiente",
      () => {
        const result =
          resolveR2Intelligence({
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType: "new",
            analysis: analysis(
              "Qual o valor da parcela?",
              "new",
            ),
            profile: PROFILE,
            candidates: [catalog()],
            commercialEvents:
              learningEvents({
                techniqueId: "spin",
                count: 10,
                outcome:
                  "SALE_COMPLETED",
              }),
            now:
              new Date(
                "2026-08-08T12:00:00.000Z",
              ),
          })

        expect(result).toMatchObject({
          learningApplied: true,
          consortiumRecommendation: {
            status:
              "OPTIONS_AVAILABLE",
          },
          learningEvidence: {
            status: "APPLIED",
            observationCount: 10,
          },
        })
        expect(
          result.consortiumRecommendation
            .topOptions,
        ).toHaveLength(1)
      },
    )

    it(
      "aprendizado altera ranking conservador quando a evidência comparável é suficiente",
      () => {
        const result =
          resolveR2Intelligence({
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType: "new",
            analysis: analysis(
              "Qual o valor da parcela?",
              "new",
            ),
            profile: PROFILE,
            candidates: [catalog()],
            commercialEvents: [
              ...learningEvents({
                techniqueId: "spin",
                count: 10,
                outcome: "LOST",
              }),
              ...learningEvents({
                techniqueId:
                  "diagnostic_selling",
                count: 30,
                outcome:
                  "SALE_COMPLETED",
              }),
            ],
          })

        expect(
          result.commercialStrategy
            .basePrimaryTechnique,
        ).toBe("spin")
        expect(
          result.commercialStrategy
            .effectivePrimaryTechnique,
        ).toBe(
          "diagnostic_selling",
        )
        expect(result.learningApplied).toBe(
          true,
        )
      },
    )

    it(
      "cenário 4: regra dura de consórcio vence padrão aprendido",
      () => {
        const result =
          resolveR2Intelligence({
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType: "new",
            analysis: analysis(
              "Qual o valor da parcela?",
              "new",
            ),
            profile: {
              ...PROFILE,
              desiredCredit: 900000,
            },
            candidates: [catalog()],
            commercialEvents:
              learningEvents({
                techniqueId: "spin",
                count: 30,
                outcome:
                  "SALE_COMPLETED",
              }),
          })

        expect(
          result.consortiumRecommendation
            .status,
        ).toBe("NO_ELIGIBLE_OPTIONS")
        expect(
          result.consortiumRecommendation
            .topOptions,
        ).toEqual([])
        expect(
          result.consortiumRecommendation
            .candidates[0].eligibility,
        ).toBe("NOT_ELIGIBLE")
      },
    )

    it(
      "cenário 5: pede prova social real quando útil e indisponível",
      () => {
        const result =
          resolveR2Intelligence({
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType: "new",
            analysis: analysis(
              "Vamos marcar uma reunião?",
              "new",
            ),
            profile: PROFILE,
            candidates: [],
            commercialEvents: [],
            hasAuthorizedSocialProof:
              false,
          })

        expect(
          result.commercialStrategy
            .socialProof.prompt,
        ).toContain(
          "real, semelhante e autorizado",
        )
        expect(result.warnings).toContain(
          "Guardrail comercial prevaleceu sobre evidência histórica.",
        )
      },
    )

    it(
      "preserva a ação operacional do Decision Engine",
      () => {
        const result =
          resolveR2Intelligence({
            workspaceId: "workspace-1",
            opportunityId:
              "opportunity-1",
            approachType: "new",
            analysis: analysis(
              "Tenho interesse em imóvel.",
              "new",
            ),
            profile: PROFILE,
            candidates: [],
            commercialEvents: [],
            operationalAction: {
              id: "nba-1",
              title:
                "Atender lead novo agora",
              reason:
                "Lead criado há três minutos.",
            },
          })

        expect(result.nextBestAction)
          .toMatchObject({
            id: "nba-1",
            source:
              "DECISION_ENGINE",
          })
      },
    )

    it(
      "explicita correção apenas no caso e mantém aprendizado global pendente",
      () => {
        const result = resolveR2Intelligence({
          recommendationId: "recommendation-b",
          workspaceId: "workspace-1",
          opportunityId: "opportunity-1",
          approachType: "new",
          analysis: analysis(
            "Tenho interesse em imóvel.",
            "new",
          ),
          profile: PROFILE,
          candidates: [],
          commercialEvents: [],
          consultantCorrectionContext: {
            feedbackId: "feedback-1",
            originalRecommendationId: "recommendation-a",
            errorCategory: "WRONG_COMMERCIAL_STRATEGY",
            correctionType: "STRATEGY_CORRECTION",
            disagreementReason: "Estratégia repetia a pergunta.",
            correctPath: "Compare as opções.",
            affectsEvidence: false,
            consultantReportsCustomerConfirmation: false,
            scope: "CASE_CORRECTION",
            learningStatus: "LEARNING_CANDIDATE",
            reviewStatus: "PENDING_HUMAN_REVIEW",
            automaticGlobalModelUpdate: false,
          },
        })

        expect(result.explanation).toContain(
          "Correção aplicada neste caso",
        )
        expect(result.supervision).toEqual({
          feedbackId: "feedback-1",
          parentRecommendationId: "recommendation-a",
          scope: "CASE_CORRECTION",
          learningStatus: "LEARNING_CANDIDATE",
          reviewStatus: "PENDING_HUMAN_REVIEW",
          automaticGlobalModelUpdate: false,
        })
      },
    )
  },
)
