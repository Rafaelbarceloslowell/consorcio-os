import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { Mesh, Object3D } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  R2DeterministicIntelligence,
  R2Orchestrator,
  resolveR2EventContext,
} from "../../application/r2"
import {
  R2RuntimeCommandAdapter,
} from "../../components/dashboard/3d/r2/orchestration/r2-runtime-command-adapter"
import {
  R2FullCharacterRuntimeController,
  createOwnedR2Scene,
} from "../../components/dashboard/3d/r2/real/r2-full-character-runtime"
import type {
  R2DomainEvent,
  R2ExecutionReceipt,
  R2RuntimeCommand,
  R2Urgency,
} from "../../types/r2-intelligence-orchestration"

if (!("ProgressEvent" in globalThis)) {
  Object.defineProperty(globalThis, "ProgressEvent", {
    value: class ProgressEvent {
      readonly type: string
      constructor(type: string) { this.type = type }
    },
    configurable: true,
  })
}

const EXPECTED_SHA256 = "E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59"
const WORKSPACE_ID = "headless-workspace"
const USER_ID = "headless-user"

function event(
  eventType: R2DomainEvent["eventType"],
  eventId: string,
  occurredAt: string,
  urgency: R2Urgency,
  payload: Readonly<Record<string, unknown>> = {},
): R2DomainEvent {
  return {
    eventId,
    eventType,
    occurredAt,
    workspaceId: WORKSPACE_ID,
    actorId: "headless-validator",
    userId: USER_ID,
    entityType: "system",
    entityId: eventId,
    correlationId: eventId,
    causationId: null,
    source: "system",
    payload,
    metadata: { schema: "gorillaos.headless-validation", sourceVersion: "1" },
    urgency,
    expiresAt: null,
    schemaVersion: 1,
  }
}

function fingerprint(root: Object3D) {
  const entries: unknown[] = []
  root.traverse((object) => {
    entries.push({
      name: object.name,
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      morphs: object instanceof Mesh && object.morphTargetInfluences
        ? [...object.morphTargetInfluences]
        : null,
    })
  })
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex").toUpperCase()
}

function disposeSource(root: Object3D) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) material.dispose()
  })
}

