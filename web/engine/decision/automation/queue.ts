import type {
    AutomationJob,
    AutomationQueue,
    CancelAutomationJobsInput,
    CancelAutomationJobsOutput,
    EnqueueAutomationJobsInput,
    EnqueueAutomationJobsOutput,
    GetReadyAutomationJobsInput,
  } from "./types"
  
  const PRIORITY_WEIGHT: Record<
    AutomationJob["priority"],
    number
  > = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4,
  }
  
  function isFinalStatus(
    status: AutomationJob["status"],
  ): boolean {
    return (
      status === "COMPLETED" ||
      status === "FAILED" ||
      status === "CANCELLED" ||
      status === "SKIPPED"
    )
  }
  
  function normalizeLimit(
    limit: number | undefined,
    totalJobs: number,
  ): number {
    if (limit === undefined) {
      return totalJobs
    }
  
    if (
      !Number.isInteger(limit) ||
      limit <= 0
    ) {
      throw new Error(
        "O limite de trabalhos da fila deve ser um número inteiro maior que zero.",
      )
    }
  
    return limit
  }
  
  function makePendingJobReady(
    job: AutomationJob,
    now: Date,
  ): AutomationJob {
    if (job.status !== "PENDING") {
      return job
    }
  
    const availableAt =
      new Date(job.availableAt)
  
    if (
      Number.isNaN(
        availableAt.getTime(),
      )
    ) {
      return job
    }
  
    if (
      availableAt.getTime() >
      now.getTime()
    ) {
      return job
    }
  
    return {
      ...job,
      status: "READY",
      updatedAt:
        now.toISOString(),
    }
  }
  
  function sortReadyJobs(
    jobs: AutomationJob[],
  ): AutomationJob[] {
    return [...jobs].sort(
      (firstJob, secondJob) => {
        const priorityDifference =
          PRIORITY_WEIGHT[
            secondJob.priority
          ] -
          PRIORITY_WEIGHT[
            firstJob.priority
          ]
  
        if (priorityDifference !== 0) {
          return priorityDifference
        }
  
        const availabilityDifference =
          firstJob.availableAt.localeCompare(
            secondJob.availableAt,
          )
  
        if (
          availabilityDifference !== 0
        ) {
          return availabilityDifference
        }
  
        const creationDifference =
          firstJob.createdAt.localeCompare(
            secondJob.createdAt,
          )
  
        if (
          creationDifference !== 0
        ) {
          return creationDifference
        }
  
        return firstJob.id.localeCompare(
          secondJob.id,
        )
      },
    )
  }
  
  export function createAutomationQueue(): AutomationQueue {
    return {
      jobs: [],
      executions: [],
    }
  }
  
  export function enqueueAutomationJobs({
    queue,
    jobs,
  }: EnqueueAutomationJobsInput): EnqueueAutomationJobsOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const existingJobIds =
      new Set(
        queue.jobs.map(
          (job) => job.id,
        ),
      )
  
    const enqueuedJobs: AutomationJob[] = []
    const ignoredJobs: AutomationJob[] = []
  
    for (const job of jobs) {
      if (
        existingJobIds.has(job.id)
      ) {
        ignoredJobs.push(job)
  
        warnings.push(
          `O trabalho de automação "${job.id}" já existe na fila e foi ignorado.`,
        )
  
        continue
      }
  
      existingJobIds.add(job.id)
      enqueuedJobs.push(job)
    }
  
    diagnostics.push(
      `${enqueuedJobs.length} trabalhos foram adicionados à fila de automação.`,
    )
  
    if (
      ignoredJobs.length > 0
    ) {
      diagnostics.push(
        `${ignoredJobs.length} trabalhos duplicados foram ignorados.`,
      )
    }
  
    return {
      queue: {
        jobs: [
          ...queue.jobs,
          ...enqueuedJobs,
        ],
        executions: [
          ...queue.executions,
        ],
      },
  
      enqueuedJobs,
      ignoredJobs,
      diagnostics,
      warnings,
    }
  }
  
  export function getReadyAutomationJobs({
    queue,
    now,
    limit,
  }: GetReadyAutomationJobsInput): AutomationJob[] {
    const normalizedLimit =
      normalizeLimit(
        limit,
        queue.jobs.length,
      )
  
    const normalizedJobs =
      queue.jobs.map(
        (job) =>
          makePendingJobReady(
            job,
            now,
          ),
      )
  
    queue.jobs =
      normalizedJobs
  
    const readyJobs =
      normalizedJobs.filter(
        (job) =>
          job.status === "READY",
      )
  
    return sortReadyJobs(
      readyJobs,
    ).slice(
      0,
      normalizedLimit,
    )
  }
  
  export function cancelAutomationJobs({
    queue,
    journeyId,
    now,
    reason,
  }: CancelAutomationJobsInput): CancelAutomationJobsOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const normalizedJourneyId =
      journeyId.trim()
  
    if (
      normalizedJourneyId.length === 0
    ) {
      throw new Error(
        "O ID da jornada é obrigatório para cancelar trabalhos de automação.",
      )
    }
  
    const normalizedReason =
      reason.trim()
  
    if (
      normalizedReason.length === 0
    ) {
      throw new Error(
        "O motivo do cancelamento dos trabalhos de automação é obrigatório.",
      )
    }
  
    const timestamp =
      now.toISOString()
  
    const cancelledJobs: AutomationJob[] = []
  
    const updatedJobs =
      queue.jobs.map(
        (job) => {
          if (
            job.journeyId !==
            normalizedJourneyId
          ) {
            return job
          }
  
          if (
            isFinalStatus(
              job.status,
            )
          ) {
            return job
          }
  
          const cancelledJob: AutomationJob = {
            ...job,
            status: "CANCELLED",
            cancelledAt:
              timestamp,
            lastFailureReason:
              normalizedReason,
            updatedAt:
              timestamp,
          }
  
          cancelledJobs.push(
            cancelledJob,
          )
  
          return cancelledJob
        },
      )
  
    diagnostics.push(
      `${cancelledJobs.length} trabalhos foram cancelados para a jornada "${normalizedJourneyId}".`,
    )
  
    if (
      cancelledJobs.length === 0
    ) {
      warnings.push(
        `Nenhum trabalho ativo foi encontrado para a jornada "${normalizedJourneyId}".`,
      )
    }
  
    return {
      queue: {
        jobs: updatedJobs,
        executions: [
          ...queue.executions,
        ],
      },
  
      cancelledJobs,
      diagnostics,
      warnings,
    }
  }