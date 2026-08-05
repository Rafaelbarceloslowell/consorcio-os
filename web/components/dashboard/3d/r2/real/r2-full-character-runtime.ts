import {
  AnimationClip,
  AnimationMixer,
  Bone,
  BufferGeometry,
  Euler,
  LoopOnce,
  LoopRepeat,
  Material,
  MathUtils,
  Mesh,
  Object3D,
  Quaternion,
  SkinnedMesh,
  Vector3,
} from "three"
import type {
  AnimationAction,
} from "three"
import type {
  GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js"
import {
  clone as cloneSkeleton,
} from "three/examples/jsm/utils/SkeletonUtils.js"

import type {
  R2Behavior,
} from "../../r2-behavior"
import {
  R2_ANIMATION_CLIPS,
  R2_EXPRESSION_CHANNELS,
  R2_RUNTIME_STATES,
  R2_VISEMES,
} from "@/types/r2-full-character-runtime"
import type {
  R2AnimationClipName,
  R2ExpressionChannel,
  R2EyeTarget,
  R2RuntimeControllerApi,
  R2RuntimeDiagnostics,
  R2RuntimeState,
  R2RuntimeStateDefinition,
  R2StateRequestResult,
  R2Viseme,
} from "@/types/r2-full-character-runtime"

export const R2_FULL_CHARACTER_MODEL_PATH =
  "/models/r2/r2-full-character-color-readable-ready-v2.glb"

export const R2_FULL_CHARACTER_ROLLBACK_MODEL_PATH =
  "/models/r2/r2-full-character-material-branded-ready-v1.glb"

const R2_PRIORITY_VALUE = {
  low: 100,
  normal: 200,
  high: 300,
  critical: 400,
} as const

type R2StateSeed = Pick<
  R2RuntimeStateDefinition,
  | "id"
  | "clip"
  | "head"
  | "eye"
  | "blinkIntervalSeconds"
  | "expressions"
  | "mouth"
  | "loop"
  | "transitionSeconds"
  | "interruptible"
  | "fallback"
> & Partial<Pick<
  R2RuntimeStateDefinition,
  | "playbackMode"
  | "playbackSpeed"
  | "fadeInMs"
  | "fadeOutMs"
  | "crossFadeMs"
  | "minimumDurationMs"
  | "maximumDurationMs"
  | "priority"
  | "returnState"
  | "cooldownMs"
  | "morphTargetProfile"
  | "description"
>>

function defineR2State(seed: R2StateSeed): R2RuntimeStateDefinition {
  const crossFadeMs = seed.crossFadeMs ?? Math.round(seed.transitionSeconds * 1_000)
  return {
    ...seed,
    playbackMode: seed.playbackMode ?? (seed.loop === "once" ? "one_shot" : "loop"),
    playbackSpeed: seed.playbackSpeed ?? 1,
    fadeInMs: seed.fadeInMs ?? crossFadeMs,
    fadeOutMs: seed.fadeOutMs ?? crossFadeMs,
    crossFadeMs,
    minimumDurationMs: seed.minimumDurationMs ?? 0,
    maximumDurationMs: seed.maximumDurationMs ?? null,
    priority: seed.priority ?? "normal",
    returnState: seed.returnState ?? seed.fallback,
    cooldownMs: seed.cooldownMs ?? 0,
    morphTargetProfile: seed.morphTargetProfile ?? "neutral",
    headTrackingProfile: seed.eye,
    eyeProfile: seed.eye,
    reducedMotionProfile: {
      playbackMode: "pose",
      playbackSpeed: 0,
      crossFadeMs: Math.min(crossFadeMs, 120),
      proceduralMotion: false,
    },
    description: seed.description ?? seed.id,
  }
}

type MorphBinding = {
  object: string
  morph: string
  scale?: number
}

type NeutralTransform = {
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}

export const R2_RUNTIME_STATE_MAP: Readonly<
  Record<R2RuntimeState, R2RuntimeStateDefinition>
> = {
  neutral: defineR2State({
    id: "neutral",
    clip: "R2_NEUTRAL",
    head: [0, 0, 0],
    eye: "forward",
    blinkIntervalSeconds: [4, 7],
    expressions: {},
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.25,
    interruptible: true,
    fallback: "neutral",
    priority: "low",
    description: "Pose neutra recuperável e baseline exato do personagem.",
  }),
  idle: defineR2State({
    id: "idle",
    clip: "R2_IDLE",
    head: [0, 0, 0],
    eye: "ambient_subtle",
    blinkIntervalSeconds: [3.5, 6.5],
    expressions: {},
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.45,
    interruptible: true,
    fallback: "neutral",
    priority: "low",
    description: "Presença ambiental discreta quando não há tarefa ativa.",
  }),
  working: defineR2State({
    id: "working",
    clip: "R2_WORKING",
    head: [-0.02, 0, 0],
    eye: "task_focus",
    blinkIntervalSeconds: [4, 7],
    expressions: {
      BROW_FROWN: 0.1,
    },
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.35,
    interruptible: true,
    fallback: "idle",
    minimumDurationMs: 250,
    morphTargetProfile: "focus",
    description: "Execução concentrada de uma tarefa operacional.",
  }),
  listening: defineR2State({
    id: "listening",
    clip: "R2_LISTENING",
    head: [0, 0, 0.02],
    eye: "user_focus",
    blinkIntervalSeconds: [3, 5.5],
    expressions: {
      BROW_RAISE: 0.08,
    },
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.3,
    interruptible: true,
    fallback: "idle",
    minimumDurationMs: 200,
    morphTargetProfile: "listen",
    description: "Escuta atenta com foco no usuário.",
  }),
  thinking: defineR2State({
    id: "thinking",
    clip: "R2_THINKING",
    head: [-0.02, -0.02, 0.03],
    eye: "up_lateral",
    blinkIntervalSeconds: [4.5, 7.5],
    expressions: {
      BROW_RAISE: 0.18,
      MOUTH_NARROW: 0.05,
    },
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.35,
    interruptible: true,
    fallback: "idle",
    minimumDurationMs: 350,
    morphTargetProfile: "think",
    description: "Raciocínio deliberado antes de uma resposta ou decisão.",
  }),
  awaiting_action: defineR2State({
    id: "awaiting_action",
    clip: "R2_AWAITING_ACTION",
    head: [0.01, 0, 0],
    eye: "user_focus",
    blinkIntervalSeconds: [3, 5],
    expressions: {
      BROW_RAISE: 0.12,
    },
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.3,
    interruptible: true,
    fallback: "listening",
    minimumDurationMs: 300,
    morphTargetProfile: "listen",
    description: "Espera explícita por uma ação do usuário.",
  }),
  alert: defineR2State({
    id: "alert",
    clip: "R2_ALERT",
    head: [0.02, 0, 0],
    eye: "event_focus",
    blinkIntervalSeconds: [5, 8],
    expressions: {
      BROW_RAISE: 0.25,
      BROW_FROWN: 0.08,
    },
    mouth: "closed_neutral",
    loop: "repeat",
    transitionSeconds: 0.15,
    interruptible: true,
    fallback: "neutral",
    minimumDurationMs: 400,
    priority: "critical",
    cooldownMs: 300,
    morphTargetProfile: "alert",
    description: "Alerta operacional que pode interromper estados menos prioritários.",
  }),
  speaking: defineR2State({
    id: "speaking",
    clip: "R2_IDLE",
    head: [0, 0, 0],
    eye: "user_focus",
    blinkIntervalSeconds: [3.5, 6],
    expressions: {
      CHEEK_RAISE: 0.05,
    },
    mouth: "runtime_viseme",
    loop: "repeat",
    transitionSeconds: 0.2,
    interruptible: true,
    fallback: "listening",
    minimumDurationMs: 500,
    priority: "high",
    morphTargetProfile: "speak",
    description: "Fala ativa; reutiliza com transparência o clipe corporal de idle.",
  }),
  celebrating_sale: defineR2State({
    id: "celebrating_sale",
    clip: "R2_CELEBRATING_SALE",
    head: [0, 0, 0],
    eye: "user_focus",
    blinkIntervalSeconds: [3, 5],
    expressions: {
      SMILE: 0.65,
      CHEEK_RAISE: 0.25,
    },
    mouth: "confident_smile",
    loop: "once",
    transitionSeconds: 0.25,
    interruptible: false,
    fallback: "idle",
    playbackMode: "one_shot",
    minimumDurationMs: 800,
    maximumDurationMs: 2_400,
    priority: "high",
    returnState: "idle",
    cooldownMs: 1_000,
    morphTargetProfile: "celebrate",
    description: "Comemoração one-shot com retorno automático e seguro ao idle.",
  }),
  error_attention: defineR2State({
    id: "error_attention",
    clip: "R2_ERROR_ATTENTION",
    head: [-0.02, 0, 0],
    eye: "event_focus",
    blinkIntervalSeconds: [4.5, 7],
    expressions: {
      BROW_FROWN: 0.45,
      FROWN: 0.28,
    },
    mouth: "serious_closed",
    loop: "once",
    transitionSeconds: 0.18,
    interruptible: false,
    fallback: "neutral",
    playbackMode: "one_shot",
    minimumDurationMs: 600,
    maximumDurationMs: 2_000,
    priority: "critical",
    returnState: "neutral",
    cooldownMs: 750,
    morphTargetProfile: "error",
    description: "Erro crítico one-shot com retorno automático ao baseline neutro.",
  }),
}

const EXPRESSION_MORPHS: Readonly<
  Partial<Record<R2ExpressionChannel, readonly MorphBinding[]>>
> = {
  BLINK_LEFT: [
    { object: "R2_UpperEyelid.L", morph: "EXP_BLINK" },
    { object: "R2_LowerEyelid.L", morph: "EXP_BLINK" },
  ],
  BLINK_RIGHT: [
    { object: "R2_UpperEyelid.R", morph: "EXP_BLINK" },
    { object: "R2_LowerEyelid.R", morph: "EXP_BLINK" },
  ],
  BLINK_BOTH: [
    { object: "R2_UpperEyelid.L", morph: "EXP_BLINK" },
    { object: "R2_LowerEyelid.L", morph: "EXP_BLINK" },
    { object: "R2_UpperEyelid.R", morph: "EXP_BLINK" },
    { object: "R2_LowerEyelid.R", morph: "EXP_BLINK" },
  ],
  BROW_RAISE: [
    { object: "R2_Head_Face_Foundation", morph: "EXP_BROW_RAISE" },
  ],
  BROW_FROWN: [
    { object: "R2_Head_Face_Foundation", morph: "EXP_BROW_FROWN" },
  ],
  CHEEK_RAISE: [
    { object: "R2_Head_Face_Foundation", morph: "EXP_CHEEK_RAISE" },
  ],
  MUZZLE: [
    { object: "R2_Head_Face_Foundation", morph: "EXP_MUZZLE" },
  ],
  LIPS_CLOSED: [
    { object: "R2_LipUpper", morph: "EXP_LIPS_CLOSED" },
    { object: "R2_LipLower", morph: "EXP_LIPS_CLOSED" },
  ],
  SMILE: [
    { object: "R2_LipUpper", morph: "EXP_SMILE" },
    { object: "R2_LipLower", morph: "EXP_SMILE" },
  ],
  FROWN: [
    { object: "R2_LipUpper", morph: "EXP_FROWN" },
    { object: "R2_LipLower", morph: "EXP_FROWN" },
  ],
  MOUTH_NARROW: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_NARROW" },
    { object: "R2_LipLower", morph: "EXP_MOUTH_NARROW" },
  ],
  MOUTH_WIDE: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_WIDE" },
    { object: "R2_LipLower", morph: "EXP_MOUTH_WIDE" },
  ],
  MOUTH_O: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_O" },
    { object: "R2_LipLower", morph: "EXP_MOUTH_O" },
  ],
  MOUTH_E: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_E" },
    { object: "R2_LipLower", morph: "EXP_MOUTH_E" },
  ],
}

