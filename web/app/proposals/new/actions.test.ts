import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  ProposalCreateActionState,
} from "@/types/proposal-operational"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  transaction: vi.fn(),
  findLead: vi.fn(),
  findConsortium: vi.fn(),
  createProposal: vi.fn(),
  createTask: vi.fn(),
  createEvent: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

vi.mock(
  "node:crypto",
  () => ({
    randomUUID: () =>
      "12345678-1234-1234-1234-123456789012",
  }),
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

vi.mock("next/cache", () => ({
  revalidatePath:
    mocks.revalidatePath,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

import {
  createProposalAction,
} from "./actions"

const initialState:
  ProposalCreateActionState = {
    status: "idle",
    message: null,
  }

function futureDate(): string {
  return new Date(
    Date.now() +
      7 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10)
}

function formData(
  overrides: Record<
    string,
    string
  > = {},
): FormData {
  const values = {
    leadId: "lead-1",
    consortiumId:
      "consortium-1",
    creditValue:
      "500.000,00",
    installmentValue:
      "1.397,50",
    termMonths: "200",
    administrationFeePercent:
      "20",
    reserveFundPercent:
      "2",
    validUntil:
      futureDate(),
    notes:
      "Condição inicial.",
    ...overrides,
  }

  const data =
    new FormData()

  for (const [key, value] of
    Object.entries(values)) {
    data.set(key, value)
  }

  return data
}

function transactionClient() {
  return {
    lead: {
      findFirst:
        mocks.findLead,
    },
    consortium: {
      findFirst:
        mocks.findConsortium,
    },
    proposal: {
      create:
        mocks.createProposal,
    },
    task: {
      create:
        mocks.createTask,
    },
    commercialEvent: {
      create:
        mocks.createEvent,
    },
  }
}

describe(
  "createProposalAction",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      mocks.findWorkspace
        .mockResolvedValue({
          id: "workspace-1",
        })
      mocks.findLead
        .mockResolvedValue({
          id: "lead-1",
          name: "Rosecleia",
          consultantId:
            "consultant-1",
          commercialJourneys: [
            {
              id: "journey-1",
            },
          ],
        })
      mocks.findConsortium
        .mockResolvedValue({
          id: "consortium-1",
          minCreditValue:
            100000,
          maxCreditValue:
            1000000,
        })
      mocks.createProposal
        .mockResolvedValue({
          id: "proposal-1",
          code:
            "GOS-2026-12345678",
        })
      mocks.createTask
        .mockResolvedValue({
          id: "task-1",
        })
      mocks.createEvent
        .mockResolvedValue({
          id: "event-1",
        })
      mocks.transaction
        .mockImplementation(
          async (
            operation: (
              transaction:
                ReturnType<
                  typeof transactionClient
                >,
            ) => unknown,
          ) =>
            operation(
              transactionClient(),
            ),
        )
    })

    it(
      "cria proposta em rascunho sem cliente e sem venda",
      async () => {
        const forged =
          formData()
        forged.set(
          "clientId",
          "client-forged",
        )
        forged.set(
          "saleId",
          "sale-forged",
        )

        await expect(
          createProposalAction(
            initialState,
            forged,
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.createProposal,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              workspaceId:
                "workspace-1",
              leadId:
                "lead-1",
              clientId:
                null,
              consultantId:
                "consultant-1",
              consortiumId:
                "consortium-1",
              status:
                "DRAFT",
              acceptedAt:
                null,
            }),
          select: {
            id: true,
            code: true,
          },
        })

        expect(
          mocks.createTask,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              leadId:
                "lead-1",
              clientId:
                null,
              proposalId:
                "proposal-1",
              type:
                "PROPOSAL_REVIEW",
            }),
          select: {
            id: true,
          },
        })

        expect(
          mocks.createEvent,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              payload:
                expect.objectContaining({
                  clientId:
                    null,
                  clientCreated:
                    false,
                }),
            }),
        })

        expect(
          mocks.redirect,
        ).toHaveBeenCalledWith(
          "/proposals",
        )
      },
    )

    it(
      "bloqueia crédito fora do grupo",
      async () => {
        const result =
          await createProposalAction(
            initialState,
            formData({
              creditValue:
                "2000000",
            }),
          )

        expect(result).toMatchObject({
          status: "error",
          fieldErrors: {
            creditValue:
              expect.stringContaining(
                "entre",
              ),
          },
        })

        expect(
          mocks.createProposal,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
