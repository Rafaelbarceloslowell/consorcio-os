import type {
    CommercialAction,
    EntityId,
  } from "@/types/domain"
  
  import type {
    AutomationActionFactoryInput,
    AutomationActionFactoryOutput,
    AutomationExecution,
    AutomationJob,
    ExecuteAutomationJobInput,
    ExecuteAutomationJobOutput,
  } from "./types"
  
  function createActionId(
    jobId: EntityId,
    attempt: number,
  ): EntityId {
    return `${jobId}:action:${attempt}`
  }
  
  function createExecutionId(
    jobId: EntityId,
    attempt: number,
  ): EntityId {
    return `${jobId}:execution:${attempt}`
  }
  
  function isJourneyClosed(
    input: ExecuteAutomationJobInput,
  ): boolean {
    return (
      input.journey.closedAt !== null ||
      input.journey.outcome !== null
    )
  }
  
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
  
  function resolveActionAttempt(
    job: AutomationJob,
  ): number {
    if (job.status === "IN_PROGRESS") {
      return job.attemptCount
    }
  
    return job.attemptCount + 1
  }
  
  function createSkippedExecution(
    job: AutomationJob,
    now: Date,
    reason: string,
  ): AutomationExecution {
    const attempt =
      job.attemptCount + 1
  
    const timestamp =
      now.toISOString()
  
    return {
      id: createExecutionId(
        job.id,
        attempt,
      ),
  
      automationJobId:
        job.id,
  
      workspaceId:
        job.workspaceId,
  
      journeyId:
        job.journeyId,
  
      attempt,
  
      status:
        "SKIPPED",
  
      startedAt:
        timestamp,
  
      finishedAt:
        timestamp,
  
      failureReason:
        reason,
  
      createdActionId:
        null,
  
      output: {
        reason,
      },
    }
  }
  
  function createCancelledExecution(
    job: AutomationJob,
    now: Date,
    reason: string,
  ): AutomationExecution {
    const attempt =
      job.attemptCount + 1
  
    const timestamp =
      now.toISOString()
  
    return {
      id: createExecutionId(
        job.id,
        attempt,
      ),
  
      automationJobId:
        job.id,
  
      workspaceId:
        job.workspaceId,
  
      journeyId:
        job.journeyId,
  
      attempt,
  
      status:
        "CANCELLED",
  
      startedAt:
        timestamp,
  
      finishedAt:
        timestamp,
  
      failureReason:
        reason,
  
      createdActionId:
        null,
  
      output: {
        reason,
      },
    }
  }
  
  export function createAutomationAction({
    job,
    journey,
    now,
  }: AutomationActionFactoryInput): AutomationActionFactoryOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    if (
      job.workspaceId !==
      journey.workspaceId
    ) {
      throw new Error(
        `O trabalho de automação "${job.id}" não pertence ao workspace da jornada "${journey.id}".`,
      )
    }
  
    if (
      job.journeyId !==
      journey.id
    ) {
      throw new Error(
        `O trabalho de automação "${job.id}" não pertence à jornada "${journey.id}".`,
      )
    }
  
    if (
      job.status !== "READY" &&
      job.status !== "IN_PROGRESS"
    ) {
      warnings.push(
        `O trabalho de automação "${job.id}" está com status ${job.status} e não pode gerar uma ação.`,
      )
  
      return {
        action: null,
        diagnostics,
        warnings,
      }
    }
  
    const attempt =
      resolveActionAttempt(job)
  
    const timestamp =
      now.toISOString()
  
    const action: CommercialAction = {
      id: createActionId(
        job.id,
        attempt,
      ),
  
      workspaceId:
        job.workspaceId,
  
      journeyId:
        job.journeyId,
  
      type:
        job.actionType,
  
      status:
        "PENDING",
  
      origin:
        "SYSTEM",
  
      actorType:
        "AUTOMATION",
  
      actorId:
        null,
  
      title:
        job.title,
  
      description:
        job.description,
  
      payload: {
        ...job.payload,
  
        automationJobId:
          job.id,
  
        strategyId:
          job.strategyId,
  
        strategyStepId:
          job.strategyStepId,
  
        automationChannel:
          job.channel,
  
        automationAttempt:
          attempt,
      },
  
      scheduledFor:
        job.scheduledFor,
  
      startedAt:
        null,
  
      completedAt:
        null,
  
      failedAt:
        null,
  
      failureReason:
        null,
  
      createdBy:
        null,
  
      createdAt:
        timestamp,
  
      updatedAt:
        timestamp,
    }
  
    diagnostics.push(
      `A ação comercial "${action.id}" foi criada pelo trabalho de automação "${job.id}".`,
    )
  
    return {
      action,
      diagnostics,
      warnings,
    }
  }
  
  export function executeAutomationJob({
    job,
    journey,
    now,
  }: ExecuteAutomationJobInput): ExecuteAutomationJobOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const timestamp =
      now.toISOString()
  
    if (
      job.workspaceId !==
      journey.workspaceId
    ) {
      throw new Error(
        `O trabalho de automação "${job.id}" não pertence ao workspace da jornada "${journey.id}".`,
      )
    }
  
    if (
      job.journeyId !==
      journey.id
    ) {
      throw new Error(
        `O trabalho de automação "${job.id}" não pertence à jornada "${journey.id}".`,
      )
    }
  
    if (
      isFinalJobStatus(job)
    ) {
      const reason =
        `O trabalho "${job.id}" já está encerrado com status ${job.status}.`
  
      const execution =
        createSkippedExecution(
          job,
          now,
          reason,
        )
  
      warnings.push(reason)
  
      return {
        job,
        execution,
        action: null,
        diagnostics,
        warnings,
      }
    }
  
    if (
      job.status !== "READY"
    ) {
      const reason =
        `O trabalho "${job.id}" não está pronto para execução. Status atual: ${job.status}.`
  
      const execution =
        createSkippedExecution(
          job,
          now,
          reason,
        )
  
      warnings.push(reason)
  
      return {
        job,
        execution,
        action: null,
        diagnostics,
        warnings,
      }
    }
  
    if (
      isJourneyClosed({
        job,
        journey,
        now,
      })
    ) {
      const reason =
        `A jornada "${journey.id}" está encerrada e o trabalho "${job.id}" foi cancelado.`
  
      const execution =
        createCancelledExecution(
          job,
          now,
          reason,
        )
  
      const cancelledJob: AutomationJob = {
        ...job,
  
        status:
          "CANCELLED",
  
        cancelledAt:
          timestamp,
  
        attemptCount:
          execution.attempt,
  
        lastFailureReason:
          reason,
  
        updatedAt:
          timestamp,
      }
  
      warnings.push(reason)
  
      return {
        job: cancelledJob,
        execution,
        action: null,
        diagnostics,
        warnings,
      }
    }
  
    const attempt =
      job.attemptCount + 1
  
    if (
      attempt >
      job.maxAttempts
    ) {
      const reason =
        `O trabalho "${job.id}" excedeu o limite de ${job.maxAttempts} tentativas.`
  
      const execution: AutomationExecution = {
        id: createExecutionId(
          job.id,
          attempt,
        ),
  
        automationJobId:
          job.id,
  
        workspaceId:
          job.workspaceId,
  
        journeyId:
          job.journeyId,
  
        attempt,
  
        status:
          "FAILED",
  
        startedAt:
          timestamp,
  
        finishedAt:
          timestamp,
  
        failureReason:
          reason,
  
        createdActionId:
          null,
  
        output: {
          reason,
        },
      }
  
      const failedJob: AutomationJob = {
        ...job,
  
        status:
          "FAILED",
  
        failedAt:
          timestamp,
  
        attemptCount:
          attempt,
  
        lastFailureReason:
          reason,
  
        updatedAt:
          timestamp,
      }
  
      warnings.push(reason)
  
      return {
        job: failedJob,
        execution,
        action: null,
        diagnostics,
        warnings,
      }
    }
  
    const inProgressJob: AutomationJob = {
      ...job,
  
      status:
        "IN_PROGRESS",
  
      startedAt:
        timestamp,
  
      attemptCount:
        attempt,
  
      updatedAt:
        timestamp,
    }
  
    const actionResult =
      createAutomationAction({
        job: inProgressJob,
        journey,
        now,
      })
  
    diagnostics.push(
      ...actionResult.diagnostics,
    )
  
    warnings.push(
      ...actionResult.warnings,
    )
  
    if (
      actionResult.action === null
    ) {
      const reason =
        `O trabalho "${job.id}" não conseguiu gerar uma ação comercial.`
  
      const execution: AutomationExecution = {
        id: createExecutionId(
          job.id,
          attempt,
        ),
  
        automationJobId:
          job.id,
  
        workspaceId:
          job.workspaceId,
  
        journeyId:
          job.journeyId,
  
        attempt,
  
        status:
          "FAILED",
  
        startedAt:
          timestamp,
  
        finishedAt:
          timestamp,
  
        failureReason:
          reason,
  
        createdActionId:
          null,
  
        output: {
          reason,
        },
      }
  
      const failedJob: AutomationJob = {
        ...inProgressJob,
  
        status:
          "FAILED",
  
        failedAt:
          timestamp,
  
        lastFailureReason:
          reason,
  
        updatedAt:
          timestamp,
      }
  
      warnings.push(reason)
  
      return {
        job: failedJob,
        execution,
        action: null,
        diagnostics,
        warnings,
      }
    }
  
    const action =
      actionResult.action
  
    const execution: AutomationExecution = {
      id: createExecutionId(
        job.id,
        attempt,
      ),
  
      automationJobId:
        job.id,
  
      workspaceId:
        job.workspaceId,
  
      journeyId:
        job.journeyId,
  
      attempt,
  
      status:
        "SUCCEEDED",
  
      startedAt:
        timestamp,
  
      finishedAt:
        timestamp,
  
      failureReason:
        null,
  
      createdActionId:
        action.id,
  
      output: {
        actionId:
          action.id,
  
        actionType:
          action.type,
      },
    }
  
    const completedJob: AutomationJob = {
      ...inProgressJob,
  
      status:
        "COMPLETED",
  
      completedAt:
        timestamp,
  
      createdActionId:
        action.id,
  
      lastFailureReason:
        null,
  
      updatedAt:
        timestamp,
    }
  
    diagnostics.push(
      `O trabalho de automação "${job.id}" foi executado com sucesso.`,
    )
  
    return {
      job: completedJob,
      execution,
      action,
      diagnostics,
      warnings,
    }
  }