/// <reference types="vitest/globals" />

import {
  AnimationClip,
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from "three"

import {
  R2_ANIMATION_CLIPS,
  R2_RUNTIME_STATES,
} from "@/types/r2-full-character-runtime"
import {
  R2_FULL_CHARACTER_MODEL_PATH,
  R2_RUNTIME_STATE_MAP,
  R2FullCharacterRuntimeController,
  createOwnedR2Scene,
  loadR2FullCharacterGLTF,
  r2BehaviorToRuntimeState,
} from "./r2-full-character-runtime"

const MORPHS_BY_OBJECT = {
  "R2_Head_Face_Foundation": [
    "EXP_BROW_RAISE",
    "EXP_BROW_FROWN",
    "EXP_CHEEK_RAISE",
    "EXP_MUZZLE",
  ],
  "R2_UpperEyelid.L": ["EXP_BLINK"],
  "R2_LowerEyelid.L": ["EXP_BLINK"],
  "R2_UpperEyelid.R": ["EXP_BLINK"],
  "R2_LowerEyelid.R": ["EXP_BLINK"],
  R2_LipUpper: [
    "EXP_LIPS_CLOSED",
    "EXP_SMILE",
    "EXP_FROWN",
    "EXP_MOUTH_NARROW",
    "EXP_MOUTH_WIDE",
    "EXP_MOUTH_O",
    "EXP_MOUTH_E",
  ],
  R2_LipLower: [
    "EXP_LIPS_CLOSED",
    "EXP_SMILE",
    "EXP_FROWN",
    "EXP_MOUTH_NARROW",
    "EXP_MOUTH_WIDE",
    "EXP_MOUTH_O",
    "EXP_MOUTH_E",
    "EXP_VISEME_FV",
  ],
  R2_Tongue: ["EXP_VISEME_L"],
} as const

function morphMesh(
  name: keyof typeof MORPHS_BY_OBJECT,
) {
  const mesh = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial(),
  )
  const morphs = MORPHS_BY_OBJECT[name]
  mesh.name = name
  mesh.morphTargetDictionary = Object.fromEntries(
    morphs.map((morph, index) => [morph, index]),
  )
  mesh.morphTargetInfluences = morphs.map(() => 0)
  return mesh
}

function fixture() {
  const root = new Group()
  root.name = "R2_Runtime_Test_Root"

  const rig = new Object3D()
  rig.name = "R2_Rig"
  root.add(rig)

  for (const name of [
    "neck",
    "head",
    "CTRL-face-root",
    "DEF-face-jaw",
  ]) {
    const bone = new Bone()
    bone.name = name
    rig.add(bone)
  }

  for (const name of [
    "R2_EyePivot.L",
    "R2_EyePivot.R",
    "R2_JawDriver",
  ]) {
    const node = new Object3D()
    node.name = name
    root.add(node)
  }

  for (const name of Object.keys(MORPHS_BY_OBJECT)) {
    root.add(
      morphMesh(name as keyof typeof MORPHS_BY_OBJECT),
    )
  }

  const animations = R2_ANIMATION_CLIPS.map(
    (name) => new AnimationClip(name, 1, []),
  )

  return { root, animations }
}

function influence(
  root: Object3D,
  objectName: string,
  morphName: string,
) {
  const mesh = root.getObjectByName(objectName) as Mesh
  return mesh.morphTargetInfluences![
    mesh.morphTargetDictionary![morphName]
  ]
}

