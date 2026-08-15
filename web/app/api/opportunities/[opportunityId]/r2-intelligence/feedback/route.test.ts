import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  findJourney: vi.fn(),
  findEvents: vi.fn(),
  findUniqueEvent: vi.fn(),
  findFeedbackEvent: vi.fn(),
  createEvent: vi.fn(),
  updateJourney: vi.fn(),
  updateMemory: vi.fn(),
  transaction: vi.fn(),
  listCandidates: vi.fn(),
  findAllEvents: vi.fn(),
  runDecisionEngine: vi.fn(),
}))

vi.mock(
  "@/lib/auth/get-authenticated-commercial-context",
  () => ({
    getApiCommercialContext: mocks.getContext,
  }),
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      commercialJourney: {
        findFirst: mocks.findJourney,
      },
      commercialEvent: {
        findMany: mocks.findEvents,
        findUnique: mocks.findUniqueEvent,
        findFirst: mocks.findFeedbackEvent,
        create: mocks.createEvent,
      },
      $transaction: mocks.transaction,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/providers/prisma-consortium-catalog-provider",
  () => ({
    PrismaConsortiumCatalogProvider: class {
      listCandidates = mocks.listCandidates
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/commercial/prisma-commercial-event-repository",
  () => ({
    PrismaCommercialEventRepository: class {
      findAll = mocks.findAllEvents
    },
  }),
)

vi.mock(
  "@/application/decision/run-decision-engine",
  () => ({
    runApplicationDecisionEngine:
      mocks.runDecisionEngine,
  }),
)

import {
  POST,
} from "./route"

import {
  processR2Evidence,
} from "@/application/r2/evidence"

import {
  analyzeR2CustomerBoundary,
} from "@/application/r2/boundary"

const context = {
  params: Promise.resolve({
    opportunityId: "journey-1",
  }),
}

const originalPayload = {
  category: "r2_intelligence_recommendation",
  recommendationId: "recommendation-a",
  version: 1,
  recommendationSnapshot: {
    title: "Confirme a capacidade mensal",
    explanation: "A qualificação ainda parece incompleta.",
    source: "COMMERCIAL_ENGINE",
    suggestedNextStep: "Confirmar orçamento",
    suggestedQuestion: "Quanto cabe por mês?",
    preparedReply: "Quanto cabe por mês?",
  },
  analysisSnapshot: {
    intent: "pricing_question",
    stage: "qualification",
    label: "Pergunta de valor",
    summary: "O cliente perguntou sobre valores.",
    recommendedAction: "Confirmar capacidade mensal.",
  },
  decisionContext: {
    approachType: "new",
    assetCategory: "real_estate",
    desiredCredit: 1_000_000,
    targetTimelineMonths: 180,
    operationalActionId: null,
  },
  commercialTechniqueIds: ["spin"],
  consortiumCandidateId: null,
  evidence: {
    status: "SUPPORTED",
    confidence: "HIGH",
  },
  safetyCheck: {
    status: "SAFE",
    safeToPresent: true,
  },
}

function journey(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "journey-1",
    version: 4,
    consultantId: "consultant-1",
    consortiumType: "REAL_ESTATE",
    lead: {
      name: "Janaina",
      approachType: "NEW",
      desiredCreditValue: 1_000_000,
      desiredTermMonths: 180,
    },
    client: null,
    conversationMemory: {
      structuredFacts: {},
      factProvenance: {},
    },
    nextBestActions: [],
    ...overrides,
  }
}

function request(
  body: Record<string, unknown>,
): Request {
  return new Request(
    "http://localhost/api/opportunities/journey-1/r2-intelligence/feedback",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  )
}

function disagree(
  overrides: Record<string, unknown> = {},
) {
  return request({
    action: "DISAGREE",
    recommendationId: "recommendation-a",
    idempotencyKey: "disagree-1",
    errorCategory: "WRONG_COMMERCIAL_STRATEGY",
    disagreementReason:
      "A capacidade mensal já foi qualificada.",
    correctPath:
      "Compare as opções e conduza para reunião.",
    ...overrides,
  })
}

describe(
  "POST R2 consultant feedback",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.getContext.mockResolvedValue({
        userId: "user-1",
        workspaceId: "workspace-1",
        consultantId: "consultant-1",
        role: "CONSULTANT",
      })
      mocks.findJourney.mockResolvedValue(journey())
      mocks.findEvents.mockResolvedValue([
        {
          id: "original-event",
          payload: originalPayload,
        },
      ])
      mocks.findUniqueEvent.mockResolvedValue(null)
      mocks.findFeedbackEvent.mockResolvedValue(null)
      mocks.updateJourney.mockResolvedValue({ count: 1 })
      mocks.createEvent.mockResolvedValue({ id: "event" })
      mocks.updateMemory.mockResolvedValue({ id: "memory-1" })
      mocks.transaction.mockImplementation(
        async (callback: (
          transaction: {
            commercialJourney: { updateMany: typeof mocks.updateJourney }
            commercialEvent: { create: typeof mocks.createEvent }
            commercialConversationMemory: { update: typeof mocks.updateMemory }
          },
        ) => Promise<unknown>) => callback({
          commercialJourney: {
            updateMany: mocks.updateJourney,
          },
          commercialEvent: {
            create: mocks.createEvent,
          },
          commercialConversationMemory: {
            update: mocks.updateMemory,
          },
        }),
      )
      mocks.listCandidates.mockResolvedValue([])
      mocks.findAllEvents.mockResolvedValue([])
      mocks.runDecisionEngine.mockResolvedValue({
        nextBestActions: [],
        warnings: [],
        evidenceContext: {
          status: "SUPPORTED",
        },
      })
    })

    it("persiste aceitação positiva com identidade autenticada e snapshots", async () => {
      const response = await POST(
        request({
          action: "ACCEPT",
          recommendationId: "recommendation-a",
          idempotencyKey: "accept-1",
          consultantId: "forged-consultant",
        }),
        context,
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: "ACCEPTED",
        duplicate: false,
        feedbackId: "r2-feedback-accept-1",
      })
      expect(mocks.createEvent).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "r2-feedback-accept-1",
          actorId: "consultant-1",
          payload: expect.objectContaining({
            category: "r2_consultant_feedback",
            feedback: "ACCEPTED",
            originalRecommendation:
              originalPayload.recommendationSnapshot,
            evidenceSnapshot:
              originalPayload.evidence,
            learningStatus: "LEARNING_CANDIDATE",
            automaticGlobalModelUpdate: false,
          }),
        }),
      })
      expect(mocks.runDecisionEngine).not.toHaveBeenCalled()
    })

    it("executa o ciclo A para feedback para pipeline real para B e preserva a relação", async () => {
      const response = await POST(disagree(), context)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.status).toBe("CORRECTION_APPLIED")
      expect(body.feedbackPersisted).toBe(true)
      expect(body.intelligence.stage).toBe("strategy")
      expect(body.intelligence.explanation).toContain(
        "Correção aplicada neste caso",
      )
      expect(mocks.transaction).toHaveBeenCalledTimes(2)
      expect(mocks.runDecisionEngine).toHaveBeenCalledWith(
        expect.objectContaining({
          journeyId: "journey-1",
          evidenceContext: expect.objectContaining({
            status: expect.any(String),
          }),
        }),
      )
      const eventCalls = mocks.createEvent.mock.calls.map(
        ([call]) => call.data,
      )
      expect(eventCalls[0].payload).toMatchObject({
        feedback: "DISAGREED",
        errorCategory: "WRONG_COMMERCIAL_STRATEGY",
        proposedCorrectPath:
          "Compare as opções e conduza para reunião.",
        learningStatus: "LEARNING_CANDIDATE",
        automaticGlobalModelUpdate: false,
      })
      expect(eventCalls[1].payload).toMatchObject({
        category: "r2_consultant_case_correction_applied",
        parentRecommendationId: "recommendation-a",
        supersedesRecommendationId: "recommendation-a",
        originalRecommendation:
          originalPayload.recommendationSnapshot,
        revisedRecommendation: expect.objectContaining({
          title: expect.any(String),
        }),
        safetyCheck: expect.objectContaining({
          safeToPresent: true,
        }),
      })
      expect(mocks.updateMemory).not.toHaveBeenCalled()
    })

    it("envia correção factual ao Evidence Layer e preserva provenance e claim anterior", async () => {
      const oldEvidence = processR2Evidence({
        opportunityId: "journey-1",
        subject: "Janaina",
        text: "O lance informado é R$50 mil.",
        sourceType: "CUSTOMER_MESSAGE",
        sourceReference: "whatsapp:old",
        observedAt: new Date("2026-08-01T10:00:00.000Z"),
        receivedAt: new Date("2026-08-01T10:00:00.000Z"),
      })
      mocks.findJourney.mockResolvedValue(journey({
        conversationMemory: {
          structuredFacts: oldEvidence.structuredFacts,
          factProvenance: oldEvidence.factProvenance,
        },
      }))

      const response = await POST(disagree({
        idempotencyKey: "fact-1",
        errorCategory: "WRONG_FACT",
        disagreementReason:
          "Ele me confirmou agora por telefone que o lance é R$80 mil.",
        correctPath:
          "Reavalie a estratégia com o lance atual informado de R$80 mil.",
      }), context)

      expect(response.status).toBe(200)
      expect(mocks.updateMemory).toHaveBeenCalledTimes(1)
      const update = mocks.updateMemory.mock.calls[0][0]
      const stored = update.data.structuredFacts.r2Evidence
      expect(stored.claims.length).toBeGreaterThan(1)
      expect(stored.claims.map(
        (claim: { provenance: { sourceReference: string } }) =>
          claim.provenance.sourceReference,
      )).toEqual(expect.arrayContaining([
        "whatsapp:old",
        "consultant-feedback:r2-feedback-fact-1",
      ]))
      expect(stored.claims.some(
        (claim: { relationship: string | null }) =>
          claim.relationship !== null,
      )).toBe(true)
    })

    it("persiste feedback perigoso e bloqueia promessa de contemplação antes da regeneração", async () => {
      const response = await POST(disagree({
        idempotencyKey: "danger-1",
        correctPath:
          "Fala que com R$100 mil ele vai ser contemplado.",
      }), context)
      const body = await response.json()

      expect(response.status).toBe(422)
      expect(body).toMatchObject({
        status: "BLOCKED_BY_SAFETY",
        feedbackPersisted: true,
      })
      expect(body.safetyCheck.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "CONTEMPLATION_PROMISE",
          }),
        ]),
      )
      expect(mocks.createEvent).toHaveBeenCalledTimes(1)
      expect(mocks.runDecisionEngine).not.toHaveBeenCalled()
    })

    it("persiste a discordância mas bloqueia tentativa de furar uma boundary", async () => {
      const customerBoundary = analyzeR2CustomerBoundary({
        opportunityId: "journey-1",
        message: "Já falei que não quero, que merda.",
      })
      mocks.findEvents.mockResolvedValue([{
        id: "original-boundary-event",
        payload: {
          ...originalPayload,
          customerBoundary,
          analysisSnapshot: {
            intent: "not_interested",
            stage: "closing",
            label: "Rejeição explícita",
            summary: "O cliente encerrou a conversa.",
            recommendedAction:
              "Encerrar respeitosamente.",
            customerBoundary,
          },
        },
      }])

      const response = await POST(disagree({
        idempotencyKey: "boundary-1",
        disagreementReason:
          "Quero tentar continuar a venda.",
        correctPath:
          "Pressionar mais uma vez e perguntar o motivo.",
      }), context)
      const body = await response.json()

      expect(response.status).toBe(422)
      expect(body).toMatchObject({
        status: "BLOCKED_BY_SAFETY",
        feedbackPersisted: true,
      })
      expect(body.safetyCheck.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "CUSTOMER_BOUNDARY_VIOLATION",
          }),
        ]),
      )
      expect(mocks.createEvent).toHaveBeenCalledTimes(1)
      expect(mocks.runDecisionEngine).not.toHaveBeenCalled()
    })

    it("não duplica evento, correção ou regeneração em retry", async () => {
      mocks.findUniqueEvent
        .mockResolvedValueOnce({
          id: "r2-feedback-disagree-1",
          workspaceId: "workspace-1",
          journeyId: "journey-1",
          payload: { regenerationStatus: "PENDING" },
        })
        .mockResolvedValueOnce({
          id: "r2-feedback-revision-disagree-1",
          workspaceId: "workspace-1",
          journeyId: "journey-1",
        })

      const response = await POST(disagree(), context)
      const body = await response.json()

      expect(body).toMatchObject({
        status: "CORRECTION_APPLIED",
        duplicate: true,
      })
      expect(mocks.transaction).not.toHaveBeenCalled()
      expect(mocks.createEvent).not.toHaveBeenCalled()
      expect(mocks.runDecisionEngine).not.toHaveBeenCalled()
    })

    it("responde 409 ao optimistic lock sem criar evento", async () => {
      mocks.updateJourney.mockResolvedValue({ count: 0 })

      const response = await POST(
        request({
          action: "ACCEPT",
          recommendationId: "recommendation-a",
          idempotencyKey: "accept-stale",
        }),
        context,
      )

      expect(response.status).toBe(409)
      expect(mocks.createEvent).not.toHaveBeenCalled()
    })

    it("impede feedback do consultor que não possui a oportunidade", async () => {
      mocks.findJourney.mockResolvedValue(journey({
        consultantId: "consultant-2",
      }))

      const response = await POST(disagree(), context)

      expect(response.status).toBe(403)
      expect(mocks.findEvents).not.toHaveBeenCalled()
    })

    it("preserva o feedback quando a regeneração falha e permite retry", async () => {
      mocks.runDecisionEngine.mockRejectedValue(
        new Error("decision unavailable"),
      )

      const response = await POST(disagree({
        idempotencyKey: "failure-1",
      }), context)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body).toMatchObject({
        feedbackPersisted: true,
        feedbackId: "r2-feedback-failure-1",
      })
      expect(mocks.createEvent).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "r2-feedback-failure-failure-1",
          payload: expect.objectContaining({
            category: "r2_consultant_feedback_regeneration_failed",
            retryable: true,
          }),
        }),
      })
    })

    it.each([
      "WORKED",
      "PARTIALLY_WORKED",
      "DID_NOT_WORK",
    ])("registra resultado posterior %s ligado ao feedback", async (outcome) => {
      mocks.findFeedbackEvent.mockResolvedValue({
        id: "r2-feedback-disagree-1",
        payload: {
          category: "r2_consultant_feedback",
          recommendationId: "recommendation-a",
        },
      })

      const response = await POST(request({
        action: "OUTCOME",
        recommendationId: "recommendation-a",
        idempotencyKey: `outcome-${outcome}`,
        feedbackId: "r2-feedback-disagree-1",
        outcome,
      }), context)

      expect(response.status).toBe(200)
      expect(mocks.createEvent).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: "consultant-1",
          payload: expect.objectContaining({
            category: "r2_consultant_correction_outcome",
            feedbackId: "r2-feedback-disagree-1",
            outcome,
          }),
        }),
      })
    })

    it("valida o payload e a recomendação específica", async () => {
      const invalid = await POST(disagree({
        disagreementReason: " ",
      }), context)
      expect(invalid.status).toBe(400)

      mocks.findEvents.mockResolvedValue([])
      const missing = await POST(disagree(), context)
      expect(missing.status).toBe(404)
    })
  },
)
