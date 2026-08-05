"use client"

import {
  Component,
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  ErrorInfo,
  ReactNode,
} from "react"
import {
  useGLTF,
} from "@react-three/drei"
import {
  useFrame,
  useThree,
} from "@react-three/fiber"
import type {
  Group,
  Object3D,
} from "three"
import {
  PerspectiveCamera,
} from "three"

import type {
  R2Behavior,
} from "../../r2-behavior"
import type {
  R2RuntimeLoadState,
} from "@/types/r2-full-character-runtime"
import type {
  R2ExecutionReceipt,
  R2RuntimeCommand,
} from "@/types/r2-intelligence-orchestration"
import {
  R2RuntimeCommandAdapter,
} from "../orchestration/r2-runtime-command-adapter"
import {
  R2_FULL_CHARACTER_MODEL_PATH,
  R2FullCharacterRuntimeController,
  createOwnedR2Scene,
  r2BehaviorToRuntimeState,
} from "./r2-full-character-runtime"
import {
  computeR2RenderableBounds,
  configureR2Camera,
} from "./r2-character-presentation"

type R2FullCharacterModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: R2Behavior
  runtimeWorkspaceId?: string
  runtimeCommand?: R2RuntimeCommand | null
  onRuntimeReceipt?: (receipt: R2ExecutionReceipt) => void
  onLoadStateChange?: (
    state: R2RuntimeLoadState,
  ) => void
  onControllerReady?: (
    controller:
      R2FullCharacterRuntimeController,
  ) => void
  autoFrame?: boolean
  reducedMotion?: boolean
}

type RuntimeInstance = {
  scene: Object3D
  controller:
    R2FullCharacterRuntimeController
  adapter: R2RuntimeCommandAdapter | null
}

declare global {
  interface Window {
    __GORILLA_R2_DIAGNOSTICS__?: Readonly<{
      setState: R2FullCharacterRuntimeController["setState"]
      setReducedMotion: R2FullCharacterRuntimeController["setReducedMotion"]
      getSnapshot: R2FullCharacterRuntimeController["getDiagnostics"]
      resetNeutral: R2FullCharacterRuntimeController["resetNeutral"]
    }>
  }
}

function R2CameraFraming({
  scene,
}: Readonly<{
  scene: Object3D
}>) {
  const {
    camera,
    size,
  } = useThree((state) => ({
    camera: state.camera,
    size: state.size,
  }))

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return
    }

    configureR2Camera(
      camera,
      computeR2RenderableBounds(scene),
      size.height > 0
        ? size.width / size.height
        : 1,
    )
  }, [
    camera,
    scene,
    size.height,
    size.width,
  ])

  return null
}

export function R2FullCharacterModel({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  behavior,
  runtimeWorkspaceId,
  runtimeCommand,
  onRuntimeReceipt,
  onLoadStateChange,
  onControllerReady,
  autoFrame = false,
  reducedMotion,
}: R2FullCharacterModelProps) {
  const onRuntimeReceiptRef = useRef(onRuntimeReceipt)
  useEffect(() => {
    onRuntimeReceiptRef.current = onRuntimeReceipt
  }, [onRuntimeReceipt])
  const {
    scene,
    animations,
  } = useGLTF(
    R2_FULL_CHARACTER_MODEL_PATH,
  )

  const [runtime, setRuntime] =
    useState<RuntimeInstance | null>(null)
  const [systemReducedMotion, setSystemReducedMotion] =
    useState(false)

  useEffect(() => {
    if (reducedMotion !== undefined || typeof window.matchMedia !== "function") {
      return undefined
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setSystemReducedMotion(media.matches)
    sync()
    media.addEventListener?.("change", sync)
    return () => media.removeEventListener?.("change", sync)
  }, [reducedMotion])

  useEffect(() => {
    onLoadStateChange?.({
      status: "loading",
    })

    const ownedScene =
      createOwnedR2Scene(scene)

    try {
      const controller =
        new R2FullCharacterRuntimeController(
          ownedScene,
          animations,
        )
      const adapter = runtimeWorkspaceId
        ? new R2RuntimeCommandAdapter({
            controller,
            workspaceId: runtimeWorkspaceId,
            onReceipt: (receipt) => onRuntimeReceiptRef.current?.(receipt),
          })
        : null

      // Each effect setup owns a fresh clone. This keeps React Strict
      // Mode's setup/cleanup/setup probe from reusing disposed GPU data.
      setRuntime({
        scene: ownedScene,
        controller,
        adapter,
      })
      onControllerReady?.(
        controller,
      )
      onLoadStateChange?.({
        status: "ready",
      })

      return () => {
        adapter?.dispose()
        controller.dispose()
      }
    } catch (error) {
      const normalized =
        error instanceof Error
          ? error
          : new Error(String(error))

      onLoadStateChange?.({
        status: "error",
        error: normalized,
      })
      setRuntime(null)

      ownedScene.traverse((object) => {
        const mesh = object as {
          geometry?: { dispose(): void }
          material?:
            | { dispose(): void }
            | { dispose(): void }[]
        }

        mesh.geometry?.dispose()

        const materials =
          Array.isArray(mesh.material)
            ? mesh.material
            : mesh.material
              ? [mesh.material]
              : []

        for (const material of materials) {
          material.dispose()
        }
      })

      return undefined
    }
  }, [
    animations,
    onControllerReady,
    onLoadStateChange,
    runtimeWorkspaceId,
    scene,
  ])

  useEffect(() => {
    if (!runtimeCommand) {
      runtime?.controller.setState(
        r2BehaviorToRuntimeState(
          behavior,
        ),
      )
    }
  }, [
    behavior,
    runtime,
    runtimeCommand,
  ])

  useEffect(() => {
    runtime?.controller.setReducedMotion(
      reducedMotion ?? systemReducedMotion,
    )
  }, [reducedMotion, runtime, systemReducedMotion])

  useEffect(() => {
    if (!runtime || process.env.NODE_ENV === "production") {
      return undefined
    }

    const api = {
      setState: runtime.controller.setState.bind(runtime.controller),
      setReducedMotion: runtime.controller.setReducedMotion.bind(runtime.controller),
      getSnapshot: runtime.controller.getDiagnostics.bind(runtime.controller),
      resetNeutral: runtime.controller.resetNeutral.bind(runtime.controller),
    }
    window.__GORILLA_R2_DIAGNOSTICS__ = api

    return () => {
      if (window.__GORILLA_R2_DIAGNOSTICS__ === api) {
        delete window.__GORILLA_R2_DIAGNOSTICS__
      }
    }
  }, [runtime])

  useEffect(() => {
    if (runtimeCommand) runtime?.adapter?.apply(runtimeCommand)
  }, [runtime, runtimeCommand])

  useFrame((_, delta) => {
    runtime?.controller.update(delta)
  })

  if (!runtime) {
    return null
  }

  return (
    <>
      {autoFrame ? (
        <R2CameraFraming
          scene={runtime.scene}
        />
      ) : null}
      <primitive
        object={runtime.scene as Group}
        scale={scale}
        position={position}
        rotation={rotation}
      />
    </>
  )
}

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  onError?: (
    error: Error,
    info: ErrorInfo,
  ) => void
}

type ErrorBoundaryState = {
  error: Error | null
}

export class R2FullCharacterErrorBoundary
extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(
    error: Error,
  ): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ) {
    this.props.onError?.(
      error,
      info,
    )
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? null
    }

    return this.props.children
  }
}

useGLTF.preload(
  R2_FULL_CHARACTER_MODEL_PATH,
)
