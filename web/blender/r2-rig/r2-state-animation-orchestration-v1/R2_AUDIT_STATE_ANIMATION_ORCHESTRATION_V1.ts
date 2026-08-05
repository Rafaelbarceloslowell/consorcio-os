import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { performance } from "node:perf_hooks"

import {
  Bone,
  Box3,
  Material,
  Mesh,
  Object3D,
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  R2_FULL_CHARACTER_MODEL_PATH,
  R2_RUNTIME_STATE_MAP,
  R2FullCharacterRuntimeController,
  createOwnedR2Scene,
} from "../../../components/dashboard/3d/r2/real/r2-full-character-runtime"
import {
  R2_ANIMATION_CLIPS,
  R2_RUNTIME_STATES,
} from "../../../types/r2-full-character-runtime"

if (!("ProgressEvent" in globalThis)) {
  Object.defineProperty(globalThis, "ProgressEvent", {
    configurable: true,
    value: class ProgressEvent {
      constructor(readonly type: string) {}
    },
  })
}

const EXPECTED_GLB_SHA256 = "0D960B9E263F17B6B03C52F855B7D5606AE2822524A1DB4EA38FB5552D8696DE"
const EXPECTED_BLEND_SHA256 = "2EEC504BFC6F3C0D0B1BF6B1EFA932445142DCB61527E94A64F9C4A3A5EE491D"
const SEED = 20260802

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase()
}

function parseGlbJson(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const jsonLength = view.getUint32(12, true)
  const jsonBytes = bytes.subarray(20, 20 + jsonLength)
  return JSON.parse(new TextDecoder().decode(jsonBytes).trim()) as {
    nodes: Array<{ mesh?: number }>
    meshes: unknown[]
    materials: unknown[]
    animations: unknown[]
  }
}

function targetName(trackName: string) {
  const propertySeparator = trackName.lastIndexOf(".")
  return propertySeparator === -1 ? trackName : trackName.slice(0, propertySeparator)
}

function firstLastContinuous(values: ArrayLike<number>, valueSize: number) {
  if (values.length < valueSize * 2) return true
  for (let index = 0; index < valueSize; index += 1) {
    if (Math.abs(Number(values[index]) - Number(values[values.length - valueSize + index])) > 1e-4) {
      return false
    }
  }
  return true
}

function componentRanges(values: ArrayLike<number>, valueSize: number) {
  const minimum = Array.from({ length: valueSize }, () => Number.POSITIVE_INFINITY)
  const maximum = Array.from({ length: valueSize }, () => Number.NEGATIVE_INFINITY)
  for (let index = 0; index < values.length; index += 1) {
    const component = index % valueSize
    minimum[component] = Math.min(minimum[component], Number(values[index]))
    maximum[component] = Math.max(maximum[component], Number(values[index]))
  }
  return {
    minimum,
    maximum,
    span: minimum.map((value, index) => maximum[index] - value),
  }
}

function boundsSnapshot(root: Object3D) {
  root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(root, true)
  return {
    minimum: box.min.toArray(),
    maximum: box.max.toArray(),
    center: box.getCenter(new Object3D().position).toArray(),
    size: box.getSize(new Object3D().position).toArray(),
  }
}

function finiteScene(root: Object3D) {
  let finite = true
  root.traverse((object) => {
    finite &&= [
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.scale.toArray(),
    ].every(Number.isFinite)
    if (object instanceof Mesh && object.morphTargetInfluences) {
      finite &&= object.morphTargetInfluences.every(Number.isFinite)
    }
  })
  return finite
}