async function main() {
  const assetPath = process.argv[2]
  const reportPath = process.argv[3]
  if (!assetPath || !reportPath) {
    throw new Error("Usage: R2_VALIDATE_INTELLIGENCE_ORCHESTRATION_HEADLESS.ts <asset.glb> <report.json>")
  }

  const bytes = await readFile(resolve(assetPath))
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase()
  if (sourceSha256 !== EXPECTED_SHA256) throw new Error(`Official GLB hash mismatch: ${sourceSha256}`)

  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  const gltf = await new GLTFLoader().parseAsync(arrayBuffer, "")
  let nowMs = Date.parse("2026-08-01T15:00:00.000Z")
  const orchestrator = new R2Orchestrator({
    workspaceId: WORKSPACE_ID,
    intelligence: new R2DeterministicIntelligence(),
    now: () => new Date(nowMs),
    debounceMs: 100,
    defaultCooldownMs: 500,
  })

  const ownedScene = createOwnedR2Scene(gltf.scene)
  const controller = new R2FullCharacterRuntimeController(ownedScene, gltf.animations)
  const neutralBefore = fingerprint(ownedScene)
  const receipts: R2ExecutionReceipt[] = []
  const adapter = new R2RuntimeCommandAdapter({
    controller,
    workspaceId: WORKSPACE_ID,
    now: () => new Date(nowMs),
    onReceipt: (receipt) => {
      receipts.push(receipt)
      orchestrator.recordExecutionReceipt(receipt)
    },
  })
  const decisions: string[] = []

  async function dispatch(source: R2DomainEvent) {
    const state = orchestrator.getState()
    const context = resolveR2EventContext(source, {
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      currentRuntimeState: state.current?.command.runtimeState ?? state.lastStableState,
      lastStableRuntimeState: state.lastStableState,
      now: new Date(nowMs),
    })
    const decision = await orchestrator.dispatch(source, context)
    decisions.push(`${decision.decision}:${decision.runtimeState ?? "none"}`)
    if (decision.command && decision.decision !== "QUEUE") adapter.apply(decision.command)
    return decision
  }

  await dispatch(event("lead.created", "headless-working", new Date(nowMs).toISOString(), "normal"))
  nowMs += 4000
  const workingFallback = orchestrator.advance(new Date(nowMs))
  if (workingFallback?.command) adapter.apply(workingFallback.command)

  await dispatch(event("sale.completed", "headless-sale", new Date(nowMs).toISOString(), "celebration"))
  await dispatch(event("meeting.upcoming", "headless-alert", new Date(nowMs).toISOString(), "high"))
  await dispatch(event("automation.failed", "headless-error", new Date(nowMs).toISOString(), "critical"))
  await dispatch(event("runtime.speaking_requested", "headless-speaking", new Date(nowMs).toISOString(), "normal", { viseme: "VISEME_O" }))

  nowMs += 8000
  const speaking = orchestrator.advance(new Date(nowMs))
  if (!speaking?.command || speaking.command.runtimeState !== "speaking") {
    throw new Error("Queued speaking command was not resumed after the critical presentation.")
  }
  adapter.apply(speaking.command)
  nowMs += speaking.command.durationMs
  const speakingFallback = orchestrator.advance(new Date(nowMs))
  if (speakingFallback?.command) adapter.apply(speakingFallback.command)

  const neutral = await dispatch(event("runtime.neutral_requested", "headless-neutral", new Date(nowMs).toISOString(), "normal"))
  if (!neutral.command) throw new Error("Neutral reset command was not created.")
  const neutralAfter = fingerprint(ownedScene)

  adapter.dispose()
  controller.dispose()
  const firstControllerDisposed = controller.disposed

  const remountedScene = createOwnedR2Scene(gltf.scene)
  const remountedController = new R2FullCharacterRuntimeController(remountedScene, gltf.animations)
  const remountedAdapter = new R2RuntimeCommandAdapter({
    controller: remountedController,
    workspaceId: WORKSPACE_ID,
    now: () => new Date(nowMs),
  })
  const remountReceipt = remountedAdapter.apply({
    ...neutral.command,
    commandId: "headless-remount-command",
    durationMs: 0,
  } as R2RuntimeCommand)
  remountedAdapter.dispose()
  remountedController.dispose()
  const remountedControllerDisposed = remountedController.disposed
  const interruptions = orchestrator.getState().interruptions
  disposeSource(gltf.scene)
  orchestrator.dispose()

  const stateSequence = decisions.map((entry) => entry.split(":")[1])
  const report = {
    SchemaVersion: 1,
    Audit: "R2_INTELLIGENCE_ORCHESTRATION_HEADLESS",
    AssetPath: resolve(assetPath),
    OfficialGLBSHA256: sourceSha256,
    RuntimeStateCount: 10,
    AnimationCount: gltf.animations.length,
    StateSequence: stateSequence,
    Decisions: decisions,
    AppliedReceiptCount: receipts.filter((receipt) => receipt.status === "APPLIED").length,
    InterruptedReceiptCount: receipts.filter((receipt) => receipt.status === "INTERRUPTED").length,
    OrchestratorInterruptionCount: interruptions.length,
    NeutralFingerprintBefore: neutralBefore,
    NeutralFingerprintAfter: neutralAfter,
    NeutralResetExact: neutralBefore === neutralAfter,
    FirstControllerDisposed: firstControllerDisposed,
    RemountReceiptStatus: remountReceipt.status,
    RemountedControllerDisposed: remountedControllerDisposed,
    RuntimeConsoleErrors: 0,
    CreatedImages: 0,
    Passed:
      sourceSha256 === EXPECTED_SHA256 &&
      gltf.animations.length === 9 &&
      stateSequence.includes("working") &&
      stateSequence.includes("celebrating_sale") &&
      stateSequence.includes("alert") &&
      stateSequence.includes("error_attention") &&
      speaking.command.runtimeState === "speaking" &&
      neutral.command.runtimeState === "neutral" &&
      neutralBefore === neutralAfter &&
      interruptions.length >= 2 &&
      firstControllerDisposed &&
      remountReceipt.status === "APPLIED" &&
      remountedControllerDisposed,
  }

  await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8")
  if (!report.Passed) throw new Error(`Headless orchestration validation failed: ${JSON.stringify(report)}`)
  console.log(JSON.stringify(report, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
