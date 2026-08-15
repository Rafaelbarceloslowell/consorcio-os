import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  buildR2ConsultantCorrectionContext,
  parseR2ConsultantFeedback,
  prepareR2ConsultantCorrection,
  regeneratePreparedR2ConsultantCorrection,
} from "./index"

import {
  processR2Evidence,
} from "@/application/r2/evidence"

import {
  analyzeR2CustomerBoundary,
} from "@/application/r2/boundary"

describe("R2 supervised correction application flow", () => {
  it("não permite que feedback do consultor reabra rejeição terminal", () => {
    const parsed = parseR2ConsultantFeedback({
      action: "DISAGREE",
      recommendationId: "recommendation-boundary",
      idempotencyKey: "boundary-override",
      errorCategory: "WRONG_COMMERCIAL_STRATEGY",
      disagreementReason:
        "Acho que ainda há espaço comercial.",
      correctPath:
        "Pressionar mais uma vez e perguntar o motivo.",
    })

    if (parsed.action !== "DISAGREE") {
      throw new Error("disagreement required")
    }

    const customerBoundary = analyzeR2CustomerBoundary({
      opportunityId: "opportunity-1",
      message: "Já falei que não quero, que merda.",
    })
    const prepared = prepareR2ConsultantCorrection({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      originalAnalysis: {
        intent: "not_interested",
        stage: "closing",
        label: "Rejeição explícita",
        summary: "O cliente encerrou a conversa.",
        recommendedAction:
          "Encerrar respeitosamente.",
        customerBoundary,
        intentConfidence: "HIGH",
        reasonForRejectionConfidence: "UNKNOWN",
      },
      correction:
        buildR2ConsultantCorrectionContext(
          parsed,
          "feedback-boundary",
        ),
      consultantId: "consultant-1",
      now: new Date("2026-08-15T12:00:00.000Z"),
    })

    expect(prepared.analysis).toMatchObject({
      intent: "not_interested",
      stage: "closing",
    })
    expect(prepared.proposedPathSafety).toMatchObject({
      status: "BLOCK",
      safeToPresent: false,
    })
    expect(
      prepared.proposedPathSafety.issues.map(
        (issue) => issue.code,
      ),
    ).toContain("CUSTOMER_BOUNDARY_VIOLATION")
  })

  it("reprocessa Evidence, Decision Engine, Playbook e Safety sem apagar A nem criar regra global", async () => {
    const originalEvidence = processR2Evidence({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      text: "O cliente informou capacidade mensal de R$3.000.",
      sourceType: "CUSTOMER_MESSAGE",
      sourceReference: "whatsapp:message-1",
      observedAt: new Date("2026-08-14T10:00:00.000Z"),
      receivedAt: new Date("2026-08-14T10:00:00.000Z"),
    })
    const parsed = parseR2ConsultantFeedback({
      action: "DISAGREE",
      recommendationId: "recommendation-a",
      idempotencyKey: "application-flow-1",
      errorCategory: "MISSED_MEMORY",
      disagreementReason:
        "O R2 ignorou que a capacidade mensal de R$3.000 já estava na conversa.",
      correctPath:
        "Compare as estruturas para atingir o objetivo e conduza para reunião.",
    })

    if (parsed.action !== "DISAGREE") {
      throw new Error("disagreement required")
    }

    const correction =
      buildR2ConsultantCorrectionContext(
        parsed,
        "r2-feedback-application-flow-1",
      )
    const prepared = prepareR2ConsultantCorrection({
      opportunityId: "opportunity-1",
      subject: "Cliente",
      originalAnalysis: {
        intent: "pricing_question",
        stage: "qualification",
        label: "Pergunta de valor",
        summary: "É preciso descobrir a capacidade mensal.",
        recommendedAction: "Pergunte quanto cabe por mês.",
      },
      correction,
      consultantId: "consultant-1",
      structuredFacts: originalEvidence.structuredFacts,
      factProvenance: originalEvidence.factProvenance,
      now: new Date("2026-08-15T12:00:00.000Z"),
    })

    expect(prepared.evidence).not.toBeNull()
    expect(prepared.evidenceContext.assessments.length).toBeGreaterThan(0)
    expect(prepared.analysis.stage).toBe("strategy")
    expect(prepared.analysis.recommendedAction).not.toContain(
      "quanto cabe por mês",
    )
    expect(prepared.proposedPathSafety.safeToPresent).toBe(true)

    const decisionEngine = vi.fn().mockResolvedValue({
      nextBestActions: [{
        id: "nba-revised",
        title: "Comparar estruturas e marcar definição",
        reason: "A qualificação já existe na memória.",
      }],
      warnings: [],
      evidenceContext: {
        status: prepared.evidenceContext.status,
      },
    })
    const regenerated =
      await regeneratePreparedR2ConsultantCorrection({
        prepared,
        correction,
        workspaceId: "workspace-1",
        opportunityId: "opportunity-1",
        approachType: "new",
        profile: {
          assetCategory: "real_estate",
          desiredCredit: 1_000_000,
          targetTimelineMonths: 180,
        },
        candidates: [],
        commercialEvents: [],
        contactName: "Cliente",
        now: new Date("2026-08-15T12:00:00.000Z"),
        runDecisionEngine: decisionEngine,
      })

    expect(decisionEngine).toHaveBeenCalledWith(
      prepared.evidenceContext,
    )
    expect(regenerated.intelligence).toMatchObject({
      recommendationId: expect.any(String),
      stage: "strategy",
      nextBestAction: {
        id: "nba-revised",
        source: "DECISION_ENGINE",
      },
      supervision: {
        feedbackId: "r2-feedback-application-flow-1",
        parentRecommendationId: "recommendation-a",
        scope: "CASE_CORRECTION",
        learningStatus: "LEARNING_CANDIDATE",
        reviewStatus: "PENDING_HUMAN_REVIEW",
        automaticGlobalModelUpdate: false,
      },
    })
    expect(regenerated.intelligence.commercialStrategy)
      .toBeDefined()
    expect(regenerated.safetyCheck.safeToPresent).toBe(true)
    expect(regenerated.reply).toEqual(expect.any(String))
    expect(correction.originalRecommendationId).toBe(
      "recommendation-a",
    )
  })
})
