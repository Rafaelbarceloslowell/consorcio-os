import type {
    CommercialStrategy,
    StrategyStep,
  } from "../strategy/types"
  
  import {
    advanceStrategyCadence,
    initializeStrategyCadence,
  } from "./cadence"
  
  import {
    executeAutomationJob,
  } from "./executor"
  
  import {
    enqueueAutomationJobs,
    getReadyAutomationJobs,
  } from "./queue"
  
  import {
    createAutomationJob,
  } from "./scheduler"
  
  import type {
    AutomationEngineInput,
    AutomationEngineOutput,
    AutomationJob,
    AutomationQueue,
  } from "./types"
  
  function normalizeExecutionLimit(
    limit: number | undefined,
  ): number {
    if (limit === undefined) {
      return Number.MAX_SAFE_INTEGER
    }
  
    if (
      !Number.isInteger(limit) ||
      limit <= 0
    ) {
      throw new Error(
        "O limite de execução da automação deve ser um número inteiro maior que zero.",
      )
    }
  
    return limit
  }
  
  function cloneQueue(
    queue: AutomationQueue,
  ): AutomationQueue {
    return {
      jobs: [
        ...queue.jobs,
      ],
  
      executions: [
        ...queue.executions,
      ],
    }
  }
  
  function replaceQueueJob(
    queue: AutomationQueue,
    updatedJob: AutomationJob,
  ): AutomationQueue {
    return {
      jobs: queue.jobs.map(
        (job) =>
          job.id === updatedJob.id
            ? updatedJob
            : job,
      ),
  
      executions: [
        ...queue.executions,
      ],
    }
  }
  
  function getJourneyReadyJobs(
    queue: AutomationQueue,
    journey: AutomationEngineInput["journey"],
    now: Date,
  ): AutomationJob[] {
    return getReadyAutomationJobs({
      queue,
      now,
    }).filter(
      (job) =>
        job.workspaceId ===
          journey.workspaceId &&
        job.journeyId ===
          journey.id,
    )
  }
  
  type ScheduleCadenceStepInput = {
    strategy: CommercialStrategy
  
    step: StrategyStep
  
    journey: AutomationEngineInput["journey"]
  
    queue: AutomationQueue
  
    now: Date
  
    scheduledJobs: AutomationJob[]
  
    diagnostics: string[]
  
    warnings: string[]
  }
  
  function scheduleCadenceStep({
    strategy,
    step,
    journey,
    queue,
    now,
    scheduledJobs,
    diagnostics,
    warnings,
  }: ScheduleCadenceStepInput): AutomationQueue {
    const job =
      createAutomationJob({
        strategy,
        step,
        journey,
        now,
      })
  
    scheduledJobs.push(
      job,
    )
  
    const enqueueResult =
      enqueueAutomationJobs({
        queue,
        jobs: [
          job,
        ],
      })
  
    diagnostics.push(
      ...enqueueResult.diagnostics,
    )
  
    warnings.push(
      ...enqueueResult.warnings,
    )
  
    return enqueueResult.queue
  }
  
  export function runAutomationEngine({
    strategy,
    journey,
    queue,
    now,
    executionLimit,
  }: AutomationEngineInput): AutomationEngineOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const scheduledJobs: AutomationJob[] = []
    const processedJobs: AutomationJob[] = []
  
    const createdActions: AutomationEngineOutput["createdActions"] = []
    const executions: AutomationEngineOutput["executions"] = []
  
    const normalizedExecutionLimit =
      normalizeExecutionLimit(
        executionLimit,
      )
  
    let workingQueue =
      cloneQueue(
        queue,
      )
  
    let workingStrategy =
      strategy
  
    if (workingStrategy !== null) {
      const cadenceResult =
        initializeStrategyCadence({
          strategy:
            workingStrategy,
  
          now,
        })
  
      workingStrategy =
        cadenceResult.strategy
  
      diagnostics.push(
        ...cadenceResult.diagnostics,
      )
  
      warnings.push(
        ...cadenceResult.warnings,
      )
  
      if (
        cadenceResult.nextStep !==
        null
      ) {
        workingQueue =
          scheduleCadenceStep({
            strategy:
              workingStrategy,
  
            step:
              cadenceResult.nextStep,
  
            journey,
  
            queue:
              workingQueue,
  
            now,
  
            scheduledJobs,
  
            diagnostics,
  
            warnings,
          })
      }
    } else {
      diagnostics.push(
        `Nenhuma estratégia foi informada para a jornada "${journey.id}".`,
      )
    }
  
    while (
      processedJobs.length <
      normalizedExecutionLimit
    ) {
      const readyJobs =
        getJourneyReadyJobs(
          workingQueue,
          journey,
          now,
        )
  
      const nextJob =
        readyJobs[0]
  
      if (
        nextJob === undefined
      ) {
        break
      }
  
      const executionResult =
        executeAutomationJob({
          job:
            nextJob,
  
          journey,
  
          now,
        })
  
      workingQueue =
        replaceQueueJob(
          workingQueue,
          executionResult.job,
        )
  
      workingQueue = {
        jobs: [
          ...workingQueue.jobs,
        ],
  
        executions: [
          ...workingQueue.executions,
          executionResult.execution,
        ],
      }
  
      processedJobs.push(
        executionResult.job,
      )
  
      executions.push(
        executionResult.execution,
      )
  
      if (
        executionResult.action !==
        null
      ) {
        createdActions.push(
          executionResult.action,
        )
      }
  
      diagnostics.push(
        ...executionResult.diagnostics,
      )
  
      warnings.push(
        ...executionResult.warnings,
      )
  
      const completedJob =
        executionResult.job
  
      if (
        completedJob.status !==
        "COMPLETED"
      ) {
        continue
      }
  
      const currentStrategy =
        workingStrategy
  
      if (
        currentStrategy === null
      ) {
        continue
      }
  
      if (
        completedJob.strategyId !==
        currentStrategy.id
      ) {
        continue
      }
  
      const cadenceResult =
        advanceStrategyCadence({
          strategy:
            currentStrategy,
  
          completedJob,
  
          now,
        })
  
      workingStrategy =
        cadenceResult.strategy
  
      diagnostics.push(
        ...cadenceResult.diagnostics,
      )
  
      warnings.push(
        ...cadenceResult.warnings,
      )
  
      if (
        cadenceResult.nextStep ===
        null
      ) {
        continue
      }
  
      workingQueue =
        scheduleCadenceStep({
          strategy:
            cadenceResult.strategy,
  
          step:
            cadenceResult.nextStep,
  
          journey,
  
          queue:
            workingQueue,
  
          now,
  
          scheduledJobs,
  
          diagnostics,
  
          warnings,
        })
    }
  
    const remainingReadyJobs =
      getJourneyReadyJobs(
        workingQueue,
        journey,
        now,
      )
  
    diagnostics.push(
      `${processedJobs.length} trabalhos de automação foram processados para a jornada "${journey.id}".`,
    )
  
    if (
      remainingReadyJobs.length >
      0 &&
      processedJobs.length >=
        normalizedExecutionLimit
    ) {
      diagnostics.push(
        `${remainingReadyJobs.length} trabalhos prontos permaneceram na fila devido ao limite de execução.`,
      )
    }
  
    if (
      processedJobs.length === 0
    ) {
      warnings.push(
        `Nenhum trabalho de automação estava pronto para execução na jornada "${journey.id}".`,
      )
    }
  
    return {
      strategy:
        workingStrategy,
  
      queue:
        workingQueue,
  
      scheduledJobs,
  
      processedJobs,
  
      createdActions,
  
      executions,
  
      diagnostics,
  
      warnings,
    }
  }