const VISEME_MORPHS: Readonly<
  Record<R2Viseme, readonly MorphBinding[]>
> = {
  VISEME_A: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_WIDE", scale: 0.55 },
    { object: "R2_LipLower", morph: "EXP_MOUTH_WIDE", scale: 0.55 },
  ],
  VISEME_E: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_E" },
    { object: "R2_LipLower", morph: "EXP_MOUTH_E" },
  ],
  VISEME_O: [
    { object: "R2_LipUpper", morph: "EXP_MOUTH_O" },
    { object: "R2_LipLower", morph: "EXP_MOUTH_O" },
  ],
  VISEME_MBP: [
    { object: "R2_LipUpper", morph: "EXP_LIPS_CLOSED" },
    { object: "R2_LipLower", morph: "EXP_LIPS_CLOSED" },
  ],
  VISEME_FV: [
    { object: "R2_LipLower", morph: "EXP_VISEME_FV" },
  ],
  VISEME_L: [
    { object: "R2_Tongue", morph: "EXP_VISEME_L" },
  ],
}

const REQUIRED_NODES = [
  "R2_Rig",
  "R2_Head_Face_Foundation",
  "R2_EyePivot.L",
  "R2_EyePivot.R",
  "R2_JawDriver",
] as const

const REQUIRED_BONES = [
  "neck",
  "head",
  "CTRL-face-root",
  "DEF-face-jaw",
] as const

