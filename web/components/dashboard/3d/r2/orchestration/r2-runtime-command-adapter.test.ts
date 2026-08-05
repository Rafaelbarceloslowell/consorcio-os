/// <reference types="vitest/globals" />

import { Object3D } from "three"

import type { R2RuntimeControllerApi } from "@/types/r2-full-character-runtime"
import type { R2RuntimeCommand } from "@/types/r2-intelligence-orchestration"
import { R2RuntimeCommandAdapter } from "./r2-runtime-command-adapter"

const NOW = "2026-08-01T15:00:00.000Z"

function command(overrides: Partial<R2RuntimeCommand> = {}): R2RuntimeCommand {
  return {
    commandId: "command-1",
    eventId: "event-1",
    workspaceId: "workspace-a",
    runtimeState: "speaking",
    expression: "SMILE",
    expressionIntensity: 0.6,
    viseme: "VISEME_A",
    speakingIntensity: 0.75,
    eyeTarget: { yaw: 0.2, pitch: -0.1 },
    durationMs: 1000,
    minimumDisplayMs: 200,
    transitionMs: 100,
    priority: "NORMAL",
    message: "Mensagem confirmada",
    actionLabel: null,
    actionId: null,
    expiresAt: null,
    fallbackState: "listening",
    requiresConfirmation: false,
    ...overrides,
  }
}

function controllerFixture() {
  const controller: R2RuntimeControllerApi = {
    root: new Object3D(),
    state: "neutral",
    requestedState: "neutral",
    disposed: false,
    setState: vi.fn((state) => ({
      requestedState: state,
      effectiveState: "neutral" as const,
      status: "applied" as const,
      generation: 1,
    })),
    setReducedMotion: vi.fn(),
    getDiagnostics: vi.fn(() => ({
      requestedState: "neutral" as const,
      effectiveState: "neutral" as const,
      activeClip: null,
      elapsedInStateMs: 0,
      reducedMotion: false,
      actionsCreated: 9,
      actionsReused: 0,
      maximumSimultaneousActions: 0,
      activeActions: 0,
      transitionsApplied: 0,
      transitionsIgnored: 0,
      fallbacks: 0,
      mixerListeners: 0,
      pendingState: null,
    })),
    setExpression: vi.fn(),
    setViseme: vi.fn(),
    setEyeTarget: vi.fn(),
    setSpeakingIntensity: vi.fn(),
    resetNeutral: vi.fn(),
    update: vi.fn(),
    dispose: vi.fn(),
  }
  return controller
}

describe("R2 runtime command adapter", () => {
  it("applies a complete typed command and reports completion with fallback", () => {
    const controller = controllerFixture()
    const receipts: string[] = []
    let scheduled: (() => void) | null = null
    const adapter = new R2RuntimeCommandAdapter({
      controller,
      workspaceId: "workspace-a",
      now: () => new Date(NOW),
      schedule: (callback) => { scheduled = callback; return 1 as unknown as ReturnType<typeof setTimeout> },
      cancel: vi.fn(),
      onReceipt: (receipt) => receipts.push(receipt.status),
    })
    expect(adapter.apply(command()).status).toBe("APPLIED")
    expect(controller.resetNeutral).not.toHaveBeenCalled()
    expect(controller.setState).toHaveBeenCalledWith("speaking")
    expect(controller.setExpression).toHaveBeenCalledWith("SMILE", 0.6)
    expect(controller.setViseme).toHaveBeenCalledWith("VISEME_A", 0.75)
    expect(controller.setEyeTarget).toHaveBeenCalledWith({ yaw: 0.2, pitch: -0.1 })
    expect(controller.setSpeakingIntensity).toHaveBeenCalledWith(0.75)
    expect(scheduled).not.toBeNull()
    ;(scheduled as unknown as () => void)()
    expect(controller.setState).toHaveBeenLastCalledWith("listening")
    expect(receipts).toEqual(["APPLIED", "COMPLETED"])
  })

  it("interrupts the prior timer and command before applying a newer command", () => {
    const controller = controllerFixture()
    const cancel = vi.fn()
    const statuses: string[] = []
    const adapter = new R2RuntimeCommandAdapter({
      controller,
      workspaceId: "workspace-a",
      now: () => new Date(NOW),
      schedule: () => 9 as unknown as ReturnType<typeof setTimeout>,
      cancel,
      onReceipt: (receipt) => statuses.push(receipt.status),
    })
    adapter.apply(command())
    adapter.apply(command({ commandId: "command-2", eventId: "event-2", runtimeState: "alert" }))
    expect(cancel).toHaveBeenCalledWith(9)
    expect(statuses).toEqual(["APPLIED", "INTERRUPTED", "APPLIED"])
  })

  it("rejects other workspaces, expired commands and invalid channels without mutating Three", () => {
    const controller = controllerFixture()
    const adapter = new R2RuntimeCommandAdapter({
      controller,
      workspaceId: "workspace-a",
      now: () => new Date(NOW),
    })
    expect(adapter.apply(command({ workspaceId: "workspace-b" }))).toMatchObject({ status: "FAILED", errorCode: "WORKSPACE_MISMATCH" })
    expect(adapter.apply(command({ expiresAt: "2026-08-01T14:00:00.000Z" }))).toMatchObject({ status: "SKIPPED", errorCode: "COMMAND_EXPIRED" })
    expect(adapter.apply({ ...command(), expression: "INVALID" } as unknown as R2RuntimeCommand)).toMatchObject({ status: "FAILED", errorCode: "INVALID_RUNTIME_COMMAND" })
    expect(controller.setState).not.toHaveBeenCalled()
  })

  it("restores a safe fallback when controller application fails", () => {
    const controller = controllerFixture()
    vi.mocked(controller.setState).mockImplementation((state) => {
      if (state === "speaking") throw new Error("mixer rejected state")
      return {
        requestedState: state,
        effectiveState: "listening",
        status: "applied",
        generation: 1,
      }
    })
    const adapter = new R2RuntimeCommandAdapter({
      controller,
      workspaceId: "workspace-a",
      now: () => new Date(NOW),
    })
    expect(adapter.apply(command())).toMatchObject({
      status: "FAILED", errorCode: "RUNTIME_COMMAND_FAILED", fallbackUsed: true,
    })
    expect(controller.setState).toHaveBeenLastCalledWith("listening")
  })

  it("clears its own timer and never owns controller disposal", () => {
    const controller = controllerFixture()
    const cancel = vi.fn()
    const adapter = new R2RuntimeCommandAdapter({
      controller,
      workspaceId: "workspace-a",
      schedule: () => 11 as unknown as ReturnType<typeof setTimeout>,
      cancel,
    })
    adapter.apply(command())
    adapter.dispose()
    expect(cancel).toHaveBeenCalledWith(11)
    expect(controller.dispose).not.toHaveBeenCalled()
    expect(adapter.apply(command({ commandId: "after-dispose" }))).toMatchObject({
      status: "FAILED", errorCode: "RUNTIME_DISPOSED",
    })
    expect(controller.setState).toHaveBeenCalledTimes(1)
  })
})
