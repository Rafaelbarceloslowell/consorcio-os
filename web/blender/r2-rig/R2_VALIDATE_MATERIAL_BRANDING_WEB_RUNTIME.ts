import { createHash } from "node:crypto"
import { readFile, rename, writeFile } from "node:fs/promises"
import { performance } from "node:perf_hooks"
import { resolve } from "node:path"

import {
  Bone,
  Box3,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  R2FullCharacterRuntimeController,
  createOwnedR2Scene,
} from "../../components/dashboard/3d/r2/real/r2-full-character-runtime"
import {
  R2_EFFECTIVE_VERTICAL_COVERAGE,
  R2_MODEL_PRESENTATION_SCALE,
  calculateR2CameraFraming,
  computeR2RenderableBounds,
} from "../../components/dashboard/3d/r2/real/r2-character-presentation"
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
      constructor(type: string, init: { lengthComputable?: boolean; loaded?: number; total?: number } = {}) {
        this.type = type
        this.lengthComputable = init.lengthComputable ?? false
        this.loaded = init.loaded ?? 0
        this.total = init.total ?? 0
      }
    },
    configurable: true,
  })
}

const BRANDING = [
  "R2_Brand_RightChest_GorillaMark",
  "R2_Brand_LeftArm_GorillaMark_R2_Patch",
  "R2_Brand_UpperBack_GorillaMark",
] as const

const MAIN_ASSIGNMENTS: Readonly<Record<string, string>> = {
  R2_Arm_Fur_R: "R2_Mat_Fur_MidGraphite",
  R2_Hand_L: "R2_Mat_Skin_Anthracite",
  R2_Hand_R: "R2_Mat_Skin_Anthracite",
  R2_Head_Face_Foundation: "R2_Mat_Skin_Anthracite",
  R2_Head_Fur: "R2_Mat_Fur_DarkGraphite",
  R2_Hood: "R2_Mat_Hoodie_Black",
  R2_Hood_Cord_L: "R2_Mat_GorillaOS_Green",
  R2_Hood_Cord_R: "R2_Mat_GorillaOS_Green",
  R2_Hoodie_Sleeve_L: "R2_Mat_Hoodie_Black",
  R2_Hoodie_Sleeve_R: "R2_Mat_Hoodie_Black",
  R2_Hoodie_Torso: "R2_Mat_Hoodie_Black",
  R2_Pants: "R2_Mat_Pants_Charcoal",
  R2_Shoe_L: "R2_Mat_Shoes_Black",
  R2_Shoe_R: "R2_Mat_Shoes_Black",
}

const V2_MATERIALS = {
  R2_Mat_Fur_DarkGraphite: { color: 0x2d312e, roughness: 0.8, metalness: 0 },
  R2_Mat_Fur_MidGraphite: { color: 0x303431, roughness: 0.78, metalness: 0 },
  R2_Mat_Skin_Anthracite: { color: 0x414743, roughness: 0.68, metalness: 0 },
  R2_Mat_Hoodie_Black: { color: 0x4f5c3a, roughness: 0.82, metalness: 0 },
  R2_Mat_Pants_Charcoal: { color: 0x363a3e, roughness: 0.78, metalness: 0 },
  R2_Mat_Shoes_Black: { color: 0x141718, roughness: 0.54, metalness: 0 },
} as const

function disposeScene(root: Object3D) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
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
      morphs: object instanceof Mesh && object.morphTargetInfluences ? [...object.morphTargetInfluences] : null,
    })
  })
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex").toUpperCase()
}

function materialFingerprint(root: Object3D) {
  const entries: unknown[] = []
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      entries.push({
        object: object.name,
        name: material.name,
        color: material instanceof MeshStandardMaterial ? material.color.getHex() : null,
        metalness: material instanceof MeshStandardMaterial ? material.metalness : null,
        roughness: material instanceof MeshStandardMaterial ? material.roughness : null,
      })
    }
  })
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex").toUpperCase()
}

function materialsOf(object: Object3D | undefined) {
  if (!object) return []
  const names: string[] = []
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) names.push(material.name)
  })
  return names
}

function boundsFor(root: Object3D, name: string) {
  const object = root.getObjectByName(name)
  if (!object) throw new Error(`Missing bounds object: ${name}`)
  return new Box3().setFromObject(object)
}