export class R2RuntimeValidationError
  extends Error {
  constructor(
    readonly code:
      | "MISSING_NODE"
      | "MISSING_BONE"
      | "MISSING_MORPH"
      | "MISSING_ANIMATION",
    readonly assetName: string,
  ) {
    super(`${code}: ${assetName}`)
    this.name = "R2RuntimeValidationError"
  }
}

export class R2RuntimeLoadError
  extends Error {
  constructor(
    readonly url: string,
    readonly cause: unknown,
  ) {
    super(`Failed to load the R2 full-character GLB: ${url}`)
    this.name = "R2RuntimeLoadError"
  }
}

function clamp01(value: number) {
  return MathUtils.clamp(
    Number.isFinite(value) ? value : 0,
    0,
    1,
  )
}

function allMorphBindings() {
  return [
    ...Object.values(
      EXPRESSION_MORPHS,
    ).flatMap(
      (bindings) => bindings ?? [],
    ),
    ...Object.values(
      VISEME_MORPHS,
    ).flatMap(
      (bindings) => bindings,
    ),
  ]
}

function resolveNamedObject(
  root: Object3D,
  blenderName: string,
) {
  return (
    root.getObjectByName(blenderName) ??
    root.getObjectByName(
      blenderName.replaceAll(".", ""),
    )
  )
}

