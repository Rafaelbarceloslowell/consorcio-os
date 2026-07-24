import type {
  CommercialStrategy,
  StrategyStep,
} from "../strategy/types"

import type {
  AutomationJob,
} from "./types"

export type InitializeStrategyCadenceInput = {
  strategy: CommercialStrategy
  now: Date
}

export type InitializeStrategyCadenceOutput = {
  strategy: CommercialStrategy
  nextStep: StrategyStep | null
  initialized: boolean
  strategyCompleted: boolean
  diagnostics: string[]
  warnings: string[]
}

export type AdvanceStrategyCadenceInput = {
  strategy: CommercialStrategy
  completedJob: AutomationJob
  now: Date
}

export type AdvanceStrategyCadenceOutput = {
  strategy: CommercialStrategy
  completedStep: StrategyStep | null
  nextStep: StrategyStep | null
  advanced: boolean
  strategyCompleted: boolean
  diagnostics: string[]
  warnings: string[]
}

function isFinalStrategyStatus(
  status: CommercialStrategy["status"],
): boolean {
  return (
    status === "COMPLETED" ||
    status === "FAILED" ||
    status === "CANCELLED"
  )
}

function isFinalStepStatus(
  status: StrategyStep["status"],
): boolean {
  return (
    status === "COMPLETED" ||
    status === "FAILED" ||
    status === "CANCELLED" ||
    status === "SKIPPED"
  )
}

function normalizeScheduledFor(
  step: StrategyStep,
  now: Date,
): string {
  if (step.scheduledFor === null) {
    return now.toISOString()
  }

  const scheduledFor =
    new Date(step.scheduledFor)

  if (
    Number.isNaN(
      scheduledFor.getTime(),
    )
  ) {
    return now.toISOString()
  }

  return scheduledFor.toISOString()
}

function resolveStepStatus(
  step: StrategyStep,
  now: Date,
): StrategyStep["status"] {
  const scheduledFor =
    normalizeScheduledFor(
      step,
      now,
    )

  return scheduledFor <= now.toISOString()
    ? "READY"
    : "PENDING"
}

function findFirstEligibleStep(
  strategy: CommercialStrategy,
): StrategyStep | null {
  return (
    [...strategy.steps]
      .filter(
        (step) =>
          !isFinalStepStatus(
            step.status,
          ),
      )
      .sort(
        (first, second) =>
          first.position -
          second.position,
      )[0] ?? null
  )
}

function findNextEligibleStep(
  strategy: CommercialStrategy,
  completedPosition: number,
): StrategyStep | null {
  return (
    [...strategy.steps]
      .filter(
        (step) =>
          step.position >
            completedPosition &&
          !isFinalStepStatus(
            step.status,
          ),
      )
      .sort(
        (first, second) =>
          first.position -
          second.position,
      )[0] ?? null
  )
}

function completeStrategy(
  strategy: CommercialStrategy,
  timestamp: string,
): CommercialStrategy {
  return {
    ...strategy,

    status:
      "COMPLETED",

    currentStepPosition:
      null,

    completedAt:
      strategy.completedAt ??
      timestamp,

    updatedAt:
      timestamp,
  }
}

function activateStrategyStep(
  strategy: CommercialStrategy,
  stepId: string,
  now: Date,
): {
  strategy: CommercialStrategy
  step: StrategyStep
} {
  const timestamp =
    now.toISOString()

  const sourceStep =
    strategy.steps.find(
      (step) =>
        step.id === stepId,
    )

  if (sourceStep === undefined) {
    throw new Error(
      `O passo "${stepId}" não foi encontrado na estratégia "${strategy.id}".`,
    )
  }

  const scheduledFor =
    normalizeScheduledFor(
      sourceStep,
      now,
    )

  const status =
    resolveStepStatus(
      sourceStep,
      now,
    )

  const updatedStep: StrategyStep = {
    ...sourceStep,

    status,

    scheduledFor,

    startedAt:
      status === "READY"
        ? sourceStep.startedAt ??
          timestamp
        : sourceStep.startedAt,
  }

  const updatedStrategy: CommercialStrategy = {
    ...strategy,

    status:
      "ACTIVE",

    currentStepPosition:
      updatedStep.position,

    startedAt:
      strategy.startedAt ??
      timestamp,

    steps:
      strategy.steps.map(
        (step) =>
          step.id ===
          updatedStep.id
            ? updatedStep
            : step,
      ),

    updatedAt:
      timestamp,
  }

  return {
    strategy:
      updatedStrategy,

    step:
      updatedStep,
  }
}

function completeStrategyStep(
  strategy: CommercialStrategy,
  stepId: string,
  completedAt: string,
  timestamp: string,
): {
  strategy: CommercialStrategy
  step: StrategyStep
} {
  const sourceStep =
    strategy.steps.find(
      (step) =>
        step.id === stepId,
    )

  if (sourceStep === undefined) {
    throw new Error(
      `O passo "${stepId}" não foi encontrado na estratégia "${strategy.id}".`,
    )
  }

  const completedStep: StrategyStep = {
    ...sourceStep,

    status:
      "COMPLETED",

    completedAt:
      sourceStep.completedAt ??
      completedAt,

    failureReason:
      null,
  }

  const updatedStrategy: CommercialStrategy = {
    ...strategy,

    steps:
      strategy.steps.map(
        (step) =>
          step.id ===
          completedStep.id
            ? completedStep
            : step,
      ),

    updatedAt:
      timestamp,
  }

  return {
    strategy:
      updatedStrategy,

    step:
      completedStep,
  }
}

