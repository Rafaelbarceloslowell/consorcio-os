import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  findAction: vi.fn(),
  findLostState: vi.fn(),
  updateAction: vi.fn(),
  updateJourney: vi.fn(),
  updateLead: vi.fn(),
  createTask: vi.fn(),
  createEvent: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findFirst:
          mocks.findWorkspace,
      },
      commercialAction: {
        findFirst:
          mocks.findAction,
      },
      journeyState: {
        findFirst:
          mocks.findLostState,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

import {
  POST,
} from "./route"

const action = {
  id: "action-1",
  workspaceId: "workspace-1",
  journeyId: "journey-1",
  status: "PENDING",
  origin: "NEXT_BEST_ACTION",
  actorId: "consultant-1",
  title: "Fazer novo contato com Rosecleia",
  payload: {},
  startedAt: null,
  journey: {
    consultantId:
      "consultant-1",
    leadId: "lead-1",
    clientId: null,
    closedAt: null,
  },
}

function request(
  body: unknown,
): Request {
  return new Request(
    "http://localhost/api/r2/actions/action-1/complete",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  )
}

const context = {
  params: Promise.resolve({
    actionId: "action-1",
  }),
}

describe(
  "POST /api/r2/actions/[actionId]/complete",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      mocks.findWorkspace.mockResolvedValue({
        id: "workspace-1",
      })
      mocks.findAction.mockResolvedValue(
        action,
      )
      mocks.updateAction.mockResolvedValue({
        count: 1,
      })
      mocks.updateJourney.mockResolvedValue({
        count: 1,
      })
      mocks.findLostState.mockResolvedValue({
        id: "state-lost",
      })
      mocks.updateLead.mockResolvedValue({
        count: 1,
      })
      mocks.createTask.mockResolvedValue({
        id: "task-1",
      })
      mocks.createEvent.mockResolvedValue({
        id: "event-1",
      })
      mocks.transaction.mockImplementation(
        async (
          operation: (
            transaction: unknown,
          ) => unknown,
        ) =>
          operation({
            commercialAction: {
              updateMany:
                mocks.updateAction,
            },
            commercialJourney: {
              updateMany:
                mocks.updateJourney,
            },
            lead: {
              updateMany:
                mocks.updateLead,
            },
            task: {
              create:
                mocks.createTask,
            },
            commercialEvent: {
              create:
                mocks.createEvent,
            },
          }),
      )
    })

    it(
      "registra o resultado, atualiza a última interação e conclui a ação",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome: "INTERESTED",
            notes:
              "Cliente pediu uma simulação.",
            nextFollowUpAt: null,
          }),
          context,
        )

        expect(response.status).toBe(200)

        expect(
          mocks.updateAction,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              id: "action-1",
              workspaceId:
                "workspace-1",
            }),
          data:
            expect.objectContaining({
              status: "COMPLETED",
              payload:
                expect.objectContaining({
                  contactOutcome:
                    expect.objectContaining({
                      contactMade: true,
                      outcome:
                        "INTERESTED",
                      notes:
                        "Cliente pediu uma simulação.",
                    }),
                }),
              completedAt:
                expect.any(Date),
            }),
        })

        expect(
          mocks.updateJourney,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              id: "journey-1",
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-1",
            }),
          data: {
            lastInteractionAt:
              expect.any(Date),
            version: {
              increment: 1,
            },
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
              type: "NOTE_ADDED",
              payload:
                expect.objectContaining({
                  category:
                    "r2_contact_outcome_recorded",
                  outcome:
                    "INTERESTED",
                }),
            }),
        })

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          actionId: "action-1",
          status: "COMPLETED",
          outcome: "INTERESTED",
          followUpTaskId: null,
        })
      },
    )

    it(
      "cria automaticamente a próxima tarefa quando existe retorno agendado",
      async () => {
        const nextFollowUpAt =
          new Date(
            Date.now() +
              24 * 60 * 60 * 1000,
          ).toISOString()

        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome: "FOLLOW_UP",
            notes:
              "Retornar com nova condição.",
            nextFollowUpAt,
          }),
          context,
        )

        expect(response.status).toBe(200)

        expect(
          mocks.createTask,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              workspaceId:
                "workspace-1",
              type: "FOLLOW_UP",
              status: "PENDING",
              priority: "MEDIUM",
              assignedToId:
                "consultant-1",
              leadId: "lead-1",
              title:
                "Retornar contato com Rosecleia",
              dueAt:
                expect.any(Date),
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
              type: "TASK_CREATED",
              payload:
                expect.objectContaining({
                  category:
                    "r2_follow_up_task_created",
                  taskId:
                    "task-1",
                }),
            }),
        })

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          followUpTaskId: "task-1",
        })
      },
    )

    it(
      "cria ligação prioritária cinco minutos após WhatsApp sem resposta",
      async () => {
        const beforeRequest =
          Date.now()

        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: false,
            outcome: "NO_ANSWER",
            notes: null,
            nextFollowUpAt: null,
          }),
          context,
        )

        const afterRequest =
          Date.now()

        expect(response.status).toBe(200)

        expect(
          mocks.createTask,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              workspaceId:
                "workspace-1",
              title:
                "Ligar para Rosecleia",
              description:
                "O cliente não respondeu ao WhatsApp. Faça uma ligação agora.",
              type: "FOLLOW_UP",
              status: "PENDING",
              priority: "HIGH",
              assignedToId:
                "consultant-1",
              leadId: "lead-1",
              clientId: null,
              dueAt:
                expect.any(Date),
            }),
          select: {
            id: true,
          },
        })

        const taskCall =
          mocks.createTask.mock.calls[0]?.[0]

        const dueAt =
          taskCall?.data?.dueAt as Date

        expect(
          dueAt.getTime(),
        ).toBeGreaterThanOrEqual(
          beforeRequest +
            5 * 60 * 1000,
        )

        expect(
          dueAt.getTime(),
        ).toBeLessThanOrEqual(
          afterRequest +
            5 * 60 * 1000,
        )

        expect(
          mocks.createEvent,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              type: "TASK_CREATED",
              payload:
                expect.objectContaining({
                  category:
                    "r2_no_answer_call_task_created",
                  taskId:
                    "task-1",
                  automaticNoAnswerCall:
                    true,
                  delayMinutes: 5,
                }),
            }),
        })

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          outcome: "NO_ANSWER",
          followUpTaskId: "task-1",
          message:
            "Resultado registrado. Se não houver resposta, a ligação entrará na fila em 5 minutos.",
        })
      },
    )

    it(
      "mantém NOT_INTERESTED sem desfecho comercial como oportunidade aberta",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome:
              "NOT_INTERESTED",
            notes:
              "Cliente ainda não explicou o motivo.",
            nextFollowUpAt:
              null,
          }),
          context,
        )

        expect(response.status).toBe(200)

        expect(
          mocks.findLostState,
        ).not.toHaveBeenCalled()

        expect(
          mocks.updateLead,
        ).not.toHaveBeenCalled()

        expect(
          mocks.updateJourney,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              id:
                "journey-1",
              closedAt:
                null,
            }),
          data: {
            lastInteractionAt:
              expect.any(Date),
            version: {
              increment:
                1,
            },
          },
        })

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          outcome:
            "NOT_INTERESTED",
          commercialOutcome:
            null,
          opportunityClosed:
            false,
        })
      },
    )

    it(
      "marca adiamento sem fechar a oportunidade",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome:
              "NOT_INTERESTED",
            commercialOutcome:
              "POSTPONED",
            notes:
              "Cliente quer retomar mais para frente.",
            nextFollowUpAt:
              null,
          }),
          context,
        )

        expect(response.status).toBe(200)

        expect(
          mocks.findLostState,
        ).not.toHaveBeenCalled()

        expect(
          mocks.updateLead,
        ).not.toHaveBeenCalled()

        expect(
          mocks.updateJourney,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              id:
                "journey-1",
              closedAt:
                null,
            }),
          data:
            expect.objectContaining({
              outcome:
                "POSTPONED",
              lastInteractionAt:
                expect.any(Date),
            }),
        })

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          outcome:
            "NOT_INTERESTED",
          commercialOutcome:
            "POSTPONED",
          opportunityClosed:
            false,
        })
      },
    )

    it(
      "encerra desistência definitiva com outcome específico e cancela ações abertas",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome:
              "NOT_INTERESTED",
            commercialOutcome:
              "CLIENT_WITHDREW",
            notes:
              "Cliente confirmou que desistiu do projeto.",
            nextFollowUpAt:
              null,
          }),
          context,
        )

        expect(response.status).toBe(200)

        expect(
          mocks.findLostState,
        ).toHaveBeenCalledWith({
          where: {
            workspaceId:
              "workspace-1",
            isFinal:
              true,
            isLost:
              true,
            isActive:
              true,
          },
          select: {
            id:
              true,
          },
          orderBy: {
            order:
              "asc",
          },
        })

        expect(
          mocks.updateJourney,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              id:
                "journey-1",
              closedAt:
                null,
            }),
          data:
            expect.objectContaining({
              currentStateId:
                "state-lost",
              stateEnteredAt:
                expect.any(Date),
              outcome:
                "CLIENT_WITHDREW",
              closedAt:
                expect.any(Date),
              lastInteractionAt:
                expect.any(Date),
            }),
        })

        expect(
          mocks.updateLead,
        ).toHaveBeenCalledWith({
          where: {
            id:
              "lead-1",
            workspaceId:
              "workspace-1",
            status: {
              notIn: [
                "LOST",
                "CONVERTED",
              ],
            },
          },
          data: {
            status:
              "LOST",
            lostReason:
              "Cliente confirmou que desistiu do projeto.",
            lastContactAt:
              expect.any(Date),
          },
        })

        expect(
          mocks.updateAction,
        ).toHaveBeenCalledWith({
          where:
            expect.objectContaining({
              workspaceId:
                "workspace-1",
              journeyId:
                "journey-1",
              id: {
                not:
                  "action-1",
              },
              status: {
                in: [
                  "PENDING",
                  "IN_PROGRESS",
                ],
              },
            }),
          data: {
            status:
              "CANCELLED",
            completedAt:
              expect.any(Date),
          },
        })

        expect(
          mocks.createEvent,
        ).toHaveBeenCalledWith({
          data:
            expect.objectContaining({
              type:
                "STATE_CHANGED",
              payload:
                expect.objectContaining({
                  category:
                    "r2_opportunity_lost",
                  commercialOutcome:
                    "CLIENT_WITHDREW",
                  lostReason:
                    "Cliente confirmou que desistiu do projeto.",
                }),
            }),
        })

        expect(
          mocks.createTask,
        ).not.toHaveBeenCalled()

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          outcome:
            "NOT_INTERESTED",
          commercialOutcome:
            "CLIENT_WITHDREW",
          opportunityClosed:
            true,
          followUpTaskId:
            null,
        })
      },
    )

    it(
      "não conclui sem um resultado válido",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome: "",
            notes: null,
            nextFollowUpAt: null,
          }),
          context,
        )

        expect(response.status).toBe(400)
        expect(
          mocks.updateAction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "exige data para um acompanhamento",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome: "FOLLOW_UP",
            notes: null,
            nextFollowUpAt: null,
          }),
          context,
        )

        expect(response.status).toBe(400)

        const payload =
          await response.json()

        expect(payload).toMatchObject({
          error:
            "Informe a data do próximo retorno.",
        })

        expect(
          mocks.updateAction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "impede outro consultor de registrar o resultado",
      async () => {
        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-2",
            contactMade: true,
            outcome: "INTERESTED",
            notes: null,
            nextFollowUpAt: null,
          }),
          context,
        )

        expect(response.status).toBe(403)
        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "não altera uma ação já concluída",
      async () => {
        mocks.findAction.mockResolvedValue({
          ...action,
          status: "COMPLETED",
        })

        const response = await POST(
          request({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome: "INTERESTED",
            notes: null,
            nextFollowUpAt: null,
          }),
          context,
        )

        expect(response.status).toBe(409)
        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
