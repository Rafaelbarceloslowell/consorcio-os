import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  R2LearningOutcome,
} from "./build-r2-learning-observation"

import type {
  R2CommercialTechniqueId,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  CommercialEvent,
} from "@/types/domain"

import {
  buildBestCommercialPatterns,
  buildR2LearningEvidence,
  MAX_LEARNING_ADJUSTMENT,
  MIN_OBSERVATIONS_FOR_ADAPTATION,
} from "./build-r2-learning-evidence"

import type {
  R2LearningContext,
} from "./build-r2-learning-evidence"

const CONTEXT: R2LearningContext = {
  approachType: "new",
  stage: "qualification",
  intent: "pricing_question",
  assetCategory: "real_estate",
  leadCategory: "inbound",
}

function event({
  id,
  workspaceId = "workspace-a",
  journeyId,
  techniqueId = "spin",
  outcome = "POSITIVE_RESPONSE",
  context = CONTEXT,
  occurredAt,
}: {
  id: string
  workspaceId?: string
  journeyId: string
  techniqueId?:
    R2CommercialTechniqueId
  outcome?: R2LearningOutcome
  context?: R2LearningContext
  occurredAt?: string
}): CommercialEvent {
  const timestamp =
    occurredAt ??
    "2026-08-08T12:00:00.000Z"

  return {
    id,
    workspaceId,
    journeyId,
    type: "NOTE_ADDED",
    actorType: "CONSULTANT",
    actorId: "consultant-1",
    payload: {
      category:
        "r2_learning_observation_recorded",
      consultantId:
        "consultant-1",
      recommendedPrimaryTechnique:
        techniqueId,
      outcome,
      ...context,
    },
    occurredAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function observations({
  count,
  techniqueId = "spin",
  outcome = "POSITIVE_RESPONSE",
  workspaceId = "workspace-a",
  context = CONTEXT,
}: {
  count: number
  techniqueId?:
    R2CommercialTechniqueId
  outcome?: R2LearningOutcome
  workspaceId?: string
  context?: R2LearningContext
}): CommercialEvent[] {
  return Array.from(
    { length: count },
    (_, index) =>
      event({
        id:
          `${workspaceId}-${techniqueId}-${index}`,
        workspaceId,
        journeyId:
          `journey-${workspaceId}-${techniqueId}-${index}`,
        techniqueId,
        outcome,
        context,
      }),
  )
}

function automaticEvent({
  id,
  journeyId,
  type,
}: {
  id: string
  journeyId: string
  type:
    | "MEETING_SCHEDULED"
    | "PROPOSAL_SENT"
    | "SALE_COMPLETED"
}): CommercialEvent {
  return {
    id,
    workspaceId: "workspace-a",
    journeyId,
    type,
    actorType: "SYSTEM",
    actorId: null,
    payload: {},
    occurredAt:
      "2026-08-09T12:00:00.000Z",
    createdAt:
      "2026-08-09T12:00:00.000Z",
    updatedAt:
      "2026-08-09T12:00:00.000Z",
  }
}

describe(
  "R2 evidence-based learning",
  () => {
    it(
      "não aplica ajuste com zero, uma ou menos que a amostra mínima",
      () => {
        for (const count of [
          0,
          1,
          MIN_OBSERVATIONS_FOR_ADAPTATION - 1,
        ]) {
          const evidence =
            buildR2LearningEvidence({
              workspaceId:
                "workspace-a",
              techniqueId: "spin",
              context: CONTEXT,
              events:
                observations({
                  count,
                }),
            })

          expect(
            evidence.learningAdjustment,
          ).toBe(0)
          expect(
            evidence.confidence,
          ).toBe(
            "INSUFFICIENT_DATA",
          )
        }
      },
    )

    it(
      "aplica ajuste conservador quando a amostra mínima é alcançada",
      () => {
        const evidence =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId: "spin",
            context: CONTEXT,
            events:
              observations({
                count:
                  MIN_OBSERVATIONS_FOR_ADAPTATION,
                outcome:
                  "SALE_COMPLETED",
              }),
          })

        expect(evidence.status).toBe(
          "APPLIED",
        )
        expect(
          evidence.learningAdjustment,
        ).toBeGreaterThan(0)
        expect(
          Math.abs(
            evidence.learningAdjustment,
          ),
        ).toBeLessThanOrEqual(
          MAX_LEARNING_ADJUSTMENT,
        )
      },
    )

    it(
      "produz evidência positiva, negativa e mista sem ultrapassar o clamp",
      () => {
        const positive =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId: "spin",
            context: CONTEXT,
            events:
              observations({
                count: 40,
                outcome:
                  "SALE_COMPLETED",
              }),
          })
        const negative =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId: "spin",
            context: CONTEXT,
            events:
              observations({
                count: 40,
                outcome: "LOST",
              }),
          })
        const mixed =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId: "spin",
            context: CONTEXT,
            events: [
              ...observations({
                count: 20,
                outcome:
                  "SALE_COMPLETED",
              }),
              ...observations({
                count: 20,
                techniqueId:
                  "spin",
                outcome: "LOST",
                context: {
                  ...CONTEXT,
                  leadCategory:
                    "inbound",
                },
              }).map(
                (item, index) => ({
                  ...item,
                  id: `mixed-loss-${index}`,
                  journeyId:
                    `mixed-loss-journey-${index}`,
                }),
              ),
            ],
          })

        expect(
          positive.learningAdjustment,
        ).toBeGreaterThan(0)
        expect(
          negative.learningAdjustment,
        ).toBeLessThan(0)
        expect(
          Math.abs(
            positive.learningAdjustment,
          ),
        ).toBeLessThanOrEqual(
          MAX_LEARNING_ADJUSTMENT,
        )
        expect(
          Math.abs(
            negative.learningAdjustment,
          ),
        ).toBeLessThanOrEqual(
          MAX_LEARNING_ADJUSTMENT,
        )
        expect(
          Math.abs(
            mixed.learningAdjustment,
          ),
        ).toBeLessThan(
          Math.abs(
            positive.learningAdjustment,
          ),
        )
      },
    )

    it(
      "isola contexto e workspace",
      () => {
        const evidence =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId: "spin",
            context: CONTEXT,
            events: [
              ...observations({
                count: 10,
              }),
              ...observations({
                count: 20,
                workspaceId:
                  "workspace-b",
                outcome: "LOST",
              }),
              ...observations({
                count: 20,
                outcome: "LOST",
                context: {
                  ...CONTEXT,
                  approachType:
                    "reactivation",
                },
              }).map(
                (item, index) => ({
                  ...item,
                  id: `reactivation-${index}`,
                }),
              ),
            ],
          })

        expect(
          evidence.observationCount,
        ).toBe(10)
        expect(
          evidence.learningAdjustment,
        ).toBeGreaterThan(0)
      },
    )

    it(
      "mantém guardrail acima do aprendizado",
      () => {
        const evidence =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId:
              "ethical_fomo",
            context: CONTEXT,
            guardrailBlocked: true,
            events:
              observations({
                count: 40,
                techniqueId:
                  "ethical_fomo",
                outcome:
                  "SALE_COMPLETED",
              }),
          })

        expect(evidence).toMatchObject({
          status:
            "GUARDRAIL_BLOCKED",
          learningAdjustment: 0,
        })
      },
    )

    it(
      "consome outcomes reais sem duplicar event id",
      () => {
        const base =
          observations({
            count: 10,
            outcome:
              "POSITIVE_RESPONSE",
          })
        const sale =
          automaticEvent({
            id: "sale-event",
            journeyId:
              base[0].journeyId,
            type:
              "SALE_COMPLETED",
          })

        const evidence =
          buildR2LearningEvidence({
            workspaceId:
              "workspace-a",
            techniqueId: "spin",
            context: CONTEXT,
            events: [
              ...base,
              sale,
              sale,
            ],
          })

        expect(
          evidence.observationCount,
        ).toBe(10)
        expect(
          evidence.automaticOutcomeCount,
        ).toBe(1)
        expect(
          evidence.outcomeSummary
            .SALE_COMPLETED,
        ).toBe(1)
      },
    )

    it(
      "protege padrão contra amostra perfeita pequena e ordena por conversão contextual",
      () => {
        const patterns =
          buildBestCommercialPatterns({
            workspaceId:
              "workspace-a",
            context: CONTEXT,
            events: [
              ...observations({
                count: 2,
                techniqueId:
                  "rapport",
                outcome:
                  "SALE_COMPLETED",
              }),
              ...observations({
                count: 40,
                techniqueId: "spin",
                outcome:
                  "PROPOSAL_SENT",
              }),
              ...observations({
                count: 30,
                techniqueId:
                  "diagnostic_selling",
                outcome:
                  "POSITIVE_RESPONSE",
              }),
            ],
          })

        expect(
          patterns.map(
            (pattern) =>
              pattern.techniqueId,
          ),
        ).not.toContain("rapport")
        expect(patterns[0]).toMatchObject({
          techniqueId: "spin",
          observationCount: 40,
        })
      },
    )

    it(
      "contabiliza feedback supervisionado como candidato sem alterar o ranking",
      () => {
        const timestamp =
          "2026-08-15T12:00:00.000Z"
        const candidate: CommercialEvent = {
          id: "feedback-candidate-1",
          workspaceId: "workspace-a",
          journeyId: "journey-feedback",
          type: "NOTE_ADDED",
          actorType: "CONSULTANT",
          actorId: "consultant-1",
          payload: {
            category: "r2_consultant_feedback",
            feedback: "DISAGREED",
            commercialTechniqueIds: ["spin"],
            learningStatus: "LEARNING_CANDIDATE",
            reviewStatus: "PENDING_HUMAN_REVIEW",
            automaticGlobalModelUpdate: false,
          },
          occurredAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        const evidence = buildR2LearningEvidence({
          workspaceId: "workspace-a",
          techniqueId: "spin",
          context: CONTEXT,
          events: [candidate],
        })

        expect(evidence).toMatchObject({
          consultantFeedbackCandidateCount: 1,
          observationCount: 0,
          learningAdjustment: 0,
          status: "NO_EVIDENCE",
        })
        expect(evidence.explanation).toContain(
          "não alteram o ranking automaticamente",
        )
      },
    )
  },
)
