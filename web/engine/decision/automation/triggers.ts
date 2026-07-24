import type {
    AutomationJob,
    HandleAutomationTriggerInput,
    HandleAutomationTriggerOutput,
  } from "./types"
  
  function isFinalJobStatus(
    job: AutomationJob,
  ): boolean {
    return (
      job.status === "COMPLETED" ||
      job.status === "FAILED" ||
      job.status === "CANCELLED" ||
      job.status === "SKIPPED"
    )
  }
  
  function getTriggerJobId(
    payload: Record<string, unknown>,
  ): string | null {
    const automationJobId =
      payload.automationJobId
  
    if (
      typeof automationJobId !== "string"
    ) {
      return null
    }
  
    const normalizedJobId =
      automationJobId.trim()
  
    if (
      normalizedJobId.length === 0
    ) {
      return null
    }
  
    return normalizedJobId
  }
  
  function shouldCancelForJourneyStateChange(
    payload: Record<string, unknown>,
  ): boolean {
    return (
      payload.isClosed === true ||
      payload.closed === true ||
      payload.isFinal === true
    )
  }
  
  function makeJobReady(
    job: AutomationJob,
    now: Date,
  ): AutomationJob {
    const timestamp =
      now.toISOString()
  
    return {
      ...job,
  
      status:
        "READY",
  
      availableAt:
        timestamp,
  
      scheduledFor:
        timestamp,
  
      updatedAt:
        timestamp,
    }
  }
  
  function cancelJob(
    job: AutomationJob,
    now: Date,
    reason: string,
  ): AutomationJob {
    const timestamp =
      now.toISOString()
  
    return {
      ...job,
  
      status:
        "CANCELLED",
  
      cancelledAt:
        timestamp,
  
      lastFailureReason:
        reason,
  
      updatedAt:
        timestamp,
    }
  }
  
  export function handleAutomationTrigger({
    queue,
    trigger,
    now,
  }: HandleAutomationTriggerInput): HandleAutomationTriggerOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
    const affectedJobs: AutomationJob[] = []
  
    const normalizedTriggerJourneyId =
      trigger.journeyId.trim()
  
    if (
      normalizedTriggerJourneyId.length === 0
    ) {
      throw new Error(
        "O ID da jornada do gatilho de automação é obrigatório.",
      )
    }
  
    if (
      trigger.workspaceId.trim().length === 0
    ) {
      throw new Error(
        "O ID do workspace do gatilho de automação é obrigatório.",
      )
    }
  
    const triggerJobId =
      getTriggerJobId(
        trigger.payload,
      )
  
    const updatedJobs =
      queue.jobs.map(
        (job) => {
          if (
            job.workspaceId !==
            trigger.workspaceId
          ) {
            return job
          }
  
          if (
            job.journeyId !==
            normalizedTriggerJourneyId
          ) {
            return job
          }
  
          if (
            triggerJobId !== null &&
            job.id !== triggerJobId
          ) {
            return job
          }
  
          if (
            isFinalJobStatus(job)
          ) {
            return job
          }
  
          if (
            trigger.type ===
            "LEAD_RESPONDED"
          ) {
            const reason =
              `O trabalho "${job.id}" foi cancelado porque o lead respondeu na jornada "${trigger.journeyId}".`
  
            const cancelledJob =
              cancelJob(
                job,
                now,
                reason,
              )
  
            affectedJobs.push(
              cancelledJob,
            )
  
            return cancelledJob
          }
  
          if (
            trigger.type ===
              "JOURNEY_STATE_CHANGED" &&
            shouldCancelForJourneyStateChange(
              trigger.payload,
            )
          ) {
            const reason =
              `O trabalho "${job.id}" foi cancelado porque a jornada "${trigger.journeyId}" entrou em um estado final.`
  
            const cancelledJob =
              cancelJob(
                job,
                now,
                reason,
              )
  
            affectedJobs.push(
              cancelledJob,
            )
  
            return cancelledJob
          }
  
          if (
            trigger.type ===
              "MANUAL" ||
            trigger.type ===
              "SYSTEM" ||
            trigger.type ===
              "SCHEDULED_TIME"
          ) {
            if (
              job.status !==
              "PENDING"
            ) {
              return job
            }
  
            const readyJob =
              makeJobReady(
                job,
                now,
              )
  
            affectedJobs.push(
              readyJob,
            )
  
            return readyJob
          }
  
          return job
        },
      )
  
    if (
      trigger.type ===
      "COMMERCIAL_EVENT"
    ) {
      diagnostics.push(
        `O evento comercial "${trigger.id}" foi registrado para a jornada "${trigger.journeyId}", mas não alterou diretamente a fila de automação.`,
      )
    }
  
    if (
      trigger.type ===
        "JOURNEY_STATE_CHANGED" &&
      !shouldCancelForJourneyStateChange(
        trigger.payload,
      )
    ) {
      diagnostics.push(
        `A mudança de estado da jornada "${trigger.journeyId}" não representa um encerramento e não cancelou trabalhos de automação.`,
      )
    }
  
    diagnostics.push(
      `${affectedJobs.length} trabalhos foram afetados pelo gatilho "${trigger.id}" do tipo ${trigger.type}.`,
    )
  
    if (
      affectedJobs.length === 0
    ) {
      warnings.push(
        `Nenhum trabalho ativo foi encontrado para o gatilho "${trigger.id}".`,
      )
    }
  
    return {
      queue: {
        jobs:
          updatedJobs,
  
        executions: [
          ...queue.executions,
        ],
      },
  
      affectedJobs,
      diagnostics,
      warnings,
    }
  }