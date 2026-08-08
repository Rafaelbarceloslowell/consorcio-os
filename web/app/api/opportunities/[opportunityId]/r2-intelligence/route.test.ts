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
    listCandidates: vi.fn(),
    findAllEvents: vi.fn(),
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

import {
  POST,
} from "./route"

const context = {
  params: Promise.resolve({
    opportunityId: "journey-1",
  }),
}

function request(
  incomingMessage =
    "Qual o valor da parcela?",
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
      }),
    },
  )
}

function journey(
  consultantId = "consultant-1",
  approachType = "NEW",
) {
  return {
    id: "journey-1",
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
    nextBestActions: [
      {
        id: "nba-1",
        title:
          "Confirmar objetivo e prazo",
        reason:
          "A decisão operacional existente tem prioridade.",
      },
    ],
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
      mocks.createEvent.mockResolvedValue({
        id: "event-1",
      })
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
            commercialTechniqueIds:
              expect.any(Array),
            learningEvidenceCount:
              expect.any(Number),
          }),
        )
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
            request("Oi"),
            context,
          )
        const body =
          await response.json()

        expect(response.status).toBe(200)
        expect(body.reply).toBeNull()
        expect(
          body.intelligence.confidence,
        ).toBe("INSUFFICIENT_DATA")
        expect(
          body.intelligence.missingData,
        ).toContain(
          "recentConversationContext",
        )
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
  },
)