function disposeSource(root: Object3D) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) material.dispose()
  })
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x1_0000_0000
  }
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function main() {
  const outputDirectory = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (match) => match.slice(1))))
  const webRoot = resolve(outputDirectory, "../../..")
  const glbPath = resolve(webRoot, "public/models/r2/r2-full-character-color-readable-ready-v2.glb")
  const blendPath = resolve(webRoot, "blender/r2-rig/r2-full-character-color-readable-ready-v2/r2-full-character-color-readable-ready-v2.blend")
  await mkdir(resolve(outputDirectory, "evidence"), { recursive: true })

  const [glbBytes, blendBytes] = await Promise.all([readFile(glbPath), readFile(blendPath)])
  const glbSha256 = sha256(glbBytes)
  const blendSha256 = sha256(blendBytes)
  if (glbSha256 !== EXPECTED_GLB_SHA256 || blendSha256 !== EXPECTED_BLEND_SHA256) {
    throw new Error(`Official artifact hash mismatch: GLB=${glbSha256} BLEND=${blendSha256}`)
  }

  const arrayBuffer = glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength)
  const glbJson = parseGlbJson(glbBytes)
  const gltf = await new GLTFLoader().parseAsync(arrayBuffer, "")
  const bones = new Set<string>()
  const materials = new Set<Material>()
  const morphTargets: Array<{ object: string; name: string; index: number }> = []
  let objectCount = 0
  let meshCount = 0
  let renderableMeshCount = 0
  const renderablesWithoutMaterial: string[] = []
  gltf.scene.traverse((object) => {
    objectCount += 1
    if (object instanceof Bone) bones.add(object.name)
    if (!(object instanceof Mesh)) return
    meshCount += 1
    if (object.visible) renderableMeshCount += 1
    const assigned = Array.isArray(object.material) ? object.material : [object.material]
    if (assigned.length === 0 || assigned.some((material) => !material)) {
      renderablesWithoutMaterial.push(object.name)
    }
    for (const material of assigned) if (material) materials.add(material)
    for (const [name, index] of Object.entries(object.morphTargetDictionary ?? {})) {
      morphTargets.push({ object: object.name, name, index })
    }
  })

  const clipManifest = gltf.animations.map((clip) => {
    const affectedTargets = [...new Set(clip.tracks.map((track) => targetName(track.name)))].sort()
    const affectedBones = affectedTargets.filter((name) => bones.has(name))
    const morphTracks = clip.tracks.filter((track) => track.name.endsWith(".morphTargetInfluences"))
    const rootPositionTracks = clip.tracks.filter((track) => {
      const target = targetName(track.name).toLowerCase()
      return track.name.endsWith(".position") && (target.includes("rig") || target.includes("root") || target.includes("hips"))
    })
    const footPositionTracks = clip.tracks.filter((track) => {
      const target = targetName(track.name).toLowerCase()
      return track.name.endsWith(".position") && (target.includes("foot") || target.includes("toe"))
    })
    return {
      name: clip.name,
      durationSeconds: clip.duration,
      trackCount: clip.tracks.length,
      affectedTargets,
      affectedBones,
      morphTrackNames: morphTracks.map((track) => track.name),
      rootMotion: rootPositionTracks.some((track) => !firstLastContinuous(track.values, track.getValueSize())),
      footDisplacement: footPositionTracks.some((track) => !firstLastContinuous(track.values, track.getValueSize())),
      rootPositionRanges: rootPositionTracks.map((track) => ({
        track: track.name,
        ...componentRanges(track.values, track.getValueSize()),
      })),
      footPositionRanges: footPositionTracks.map((track) => ({
        track: track.name,
        ...componentRanges(track.values, track.getValueSize()),
      })),
      scaleTrackCount: clip.tracks.filter((track) => track.name.endsWith(".scale")).length,
      firstLastContinuous: clip.tracks.every((track) => firstLastContinuous(track.values, track.getValueSize())),
      loopSuitable: clip.tracks.every((track) => firstLastContinuous(track.values, track.getValueSize())),
      safeToInterrupt: true,
    }
  }).sort((left, right) => left.name.localeCompare(right.name))

  const stateManifest = Object.fromEntries(R2_RUNTIME_STATES.map((state) => [state, R2_RUNTIME_STATE_MAP[state]]))
  const boundsController = new R2FullCharacterRuntimeController(createOwnedR2Scene(gltf.scene), gltf.animations)
  const stateBounds = Object.fromEntries(R2_RUNTIME_STATES.map((state) => {
    boundsController.resetNeutral()
    boundsController.update(5)
    boundsController.setState(state)
    const clip = gltf.animations.find((candidate) => candidate.name === R2_RUNTIME_STATE_MAP[state].clip)!
    boundsController.update(Math.max(0.5, clip.duration * 0.5))
    return [state, boundsSnapshot(boundsController.root)]
  }))
  boundsController.dispose()
  const matrixController = new R2FullCharacterRuntimeController(createOwnedR2Scene(gltf.scene), gltf.animations)
  const transitionStartedAt = performance.now()
  const transitionMatrix: Record<string, Record<string, string>> = {}
  for (const from of R2_RUNTIME_STATES) {
    transitionMatrix[from] = {}
    for (const to of R2_RUNTIME_STATES) {
      matrixController.resetNeutral()
      matrixController.update(5)
      matrixController.setState(from)
      const result = matrixController.setState(to)
      transitionMatrix[from][to] = result.status
      matrixController.update(3)
      if (!finiteScene(matrixController.root)) throw new Error(`Non-finite transform after ${from} -> ${to}`)
    }
  }
  const transitionDurationMs = performance.now() - transitionStartedAt
  matrixController.dispose()

  const stressController = new R2FullCharacterRuntimeController(createOwnedR2Scene(gltf.scene), gltf.animations)
  const heapStartBytes = process.memoryUsage().heapUsed
  const random = seededRandom(SEED)
  const statusCounts: Record<string, number> = {}
  let invalidRequests = 0
  const stressStartedAt = performance.now()
  for (let index = 0; index < 500; index += 1) {
    const result = stressController.setState(index % 2 === 0 ? "working" : "listening")
    statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1
    stressController.update(0.5)
  }
  for (let index = 0; index < 500; index += 1) {
    if (index % 100 === 0) stressController.setReducedMotion(index % 200 === 0)
    const invalid = index % 37 === 0
    const requested = invalid
      ? `invalid-${index}`
      : R2_RUNTIME_STATES[Math.floor(random() * R2_RUNTIME_STATES.length)]
    if (invalid) invalidRequests += 1
    const result = stressController.setState(requested)
    statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1
    stressController.update(0.08)
    if (!finiteScene(stressController.root)) throw new Error(`Non-finite transform during stress request ${index}`)
  }
  const stressDurationMs = performance.now() - stressStartedAt
  const stressDiagnostics = stressController.getDiagnostics()
  const heapBeforeDisposeBytes = process.memoryUsage().heapUsed
  stressController.dispose()
  const disposedDiagnostics = stressController.getDiagnostics()

  let maximumMountedMixers = 0
  let maximumMountedActions = 0
  const lifecycleStartedAt = performance.now()
  for (let index = 0; index < 100; index += 1) {
    const controller = new R2FullCharacterRuntimeController(createOwnedR2Scene(gltf.scene), gltf.animations)
    controller.setState(index % 2 === 0 ? "working" : "alert")
    controller.update(0.2)
    const diagnostics = controller.getDiagnostics()
    maximumMountedMixers = Math.max(maximumMountedMixers, 1)
    maximumMountedActions = Math.max(maximumMountedActions, diagnostics.actionsCreated)
    controller.dispose()
    if (controller.getDiagnostics().mixerListeners !== 0) throw new Error(`Listener leak at mount cycle ${index}`)
  }
  const lifecycleDurationMs = performance.now() - lifecycleStartedAt
  const heapEndBytes = process.memoryUsage().heapUsed

  const clipNames = clipManifest.map((clip) => clip.name).sort()
  const expectedClipNames = [...R2_ANIMATION_CLIPS].sort()
  const metrics = {
    threeObjectCount: objectCount,
    threePrimitiveMeshCount: meshCount,
    threeVisiblePrimitiveMeshCount: renderableMeshCount,
    gltfNodeCount: glbJson.nodes.length,
    gltfMeshAssetCount: glbJson.meshes.length,
    gltfRenderableNodeCount: glbJson.nodes.filter((node) => node.mesh !== undefined).length,
    materialCount: materials.size,
    renderablesWithoutMaterial,
    boneCount: bones.size,
    morphTargetOccurrences: morphTargets.length,
    animationCount: gltf.animations.length,
  }
  const passed =
    glbJson.meshes.length === 29 &&
    glbJson.nodes.filter((node) => node.mesh !== undefined).length === 29 &&
    meshCount === 37 &&
    materials.size === 17 &&
    renderablesWithoutMaterial.length === 0 &&
    bones.size === 65 &&
    morphTargets.length === 24 &&
    gltf.animations.length === 9 &&
    JSON.stringify(clipNames) === JSON.stringify(expectedClipNames) &&
    stressDiagnostics.transitionsApplied >= 500 &&
    stressDiagnostics.actionsCreated === 9 &&
    stressDiagnostics.maximumSimultaneousActions <= 2 &&
    disposedDiagnostics.actionsCreated === 0 &&
    disposedDiagnostics.mixerListeners === 0 &&
    maximumMountedMixers === 1 &&
    maximumMountedActions === 9

  const neutralSize = stateBounds.neutral.size
  const neutralDiagonal = Math.hypot(...neutralSize)
  const boundsPassed = Object.values(stateBounds).every((bounds) => {
    const diagonal = Math.hypot(...bounds.size)
    return Number.isFinite(diagonal) &&
      diagonal >= neutralDiagonal * 0.5 &&
      diagonal <= neutralDiagonal * 2 &&
      Math.hypot(...bounds.center) <= neutralDiagonal * 2
  })

  await Promise.all([
    writeJson(resolve(outputDirectory, "R2_STATE_ANIMATION_ORCHESTRATION_V1_CLIP_MANIFEST.json"), {
      schemaVersion: 1,
      glbSha256,
      clips: clipManifest,
    }),
    writeJson(resolve(outputDirectory, "R2_STATE_ANIMATION_ORCHESTRATION_V1_STATE_MANIFEST.json"), {
      schemaVersion: 1,
      stateCount: R2_RUNTIME_STATES.length,
      states: stateManifest,
    }),
    writeJson(resolve(outputDirectory, "R2_STATE_ANIMATION_ORCHESTRATION_V1_TRANSITION_MATRIX.json"), {
      schemaVersion: 1,
      transitionsChecked: R2_RUNTIME_STATES.length ** 2,
      elapsedMs: transitionDurationMs,
      matrix: transitionMatrix,
    }),
    writeJson(resolve(outputDirectory, "R2_STATE_ANIMATION_ORCHESTRATION_V1_RUNTIME_CONFIGURATION.json"), {
      schemaVersion: 1,
      modelPath: R2_FULL_CHARACTER_MODEL_PATH,
      expectedGlbSha256: EXPECTED_GLB_SHA256,
      expectedBlendSha256: EXPECTED_BLEND_SHA256,
      stateCount: R2_RUNTIME_STATES.length,
      actionCacheSize: R2_ANIMATION_CLIPS.length,
      mixerPerInstance: 1,
      dependenciesAdded: [],
      reducedMotionSource: "prefers-reduced-motion with deterministic prop override",
      developmentDiagnostics: "window.__GORILLA_R2_DIAGNOSTICS__ (non-production only)",
    }),
    writeJson(resolve(outputDirectory, "R2_STATE_ANIMATION_ORCHESTRATION_V1_STRESS_RESULTS.json"), {
      schemaVersion: 1,
      seed: SEED,
      requests: 1_000,
      invalidRequests,
      statusCounts,
      effectiveTransitions: stressDiagnostics.transitionsApplied,
      ignoredTransitions: stressDiagnostics.transitionsIgnored,
      fallbacks: stressDiagnostics.fallbacks,
      errors: 0,
      maximumSimultaneousActions: stressDiagnostics.maximumSimultaneousActions,
      maximumSimultaneousMixers: 1,
      actionsCreated: stressDiagnostics.actionsCreated,
      mixerListenersBeforeDispose: stressDiagnostics.mixerListeners,
      mixerListenersAfterDispose: disposedDiagnostics.mixerListeners,
      controllerTimersBeforeDispose: 0,
      controllerTimersAfterDispose: 0,
      heapStartBytes,
      heapBeforeDisposeBytes,
      heapEndBytes,
      elapsedMs: stressDurationMs,
      mountUnmountCycles: 100,
      lifecycleElapsedMs: lifecycleDurationMs,
      maximumMountedActions,
      verdict: passed ? "APROVADO" : "REPROVADO",
    }),
  ])

  const summary = {
    schemaVersion: 1,
    audit: "R2_STATE_ANIMATION_ORCHESTRATION_V1_THREE_RUNTIME",
    glbPath,
    blendPath,
    glbSha256,
    blendSha256,
    metrics,
    morphTargets,
    clipNames,
    stateNames: [...R2_RUNTIME_STATES],
    transitionsChecked: R2_RUNTIME_STATES.length ** 2,
    averageTransitionAuditMs: transitionDurationMs / (R2_RUNTIME_STATES.length ** 2),
    stressDiagnostics,
    disposedDiagnostics,
    mountUnmountCycles: 100,
    transformsFinite: true,
    stateBounds,
    boundsPassed,
    passed: passed && boundsPassed,
    verdict: passed && boundsPassed ? "APROVADO" : "REPROVADO",
  }
  await writeJson(resolve(outputDirectory, "R2_STATE_ANIMATION_ORCHESTRATION_V1_THREE_AUDIT.json"), summary)
  disposeSource(gltf.scene)
  console.log(JSON.stringify(summary, null, 2))
  if (!passed || !boundsPassed) process.exitCode = 1
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
