import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(
  () => ({
    getContext: vi.fn(),
    findJourney: vi.fn(),
    createEvent: vi.fn(),
    upsertMemory: vi.fn(),
    updateReactivationContext:
      vi.fn(),
    updateJourneyVersion:
      vi.fn(),
    cancelTasks: vi.fn(),
    cancelCommitments: vi.fn(),
    transaction: vi.fn(),
    listCandidates: vi.fn(),
    findAllEvents: vi.fn(),
    runDecisionEngine: vi.fn(),
  }),
)

vi.mock(
  "@/lib/auth/get-authenticated-commercial-context",
  () => ({
    getApiCommercialContext:
      mocks.getContext,
  }),
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      commercialJourney: {
        findFirst:
          mocks.findJourney,
      },
      commercialEvent: {
        create:
          mocks.createEvent,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/providers/prisma-consortium-catalog-provider",
  () => ({
    PrismaConsortiumCatalogProvider:
      class {
        listCandidates =
          mocks.listCandidates
      },
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/commercial/prisma-commercial-event-repository",
  () => ({
    PrismaCommercialEventRepository:
      class {
        findAll =
          mocks.findAllEvents
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
  evolveR2CustomerBoundaryMemory,
  writeR2CustomerBoundaryMemory,
} from "@/application/r2/boundary"

const context = {
  params: Promise.resolve({
    opportunityId: "journey-1",
  }),
}

function request(
  incomingMessage =
    "Qual o valor da parcela?",
  contextDecision?:
    | "CONFIRM_CONTEXT"
    | "CONFIRM_EVIDENCE",
  sourceType:
    | "CUSTOMER_INBOUND"
    | "CONSULTANT_CONTEXT" =
      "CUSTOMER_INBOUND",
): Request {
  return new Request(
    "http://localhost/api/opportunities/journey-1/r2-intelligence",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        incomingMessage,
        ...(contextDecision
          ? { contextDecision }
          : {}),
        ...(sourceType
          ? { sourceType }
          : {}),
      }),
    },
  )
}

function journey(
  consultantId = "consultant-1",
  approachType = "NEW",
  reactivationContexts:
    Array<{
      id: string
      contextSummary: string | null
      contextState: string
    }> = [],
) {
  return {
    id: "journey-1",
    version: 1,
    consultantId,
    consortiumType:
      "REAL_ESTATE",
    lead: {
      name: "Janaina",
      approachType,
      desiredCreditValue:
        500000,
      desiredTermMonths: 180,
    },
    client: null,
    reactivationContexts,
    commercialEvents: [],
    nextBestActions: [
      {
        id: "nba-1",
        title:
          "Confirmar objetivo e prazo",
        reason:
          "A decisão operacional existente tem prioridade.",
      },
    ],
    conversationMemory: null,
  }
}

describe(
  "POST /api/opportunities/[opportunityId]/r2-intelligence",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.getContext.mockResolvedValue({
        userId: "user-1",
        workspaceId:
          "workspace-1",
        consultantId:
          "consultant-1",
        role: "CONSULTANT",
      })
      mocks.findJourney.mockResolvedValue(
        journey(),
      )
      mocks.listCandidates.mockResolvedValue(
        [],
      )
      mocks.findAllEvents.mockResolvedValue(
        [],
      )
      mocks.runDecisionEngine.mockImplementation(
        async (input: {
          evidenceContext?: unknown
        }) => ({
          nextBestActions: [],
          strategy: null,
          diagnostics: [],
          warnings: [],
          evidenceContext:
            input.evidenceContext,
        }),
      )
      mocks.createEvent.mockResolvedValue({
        id: "event-1",
      })
      mocks.upsertMemory.mockResolvedValue({
        id: "memory-1",
      })
      mocks.updateJourneyVersion.mockResolvedValue({
        count: 1,
      })
      mocks.cancelTasks.mockResolvedValue({ count: 0 })
      mocks.cancelCommitments.mockResolvedValue({ count: 0 })
      mocks.transaction.mockImplementation(
        async (
          operation: (
            transaction: unknown,
          ) => unknown,
        ) => operation({
          commercialJourney: {
            updateMany:
              mocks.updateJourneyVersion,
          },
          commercialConversationMemory: {
            upsert:
              mocks.upsertMemory,
          },
          reactivationContext: {
            update:
              mocks.updateReactivationContext,
          },
          commercialEvent: {
            create:
              mocks.createEvent,
          },
          task: {
            updateMany:
              mocks.cancelTasks,
          },
          commercialCommitment: {
            updateMany:
              mocks.cancelCommitments,
          },
        }),
      )
    })

    it(
      "orquestra a decisão no workspace autenticado e preserva a NBA existente",
      async () => {
        const response =
          await POST(
            request(),
            context,
          )
        const body =
          await response.json()

        expect(response.status).toBe(200)
        expect(
          mocks.findJourney,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              id: "journey-1",
              workspaceId:
                "workspace-1",
            }),
          }),
        )
        expect(
          body.intelligence.nextBestAction,
        ).toMatchObject({
          id: "nba-1",
          source:
            "DECISION_ENGINE",
        })
        expect(
          body.intelligence.workspaceId,
        ).toBe("workspace-1")
        expect(
          body.reply,
        ).toEqual(expect.any(String))
      },
    )

    it(
      "persiste somente observabilidade segura, sem copiar a conversa",
      async () => {
        const sensitiveContext =
          "Meu CPF é 123 e quero uma parcela específica."

        await POST(
          request(sensitiveContext),
          context,
        )

        expect(
          mocks.createEvent,
        ).toHaveBeenCalledOnce()
        const persisted =
          mocks.createEvent.mock.calls[0]?.[0]
        const serialized =
          JSON.stringify(persisted)

        expect(serialized).toContain(
          "r2_intelligence_recommendation",
        )
        expect(serialized).not.toContain(
          sensitiveContext,
        )
        expect(
          persisted.data.payload,
        ).toEqual(
          expect.objectContaining({
            recommendationId:
              expect.any(String),
            version: 1,
            parentRecommendationId: null,
            recommendationSnapshot:
              expect.objectContaining({
                title: expect.any(String),
                explanation: expect.any(String),
              }),
            analysisSnapshot:
              expect.objectContaining({
                intent: expect.any(String),
                stage: expect.any(String),
                recommendedAction:
                  expect.any(String),
              }),
            decisionContext:
              expect.objectContaining({
                approachType: "new",
                assetCategory:
                  "real_estate",
              }),
            commercialTechniqueIds:
              expect.any(Array),
            learningEvidenceCount:
              expect.any(Number),
            evidence:
              expect.objectContaining({
                status:
                  expect.any(String),
              }),
            safetyCheck:
              expect.objectContaining({
                status:
                  expect.any(String),
              }),
          }),
        )
        expect(
          mocks.upsertMemory,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              journeyId:
                "journey-1",
            },
            create:
              expect.objectContaining({
                workspaceId:
                  "workspace-1",
                lastIncomingMessage:
                  sensitiveContext,
              }),
          }),
        )
      },
    )

    it(
      "executa o fluxo real de claim, evidência, NBA/playbook, safety e resposta",
      async () => {
        const response = await POST(
          request(
            "Tenho R$ 100 mil para lance.",
          ),
          context,
        )
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.evidence).toMatchObject({
          status: "SUPPORTED",
          confidence: "HIGH",
          outcome: "PASS",
          humanConfirmationRequired: false,
        })
        expect(body.intelligence.nextBestAction.source).toBe(
          "DECISION_ENGINE",
        )
        expect(mocks.runDecisionEngine).toHaveBeenCalledWith(
          expect.objectContaining({
            journeyId: "journey-1",
            evidenceContext:
              expect.objectContaining({
                status: "SUPPORTED",
                outcome: "PASS",
              }),
          }),
        )
        expect(body.intelligence.commercialStrategy).toBeDefined()
        expect(body.safetyCheck).toMatchObject({
          status: "SAFE",
          safeToPresent: true,
        })
        expect(body.reply).toEqual(expect.any(String))

        const memoryWrite = mocks.upsertMemory.mock.calls[0]?.[0]
        expect(
          memoryWrite.create.structuredFacts.r2Evidence.claims,
        ).toHaveLength(1)
      },
    )

    it(
      "preserva nunca respondeu como contexto do consultor sem criar falso inbound",
      async () => {
        const response = await POST(
          request(
            "Cliente nunca respondeu",
            undefined,
            "CONSULTANT_CONTEXT",
          ),
          context,
        )
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.interactionState).toMatchObject({
          sourceType: "CONSULTANT_CONTEXT",
          customerHasReplied: false,
          responseStatus: "NEVER_RESPONDED",
          consultantContext:
            "Cliente nunca respondeu",
        })
        expect(body.reply).not.toMatch(
          /obrigad[oa].*(?:responder|retorno|resposta)/iu,
        )

        const memoryWrite =
          mocks.upsertMemory.mock.calls[0]?.[0]
            .create

        expect(memoryWrite).toMatchObject({
          lastIncomingMessage: null,
          structuredFacts: {
            conversationInteraction: {
              sourceType:
                "CONSULTANT_CONTEXT",
              customerHasReplied: false,
              responseStatus:
                "NEVER_RESPONDED",
              consultantContext:
                "Cliente nunca respondeu",
            },
          },
          factProvenance: {
            consultantContext:
              "manual_context",
          },
        })
        expect(
          memoryWrite.structuredFacts
            .r2Evidence.claims[0]
            .provenance,
        ).toMatchObject({
          sourceType: "CONSULTANT_INPUT",
          actorId: "consultant-1",
        })
      },
    )

    it(
      "substitui o estado por inbound real quando o cliente responde depois",
      async () => {
        const firstResponse = await POST(
          request(
            "Cliente nunca respondeu",
            undefined,
            "CONSULTANT_CONTEXT",
          ),
          context,
        )

        expect(firstResponse.status).toBe(200)

        const firstMemory =
          mocks.upsertMemory.mock.calls[0]?.[0]
            .create

        mocks.findJourney.mockResolvedValue({
          ...journey(),
          version: 2,
          conversationMemory: {
            structuredFacts:
              firstMemory.structuredFacts,
            factProvenance:
              firstMemory.factProvenance,
            lastIncomingMessage: null,
          },
        })
        mocks.upsertMemory.mockClear()

        const response = await POST(
          request(
            "Oi, agora posso falar.",
            undefined,
            "CUSTOMER_INBOUND",
          ),
          context,
        )
        const body = await response.json()

        expect(body.interactionState).toMatchObject({
          sourceType: "CUSTOMER_INBOUND",
          customerHasReplied: true,
          responseStatus: "RESPONDED",
          consultantContext:
            "Cliente nunca respondeu",
        })
        expect(
          mocks.upsertMemory.mock.calls[0]?.[0]
            .create,
        ).toMatchObject({
          lastIncomingMessage:
            "Oi, agora posso falar.",
          factProvenance: {
            lastIncomingMessage:
              "customer_message",
          },
        })
      },
    )

    it(
      "mantém outro relato do consultor fora de lastIncomingMessage",
      async () => {
        const consultantContext =
          "Cliente pediu para retornar mês que vem."
        const response = await POST(
          request(
            consultantContext,
            undefined,
            "CONSULTANT_CONTEXT",
          ),
          context,
        )

        expect(response.status).toBe(200)
        expect(
          mocks.upsertMemory.mock.calls[0]?.[0]
            .create,
        ).toMatchObject({
          lastIncomingMessage: null,
          structuredFacts: {
            conversationInteraction: {
              sourceType:
                "CONSULTANT_CONTEXT",
              consultantContext,
            },
          },
        })
      },
    )

    it(
      "persiste conflito, pede humano uma vez e não apresenta resposta",
      async () => {
        const oldEvidence = processR2Evidence({
          opportunityId: "journey-1",
          subject: "Janaina",
          text: "Tenho R$ 50 mil para lance.",
          sourceType: "CUSTOMER_MESSAGE",
          sourceReference: "customer-message-1",
          observedAt: new Date("2026-08-14T12:00:00.000Z"),
        })

        mocks.findJourney.mockResolvedValue({
          ...journey(),
          conversationMemory: {
            structuredFacts:
              oldEvidence.structuredFacts,
            factProvenance:
              oldEvidence.factProvenance,
          },
        })

        const response = await POST(
          request(
            "Consultor: Ele tem R$ 200 mil para lance.",
          ),
          context,
        )
        const body = await response.json()

        expect(body.evidence).toMatchObject({
          status: "CONFLICTING",
          outcome: "HUMAN_CONFIRMATION_REQUIRED",
          humanConfirmationRequired: true,
        })
        expect(body.humanReview).toMatchObject({
          title: "Informação conflitante",
          confirmationAlreadyRequested: false,
        })
        expect(body.reply).toBeNull()
        expect(body.safetyCheck.status).toBe(
          "HUMAN_REVIEW_REQUIRED",
        )
        expect(
          mocks.upsertMemory.mock.calls[0]?.[0]
            .create.structuredFacts.r2Evidence.claims,
        ).toHaveLength(2)
      },
    )

    it(
      "encerra o caso real de rejeição repetida sem NBA, pergunta ou pressão",
      async () => {
        let structuredFacts: unknown = {}

        for (const message of [
          "Não tenho interesse.",
          "Já falei que não quero.",
          "Não quero.",
        ]) {
          const boundary = analyzeR2CustomerBoundary({
            opportunityId: "journey-1",
            message,
            structuredFacts,
          })
          structuredFacts = writeR2CustomerBoundaryMemory(
            structuredFacts,
            evolveR2CustomerBoundaryMemory({
              structuredFacts,
              boundary,
            }),
          )
        }

        mocks.findJourney.mockResolvedValue({
          ...journey(),
          conversationMemory: {
            structuredFacts,
            factProvenance: {},
            lastIncomingMessage:
              "Não quero.",
          },
        })

        const response = await POST(
          request("Já falei que não quero, que merda."),
          context,
        )
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.customerBoundary).toMatchObject({
          signal: "HOSTILE_REJECTION",
          state: "STOP_CURRENT_CONVERSATION",
          explicitRejectionCount: 4,
          terminal: true,
          outboundAutomationSuppressed: true,
        })
        expect(body.analysis).toMatchObject({
          intent: "not_interested",
          stage: "closing",
          intentConfidence: "HIGH",
          reasonForRejectionConfidence: "UNKNOWN",
        })
        expect(body.intelligence.nextBestAction).toMatchObject({
          source: "CUSTOMER_BOUNDARY",
          title: "Encerrar o contato respeitosamente",
        })
        expect(body.intelligence.commercialStrategy).toMatchObject({
          primaryTechnique: "none",
          supportingTechniques: [],
          callToAction: "Nenhum CTA comercial.",
          suggestedQuestion: null,
        })
        expect(body.reply).toBe(
          "Entendido. Desculpe pela insistência. Vou encerrar o contato por aqui.",
        )
        expect(body.reply).not.toContain("?")
        expect(body.safetyCheck.safeToPresent).toBe(true)
        expect(mocks.runDecisionEngine).toHaveBeenCalledWith(
          expect.objectContaining({
            customerBoundaryContext:
              expect.objectContaining({
                terminal: true,
              }),
          }),
        )
        expect(
          mocks.upsertMemory.mock.calls[0]?.[0]
            .create.structuredFacts.r2CustomerBoundary,
        ).toMatchObject({
          currentState: "STOP_CURRENT_CONVERSATION",
          explicitRejectionCount: 4,
        })
        expect(
          mocks.createEvent.mock.calls.map(
            (call) => call[0].data.payload.category,
          ),
        ).toEqual([
          "r2_customer_boundary_detected",
          "r2_intelligence_recommendation",
        ])
        expect(mocks.cancelTasks).toHaveBeenCalledOnce()
        expect(mocks.cancelCommitments).toHaveBeenCalledOnce()
      },
    )

    it(
      "bloqueia oportunidade de outro consultor",
      async () => {
        mocks.findJourney.mockResolvedValue(
          journey("consultant-2"),
        )

        const response =
          await POST(
            request(),
            context,
          )

        expect(response.status).toBe(403)
        expect(
          mocks.createEvent,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita atualização concorrente sem sobrescrever memória",
      async () => {
        mocks.updateJourneyVersion.mockResolvedValue({
          count: 0,
        })

        const response = await POST(
          request("Tenho R$ 100 mil para lance."),
          context,
        )

        expect(response.status).toBe(409)
        expect(mocks.upsertMemory).not.toHaveBeenCalled()
        expect(mocks.createEvent).not.toHaveBeenCalled()
      },
    )

    it(
      "não prepara mensagem de reativação sem contexto recente suficiente",
      async () => {
        mocks.findJourney.mockResolvedValue(
          journey(
            "consultant-1",
            "REACTIVATION",
          ),
        )

        const response =
          await POST(
            request(
              "Oi",
              undefined,
              "CONSULTANT_CONTEXT",
            ),
            context,
          )
        const body =
          await response.json()

        expect(response.status).toBe(200)
        expect(body.reply).toBeNull()
        expect(body.intelligence).toBeNull()

        expect(
          body.reconciliation,
        ).toMatchObject({
          status:
            "INSUFFICIENT",
        })
      },
    )

    it(
      "bloqueia sugestao quando observacao contradiz contexto salvo",
      async () => {
        mocks.findJourney.mockResolvedValue(
          journey(
            "consultant-1",
            "REACTIVATION",
            [
              {
                id:
                  "reactivation-context-1",
                contextSummary:
                  "Já apresentei o produto e fiz duas propostas. Depois disso ele não me respondeu mais.",
                contextState:
                  "PROVIDED",
              },
            ],
          ),
        )

        const response =
          await POST(
            request(
              "Ele não me respondeu.",
              undefined,
              "CONSULTANT_CONTEXT",
            ),
            context,
          )

        const body =
          await response.json()

        expect(response.status).toBe(200)

        expect(
          body.reconciliation,
        ).toMatchObject({
          status:
            "CONFLICT",
        })

        expect(body.reply).toBeNull()
        expect(body.intelligence).toBeNull()

        expect(
          mocks.createEvent,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "interrompe antes do banco quando a sessão não está autenticada",
      async () => {
        mocks.getContext.mockResolvedValue(
          Response.json(
            { error: "unauthorized" },
            { status: 401 },
          ),
        )

        const response =
          await POST(
            request(),
            context,
          )

        expect(response.status).toBe(401)
        expect(
          mocks.findJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "recusa payload vazio ou excessivo sem gerar recomendação",
      async () => {
        const empty =
          await POST(
            request(" "),
            context,
          )
        const oversized =
          await POST(
            request("x".repeat(5001)),
            context,
          )

        expect(empty.status).toBe(400)
        expect(oversized.status).toBe(400)
        expect(
          mocks.findJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "recusa texto sem origem semântica explícita",
      async () => {
        const response = await POST(
          new Request(
            "http://localhost/api/opportunities/journey-1/r2-intelligence",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                incomingMessage:
                  "Cliente nunca respondeu",
              }),
            },
          ),
          context,
        )

        expect(response.status).toBe(400)
        expect(
          mocks.findJourney,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
