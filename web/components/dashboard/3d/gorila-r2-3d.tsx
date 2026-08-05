"use client"

import {
  Suspense,
  useEffect,
  useState,
} from "react"

import {
  Canvas,
} from "@react-three/fiber"

import {
  R2FullCharacterErrorBoundary,
  R2FullCharacterModel,
} from "./r2/real/r2-full-character-model"
import {
  R2_CAMERA_FOV,
  R2_LIGHTING,
  R2_MODEL_PRESENTATION_SCALE,
  R2_RENDERER,
} from "./r2/real/r2-character-presentation"
import type {
  R2ExecutionReceipt,
  R2RuntimeCommand,
} from "@/types/r2-intelligence-orchestration"

export function GorilaR23D({
  workspaceId,
  runtimeCommand,
  onRuntimeReceipt,
}: Readonly<{
  workspaceId?: string
  runtimeCommand?: R2RuntimeCommand | null
  onRuntimeReceipt?: (receipt: R2ExecutionReceipt) => void
}>) {
  const [canRenderCanvas, setCanRenderCanvas] =
    useState(false)

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (active) {
        setCanRenderCanvas(
          typeof globalThis.ResizeObserver !==
            "undefined",
        )
      }
    })

    return () => {
      active = false
    }
  }, [])

  if (!canRenderCanvas) {
    return (
      <div
        aria-label="Visualização 3D do R2 indisponível"
        className="h-full w-full bg-transparent"
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        camera={{
          position: [
            0,
            0,
            5,
          ],
          fov: R2_CAMERA_FOV,
          near: 0.1,
          far: 100,
        }}
        dpr={[
          1,
          1.25,
        ]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference:
            "high-performance",
          preserveDrawingBuffer:
            false,
        }}
        onCreated={({
          gl,
        }) => {
          gl.toneMapping =
            R2_RENDERER.toneMapping
          gl.toneMappingExposure =
            R2_RENDERER.toneMappingExposure
          gl.outputColorSpace =
            R2_RENDERER.outputColorSpace
          gl.shadowMap.enabled =
            R2_RENDERER.shadowsEnabled
          gl.setClearColor(
            0x000000,
            0,
          )
        }}
        fallback={
          <div
            aria-label="Visualização 3D do R2 indisponível"
            className="h-full w-full bg-transparent"
          />
        }
      >
        <hemisphereLight
          name="r2-hemisphere-light"
          color={
            R2_LIGHTING.hemisphere.skyColor
          }
          groundColor={
            R2_LIGHTING.hemisphere.groundColor
          }
          intensity={
            R2_LIGHTING.hemisphere.intensity
          }
        />
        <directionalLight
          name="r2-key-light"
          color={R2_LIGHTING.key.color}
          intensity={R2_LIGHTING.key.intensity}
          position={R2_LIGHTING.key.position}
        />
        <directionalLight
          name="r2-fill-light"
          color={R2_LIGHTING.fill.color}
          intensity={R2_LIGHTING.fill.intensity}
          position={R2_LIGHTING.fill.position}
        />
        <directionalLight
          name="r2-rim-light"
          color={R2_LIGHTING.rim.color}
          intensity={R2_LIGHTING.rim.intensity}
          position={R2_LIGHTING.rim.position}
        />
        <Suspense fallback={null}>
          <R2FullCharacterErrorBoundary>
            <R2FullCharacterModel
              runtimeWorkspaceId={workspaceId}
              runtimeCommand={runtimeCommand}
              onRuntimeReceipt={onRuntimeReceipt}
              scale={R2_MODEL_PRESENTATION_SCALE}
              autoFrame
            />
          </R2FullCharacterErrorBoundary>
        </Suspense>
      </Canvas>
    </div>
  )
}
