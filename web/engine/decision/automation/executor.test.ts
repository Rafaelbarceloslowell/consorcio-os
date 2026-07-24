import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CommercialJourney,
  } from "@/types/domain"
  
  import {
    createAutomationAction,
    executeAutomationJob,
  } from "./executor"
  
  import type {
    AutomationJob,
  } from "./types"
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
  const NOW_ISO =
    "2026-07-22T15:00:00.000Z"
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id: "journey-test",
      workspaceId: "workspace-test",
      leadId: "lead-test",
      clientId: null,
      consultantId: "consultant-test",
      title: "Jornada comercial de teste",
      consortiumType: "real_estate",
      currentPhaseId: "phase-test",
      currentStateId: "state-test",
      priority: "HIGH",
      score: 80,
      outcome: null,
      stateEnteredAt:
        "2026-07-20T12:00:00.000Z",
      lastInteractionAt:
        "2026-07-21T12:00:00.000Z",
      closedAt: null,
      version: 1,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-21T12:00:00.000Z",
      ...overrides,
    }
  }
  
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
        "Enviar mensagem personalizada ao lead.",
      status: "READY",
      priority: "HIGH",
      scheduledFor:
        "2026-07-22T15:00:00.000Z",
      availableAt:
        "2026-07-22T15:00:00.000Z",
      startedAt: null,
      completedAt: null,
      failedAt: null,
      cancelledAt: null,
      attemptCount: 0,
      maxAttempts: 3,
      lastFailureReason: null,
      payload: {
        message:
          "Olá, podemos retomar nossa conversa?",
      },
      createdActionId: null,
      createdAt:
        "2026-07-22T14:00:00.000Z",
      updatedAt:
        "2026-07-22T14:00:00.000Z",
      ...overrides,
    }
  }
  
  describe(
    "createAutomationAction",
    () => {
      it(
        "deve criar uma ação comercial para um trabalho pronto",
        () => {
          const result =
            createAutomationAction({
              job:
                createJob(),
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.action,
          ).not.toBeNull()
  
          expect(
            result.action,
          ).toMatchObject({
            id:
              "job-test:action:1",
            workspaceId:
              "workspace-test",
            journeyId:
              "journey-test",
            type:
              "SEND_MESSAGE",
            status:
              "PENDING",
            origin:
              "SYSTEM",
            actorType:
              "AUTOMATION",
            actorId:
              null,
            title:
              "Enviar mensagem",
            description:
              "Enviar mensagem personalizada ao lead.",
            scheduledFor:
              "2026-07-22T15:00:00.000Z",
            createdAt:
              NOW_ISO,
            updatedAt:
              NOW_ISO,
          })
  
          expect(
            result.action?.payload,
          ).toEqual({
            message:
              "Olá, podemos retomar nossa conversa?",
            automationJobId:
              "job-test",
            strategyId:
              "strategy-test",
            strategyStepId:
              "step-test",
            automationChannel:
              "WHATSAPP",
            automationAttempt:
              1,
          })
  
          expect(
            result.warnings,
          ).toEqual([])
        },
      )
  
      it(
        "deve reutilizar a tentativa atual quando o trabalho estiver em execução",
        () => {
          const result =
            createAutomationAction({
              job:
                createJob({
                  status:
                    "IN_PROGRESS",
                  attemptCount:
                    2,
                }),
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.action?.id,
          ).toBe(
            "job-test:action:2",
          )
  
          expect(
            result.action?.payload,
          ).toMatchObject({
            automationAttempt:
              2,
          })
        },
      )
  
      it(
        "não deve criar ação para um trabalho com status inválido",
        () => {
          const result =
            createAutomationAction({
              job:
                createJob({
                  status:
                    "PENDING",
                }),
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.action,
          ).toBeNull()
  
          expect(
            result.warnings,
          ).toContain(
            'O trabalho de automação "job-test" está com status PENDING e não pode gerar uma ação.',
          )
        },
      )
  
      it(
        "deve rejeitar trabalho de outro workspace",
        () => {
          expect(() =>
            createAutomationAction({
              job:
                createJob({
                  workspaceId:
                    "workspace-other",
                }),
              journey:
                createJourney(),
              now: NOW,
            }),
          ).toThrow(
            'O trabalho de automação "job-test" não pertence ao workspace da jornada "journey-test".',
          )
        },
      )
  
      it(
        "deve rejeitar trabalho de outra jornada",
        () => {
          expect(() =>
            createAutomationAction({
              job:
                createJob({
                  journeyId:
                    "journey-other",
                }),
              journey:
                createJourney(),
              now: NOW,
            }),
          ).toThrow(
            'O trabalho de automação "job-test" não pertence à jornada "journey-test".',
          )
        },
      )
    },
  )
  
  describe(
    "executeAutomationJob",
    () => {
      it(
        "deve executar um trabalho pronto com sucesso",
        () => {
          const originalJob =
            createJob()
  
          const result =
            executeAutomationJob({
              job:
                originalJob,
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.job.status,
          ).toBe(
            "COMPLETED",
          )
  
          expect(
            result.job.attemptCount,
          ).toBe(1)
  
          expect(
            result.job.startedAt,
          ).toBe(
            NOW_ISO,
          )
  
          expect(
            result.job.completedAt,
          ).toBe(
            NOW_ISO,
          )
  
          expect(
            result.job.createdActionId,
          ).toBe(
            "job-test:action:1",
          )
  
          expect(
            result.execution,
          ).toMatchObject({
            id:
              "job-test:execution:1",
            automationJobId:
              "job-test",
            workspaceId:
              "workspace-test",
            journeyId:
              "journey-test",
            attempt:
              1,
            status:
              "SUCCEEDED",
            startedAt:
              NOW_ISO,
            finishedAt:
              NOW_ISO,
            failureReason:
              null,
            createdActionId:
              "job-test:action:1",
          })
  
          expect(
            result.action?.id,
          ).toBe(
            "job-test:action:1",
          )
  
          expect(
            result.action?.payload,
          ).toMatchObject({
            automationAttempt:
              1,
          })
  
          expect(
            result.warnings,
          ).toEqual([])
        },
      )
  
      it(
        "deve manter job, execução e ação na mesma tentativa",
        () => {
          const result =
            executeAutomationJob({
              job:
                createJob({
                  attemptCount:
                    1,
                }),
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.job.attemptCount,
          ).toBe(2)
  
          expect(
            result.execution.attempt,
          ).toBe(2)
  
          expect(
            result.action?.payload,
          ).toMatchObject({
            automationAttempt:
              2,
          })
  
          expect(
            result.action?.id,
          ).toBe(
            "job-test:action:2",
          )
  
          expect(
            result.execution.id,
          ).toBe(
            "job-test:execution:2",
          )
        },
      )
  
      it(
        "não deve alterar o trabalho original",
        () => {
          const originalJob =
            createJob()
  
          const originalSnapshot =
            structuredClone(
              originalJob,
            )
  
          const result =
            executeAutomationJob({
              job:
                originalJob,
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            originalJob,
          ).toEqual(
            originalSnapshot,
          )
  
          expect(
            originalJob.status,
          ).toBe(
            "READY",
          )
  
          expect(
            originalJob.attemptCount,
          ).toBe(0)
  
          expect(
            result.job,
          ).not.toBe(
            originalJob,
          )
        },
      )
  
      it(
        "deve ignorar um trabalho já encerrado",
        () => {
          const job =
            createJob({
              status:
                "COMPLETED",
              attemptCount:
                1,
              completedAt:
                "2026-07-22T14:30:00.000Z",
            })
  
          const result =
            executeAutomationJob({
              job,
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.job,
          ).toBe(job)
  
          expect(
            result.execution.status,
          ).toBe(
            "SKIPPED",
          )
  
          expect(
            result.execution.attempt,
          ).toBe(2)
  
          expect(
            result.action,
          ).toBeNull()
  
          expect(
            result.warnings,
          ).toContain(
            'O trabalho "job-test" já está encerrado com status COMPLETED.',
          )
        },
      )
  
      it(
        "deve ignorar um trabalho que não esteja pronto",
        () => {
          const job =
            createJob({
              status:
                "PENDING",
            })
  
          const result =
            executeAutomationJob({
              job,
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.job,
          ).toBe(job)
  
          expect(
            result.execution.status,
          ).toBe(
            "SKIPPED",
          )
  
          expect(
            result.execution.attempt,
          ).toBe(1)
  
          expect(
            result.action,
          ).toBeNull()
  
          expect(
            result.warnings,
          ).toContain(
            'O trabalho "job-test" não está pronto para execução. Status atual: PENDING.',
          )
        },
      )
  
      it(
        "deve cancelar o trabalho quando a jornada estiver encerrada",
        () => {
          const result =
            executeAutomationJob({
              job:
                createJob(),
              journey:
                createJourney({
                  outcome:
                    "NO_RESPONSE",
                  closedAt:
                    "2026-07-22T14:00:00.000Z",
                }),
              now: NOW,
            })
  
          expect(
            result.job.status,
          ).toBe(
            "CANCELLED",
          )
  
          expect(
            result.job.attemptCount,
          ).toBe(1)
  
          expect(
            result.job.cancelledAt,
          ).toBe(
            NOW_ISO,
          )
  
          expect(
            result.execution.status,
          ).toBe(
            "CANCELLED",
          )
  
          expect(
            result.execution.attempt,
          ).toBe(1)
  
          expect(
            result.action,
          ).toBeNull()
        },
      )
  
      it(
        "deve falhar quando o limite máximo de tentativas for excedido",
        () => {
          const result =
            executeAutomationJob({
              job:
                createJob({
                  attemptCount:
                    3,
                  maxAttempts:
                    3,
                }),
              journey:
                createJourney(),
              now: NOW,
            })
  
          expect(
            result.job.status,
          ).toBe(
            "FAILED",
          )
  
          expect(
            result.job.attemptCount,
          ).toBe(4)
  
          expect(
            result.job.failedAt,
          ).toBe(
            NOW_ISO,
          )
  
          expect(
            result.execution.status,
          ).toBe(
            "FAILED",
          )
  
          expect(
            result.execution.attempt,
          ).toBe(4)
  
          expect(
            result.action,
          ).toBeNull()
  
          expect(
            result.warnings,
          ).toContain(
            'O trabalho "job-test" excedeu o limite de 3 tentativas.',
          )
        },
      )
  
      it(
        "deve rejeitar trabalho de outro workspace",
        () => {
          expect(() =>
            executeAutomationJob({
              job:
                createJob({
                  workspaceId:
                    "workspace-other",
                }),
              journey:
                createJourney(),
              now: NOW,
            }),
          ).toThrow(
            'O trabalho de automação "job-test" não pertence ao workspace da jornada "journey-test".',
          )
        },
      )
  
      it(
        "deve rejeitar trabalho de outra jornada",
        () => {
          expect(() =>
            executeAutomationJob({
              job:
                createJob({
                  journeyId:
                    "journey-other",
                }),
              journey:
                createJourney(),
              now: NOW,
            }),
          ).toThrow(
            'O trabalho de automação "job-test" não pertence à jornada "journey-test".',
          )
        },
      )
    },
  )