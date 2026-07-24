import { describe, expect, it } from "vitest"

import type { AutomationJob } from "./types"

import {
  cancelAutomationJobs,
  createAutomationQueue,
  enqueueAutomationJobs,
  getReadyAutomationJobs,
} from "./queue"

const NOW = new Date("2026-07-22T15:00:00.000Z")

function createJob(
  overrides: Partial<AutomationJob> = {},
): AutomationJob {
  return {
    id: "job-1",
    workspaceId: "workspace-1",
    journeyId: "journey-1",
    strategyId: "strategy-1",
    strategyStepId: "step-1",
    source: "STRATEGY_STEP",
    actionType: "SEND_MESSAGE",
    channel: "WHATSAPP",
    title: "Enviar mensagem",
    description: "Teste",
    status: "READY",
    priority: "NORMAL",
    scheduledFor: NOW.toISOString(),
    availableAt: NOW.toISOString(),
    startedAt: null,
    completedAt: null,
    failedAt: null,
    cancelledAt: null,
    attemptCount: 0,
    maxAttempts: 3,
    lastFailureReason: null,
    payload: {},
    createdActionId: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

describe("automation queue", () => {
  it("deve criar uma fila vazia", () => {
    expect(createAutomationQueue()).toEqual({
      jobs: [],
      executions: [],
    })
  })

  it("deve adicionar trabalhos à fila", () => {
    const queue = createAutomationQueue()

    const result = enqueueAutomationJobs({
      queue,
      jobs: [
        createJob(),
      ],
    })

    expect(result.queue.jobs).toHaveLength(1)
    expect(result.enqueuedJobs).toHaveLength(1)
    expect(result.ignoredJobs).toEqual([])
  })

  it("deve ignorar trabalhos duplicados", () => {
    const queue = createAutomationQueue()

    const job = createJob()

    const first = enqueueAutomationJobs({
      queue,
      jobs: [job],
    })

    const second = enqueueAutomationJobs({
      queue: first.queue,
      jobs: [job],
    })

    expect(second.queue.jobs).toHaveLength(1)
    expect(second.enqueuedJobs).toHaveLength(0)
    expect(second.ignoredJobs).toHaveLength(1)
  })

  it("deve promover trabalhos pendentes para READY", () => {
    const queue = createAutomationQueue()

    const job = createJob({
      status: "PENDING",
      availableAt: "2026-07-22T14:00:00.000Z",
    })

    const result = enqueueAutomationJobs({
      queue,
      jobs: [job],
    })

    const ready = getReadyAutomationJobs({
      queue: result.queue,
      now: NOW,
    })

    expect(ready).toHaveLength(1)
    expect(ready[0].status).toBe("READY")
  })

  it("não deve promover trabalhos futuros", () => {
    const queue = createAutomationQueue()

    const job = createJob({
      status: "PENDING",
      availableAt: "2026-07-23T14:00:00.000Z",
    })

    const result = enqueueAutomationJobs({
      queue,
      jobs: [job],
    })

    const ready = getReadyAutomationJobs({
      queue: result.queue,
      now: NOW,
    })

    expect(ready).toEqual([])
  })

  it("deve ordenar por prioridade", () => {
    const queue = createAutomationQueue()

    const result = enqueueAutomationJobs({
      queue,
      jobs: [
        createJob({
          id: "low",
          priority: "LOW",
        }),
        createJob({
          id: "urgent",
          priority: "URGENT",
        }),
        createJob({
          id: "normal",
          priority: "NORMAL",
        }),
        createJob({
          id: "high",
          priority: "HIGH",
        }),
      ],
    })

    const jobs = getReadyAutomationJobs({
      queue: result.queue,
      now: NOW,
    })

    expect(jobs.map(job => job.id)).toEqual([
      "urgent",
      "high",
      "normal",
      "low",
    ])
  })

  it("deve respeitar o limite", () => {
    const queue = createAutomationQueue()

    const result = enqueueAutomationJobs({
      queue,
      jobs: [
        createJob({
          id: "1",
          priority: "URGENT",
        }),
        createJob({
          id: "2",
          priority: "HIGH",
        }),
        createJob({
          id: "3",
          priority: "NORMAL",
        }),
      ],
    })

    const jobs = getReadyAutomationJobs({
      queue: result.queue,
      now: NOW,
      limit: 2,
    })

    expect(jobs).toHaveLength(2)
  })

  it("deve cancelar apenas trabalhos ativos", () => {
    const queue = createAutomationQueue()

    const result = enqueueAutomationJobs({
      queue,
      jobs: [
        createJob({
          id: "ready",
        }),
        createJob({
          id: "completed",
          status: "COMPLETED",
        }),
      ],
    })

    const cancelled = cancelAutomationJobs({
      queue: result.queue,
      journeyId: "journey-1",
      now: NOW,
      reason: "teste",
    })

    expect(cancelled.cancelledJobs).toHaveLength(1)
    expect(cancelled.cancelledJobs[0].id).toBe("ready")
  })

  it("não deve cancelar quando não houver trabalhos ativos", () => {
    const queue = createAutomationQueue()

    const result = enqueueAutomationJobs({
      queue,
      jobs: [
        createJob({
          status: "COMPLETED",
        }),
      ],
    })

    const cancelled = cancelAutomationJobs({
      queue: result.queue,
      journeyId: "journey-1",
      now: NOW,
      reason: "teste",
    })

    expect(cancelled.cancelledJobs).toHaveLength(0)
    expect(cancelled.warnings).toHaveLength(1)
  })

  it("deve validar journeyId", () => {
    expect(() =>
      cancelAutomationJobs({
        queue: createAutomationQueue(),
        journeyId: " ",
        now: NOW,
        reason: "teste",
      }),
    ).toThrow()
  })

  it("deve validar o motivo do cancelamento", () => {
    expect(() =>
      cancelAutomationJobs({
        queue: createAutomationQueue(),
        journeyId: "journey-1",
        now: NOW,
        reason: " ",
      }),
    ).toThrow()
  })

  it("deve validar limite inválido", () => {
    expect(() =>
      getReadyAutomationJobs({
        queue: createAutomationQueue(),
        now: NOW,
        limit: 0,
      }),
    ).toThrow()
  })
})