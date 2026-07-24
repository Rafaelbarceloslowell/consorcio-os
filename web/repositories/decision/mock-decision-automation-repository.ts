import type {
    AutomationExecution,
    AutomationJob,
    AutomationQueue,
  } from "@/engine/decision/automation"
  
  import type {
    CommercialStrategy,
  } from "@/engine/decision/strategy/types"
  
  import type {
    DecisionAutomationRepository,
    SaveDecisionAutomationStateInput,
    SaveDecisionAutomationStateResult,
  } from "./decision-automation-repository"
  
  export type MockDecisionAutomationRepositoryData = {
    strategies?: CommercialStrategy[]
  
    automationJobs?: AutomationJob[]
  
    automationExecutions?: AutomationExecution[]
  }
  
  function isActiveStrategy(
    strategy: CommercialStrategy,
  ): boolean {
    return (
      strategy.status === "PLANNED" ||
      strategy.status === "ACTIVE" ||
      strategy.status === "PAUSED"
    )
  }
  
  function validateJourneyId(
    journeyId: string,
  ): string {
    const normalizedJourneyId =
      journeyId.trim()
  
    if (!normalizedJourneyId) {
      throw new Error(
        "O ID da jornada comercial é obrigatório.",
      )
    }
  
    return normalizedJourneyId
  }
  
  export class MockDecisionAutomationRepository
    implements DecisionAutomationRepository
  {
    private readonly strategies:
      CommercialStrategy[]
  
    private readonly automationJobs:
      AutomationJob[]
  
    private readonly automationExecutions:
      AutomationExecution[]
  
    constructor(
      data:
        MockDecisionAutomationRepositoryData = {},
    ) {
      this.strategies = [
        ...(data.strategies ?? []),
      ]
  
      this.automationJobs = [
        ...(data.automationJobs ?? []),
      ]
  
      this.automationExecutions = [
        ...(data.automationExecutions ?? []),
      ]
    }
  
    getStrategiesByJourneyId(
      journeyId: string,
    ): CommercialStrategy[] {
      const normalizedJourneyId =
        validateJourneyId(
          journeyId,
        )
  
      return this.strategies.filter(
        (strategy) =>
          strategy.journeyId ===
          normalizedJourneyId,
      )
    }
  
    getStrategyById(
      strategyId: string,
    ): CommercialStrategy | undefined {
      const normalizedStrategyId =
        strategyId.trim()
  
      if (!normalizedStrategyId) {
        throw new Error(
          "O ID da estratégia comercial é obrigatório.",
        )
      }
  
      return this.strategies.find(
        (strategy) =>
          strategy.id ===
          normalizedStrategyId,
      )
    }
  
    getActiveStrategyByJourneyId(
      journeyId: string,
    ): CommercialStrategy | undefined {
      return this
        .getStrategiesByJourneyId(
          journeyId,
        )
        .filter(
          (strategy) =>
            isActiveStrategy(
              strategy,
            ),
        )
        .sort(
          (
            firstStrategy,
            secondStrategy,
          ) => {
            const updateDifference =
              secondStrategy.updatedAt.localeCompare(
                firstStrategy.updatedAt,
              )
  
            if (updateDifference !== 0) {
              return updateDifference
            }
  
            return secondStrategy.id.localeCompare(
              firstStrategy.id,
            )
          },
        )[0]
    }
  
    createStrategy(
      strategy: CommercialStrategy,
    ): CommercialStrategy {
      const duplicatedStrategy =
        this.strategies.some(
          (currentStrategy) =>
            currentStrategy.id ===
            strategy.id,
        )
  
      if (duplicatedStrategy) {
        throw new Error(
          `Já existe uma estratégia comercial com o ID "${strategy.id}".`,
        )
      }
  
      const conflictingActiveStrategy =
        this.strategies.find(
          (currentStrategy) =>
            currentStrategy.journeyId ===
              strategy.journeyId &&
            isActiveStrategy(
              currentStrategy,
            ) &&
            isActiveStrategy(
              strategy,
            ),
        )
  
      if (conflictingActiveStrategy) {
        throw new Error(
          `A jornada comercial "${strategy.journeyId}" já possui a estratégia ativa "${conflictingActiveStrategy.id}".`,
        )
      }
  
      this.strategies.push(
        strategy,
      )
  
      return strategy
    }
  
    updateStrategy(
      strategy: CommercialStrategy,
    ): CommercialStrategy {
      const strategyIndex =
        this.strategies.findIndex(
          (currentStrategy) =>
            currentStrategy.id ===
            strategy.id,
        )
  
      if (strategyIndex === -1) {
        throw new Error(
          `Estratégia comercial não encontrada para o ID "${strategy.id}".`,
        )
      }
  
      const currentStrategy =
        this.strategies[
          strategyIndex
        ]
  
      if (
        currentStrategy.workspaceId !==
        strategy.workspaceId
      ) {
        throw new Error(
          `A estratégia comercial "${strategy.id}" não pode ser movida para outro workspace.`,
        )
      }
  
      if (
        currentStrategy.journeyId !==
        strategy.journeyId
      ) {
        throw new Error(
          `A estratégia comercial "${strategy.id}" não pode ser movida para outra jornada.`,
        )
      }
  
      if (
        isActiveStrategy(
          strategy,
        )
      ) {
        const conflictingActiveStrategy =
          this.strategies.find(
            (
              candidateStrategy,
            ) =>
              candidateStrategy.id !==
                strategy.id &&
              candidateStrategy.journeyId ===
                strategy.journeyId &&
              isActiveStrategy(
                candidateStrategy,
              ),
          )
  
        if (
          conflictingActiveStrategy
        ) {
          throw new Error(
            `A jornada comercial "${strategy.journeyId}" já possui a estratégia ativa "${conflictingActiveStrategy.id}".`,
          )
        }
      }
  
      this.strategies[
        strategyIndex
      ] = strategy
  
      return strategy
    }
  
    getAutomationJobsByJourneyId(
      journeyId: string,
    ): AutomationJob[] {
      const normalizedJourneyId =
        validateJourneyId(
          journeyId,
        )
  
      return this.automationJobs.filter(
        (automationJob) =>
          automationJob.journeyId ===
          normalizedJourneyId,
      )
    }
  
    getAutomationJobById(
      automationJobId: string,
    ): AutomationJob | undefined {
      const normalizedAutomationJobId =
        automationJobId.trim()
  
      if (!normalizedAutomationJobId) {
        throw new Error(
          "O ID do trabalho de automação é obrigatório.",
        )
      }
  
      return this.automationJobs.find(
        (automationJob) =>
          automationJob.id ===
          normalizedAutomationJobId,
      )
    }
  
    createAutomationJob(
      automationJob: AutomationJob,
    ): AutomationJob {
      const duplicatedAutomationJob =
        this.automationJobs.some(
          (currentAutomationJob) =>
            currentAutomationJob.id ===
            automationJob.id,
        )
  
      if (duplicatedAutomationJob) {
        throw new Error(
          `Já existe um trabalho de automação com o ID "${automationJob.id}".`,
        )
      }
  
      if (
        automationJob.strategyId !==
        null
      ) {
        const strategy =
          this.getStrategyById(
            automationJob.strategyId,
          )
  
        if (!strategy) {
          throw new Error(
            `Estratégia comercial não encontrada para o ID "${automationJob.strategyId}".`,
          )
        }
  
        if (
          strategy.workspaceId !==
          automationJob.workspaceId
        ) {
          throw new Error(
            `O trabalho de automação "${automationJob.id}" não pertence ao mesmo workspace da estratégia "${strategy.id}".`,
          )
        }
  
        if (
          strategy.journeyId !==
          automationJob.journeyId
        ) {
          throw new Error(
            `O trabalho de automação "${automationJob.id}" não pertence à mesma jornada da estratégia "${strategy.id}".`,
          )
        }
      }
  
      this.automationJobs.push(
        automationJob,
      )
  
      return automationJob
    }
  
    updateAutomationJob(
      automationJob: AutomationJob,
    ): AutomationJob {
      const automationJobIndex =
        this.automationJobs.findIndex(
          (currentAutomationJob) =>
            currentAutomationJob.id ===
            automationJob.id,
        )
  
      if (
        automationJobIndex === -1
      ) {
        throw new Error(
          `Trabalho de automação não encontrado para o ID "${automationJob.id}".`,
        )
      }
  
      const currentAutomationJob =
        this.automationJobs[
          automationJobIndex
        ]
  
      if (
        currentAutomationJob.workspaceId !==
        automationJob.workspaceId
      ) {
        throw new Error(
          `O trabalho de automação "${automationJob.id}" não pode ser movido para outro workspace.`,
        )
      }
  
      if (
        currentAutomationJob.journeyId !==
        automationJob.journeyId
      ) {
        throw new Error(
          `O trabalho de automação "${automationJob.id}" não pode ser movido para outra jornada.`,
        )
      }
  
      if (
        currentAutomationJob.strategyId !==
        automationJob.strategyId
      ) {
        throw new Error(
          `O trabalho de automação "${automationJob.id}" não pode ser movido para outra estratégia.`,
        )
      }
  
      this.automationJobs[
        automationJobIndex
      ] = automationJob
  
      return automationJob
    }
  
    getAutomationExecutionsByJourneyId(
      journeyId: string,
    ): AutomationExecution[] {
      const normalizedJourneyId =
        validateJourneyId(
          journeyId,
        )
  
      return this.automationExecutions.filter(
        (automationExecution) =>
          automationExecution.journeyId ===
          normalizedJourneyId,
      )
    }
  
    getAutomationExecutionById(
      automationExecutionId: string,
    ): AutomationExecution | undefined {
      const normalizedAutomationExecutionId =
        automationExecutionId.trim()
  
      if (
        !normalizedAutomationExecutionId
      ) {
        throw new Error(
          "O ID da execução de automação é obrigatório.",
        )
      }
  
      return this.automationExecutions.find(
        (automationExecution) =>
          automationExecution.id ===
          normalizedAutomationExecutionId,
      )
    }
  
    createAutomationExecution(
      automationExecution: AutomationExecution,
    ): AutomationExecution {
      const duplicatedAutomationExecution =
        this.automationExecutions.some(
          (
            currentAutomationExecution,
          ) =>
            currentAutomationExecution.id ===
            automationExecution.id,
        )
  
      if (
        duplicatedAutomationExecution
      ) {
        throw new Error(
          `Já existe uma execução de automação com o ID "${automationExecution.id}".`,
        )
      }
  
      const automationJob =
        this.getAutomationJobById(
          automationExecution.automationJobId,
        )
  
      if (!automationJob) {
        throw new Error(
          `Trabalho de automação não encontrado para o ID "${automationExecution.automationJobId}".`,
        )
      }
  
      if (
        automationJob.workspaceId !==
        automationExecution.workspaceId
      ) {
        throw new Error(
          `A execução de automação "${automationExecution.id}" não pertence ao mesmo workspace do trabalho "${automationJob.id}".`,
        )
      }
  
      if (
        automationJob.journeyId !==
        automationExecution.journeyId
      ) {
        throw new Error(
          `A execução de automação "${automationExecution.id}" não pertence à mesma jornada do trabalho "${automationJob.id}".`,
        )
      }
  
      this.automationExecutions.push(
        automationExecution,
      )
  
      return automationExecution
    }
  
    getAutomationQueueByJourneyId(
      journeyId: string,
    ): AutomationQueue {
      const normalizedJourneyId =
        validateJourneyId(
          journeyId,
        )
  
      return {
        jobs:
          this.getAutomationJobsByJourneyId(
            normalizedJourneyId,
          ),
  
        executions:
          this.getAutomationExecutionsByJourneyId(
            normalizedJourneyId,
          ),
      }
    }
  
    saveDecisionAutomationState({
      strategy,
      queue,
    }: SaveDecisionAutomationStateInput): SaveDecisionAutomationStateResult {
      validateDecisionAutomationState({
        strategy,
        queue,
      })
  
      if (strategy !== null) {
        const existingStrategy =
          this.getStrategyById(
            strategy.id,
          )
  
        if (existingStrategy) {
          this.updateStrategy(
            strategy,
          )
        } else {
          this.createStrategy(
            strategy,
          )
        }
      }
  
      for (
        const automationJob of
        queue.jobs
      ) {
        const existingAutomationJob =
          this.getAutomationJobById(
            automationJob.id,
          )
  
        if (existingAutomationJob) {
          this.updateAutomationJob(
            automationJob,
          )
        } else {
          this.createAutomationJob(
            automationJob,
          )
        }
      }
  
      for (
        const automationExecution of
        queue.executions
      ) {
        const existingAutomationExecution =
          this.getAutomationExecutionById(
            automationExecution.id,
          )
  
        if (
          existingAutomationExecution
        ) {
          continue
        }
  
        this.createAutomationExecution(
          automationExecution,
        )
      }
  
      return {
        strategy,
  
        queue: {
          jobs: [
            ...queue.jobs,
          ],
  
          executions: [
            ...queue.executions,
          ],
        },
      }
    }
  }
  
  function validateDecisionAutomationState({
    strategy,
    queue,
  }: SaveDecisionAutomationStateInput): void {
    const strategyId =
      strategy?.id ?? null
  
    const journeyId =
      strategy?.journeyId ??
      queue.jobs[0]?.journeyId ??
      queue.executions[0]?.journeyId ??
      null
  
    const workspaceId =
      strategy?.workspaceId ??
      queue.jobs[0]?.workspaceId ??
      queue.executions[0]?.workspaceId ??
      null
  
    for (
      const automationJob of
      queue.jobs
    ) {
      if (
        journeyId !== null &&
        automationJob.journeyId !==
          journeyId
      ) {
        throw new Error(
          `O trabalho de automação "${automationJob.id}" pertence a outra jornada.`,
        )
      }
  
      if (
        workspaceId !== null &&
        automationJob.workspaceId !==
          workspaceId
      ) {
        throw new Error(
          `O trabalho de automação "${automationJob.id}" pertence a outro workspace.`,
        )
      }
  
      if (
        strategyId !== null &&
        automationJob.strategyId !==
          null &&
        automationJob.strategyId !==
          strategyId
      ) {
        throw new Error(
          `O trabalho de automação "${automationJob.id}" pertence a outra estratégia.`,
        )
      }
    }
  
    const automationJobIds =
      new Set(
        queue.jobs.map(
          (automationJob) =>
            automationJob.id,
        ),
      )
  
    for (
      const automationExecution of
      queue.executions
    ) {
      if (
        journeyId !== null &&
        automationExecution.journeyId !==
          journeyId
      ) {
        throw new Error(
          `A execução de automação "${automationExecution.id}" pertence a outra jornada.`,
        )
      }
  
      if (
        workspaceId !== null &&
        automationExecution.workspaceId !==
          workspaceId
      ) {
        throw new Error(
          `A execução de automação "${automationExecution.id}" pertence a outro workspace.`,
        )
      }
  
      if (
        !automationJobIds.has(
          automationExecution.automationJobId,
        )
      ) {
        throw new Error(
          `A execução de automação "${automationExecution.id}" referencia um trabalho que não está presente na fila.`,
        )
      }
    }
  }
  
  export const mockDecisionAutomationRepository =
    new MockDecisionAutomationRepository()