import type {
  Object3D,
  Vector3,
} from "three"

export const R2_RUNTIME_STATES = [
  "neutral",
  "idle",
  "working",
  "listening",
  "thinking",
  "awaiting_action",
  "alert",
  "speaking",
  "celebrating_sale",
  "error_attention",
] as const

export type R2RuntimeState =
  (typeof R2_RUNTIME_STATES)[number]

export const R2_EXPRESSION_CHANNELS = [
  "BLINK_LEFT",
  "BLINK_RIGHT",
  "BLINK_BOTH",
  "BROW_RAISE",
  "BROW_FROWN",
  "CHEEK_RAISE",
  "MUZZLE",
  "JAW_OPEN",
  "LIPS_CLOSED",
  "SMILE",
  "FROWN",
  "MOUTH_NARROW",
  "MOUTH_WIDE",
  "MOUTH_O",
  "MOUTH_E",
  "EYE_LEFT",
  "EYE_RIGHT",
  "EYE_AIM",
] as const

export type R2ExpressionChannel =
  (typeof R2_EXPRESSION_CHANNELS)[number]

export const R2_VISEMES = [
  "VISEME_A",
  "VISEME_E",
  "VISEME_O",
  "VISEME_MBP",
  "VISEME_FV",
  "VISEME_L",
] as const

export type R2Viseme =
  (typeof R2_VISEMES)[number]

export type R2LoopMode =
  | "repeat"
  | "once"

export type R2PlaybackMode =
  | "loop"
  | "one_shot"
  | "pose"

export type R2RuntimePriority =
  | "low"
  | "normal"
  | "high"
  | "critical"

export type R2ReducedMotionProfile = Readonly<{
  playbackMode: "loop" | "pose"
  playbackSpeed: number
  crossFadeMs: number
  proceduralMotion: boolean
}>

export type R2EyeBehavior =
  | "forward"
  | "ambient_subtle"
  | "task_focus"
  | "user_focus"
  | "up_lateral"
  | "event_focus"

export type R2MouthBehavior =
  | "closed_neutral"
  | "runtime_viseme"
  | "confident_smile"
  | "serious_closed"

export type R2RuntimeStateDefinition = {
  id: R2RuntimeState
  clip: R2AnimationClipName
  head: readonly [number, number, number]
  eye: R2EyeBehavior
  blinkIntervalSeconds: readonly [number, number]
  expressions: Readonly<
    Partial<Record<R2ExpressionChannel, number>>
  >
  mouth: R2MouthBehavior
  playbackMode: R2PlaybackMode
  playbackSpeed: number
  loop: R2LoopMode
  fadeInMs: number
  fadeOutMs: number
  crossFadeMs: number
  transitionSeconds: number
  minimumDurationMs: number
  maximumDurationMs: number | null
  priority: R2RuntimePriority
  interruptible: boolean
  returnState: R2RuntimeState
  cooldownMs: number
  fallback: R2RuntimeState
  morphTargetProfile: "neutral" | "focus" | "listen" | "think" | "alert" | "speak" | "celebrate" | "error"
  headTrackingProfile: R2EyeBehavior
  eyeProfile: R2EyeBehavior
  reducedMotionProfile: R2ReducedMotionProfile
  description: string
}

export type R2StateRequestStatus =
  | "applied"
  | "repeated"
  | "deferred"
  | "cooldown"
  | "fallback"

export type R2StateRequestResult = Readonly<{
  requestedState: unknown
  effectiveState: R2RuntimeState
  status: R2StateRequestStatus
  generation: number
}>

export type R2RuntimeDiagnostics = Readonly<{
  requestedState: R2RuntimeState
  effectiveState: R2RuntimeState
  activeClip: R2AnimationClipName | null
  elapsedInStateMs: number
  reducedMotion: boolean
  actionsCreated: number
  actionsReused: number
  maximumSimultaneousActions: number
  activeActions: number
  transitionsApplied: number
  transitionsIgnored: number
  fallbacks: number
  mixerListeners: number
  pendingState: R2RuntimeState | null
}>

export const R2_ANIMATION_CLIPS = [
  "R2_NEUTRAL",
  "R2_IDLE",
  "R2_WORKING",
  "R2_LISTENING",
  "R2_THINKING",
  "R2_AWAITING_ACTION",
  "R2_ALERT",
  "R2_CELEBRATING_SALE",
  "R2_ERROR_ATTENTION",
] as const

export type R2AnimationClipName =
  (typeof R2_ANIMATION_CLIPS)[number]

export type R2EyeTarget = {
  yaw: number
  pitch: number
}

export type R2RuntimeLoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: Error }

export interface R2RuntimeControllerApi {
  readonly root: Object3D
  readonly state: R2RuntimeState
  readonly requestedState: R2RuntimeState
  readonly disposed: boolean
  setState(state: R2RuntimeState | string): R2StateRequestResult
  setReducedMotion(enabled: boolean): void
  getDiagnostics(): R2RuntimeDiagnostics
  setExpression(
    channel: R2ExpressionChannel,
    value: number,
  ): void
  setViseme(
    viseme: R2Viseme,
    value: number,
  ): void
  setEyeTarget(target: R2EyeTarget): void
  setSpeakingIntensity(value: number): void
  resetNeutral(): void
  update(deltaSeconds: number): void
  dispose(): void
}

export type R2RuntimeSceneFactory = (
  source: Object3D,
) => Object3D

export type R2RuntimeTargetVector =
  Pick<Vector3, "x" | "y" | "z">
