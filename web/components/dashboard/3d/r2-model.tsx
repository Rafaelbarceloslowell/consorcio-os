"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

import type { R2Behavior } from "./r2-behavior"
import { R2Placeholder } from "./r2-placeholder"

type R2ModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: R2Behavior
}

export function R2Model({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  behavior,
}: R2ModelProps) {
  const modelRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!modelRef.current) return

    const time = state.clock.elapsedTime

    if (behavior?.animation === "breathing") {
      modelRef.current.scale.y =
        scale + Math.sin(time * 2) * 0.03
    }

    if (behavior?.animation === "thinking") {
      modelRef.current.rotation.y =
        Math.sin(time) * 0.2
    }

    if (behavior?.animation === "warning") {
      modelRef.current.position.x =
        position[0] + Math.sin(time * 15) * 0.05
    }

    if (behavior?.animation === "celebrating") {
      modelRef.current.position.y =
        position[1] + Math.abs(Math.sin(time * 4)) * 0.2
    }
  })

  return (
    <group
      ref={modelRef}
      position={position}
      rotation={rotation}
    >
      <R2Placeholder
        scale={scale}
        position={[0, 0, 0]}
        behavior={behavior}
      />
    </group>
  )
}