import {
  R2_EXPRESSION_CHANNELS,
  R2_RUNTIME_STATES,
  R2_VISEMES,
} from "@/types/r2-full-character-runtime"
import type {
  R2RuntimeControllerApi,
} from "@/types/r2-full-character-runtime"
import type {
  R2ExecutionReceipt,
  R2RuntimeCommand,
} from "@/types/r2-intelligence-orchestration"

export type R2RuntimeCommandAdapterConfig = Readonly<{
  controller: R2RuntimeControllerApi
  workspaceId: string
  now?: () => Date
  schedule?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>
  cancel?: (handle: ReturnType<typeof setTimeout>) => void
  onReceipt?: (receipt: R2ExecutionReceipt) => void
}>

function finiteUnit(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= 1)
}

export class R2RuntimeCommandAdapter {
  private readonly controller: R2RuntimeControllerApi
  private readonly workspaceId: string
  private readonly clock: () => Date
  private readonly schedule: NonNullable<R2RuntimeCommandAdapterConfig["schedule"]>
  private readonly cancel: NonNullable<R2RuntimeCommandAdapterConfig["cancel"]>
  private readonly onReceipt: NonNullable<R2RuntimeCommandAdapterConfig["onReceipt"]>
  private timer: ReturnType<typeof setTimeout> | null = null
  private active: Readonly<{ command: R2RuntimeCommand; startedAt: string }> | null = null
  private disposed = false

  constructor(config: R2RuntimeCommandAdapterConfig) {
    const workspaceId = config.workspaceId.trim()
    if (!workspaceId) throw new Error("R2 runtime adapter workspaceId is required.")
    this.controller = config.controller
    this.workspaceId = workspaceId
    this.clock = config.now ?? (() => new Date())
    this.schedule = config.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs))
    this.cancel = config.cancel ?? ((handle) => clearTimeout(handle))
    this.onReceipt = config.onReceipt ?? (() => undefined)
  }

  apply(command: R2RuntimeCommand): R2ExecutionReceipt {
    const startedAt = this.clock()
    if (this.disposed || this.controller.disposed) {
      return this.fail(command, startedAt, "RUNTIME_DISPOSED")
    }
    if (command.workspaceId !== this.workspaceId) {
      return this.fail(command, startedAt, "WORKSPACE_MISMATCH")
    }
    if (command.expiresAt && new Date(command.expiresAt).getTime() <= startedAt.getTime()) {
      return this.skip(command, startedAt, "COMMAND_EXPIRED")
    }
    if (
      !R2_RUNTIME_STATES.includes(command.runtimeState) ||
      (command.expression !== undefined && !R2_EXPRESSION_CHANNELS.includes(command.expression)) ||
      (command.viseme !== undefined && !R2_VISEMES.includes(command.viseme)) ||
      !finiteUnit(command.expressionIntensity) ||
      !finiteUnit(command.speakingIntensity) ||
      !Number.isFinite(command.durationMs) || command.durationMs < 0
    ) {
      return this.fail(command, startedAt, "INVALID_RUNTIME_COMMAND")
    }

    this.interruptActive(command.commandId, startedAt)
    try {
      this.controller.setState(command.runtimeState)
      if (command.expression) {
        this.controller.setExpression(command.expression, command.expressionIntensity ?? 1)
      }
      if (command.viseme) {
        this.controller.setViseme(command.viseme, command.speakingIntensity ?? 1)
      }
      if (command.eyeTarget) this.controller.setEyeTarget(command.eyeTarget)
      if (command.speakingIntensity !== undefined) {
        this.controller.setSpeakingIntensity(command.speakingIntensity)
      }
    } catch {
      try {
        if (!this.controller.disposed) {
          this.controller.setState(command.fallbackState)
        }
      } catch {
        // The failed receipt below is the authoritative result.
      }
      return this.fail(command, startedAt, "RUNTIME_COMMAND_FAILED", true)
    }

    const receipt = this.receipt(command, "APPLIED", startedAt, null, null, false, null)
    this.active = { command, startedAt: startedAt.toISOString() }
    this.onReceipt(receipt)
    if (command.durationMs > 0) {
      this.timer = this.schedule(() => this.complete(command.commandId), command.durationMs)
    }
    return receipt
  }

  private complete(commandId: string) {
    if (this.disposed || !this.active || this.active.command.commandId !== commandId) return
    const active = this.active
    const completedAt = this.clock()
    this.timer = null
    this.active = null
    let fallbackUsed = false
    let errorCode: string | null = null
    try {
      if (!this.controller.disposed) {
        this.controller.setState(active.command.fallbackState)
        fallbackUsed = true
      }
    } catch {
      errorCode = "RUNTIME_COMMAND_FAILED"
    }
    this.onReceipt(this.receipt(
      active.command,
      errorCode ? "FAILED" : "COMPLETED",
      new Date(active.startedAt),
      completedAt,
      null,
      fallbackUsed,
      errorCode,
    ))
  }

  private interruptActive(interruptedBy: string, at: Date) {
    if (!this.active) return
    const active = this.active
    if (this.timer) this.cancel(this.timer)
    this.timer = null
    this.active = null
    this.onReceipt(this.receipt(
      active.command,
      "INTERRUPTED",
      new Date(active.startedAt),
      at,
      interruptedBy,
      false,
      null,
    ))
  }

  private fail(command: R2RuntimeCommand, at: Date, errorCode: string, fallbackUsed = false) {
    const receipt = this.receipt(command, "FAILED", at, at, null, fallbackUsed, errorCode)
    this.onReceipt(receipt)
    return receipt
  }

  private skip(command: R2RuntimeCommand, at: Date, errorCode: string) {
    const receipt = this.receipt(command, "SKIPPED", at, at, null, false, errorCode)
    this.onReceipt(receipt)
    return receipt
  }

  private receipt(
    command: R2RuntimeCommand,
    status: R2ExecutionReceipt["status"],
    startedAt: Date,
    completedAt: Date | null,
    interruptedBy: string | null,
    fallbackUsed: boolean,
    errorCode: string | null,
  ): R2ExecutionReceipt {
    return {
      receiptId: `${command.commandId}:${status.toLowerCase()}:${startedAt.getTime()}`,
      commandId: command.commandId,
      eventId: command.eventId,
      workspaceId: command.workspaceId,
      status,
      runtimeState: command.runtimeState,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt?.toISOString() ?? null,
      durationMs: completedAt ? Math.max(0, completedAt.getTime() - startedAt.getTime()) : null,
      interruptedBy,
      fallbackUsed,
      errorCode,
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.timer) this.cancel(this.timer)
    this.timer = null
    this.active = null
  }
}