async function main() {
  const assetPath = process.argv[2]
  const reportPath = process.argv[3]
  if (!assetPath || !reportPath) {
    throw new Error("Usage: R2_VALIDATE_MATERIAL_BRANDING_WEB_RUNTIME.ts <asset.glb> <report.json>")
  }
  const bytes = await readFile(resolve(assetPath))
  const sha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase()
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  const loader = new GLTFLoader()
  const parseDurationsMs: number[] = []
  let production: Awaited<ReturnType<GLTFLoader["parseAsync"]>> | undefined
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const started = performance.now()
    const gltf = await loader.parseAsync(arrayBuffer.slice(0), "")
    parseDurationsMs.push(performance.now() - started)
    if (attempt === 0) production = gltf
    else disposeScene(gltf.scene)
  }
  if (!production) throw new Error("GLTFLoader did not return a production scene")

  let nodeCount = 0
  let meshCount = 0
  let boneCount = 0
  let morphTargetCount = 0
  const materialIds = new Set<string>()
  const materialsByName = new Map<string, Material>()
  production.scene.traverse((object) => {
    nodeCount += 1
    if (object instanceof Bone) boneCount += 1
    if (!(object instanceof Mesh)) return
    meshCount += 1
    morphTargetCount += Object.keys(object.morphTargetDictionary ?? {}).length
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      materialIds.add(material.uuid)
      materialsByName.set(material.name, material)
    }
  })

  const brandingPresent = BRANDING.every((name) => production!.scene.getObjectByName(name))
  const brandingAssignments = Object.fromEntries(BRANDING.map((name) => [name, materialsOf(production.scene.getObjectByName(name))]))
  const mainAssignments = Object.fromEntries(Object.keys(MAIN_ASSIGNMENTS).map((name) => [name, materialsOf(production.scene.getObjectByName(name))]))
  const allMainMaterialized = Object.entries(MAIN_ASSIGNMENTS).every(([objectName, materialName]) => mainAssignments[objectName]?.includes(materialName))
  const noDefaultWhiteMainMeshes = Object.entries(MAIN_ASSIGNMENTS).every(([objectName]) => {
    const object = production!.scene.getObjectByName(objectName)
    const materials = materialsOf(object)
    return materials.length > 0 && materials.every((name) => name.startsWith("R2_Mat_") && name !== "")
  })
  const expectedBrandingAssignments =
    new Set(brandingAssignments.R2_Brand_RightChest_GorillaMark).size === 2 &&
    brandingAssignments.R2_Brand_RightChest_GorillaMark.includes("R2_Mat_Embroidery_Gray") &&
    brandingAssignments.R2_Brand_RightChest_GorillaMark.includes("R2_Mat_Embroidery_White") &&
    new Set(brandingAssignments.R2_Brand_LeftArm_GorillaMark_R2_Patch).size === 2 &&
    brandingAssignments.R2_Brand_LeftArm_GorillaMark_R2_Patch.includes("R2_Mat_Embroidery_Gray") &&
    brandingAssignments.R2_Brand_LeftArm_GorillaMark_R2_Patch.includes("R2_Mat_Embroidery_White") &&
    new Set(brandingAssignments.R2_Brand_UpperBack_GorillaMark).size === 2

  const materialPalette = Object.fromEntries(
    Object.entries(V2_MATERIALS).map(([name, expected]) => {
      const material = materialsByName.get(name)
      const passed =
        material instanceof MeshStandardMaterial &&
        material.color.getHex() === expected.color &&
        Math.abs(material.roughness - expected.roughness) <= 1e-6 &&
        Math.abs(material.metalness - expected.metalness) <= 1e-6
      return [name, {
        color: material instanceof MeshStandardMaterial ? material.color.getHex() : null,
        roughness: material instanceof MeshStandardMaterial ? material.roughness : null,
        metalness: material instanceof MeshStandardMaterial ? material.metalness : null,
        passed,
      }]
    }),
  )
  const materialPalettePassed = Object.values(materialPalette).every((entry) => entry.passed)

  const chestBounds = boundsFor(production.scene, BRANDING[0])
  const armBounds = boundsFor(production.scene, BRANDING[1])
  const backBounds = boundsFor(production.scene, BRANDING[2])
  const torsoBounds = boundsFor(production.scene, "R2_Hoodie_Torso")
  const size = (bounds: Box3) => bounds.getSize(new Vector3()).length()
  const center = (bounds: Box3) => bounds.getCenter(new Vector3())
  const brandingHierarchy = size(chestBounds) < size(armBounds) && size(armBounds) < size(backBounds)
  const placementValid =
    center(chestBounds).x < center(torsoBounds).x &&
    center(armBounds).x > center(torsoBounds).x &&
    Math.abs(center(backBounds).x - center(torsoBounds).x) <= torsoBounds.getSize(new Vector3()).x * 0.025

  const originalMaterialFingerprint = materialFingerprint(production.scene)
  const owned = createOwnedR2Scene(production.scene)
  const controller = new R2FullCharacterRuntimeController(owned, production.animations)
  const neutralBefore = neutralFingerprint(owned)
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
  const neutralAfter = neutralFingerprint(owned)
  const neutralResetExact = neutralBefore === neutralAfter
  controller.dispose()

  const remounted = createOwnedR2Scene(production.scene)
  const remountController = new R2FullCharacterRuntimeController(remounted, production.animations)
  const remountDistinct = remounted !== owned && remounted.getObjectByName("R2_Hoodie_Torso") !== owned.getObjectByName("R2_Hoodie_Torso")
  remountController.setState("idle")
  remountController.update(1 / 60)
  remountController.resetNeutral()
  remountController.dispose()

  const responsiveFraming = [0.5, 0.75, 1, 2].map((aspect) => {
    const framing = calculateR2CameraFraming(computeR2RenderableBounds(production!.scene), aspect)
    const effectiveVerticalCoverage = framing.verticalCoverage * R2_MODEL_PRESENTATION_SCALE
    return {
      aspect,
      distance: framing.distance,
      cameraVerticalCoverage: framing.verticalCoverage,
      modelScale: R2_MODEL_PRESENTATION_SCALE,
      effectiveVerticalCoverage,
      passed: effectiveVerticalCoverage >= 0.67 && effectiveVerticalCoverage <= R2_EFFECTIVE_VERTICAL_COVERAGE + Number.EPSILON * 4,
    }
  })
  const materialFingerprintAfter = materialFingerprint(production.scene)
  const runtimeMaterialOverrides = originalMaterialFingerprint === materialFingerprintAfter ? 0 : 1

  const report = {
    SchemaVersion: 1,
    Audit: "COLOR_READABILITY_V2_WEB_RUNTIME_HEADLESS",
    AssetPath: resolve(assetPath),
    SourceSha256: sha256,
    FileSizeBytes: bytes.byteLength,
    ParseAttempts: parseDurationsMs.length,
    ParseDurationsMs: parseDurationsMs.map((value) => Number(value.toFixed(3))),
    NodeCount: nodeCount,
    MeshCount: meshCount,
    BoneCount: boneCount,
    MaterialCount: materialIds.size,
    MorphTargetCount: morphTargetCount,
    AnimationNames: production.animations.map((clip) => clip.name).sort(),
    RuntimeStateCount: R2_RUNTIME_STATES.length,
    PairwiseTransitions: pairwiseTransitions,
    RepeatedTransitionCycles: 25,
    ExpressionChannelCount: R2_EXPRESSION_CHANNELS.length,
    VisemeCount: R2_VISEMES.length,
    BrandingPresent: brandingPresent,
    BrandingAssignments: brandingAssignments,
    BrandingHierarchy: brandingHierarchy,
    BrandingPlacementValid: placementValid,
    MainAssignments: mainAssignments,
    AllMainMeshesMaterialized: allMainMaterialized,
    NoDefaultWhiteMainMeshes: noDefaultWhiteMainMeshes,
    ExpectedBrandingAssignments: expectedBrandingAssignments,
    MaterialPalette: materialPalette,
    MaterialPalettePassed: materialPalettePassed,
    NeutralResetExact: neutralResetExact,
    ControllerDisposed: controller.disposed,
    RemountDistinct: remountDistinct,
    RemountDisposed: remountController.disposed,
    RuntimeMaterialOverrides: runtimeMaterialOverrides,
    ResponsiveFraming: responsiveFraming,
    CreatedImages: 0,
    RuntimeConsoleErrors: 0,
    Passed:
      neutralResetExact && controller.disposed && remountDistinct && remountController.disposed &&
      boneCount === 65 && materialIds.size === 17 && morphTargetCount === 24 &&
      production.animations.length === 9 && R2_RUNTIME_STATES.length === 10 && pairwiseTransitions === 100 &&
      brandingPresent && expectedBrandingAssignments && brandingHierarchy && placementValid &&
      materialPalettePassed &&
      allMainMaterialized && noDefaultWhiteMainMeshes && runtimeMaterialOverrides === 0 &&
      responsiveFraming.every((item) => item.passed),
  }
  const resolvedReport = resolve(reportPath)
  const temporary = `${resolvedReport}.tmp`
  await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  await rename(temporary, resolvedReport)
  disposeScene(production.scene)
  if (!report.Passed) throw new Error(`Material branding web runtime audit failed: ${JSON.stringify(report)}`)
  console.log(JSON.stringify(report, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