export function initializeStrategyCadence({
  strategy,
  now,
}: InitializeStrategyCadenceInput): InitializeStrategyCadenceOutput {
  const diagnostics: string[] = []
  const warnings: string[] = []

  if (
    isFinalStrategyStatus(
      strategy.status,
    )
  ) {
    warnings.push(
      `A estratégia "${strategy.id}" está com status ${strategy.status} e não pode iniciar uma cadência.`,
    )

    return {
      strategy,
      nextStep: null,
      initialized: false,
      strategyCompleted:
        strategy.status ===
        "COMPLETED",
      diagnostics,
      warnings,
    }
  }

  const firstStep =
    findFirstEligibleStep(
      strategy,
    )

  if (firstStep === null) {
    const completedStrategy =
      completeStrategy(
        strategy,
        now.toISOString(),
      )

    diagnostics.push(
      `A estratégia "${strategy.id}" foi concluída porque não possui passos ativos.`,
    )

    return {
      strategy:
        completedStrategy,

      nextStep: null,

      initialized: true,

      strategyCompleted:
        true,

      diagnostics,

      warnings,
    }
  }

  const activationResult =
    activateStrategyStep(
      strategy,
      firstStep.id,
      now,
    )

  diagnostics.push(
    `O passo "${activationResult.step.id}" foi selecionado para iniciar a estratégia "${strategy.id}".`,
  )

  return {
    strategy:
      activationResult.strategy,

    nextStep:
      activationResult.step,

    initialized:
      true,

    strategyCompleted:
      false,

    diagnostics,

    warnings,
  }
}

export function advanceStrategyCadence({
  strategy,
  completedJob,
  now,
}: AdvanceStrategyCadenceInput): AdvanceStrategyCadenceOutput {
  const diagnostics: string[] = []
  const warnings: string[] = []

  if (
    completedJob.workspaceId !==
    strategy.workspaceId
  ) {
    throw new Error(
      `O trabalho "${completedJob.id}" não pertence ao workspace da estratégia "${strategy.id}".`,
    )
  }

  if (
    completedJob.journeyId !==
    strategy.journeyId
  ) {
    throw new Error(
      `O trabalho "${completedJob.id}" não pertence à jornada da estratégia "${strategy.id}".`,
    )
  }

  if (
    completedJob.strategyId !==
    strategy.id
  ) {
    throw new Error(
      `O trabalho "${completedJob.id}" não pertence à estratégia "${strategy.id}".`,
    )
  }

  if (
    completedJob.strategyStepId ===
    null
  ) {
    throw new Error(
      `O trabalho "${completedJob.id}" não está vinculado a um passo de estratégia.`,
    )
  }

  if (
    completedJob.status !==
    "COMPLETED"
  ) {
    warnings.push(
      `O trabalho "${completedJob.id}" ainda não foi concluído e não pode avançar a cadência.`,
    )

    return {
      strategy,
      completedStep: null,
      nextStep: null,
      advanced: false,
      strategyCompleted: false,
      diagnostics,
      warnings,
    }
  }

  if (
    isFinalStrategyStatus(
      strategy.status,
    )
  ) {
    warnings.push(
      `A estratégia "${strategy.id}" está com status ${strategy.status} e não pode avançar a cadência.`,
    )

    return {
      strategy,
      completedStep: null,
      nextStep: null,
      advanced: false,
      strategyCompleted:
        strategy.status ===
        "COMPLETED",
      diagnostics,
      warnings,
    }
  }

  const strategyStepId =
    completedJob.strategyStepId

  const sourceStep =
    strategy.steps.find(
      (step) =>
        step.id ===
        strategyStepId,
    )

  if (sourceStep === undefined) {
    throw new Error(
      `O passo "${strategyStepId}" do trabalho "${completedJob.id}" não foi encontrado na estratégia "${strategy.id}".`,
    )
  }

  const timestamp =
    now.toISOString()

  const completionResult =
    completeStrategyStep(
      strategy,
      strategyStepId,
      completedJob.completedAt ??
        timestamp,
      timestamp,
    )

  const nextStep =
    findNextEligibleStep(
      completionResult.strategy,
      sourceStep.position,
    )

  if (nextStep === null) {
    const completedStrategy =
      completeStrategy(
        completionResult.strategy,
        timestamp,
      )

    diagnostics.push(
      `A estratégia "${strategy.id}" foi concluída porque não existem outros passos ativos na cadência.`,
    )

    return {
      strategy:
        completedStrategy,

      completedStep:
        completionResult.step,

      nextStep: null,

      advanced:
        true,

      strategyCompleted:
        true,

      diagnostics,

      warnings,
    }
  }

  const activationResult =
    activateStrategyStep(
      completionResult.strategy,
      nextStep.id,
      now,
    )

  diagnostics.push(
    `A estratégia "${strategy.id}" avançou do passo "${completionResult.step.id}" para o passo "${activationResult.step.id}".`,
  )

  return {
    strategy:
      activationResult.strategy,

    completedStep:
      completionResult.step,

    nextStep:
      activationResult.step,

    advanced:
      true,

    strategyCompleted:
      false,

    diagnostics,

    warnings,
  }
}