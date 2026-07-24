import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    handleAutomationTrigger,
  } from "./triggers"
  
  import type {
    AutomationJob,
    AutomationQueue,
    AutomationTrigger,
  } from "./types"
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
  function createJob(
    overrides: Partial<AutomationJob> = {},
  ): AutomationJob {
    return {
      id: "job-test",
      workspaceId: "workspace-test",
      journeyId: "journey-test",
      strategyId: "strategy-test",
      strategyStepId: "step-test",
      source: "STRATEGY_STEP",
      actionType: "SEND_MESSAGE",
      channel: "WHATSAPP",
      title: "Enviar mensagem",
      description:
        "Enviar mensagem automatizada.",
      status: "PENDING",
      priority: "HIGH",
      scheduledFor:
        "2026-07-23T15:00:00.000Z",
      availableAt:
        "2026-07-23T15:00:00.000Z",
      startedAt: null,
      completedAt: null,
      failedAt: null,
      cancelledAt: null,
      attemptCount: 0,
      maxAttempts: 3,
      lastFailureReason: null,
      payload: {},
      createdActionId: null,
      createdAt:
        "2026-07-22T14:00:00.000Z",
      updatedAt:
        "2026-07-22T14:00:00.000Z",
      ...overrides,
    }
  }
  
  function createQueue(
    jobs: AutomationJob[] = [],
  ): AutomationQueue {
    return {
      jobs,
      executions: [],
    }
  }
  
  function createTrigger(
    overrides: Partial<AutomationTrigger> = {},
  ): AutomationTrigger {
    return {
      id: "trigger-test",
      workspaceId: "workspace-test",
      journeyId: "journey-test",
      type: "MANUAL",
      occurredAt:
        "2026-07-22T15:00:00.000Z",
      payload: {},
      ...overrides,
    }
  }
  
  describe(
    "automation triggers",
    () => {
      it(
        "deve liberar um trabalho pendente por gatilho manual",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob(),
                ]),
              trigger:
                createTrigger({
                  type: "MANUAL",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.status,
          ).toBe(
            "READY",
          )
  
          expect(
            result.affectedJobs[0]?.scheduledFor,
          ).toBe(
            NOW.toISOString(),
          )
  
          expect(
            result.affectedJobs[0]?.availableAt,
          ).toBe(
            NOW.toISOString(),
          )
  
          expect(
            result.queue.jobs[0]?.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve liberar um trabalho pendente por gatilho do sistema",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob(),
                ]),
              trigger:
                createTrigger({
                  type: "SYSTEM",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve liberar um trabalho pendente por horário agendado",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob(),
                ]),
              trigger:
                createTrigger({
                  type:
                    "SCHEDULED_TIME",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "não deve alterar trabalho já pronto em gatilho manual",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    status: "READY",
                  }),
                ]),
              trigger:
                createTrigger({
                  type: "MANUAL",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toEqual([])
  
          expect(
            result.queue.jobs[0]?.status,
          ).toBe(
            "READY",
          )
  
          expect(
            result.warnings,
          ).toContain(
            'Nenhum trabalho ativo foi encontrado para o gatilho "trigger-test".',
          )
        },
      )
  
      it(
        "deve cancelar trabalhos ativos quando o lead responder",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    id: "job-pending",
                    status: "PENDING",
                  }),
  
                  createJob({
                    id: "job-ready",
                    status: "READY",
                  }),
  
                  createJob({
                    id: "job-progress",
                    status:
                      "IN_PROGRESS",
                  }),
                ]),
              trigger:
                createTrigger({
                  type:
                    "LEAD_RESPONDED",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(3)
  
          expect(
            result.affectedJobs.every(
              (job) =>
                job.status ===
                "CANCELLED",
            ),
          ).toBe(true)
  
          expect(
            result.queue.jobs.every(
              (job) =>
                job.status ===
                "CANCELLED",
            ),
          ).toBe(true)
  
          expect(
            result.affectedJobs[0]?.cancelledAt,
          ).toBe(
            NOW.toISOString(),
          )
        },
      )
  
      it(
        "não deve cancelar trabalhos finalizados quando o lead responder",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    id: "completed",
                    status:
                      "COMPLETED",
                  }),
  
                  createJob({
                    id: "failed",
                    status: "FAILED",
                  }),
  
                  createJob({
                    id: "cancelled",
                    status:
                      "CANCELLED",
                  }),
  
                  createJob({
                    id: "skipped",
                    status: "SKIPPED",
                  }),
                ]),
              trigger:
                createTrigger({
                  type:
                    "LEAD_RESPONDED",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toEqual([])
  
          expect(
            result.queue.jobs.map(
              (job) => job.status,
            ),
          ).toEqual([
            "COMPLETED",
            "FAILED",
            "CANCELLED",
            "SKIPPED",
          ])
        },
      )
  
      it(
        "deve cancelar trabalhos quando a jornada entrar em estado final",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    status: "READY",
                  }),
                ]),
              trigger:
                createTrigger({
                  type:
                    "JOURNEY_STATE_CHANGED",
                  payload: {
                    isFinal: true,
                  },
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.status,
          ).toBe(
            "CANCELLED",
          )
  
          expect(
            result.affectedJobs[0]?.lastFailureReason,
          ).toContain(
            "entrou em um estado final",
          )
        },
      )
  
      it(
        "deve aceitar isClosed como indicação de encerramento da jornada",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob(),
                ]),
              trigger:
                createTrigger({
                  type:
                    "JOURNEY_STATE_CHANGED",
                  payload: {
                    isClosed: true,
                  },
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.status,
          ).toBe(
            "CANCELLED",
          )
        },
      )
  
      it(
        "não deve cancelar trabalhos quando a mudança de estado não for final",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob(),
                ]),
              trigger:
                createTrigger({
                  type:
                    "JOURNEY_STATE_CHANGED",
                  payload: {
                    isFinal: false,
                  },
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toEqual([])
  
          expect(
            result.queue.jobs[0]?.status,
          ).toBe(
            "PENDING",
          )
  
          expect(
            result.diagnostics,
          ).toContain(
            'A mudança de estado da jornada "journey-test" não representa um encerramento e não cancelou trabalhos de automação.',
          )
        },
      )
  
      it(
        "deve afetar somente o trabalho informado no payload",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    id: "job-1",
                  }),
  
                  createJob({
                    id: "job-2",
                  }),
                ]),
              trigger:
                createTrigger({
                  type: "MANUAL",
                  payload: {
                    automationJobId:
                      "job-2",
                  },
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.id,
          ).toBe(
            "job-2",
          )
  
          expect(
            result.queue.jobs.find(
              (job) =>
                job.id === "job-1",
            )?.status,
          ).toBe(
            "PENDING",
          )
  
          expect(
            result.queue.jobs.find(
              (job) =>
                job.id === "job-2",
            )?.status,
          ).toBe(
            "READY",
          )
        },
      )
  
      it(
        "deve ignorar trabalhos de outra jornada",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    id: "current",
                    journeyId:
                      "journey-test",
                  }),
  
                  createJob({
                    id: "other",
                    journeyId:
                      "journey-other",
                  }),
                ]),
              trigger:
                createTrigger({
                  type:
                    "LEAD_RESPONDED",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.id,
          ).toBe(
            "current",
          )
  
          expect(
            result.queue.jobs.find(
              (job) =>
                job.id === "other",
            )?.status,
          ).toBe(
            "PENDING",
          )
        },
      )
  
      it(
        "deve ignorar trabalhos de outro workspace",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob({
                    id: "current",
                    workspaceId:
                      "workspace-test",
                  }),
  
                  createJob({
                    id: "other",
                    workspaceId:
                      "workspace-other",
                  }),
                ]),
              trigger:
                createTrigger({
                  type:
                    "LEAD_RESPONDED",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toHaveLength(1)
  
          expect(
            result.affectedJobs[0]?.id,
          ).toBe(
            "current",
          )
  
          expect(
            result.queue.jobs.find(
              (job) =>
                job.id === "other",
            )?.status,
          ).toBe(
            "PENDING",
          )
        },
      )
  
      it(
        "deve registrar evento comercial sem alterar diretamente a fila",
        () => {
          const result =
            handleAutomationTrigger({
              queue:
                createQueue([
                  createJob(),
                ]),
              trigger:
                createTrigger({
                  type:
                    "COMMERCIAL_EVENT",
                }),
              now: NOW,
            })
  
          expect(
            result.affectedJobs,
          ).toEqual([])
  
          expect(
            result.queue.jobs[0]?.status,
          ).toBe(
            "PENDING",
          )
  
          expect(
            result.diagnostics,
          ).toContain(
            'O evento comercial "trigger-test" foi registrado para a jornada "journey-test", mas não alterou diretamente a fila de automação.',
          )
        },
      )
  
      it(
        "deve preservar execuções existentes na fila",
        () => {
          const queue =
            createQueue([
              createJob(),
            ])
  
          queue.executions.push({
            id: "execution-existing",
            automationJobId:
              "job-existing",
            workspaceId:
              "workspace-test",
            journeyId:
              "journey-test",
            attempt: 1,
            status: "SUCCEEDED",
            startedAt:
              "2026-07-21T15:00:00.000Z",
            finishedAt:
              "2026-07-21T15:00:00.000Z",
            failureReason: null,
            createdActionId:
              "action-existing",
            output: {},
          })
  
          const result =
            handleAutomationTrigger({
              queue,
              trigger:
                createTrigger({
                  type: "MANUAL",
                }),
              now: NOW,
            })
  
          expect(
            result.queue.executions,
          ).toHaveLength(1)
  
          expect(
            result.queue.executions[0]?.id,
          ).toBe(
            "execution-existing",
          )
        },
      )
  
      it(
        "deve rejeitar gatilho sem ID de jornada",
        () => {
          expect(() =>
            handleAutomationTrigger({
              queue:
                createQueue(),
              trigger:
                createTrigger({
                  journeyId: " ",
                }),
              now: NOW,
            }),
          ).toThrow(
            "O ID da jornada do gatilho de automação é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar gatilho sem ID de workspace",
        () => {
          expect(() =>
            handleAutomationTrigger({
              queue:
                createQueue(),
              trigger:
                createTrigger({
                  workspaceId: " ",
                }),
              now: NOW,
            }),
          ).toThrow(
            "O ID do workspace do gatilho de automação é obrigatório.",
          )
        },
      )
    },
  )