function resolveMorph(
  root: Object3D,
  binding: MorphBinding,
) {
  const object =
    resolveNamedObject(
      root,
      binding.object,
    )

  if (
    !(object instanceof Mesh) ||
    !object.morphTargetDictionary ||
    !object.morphTargetInfluences
  ) {
    throw new R2RuntimeValidationError(
      "MISSING_MORPH",
      `${binding.object}:${binding.morph}`,
    )
  }

  const index =
    object.morphTargetDictionary[
      binding.morph
    ]

  if (index === undefined) {
    throw new R2RuntimeValidationError(
      "MISSING_MORPH",
      `${binding.object}:${binding.morph}`,
    )
  }

  return {
    influences:
      object.morphTargetInfluences,
    index,
  }
}

export function createOwnedR2Scene(
  source: Object3D,
) {
  const clone = cloneSkeleton(
    source,
  )

  clone.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }

    object.geometry =
      object.geometry.clone()

    if (Array.isArray(object.material)) {
      object.material =
        object.material.map(
          (material) =>
            material.clone(),
        )
    } else {
      object.material =
        object.material.clone()
    }

    object.castShadow = true
    object.receiveShadow = true
  })

  return clone
}

export function r2BehaviorToRuntimeState(
  behavior?: R2Behavior,
): R2RuntimeState {
  switch (behavior?.mood) {
    case "thinking":
      return "thinking"
    case "alert":
      return "alert"
    case "success":
      return "celebrating_sale"
    case "welcome":
      return "listening"
    case "idle":
    default:
      return "idle"
  }
}

export async function loadR2FullCharacterGLTF(
  loader: Pick<
    {
      loadAsync(url: string): Promise<GLTF>
    },
    "loadAsync"
  >,
  url = R2_FULL_CHARACTER_MODEL_PATH,
) {
  try {
    return await loader.loadAsync(url)
  } catch (error) {
    throw new R2RuntimeLoadError(
      url,
      error,
    )
  }
}