describe("R2 full-character runtime contract", () => {
  it("uses the versionless approved public GLB path", () => {
    expect(R2_FULL_CHARACTER_MODEL_PATH).toBe(
      "/models/r2/r2-full-character-color-readable-ready-v2.glb",
    )
  })

  it("maps every runtime state to a certified animation", () => {
    expect(Object.keys(R2_RUNTIME_STATE_MAP)).toEqual(
      [...R2_RUNTIME_STATES],
    )
    for (const state of R2_RUNTIME_STATES) {
      expect(R2_ANIMATION_CLIPS).toContain(
        R2_RUNTIME_STATE_MAP[state].clip,
      )
    }
  })

  it("maps legacy dashboard behavior without ambiguity", () => {
    expect(r2BehaviorToRuntimeState()).toBe("idle")
    expect(r2BehaviorToRuntimeState({ mood: "thinking", animation: "thinking", message: "" })).toBe("thinking")
    expect(r2BehaviorToRuntimeState({ mood: "alert", animation: "warning", message: "" })).toBe("alert")
    expect(r2BehaviorToRuntimeState({ mood: "success", animation: "celebrating", message: "" })).toBe("celebrating_sale")
    expect(r2BehaviorToRuntimeState({ mood: "welcome", animation: "looking", message: "" })).toBe("listening")
  })

  it("accepts the complete node, bone, morph and animation contract", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    expect(controller.state).toBe("neutral")
    expect(controller.disposed).toBe(false)
    controller.dispose()
  })

  it.each([
    ["R2_EyePivot.L", "MISSING_NODE"],
    ["CTRL-face-root", "MISSING_BONE"],
  ] as const)("rejects a missing required asset %s", (name, code) => {
    const { root, animations } = fixture()
    root.getObjectByName(name)!.removeFromParent()
    expect(() => new R2FullCharacterRuntimeController(root, animations)).toThrowError(
      expect.objectContaining({ code }),
    )
  })

  it("rejects a missing required morph", () => {
    const { root, animations } = fixture()
    const lip = root.getObjectByName("R2_LipUpper") as Mesh
    delete lip.morphTargetDictionary!.EXP_SMILE
    expect(() => new R2FullCharacterRuntimeController(root, animations)).toThrowError(
      expect.objectContaining({ code: "MISSING_MORPH" }),
    )
  })

  it("rejects a missing certified animation", () => {
    const { root, animations } = fixture()
    expect(() => new R2FullCharacterRuntimeController(root, animations.slice(1))).toThrowError(
      expect.objectContaining({ code: "MISSING_ANIMATION" }),
    )
  })

  it("survives all pairwise state transitions and repeated interruption", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    for (const from of R2_RUNTIME_STATES) {
      controller.setState(from)
      for (const to of R2_RUNTIME_STATES) {
        controller.update(1)
        controller.setState(to)
        controller.update(1 / 60)
        expect(controller.state).toBe(to)
      }
    }
    controller.resetNeutral()
    controller.setState("speaking")
    controller.setViseme("VISEME_O", 0.9)
    controller.update(0.5)
    controller.setState("alert")
    expect(influence(root, "R2_LipUpper", "EXP_MOUTH_O")).toBe(0)
    controller.dispose()
  })

  it("aggregates state expressions, user expressions and speaking visemes", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    controller.setState("celebrating_sale")
    expect(influence(root, "R2_LipUpper", "EXP_SMILE")).toBeCloseTo(0.65)
    controller.setExpression("SMILE", 0.8)
    expect(influence(root, "R2_LipUpper", "EXP_SMILE")).toBeCloseTo(0.8)
    controller.setState("speaking")
    controller.setSpeakingIntensity(0.5)
    controller.setViseme("VISEME_E", 0.8)
    expect(influence(root, "R2_LipLower", "EXP_MOUTH_E")).toBeCloseTo(0.4)
    controller.dispose()
  })

  it("clamps facial inputs and restores the exact neutral baseline", () => {
    const { root, animations } = fixture()
    const jaw = root.getObjectByName("R2_JawDriver")!
    const eye = root.getObjectByName("R2_EyePivot.L")!
    const jawNeutral = jaw.quaternion.clone()
    const eyeNeutral = eye.quaternion.clone()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    controller.setExpression("JAW_OPEN", 99)
    controller.setEyeTarget({ yaw: -99, pitch: 99 })
    controller.setExpression("BLINK_BOTH", 1)
    expect(influence(root, "R2_UpperEyelid.L", "EXP_BLINK")).toBe(1)
    controller.resetNeutral()
    expect(jaw.quaternion.equals(jawNeutral)).toBe(true)
    expect(eye.quaternion.equals(eyeNeutral)).toBe(true)
    expect(influence(root, "R2_UpperEyelid.L", "EXP_BLINK")).toBe(0)
    controller.dispose()
  })

  it("exposes a complete centralized orchestration contract for every state", () => {
    for (const state of R2_RUNTIME_STATES) {
      const definition = R2_RUNTIME_STATE_MAP[state]
      expect(definition.id).toBe(state)
      expect(definition.playbackSpeed).toBeGreaterThanOrEqual(0)
      expect(definition.crossFadeMs).toBeGreaterThanOrEqual(0)
      expect(definition.fadeInMs).toBeGreaterThanOrEqual(0)
      expect(definition.fadeOutMs).toBeGreaterThanOrEqual(0)
      expect(definition.minimumDurationMs).toBeGreaterThanOrEqual(0)
      expect(R2_RUNTIME_STATES).toContain(definition.returnState)
      expect(R2_RUNTIME_STATES).toContain(definition.fallback)
      expect(definition.description.length).toBeGreaterThan(0)
    }
  })

  it("does not restart a repeated state and falls back unknown requests", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    expect(controller.setState("working").status).toBe("applied")
    controller.update(0.5)
    expect(controller.setState("working").status).toBe("repeated")
    expect(controller.getDiagnostics().elapsedInStateMs).toBe(500)
    expect(controller.setState("unknown-state").status).toBe("fallback")
    expect(controller.state).toBe("neutral")
    expect(controller.getDiagnostics().fallbacks).toBe(1)
    controller.dispose()
  })

  it("applies priority, minimum-duration deferral, cooldown and queued recovery", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    controller.setState("working")
    expect(controller.setState("alert").status).toBe("applied")
    controller.update(0.4)
    controller.setState("celebrating_sale")
    controller.update(0.8)
    expect(controller.setState("error_attention").status).toBe("applied")
    expect(controller.setState("celebrating_sale").status).toBe("cooldown")
    expect(controller.setState("working").status).toBe("deferred")
    controller.update(0.6)
    expect(controller.state).toBe("working")
    expect(controller.getDiagnostics().pendingState).toBeNull()
    controller.dispose()
  })

  it("returns one-shots safely and keeps reduced-motion state communication", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    controller.setState("celebrating_sale")
    controller.update(1.1)
    expect(controller.state).toBe("idle")
    controller.setReducedMotion(true)
    controller.setState("error_attention")
    expect(controller.getDiagnostics().reducedMotion).toBe(true)
    expect(influence(root, "R2_LipUpper", "EXP_FROWN")).toBeCloseTo(0.28)
    controller.update(2.1)
    expect(controller.state).toBe("neutral")
    controller.dispose()
  })

  it("keeps one mixer, nine cached actions and bounded resources under stress", () => {
    const { root, animations } = fixture()
    const controller = new R2FullCharacterRuntimeController(root, animations)
    for (let index = 0; index < 1_000; index += 1) {
      controller.setState(index % 2 === 0 ? "working" : "listening")
      controller.update(0.4)
    }
    const diagnostics = controller.getDiagnostics()
    expect(diagnostics.actionsCreated).toBe(9)
    expect(diagnostics.transitionsApplied).toBe(1_000)
    expect(diagnostics.maximumSimultaneousActions).toBeLessThanOrEqual(2)
    expect(diagnostics.mixerListeners).toBe(1)
    controller.dispose()
    expect(controller.getDiagnostics().mixerListeners).toBe(0)
    expect(controller.getDiagnostics().actionsCreated).toBe(0)
  })

  it("deep-clones disposable mesh resources", () => {
    const { root } = fixture()
    const source = root.getObjectByName("R2_LipUpper") as Mesh
    const sourceMaterial = source.material as MeshBasicMaterial
    sourceMaterial.color.setRGB(0.1, 0.2, 0.3)
    sourceMaterial.opacity = 0.75
    sourceMaterial.transparent = true
    const owned = createOwnedR2Scene(root)
    const clone = owned.getObjectByName("R2_LipUpper") as Mesh
    const cloneMaterial = clone.material as MeshBasicMaterial
    expect(clone.geometry).not.toBe(source.geometry)
    expect(clone.material).not.toBe(source.material)
    expect(cloneMaterial.color.equals(sourceMaterial.color)).toBe(true)
    expect(cloneMaterial.opacity).toBe(sourceMaterial.opacity)
    expect(cloneMaterial.transparent).toBe(sourceMaterial.transparent)
  })

  it("disposes owned resources once and rejects later mutation", () => {
    const { root, animations } = fixture()
    const mesh = root.getObjectByName("R2_LipUpper") as Mesh
    const geometryDispose = vi.spyOn(mesh.geometry, "dispose")
    const materialDispose = vi.spyOn(mesh.material as MeshBasicMaterial, "dispose")
    const controller = new R2FullCharacterRuntimeController(root, animations)
    controller.dispose()
    controller.dispose()
    expect(geometryDispose).toHaveBeenCalledTimes(1)
    expect(materialDispose).toHaveBeenCalledTimes(1)
    expect(() => controller.setState("idle")).toThrow(/disposed/)
  })

  it("wraps loader failures with the requested URL and original cause", async () => {
    const cause = new Error("network offline")
    await expect(
      loadR2FullCharacterGLTF(
        { loadAsync: async () => Promise.reject(cause) },
        "/broken.glb",
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        url: "/broken.glb",
        cause,
      }),
    )
  })
})
