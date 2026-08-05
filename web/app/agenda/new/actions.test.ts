import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  AgendaCreateActionState,
} from "@/types/agenda"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  transaction: vi.fn(),
  findLead: vi.fn(),
  createTask: vi.fn(),
  createMeeting: vi.fn(),
  createEvent: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

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
  createAgendaCommitmentAction,
} from "./actions"

const initialState:
  AgendaCreateActionState = {
    status: "idle",
    message: null,
  }

function futureLocal(
  hours: number,
): string {
  return new Date(
    Date.now() +
      hours * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 16)
}

function formData(
  overrides: Record<
    string,
    string
  > = {},
): FormData {
  const values = {
    kind: "task",
    leadId: "lead-1",
    title:
      "Retornar contato",
    description:
      "Confirmar interesse.",
    startAt:
      futureLocal(24),
    endAt:
      futureLocal(25),
    meetingType:
      "online",
    taskType:
      "follow_up",
    priority:
      "high",
    location: "",
    meetingUrl:
      "https://meet.example.com/test",
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
    task: {
      create:
        mocks.createTask,
    },
    meeting: {
      create:
        mocks.createMeeting,
    },
    commercialEvent: {
      create:
        mocks.createEvent,
    },
  }
}

describe(
  "createAgendaCommitmentAction",
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
      mocks.createTask
        .mockResolvedValue({
          id: "task-1",
        })
      mocks.createMeeting
        .mockResolvedValue({
          id: "meeting-1",
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
      "cria tarefa para lead sem clientId",
      async () => {
        await expect(
          createAgendaCommitmentAction(
            initialState,
            formData(),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.createTask,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              workspaceId:
                "workspace-1",
              leadId:
                "lead-1",
              clientId:
                null,
              assignedToId:
                "consultant-1",
              type:
                "FOLLOW_UP",
              status:
                "PENDING",
              priority:
                "HIGH",
            }),
          select: {
            id: true,
          },
        })

        expect(
          mocks.createMeeting,
        ).not.toHaveBeenCalled()
        expect(
          mocks.redirect,
        ).toHaveBeenCalledWith(
          "/agenda",
        )
      },
    )

    it(
      "cria reunião para lead sem clientId",
      async () => {
        await expect(
          createAgendaCommitmentAction(
            initialState,
            formData({
              kind:
                "meeting",
            }),
          ),
        ).rejects.toThrow(
          "NEXT_REDIRECT",
        )

        expect(
          mocks.createMeeting,
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
              type:
                "ONLINE",
              status:
                "SCHEDULED",
            }),
          select: {
            id: true,
          },
        })

        expect(
          mocks.createTask,
        ).not.toHaveBeenCalled()
        expect(
          mocks.createEvent,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              type:
                "MEETING_SCHEDULED",
              payload:
                expect.objectContaining({
                  clientId:
                    null,
                }),
            }),
        })
      },
    )
  },
)