export class R2FullCharacterRuntimeController
implements R2RuntimeControllerApi {
  readonly root: Object3D
  readonly mixer: AnimationMixer

  private readonly actions =
    new Map<
      R2AnimationClipName,
      AnimationAction
    >()

  private readonly clips =
    new Map<
      R2AnimationClipName,
      AnimationClip
    >()

  private readonly neutralTransforms =
    new Map<Object3D, NeutralTransform>()

  private readonly expressionValues =
    new Map<R2ExpressionChannel, number>()

  private readonly stateExpressionValues =
    new Map<R2ExpressionChannel, number>()

  private readonly visemeValues =
    new Map<R2Viseme, number>()

  private readonly leftEyePivot: Object3D
  private readonly rightEyePivot: Object3D
  private readonly jawDriver: Object3D

  private currentAction?: AnimationAction
  private pendingState: R2RuntimeState | null = null
  private readonly lastStateStartedAtMs = new Map<R2RuntimeState, number>()
  private runtimeElapsedMs = 0
  private requestGeneration = 0
  private transitionsApplied = 0
  private transitionsIgnored = 0
  private fallbacks = 0
  private actionsReused = 0
  private maximumSimultaneousActions = 0
  private mixerListeners = 0
  private reducedMotion = false
  private speakingIntensity = 1
  private activeViseme?: R2Viseme
  private elapsedInState = 0
  private autoBlinkValue = 0

  state: R2RuntimeState = "neutral"
  requestedState: R2RuntimeState = "neutral"
  disposed = false

  private readonly handleMixerFinished = (event: { action: AnimationAction }) => {
    if (this.disposed || event.action !== this.currentAction) {
      return
    }

    const definition = R2_RUNTIME_STATE_MAP[this.state]
    if (definition.playbackMode === "one_shot") {
      this.applyState(definition.returnState, true)
    }
  }

  constructor(
    root: Object3D,
    animations: readonly AnimationClip[],
  ) {
    this.root = root

    for (const name of REQUIRED_NODES) {
      if (!resolveNamedObject(root, name)) {
        throw new R2RuntimeValidationError(
          "MISSING_NODE",
          name,
        )
      }
    }

    const bones = new Set<string>()
    root.traverse((object) => {
      this.neutralTransforms.set(
        object,
        {
          position:
            object.position.clone(),
          quaternion:
            object.quaternion.clone(),
          scale:
            object.scale.clone(),
        },
      )

      if (object instanceof Bone) {
        bones.add(object.name)
      }
    })

    for (const bone of REQUIRED_BONES) {
      if (!bones.has(bone)) {
        throw new R2RuntimeValidationError(
          "MISSING_BONE",
          bone,
        )
      }
    }

    for (const binding of allMorphBindings()) {
      resolveMorph(root, binding)
    }

    this.mixer =
      new AnimationMixer(root)
    this.mixer.addEventListener("finished", this.handleMixerFinished)
    this.mixerListeners = 1

    for (const clipName of R2_ANIMATION_CLIPS) {
      const clip = animations.find(
        (candidate) =>
          candidate.name === clipName,
      )

      if (!clip) {
        throw new R2RuntimeValidationError(
          "MISSING_ANIMATION",
          clipName,
        )
      }

      this.clips.set(
        clipName,
        clip,
      )
      this.actions.set(
        clipName,
        this.mixer.clipAction(clip),
      )
    }

    this.leftEyePivot =
      resolveNamedObject(
        root,
        "R2_EyePivot.L",
      )!
    this.rightEyePivot =
      resolveNamedObject(
        root,
        "R2_EyePivot.R",
      )!
    this.jawDriver =
      resolveNamedObject(
        root,
        "R2_JawDriver",
      )!

    this.resetNeutral()
  }

  private assertActive() {
    if (this.disposed) {
      throw new Error(
        "R2 runtime controller is disposed",
      )
    }
  }

  private setMorph(
    binding: MorphBinding,
    value: number,
  ) {
    const target = resolveMorph(
      this.root,
      binding,
    )

    target.influences[target.index] =
      clamp01(
        value *
        (binding.scale ?? 1),
      )
  }

  private recomputeFacialState() {
    const contributions =
      new Map<string, number>()

    const contribute = (
      binding: MorphBinding,
      value: number,
    ) => {
      const key =
        `${binding.object}:${binding.morph}`
      const scaled =
        clamp01(
          value *
          (binding.scale ?? 1),
        )

      contributions.set(
        key,
        Math.max(
          contributions.get(key) ?? 0,
          scaled,
        ),
      )
    }

    for (const binding of allMorphBindings()) {
      this.setMorph(binding, 0)
    }

    for (const channel of R2_EXPRESSION_CHANNELS) {
      const value = Math.max(
        this.expressionValues.get(channel) ?? 0,
        this.stateExpressionValues.get(channel) ?? 0,
        channel.startsWith("BLINK_")
          ? this.autoBlinkValue
          : 0,
      )

      for (
        const binding of
          EXPRESSION_MORPHS[channel] ?? []
      ) {
        contribute(binding, value)
      }
    }

    for (const viseme of R2_VISEMES) {
      const value =
        (this.visemeValues.get(viseme) ?? 0) *
        this.speakingIntensity

      for (const binding of VISEME_MORPHS[viseme]) {
        contribute(binding, value)
      }
    }

    for (const [key, value] of contributions) {
      const separator = key.indexOf(":")
      this.setMorph(
        {
          object: key.slice(0, separator),
          morph: key.slice(separator + 1),
        },
        value,
      )
    }

    const jawValue = Math.max(
      this.expressionValues.get(
        "JAW_OPEN",
      ) ?? 0,
      this.stateExpressionValues.get(
        "JAW_OPEN",
      ) ?? 0,
    )
    this.applyRelativeRotation(
      this.jawDriver,
      -MathUtils.degToRad(32) *
        jawValue,
      0,
      0,
    )

    const leftYaw = Math.max(
      this.expressionValues.get(
        "EYE_LEFT",
      ) ?? 0,
      this.expressionValues.get(
        "EYE_AIM",
      ) ?? 0,
    )
    const rightYaw = Math.max(
      this.expressionValues.get(
        "EYE_RIGHT",
      ) ?? 0,
      this.expressionValues.get(
        "EYE_AIM",
      ) ?? 0,
    )
    this.applyEyeTarget({
      leftYaw,
      rightYaw,
      pitch: 0,
    })
  }

  private applyRelativeRotation(
    object: Object3D,
    x: number,
    y: number,
    z: number,
  ) {
    const neutral =
      this.neutralTransforms.get(object)!
    const offset =
      new Quaternion().setFromEuler(
        new Euler(x, y, z, "XYZ"),
      )

    object.quaternion
      .copy(neutral.quaternion)
      .multiply(offset)
  }

  private applyEyeTarget({
    leftYaw,
    rightYaw,
    pitch,
  }: {
    leftYaw: number
    rightYaw: number
    pitch: number
  }) {
    this.applyRelativeRotation(
      this.leftEyePivot,
      MathUtils.degToRad(10) * pitch,
      0,
      MathUtils.degToRad(28) * leftYaw,
    )
    this.applyRelativeRotation(
      this.rightEyePivot,
      MathUtils.degToRad(10) * pitch,
      0,
      MathUtils.degToRad(28) * rightYaw,
    )
  }

  private activeActionCount() {
    let active = 0
    for (const action of this.actions.values()) {
      if (action.isRunning() && action.getEffectiveWeight() > 0.0001) {
        active += 1
      }
    }
    return active
  }

  private applyState(state: R2RuntimeState, force = false): R2StateRequestResult {
    this.assertActive()
    this.requestGeneration += 1
    const generation = this.requestGeneration
    this.requestedState = state
    const definition =
      R2_RUNTIME_STATE_MAP[state]

    if (!force && this.currentAction && state === this.state) {
      this.actionsReused += 1
      this.transitionsIgnored += 1
      return {
        requestedState: state,
        effectiveState: this.state,
        status: "repeated",
        generation,
      }
    }

    const currentDefinition = R2_RUNTIME_STATE_MAP[this.state]
    const elapsedMs = this.elapsedInState * 1_000
    const nextPriority = R2_PRIORITY_VALUE[definition.priority]
    const currentPriority = R2_PRIORITY_VALUE[currentDefinition.priority]
    const minimumLocked = elapsedMs < currentDefinition.minimumDurationMs
    const cannotInterrupt = minimumLocked && (
      !currentDefinition.interruptible || nextPriority < currentPriority
    )

    const lastStartedAt = this.lastStateStartedAtMs.get(state)
    if (
      !force &&
      lastStartedAt !== undefined &&
      this.runtimeElapsedMs - lastStartedAt < definition.cooldownMs
    ) {
      this.transitionsIgnored += 1
      return {
        requestedState: state,
        effectiveState: this.state,
        status: "cooldown",
        generation,
      }
    }

    if (!force && this.currentAction && cannotInterrupt) {
      this.pendingState = state
      this.transitionsIgnored += 1
      return {
        requestedState: state,
        effectiveState: this.state,
        status: "deferred",
        generation,
      }
    }

    const nextAction =
      this.actions.get(
        definition.clip,
      )!

    for (const action of this.actions.values()) {
      if (action !== this.currentAction && action !== nextAction) {
        action.stop()
      }
    }

    this.stateExpressionValues.clear()
    for (
      const [channel, value] of
        Object.entries(
          definition.expressions,
        ) as [
          R2ExpressionChannel,
          number,
        ][]
    ) {
      this.stateExpressionValues.set(
        channel,
        value,
      )
    }

    if (state !== "speaking") {
      this.visemeValues.clear()
      this.activeViseme = undefined
    }

    nextAction
      .reset()
      .setLoop(
        definition.loop === "repeat"
          ? LoopRepeat
          : LoopOnce,
        definition.loop === "repeat"
          ? Infinity
          : 1,
      )
      .setEffectiveTimeScale(
        this.reducedMotion
          ? definition.reducedMotionProfile.playbackSpeed
          : definition.playbackSpeed,
      )
      .setEffectiveWeight(1)
      .play()

    nextAction.paused = this.reducedMotion &&
      definition.reducedMotionProfile.playbackMode === "pose"

    if (
      this.currentAction &&
      this.currentAction !== nextAction
    ) {
      nextAction.crossFadeFrom(
        this.currentAction,
        (
          this.reducedMotion
            ? definition.reducedMotionProfile.crossFadeMs
            : definition.crossFadeMs
        ) / 1_000,
        true,
      )
    }

    this.currentAction = nextAction
    this.state = state
    this.pendingState = null
    this.lastStateStartedAtMs.set(state, this.runtimeElapsedMs)
    this.elapsedInState = 0
    this.autoBlinkValue = 0
    this.actionsReused += 1
    this.transitionsApplied += 1
    this.recomputeFacialState()

    const activeActions = this.activeActionCount()
    this.maximumSimultaneousActions = Math.max(
      this.maximumSimultaneousActions,
      activeActions,
    )

    return {
      requestedState: state,
      effectiveState: state,
      status: "applied",
      generation,
    }
  }

  setState(requestedState: R2RuntimeState | string): R2StateRequestResult {
    const valid = (R2_RUNTIME_STATES as readonly string[]).includes(requestedState)
    if (!valid) {
      this.fallbacks += 1
      const result = this.applyState("neutral", true)
      return {
        ...result,
        requestedState,
        status: "fallback",
      }
    }

    return this.applyState(requestedState as R2RuntimeState)
  }

  setReducedMotion(enabled: boolean) {
    this.assertActive()
    const normalized = Boolean(enabled)
    if (this.reducedMotion === normalized) {
      return
    }
    this.reducedMotion = normalized
    this.applyState(this.state, true)
  }

  getDiagnostics(): R2RuntimeDiagnostics {
    return {
      requestedState: this.requestedState,
      effectiveState: this.state,
      activeClip: this.currentAction
        ? R2_RUNTIME_STATE_MAP[this.state].clip
        : null,
      elapsedInStateMs: Math.round(this.elapsedInState * 1_000),
      reducedMotion: this.reducedMotion,
      actionsCreated: this.actions.size,
      actionsReused: this.actionsReused,
      maximumSimultaneousActions: this.maximumSimultaneousActions,
      activeActions: this.activeActionCount(),
      transitionsApplied: this.transitionsApplied,
      transitionsIgnored: this.transitionsIgnored,
      fallbacks: this.fallbacks,
      mixerListeners: this.mixerListeners,
      pendingState: this.pendingState,
    }
  }

  setExpression(
    channel: R2ExpressionChannel,
    value: number,
  ) {
    this.assertActive()
    this.expressionValues.set(
      channel,
      clamp01(value),
    )
    this.recomputeFacialState()
  }

  setViseme(
    viseme: R2Viseme,
    value: number,
  ) {
    this.assertActive()
    this.visemeValues.clear()
    this.activeViseme = viseme
    this.visemeValues.set(
      viseme,
      clamp01(value),
    )
    this.recomputeFacialState()
  }

  setEyeTarget({
    yaw,
    pitch,
  }: R2EyeTarget) {
    this.assertActive()
    this.applyEyeTarget({
      leftYaw:
        MathUtils.clamp(yaw, -1, 1),
      rightYaw:
        MathUtils.clamp(yaw, -1, 1),
      pitch:
        MathUtils.clamp(pitch, -1, 1),
    })
  }

  setSpeakingIntensity(value: number) {
    this.assertActive()
    this.speakingIntensity =
      clamp01(value)
    this.recomputeFacialState()
  }

  resetNeutral() {
    if (this.disposed) {
      return
    }

    this.mixer.stopAllAction()
    this.currentAction = undefined
    this.expressionValues.clear()
    this.stateExpressionValues.clear()
    this.visemeValues.clear()
    this.activeViseme = undefined
    this.pendingState = null
    this.speakingIntensity = 1
    this.elapsedInState = 0
    this.autoBlinkValue = 0

    for (
      const [object, transform] of
        this.neutralTransforms
    ) {
      object.position.copy(
        transform.position,
      )
      object.quaternion.copy(
        transform.quaternion,
      )
      object.scale.copy(
        transform.scale,
      )
    }

    for (const binding of allMorphBindings()) {
      this.setMorph(binding, 0)
    }

    this.state = "neutral"
    this.requestedState = "neutral"
    this.root.updateMatrixWorld(true)
  }

  update(deltaSeconds: number) {
    this.assertActive()
    const delta = Math.max(
      0,
      Number.isFinite(deltaSeconds)
        ? deltaSeconds
        : 0,
    )
    this.mixer.update(delta)
    this.elapsedInState += delta
    this.runtimeElapsedMs += delta * 1_000

    for (const action of this.actions.values()) {
      if (
        action !== this.currentAction &&
        action.isRunning() &&
        action.getEffectiveWeight() <= 0.0001
      ) {
        action.stop()
      }
    }

    const definition = R2_RUNTIME_STATE_MAP[this.state]
    if (
      definition.maximumDurationMs !== null &&
      this.elapsedInState * 1_000 >= definition.maximumDurationMs
    ) {
      this.applyState(definition.returnState, true)
    } else if (
      this.pendingState &&
      this.elapsedInState * 1_000 >= definition.minimumDurationMs
    ) {
      this.applyState(this.pendingState, true)
    }

    const blinkRange =
      R2_RUNTIME_STATE_MAP[
        this.state
      ].blinkIntervalSeconds
    const period =
      (blinkRange[0] + blinkRange[1]) /
      2
    const phase =
      this.elapsedInState % period
    const duration = 0.16

    this.autoBlinkValue =
      !this.reducedMotion && phase < duration
        ? 1 -
          Math.abs(
            phase / (duration / 2) - 1,
          )
        : 0

    this.recomputeFacialState()
  }

  dispose() {
    if (this.disposed) {
      return
    }

    this.resetNeutral()
    this.mixer.removeEventListener("finished", this.handleMixerFinished)
    this.mixerListeners = 0
    this.mixer.stopAllAction()

    for (const clip of this.clips.values()) {
      this.mixer.uncacheClip(clip)
    }
    this.mixer.uncacheRoot(this.root)

    this.root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return
      }

      object.geometry.dispose()

      const materials =
        Array.isArray(object.material)
          ? object.material
          : [object.material]

      for (const material of materials) {
        material.dispose()
      }
    })

    this.actions.clear()
    this.clips.clear()
    this.disposed = true
  }
}

export function createR2RuntimeController(
  root: Object3D,
  animations: readonly AnimationClip[],
) {
  return new R2FullCharacterRuntimeController(
    root,
    animations,
  )
}

export type R2OwnedMesh =
  | Mesh<BufferGeometry, Material>
  | SkinnedMesh<BufferGeometry, Material>
