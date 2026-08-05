import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { performance } from "node:perf_hooks"
import { resolve } from "node:path"

import { Bone, Mesh, Object3D } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  R2FullCharacterRuntimeController,
  createOwnedR2Scene,
} from "../../components/dashboard/3d/r2/real/r2-full-character-runtime"
import {
  R2_EXPRESSION_CHANNELS,
  R2_RUNTIME_STATES,
  R2_VISEMES,
} from "../../types/r2-full-character-runtime"

if (!("ProgressEvent" in globalThis)) {
  Object.defineProperty(globalThis, "ProgressEvent", {
    value: class ProgressEvent {
      readonly type: string
      readonly lengthComputable: boolean
      readonly loaded: number
      readonly total: number

      constructor(
        type: string,
        init: {
          lengthComputable?: boolean
          loaded?: number
          total?: number
        } = {},
      ) {
        this.type = type
        this.lengthComputable = init.lengthComputable ?? false
        this.loaded = init.loaded ?? 0
        this.total = init.total ?? 0
      }
    },
    configurable: true,
  })
}

async function main() {
const assetPath = process.argv[2]
const reportPath = process.argv[3]

if (!assetPath || !reportPath) {
  throw new Error("Usage: R2_VALIDATE_FULL_CHARACTER_WEB_RUNTIME.ts <asset.glb> <report.json>")
}

function disposeScene(root: Object3D) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]
    for (const material of materials) material.dispose()
  })
}

function neutralFingerprint(root: Object3D) {
  const entries: unknown[] = []
  root.traverse((object) => {
    entries.push({
      name: object.name,
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      morphs:
        object instanceof Mesh && object.morphTargetInfluences
          ? [...object.morphTargetInfluences]
          : null,
    })
  })
  return createHash("sha256")
    .update(JSON.stringify(entries))
    .digest("hex")
    .toUpperCase()
}

const bytes = await readFile(resolve(assetPath))
const sourceSha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase()
const arrayBuffer = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
)

const loader = new GLTFLoader()
const parseDurationsMs: number[] = []
let productionGLTF: Awaited<ReturnType<GLTFLoader["parseAsync"]>> | undefined

for (let attempt = 0; attempt < 3; attempt += 1) {
  const started = performance.now()
  const gltf = await loader.parseAsync(arrayBuffer.slice(0), "")
  parseDurationsMs.push(performance.now() - started)
  if (attempt === 0) {
    productionGLTF = gltf
  } else {
    disposeScene(gltf.scene)
  }
}

if (!productionGLTF) throw new Error("GLTFLoader did not return a scene")

let nodeCount = 0
let meshCount = 0
let boneCount = 0
let materialCount = 0
let morphTargetCount = 0
const materialIds = new Set<string>()

productionGLTF.scene.traverse((object) => {
  nodeCount += 1
  if (object instanceof Bone) boneCount += 1
  if (!(object instanceof Mesh)) return
  meshCount += 1
  morphTargetCount += Object.keys(object.morphTargetDictionary ?? {}).length
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material]
  for (const material of materials) materialIds.add(material.uuid)
})
materialCount = materialIds.size

const ownedScene = createOwnedR2Scene(productionGLTF.scene)
const controller = new R2FullCharacterRuntimeController(
  ownedScene,
  productionGLTF.animations,
)
const neutralBefore = neutralFingerprint(ownedScene)

let pairwiseTransitions = 0
for (const from of R2_RUNTIME_STATES) {
  controller.setState(from)
  for (const to of R2_RUNTIME_STATES) {
    controller.setState(to)
    controller.update(1 / 60)
    pairwiseTransitions += 1
  }
}

for (let cycle = 0; cycle < 25; cycle += 1) {
  for (const state of R2_RUNTIME_STATES) {
    controller.setState(state)
    controller.update(1 / 24)
  }
}

for (const channel of R2_EXPRESSION_CHANNELS) {
  controller.setExpression(channel, 0.75)
  controller.update(1 / 60)
  controller.setExpression(channel, 0)
}

controller.setState("speaking")
for (const viseme of R2_VISEMES) {
  controller.setViseme(viseme, 0.8)
  controller.update(1 / 60)
}
controller.setState("alert")
controller.setEyeTarget({ yaw: -1, pitch: 1 })
controller.resetNeutral()
const neutralAfter = neutralFingerprint(ownedScene)
const neutralResetExact = neutralBefore === neutralAfter

controller.dispose()
const disposed = controller.disposed
disposeScene(productionGLTF.scene)

const sortedDurations = [...parseDurationsMs].sort((a, b) => a - b)
const report = {
  SchemaVersion: 1,
  Audit: "FULL_CHARACTER_WEB_RUNTIME_HEADLESS",
  AssetPath: resolve(assetPath),
  SourceSha256: sourceSha256,
  FileSizeBytes: bytes.byteLength,
  Loader: "three/GLTFLoader.parseAsync",
  ParseAttempts: parseDurationsMs.length,
  ParseDurationsMs: parseDurationsMs.map((value) => Number(value.toFixed(3))),
  ParseMedianMs: Number(sortedDurations[1].toFixed(3)),
  NodeCount: nodeCount,
  MeshCount: meshCount,
  BoneCount: boneCount,
  MaterialCount: materialCount,
  MorphTargetCount: morphTargetCount,
  AnimationNames: productionGLTF.animations.map((clip) => clip.name).sort(),
  RuntimeStateCount: R2_RUNTIME_STATES.length,
  PairwiseTransitions: pairwiseTransitions,
  RepeatedTransitionCycles: 25,
  ExpressionChannelCount: R2_EXPRESSION_CHANNELS.length,
  VisemeCount: R2_VISEMES.length,
  NeutralFingerprintBefore: neutralBefore,
  NeutralFingerprintAfter: neutralAfter,
  NeutralResetExact: neutralResetExact,
  ControllerDisposed: disposed,
  CreatedImages: 0,
  Passed:
    neutralResetExact &&
    disposed &&
    boneCount === 65 &&
    productionGLTF.animations.length === 9 &&
    pairwiseTransitions === 100,
}

await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8")

if (!report.Passed) {
  throw new Error(`Web runtime audit failed: ${JSON.stringify(report)}`)
}

console.log(JSON.stringify(report, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
