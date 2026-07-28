"use client"

import type { R2Behavior } from "./r2-behavior"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

type R2PlaceholderProps = {
  scale?: number
  position?: [number, number, number]
  behavior?: R2Behavior
}

export function R2Placeholder({
  scale = 1,
  position = [0,0,0],
  behavior,
}: R2PlaceholderProps) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return

    const time = state.clock.elapsedTime

    if (behavior?.animation === "breathing") {
      ref.current.scale.y =
        scale + Math.sin(time * 2) * 0.05
    }

    if (behavior?.animation === "thinking") {
      ref.current.rotation.y =
        Math.sin(time) * 0.3
    }

    if (behavior?.animation === "warning") {
      ref.current.rotation.z =
        Math.sin(time * 15) * 0.08
    }

    if (behavior?.animation === "celebrating") {
      ref.current.position.y =
        position[1] + Math.abs(Math.sin(time * 4)) * 0.3
    }
  })

  return (
    <group
      ref={ref}
      position={position}
      scale={scale}
    >
      <mesh>
        <sphereGeometry args={[0.8,32,32]} />
        <meshStandardMaterial color="#2F8F5B" />
      </mesh>

      <mesh position={[0,1,0]}>
        <sphereGeometry args={[0.4,32,32]} />
        <meshStandardMaterial color="#43A972" />
      </mesh>
    </group>
  )
}