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

function getAuraColor(
  mood?: R2Behavior["mood"]
) {
  switch (mood) {
    case "alert":
      return "#E16A6A"

    case "thinking":
      return "#E8B04A"

    case "success":
      return "#3FB980"

    case "welcome":
      return "#43A972"

    default:
      return "#2F8F5B"
  }
}

export function R2Placeholder({
  scale = 1,
  position = [0, 0, 0],
  behavior,
}: R2PlaceholderProps) {

  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return

    const time =
      state.clock.elapsedTime

    ref.current.position.y =
      position[1]

    if (
      behavior?.animation === "breathing"
    ) {
      ref.current.scale.y =
        scale + Math.sin(time * 2) * 0.03
    }

    if (
      behavior?.animation === "thinking"
    ) {
      ref.current.rotation.y =
        Math.sin(time) * 0.25

      ref.current.rotation.z =
        Math.sin(time) * 0.05
    }

    if (
      behavior?.animation === "warning"
    ) {
      ref.current.rotation.z =
        Math.sin(time * 15) * 0.08
    }

    if (
      behavior?.animation === "celebrating"
    ) {
      ref.current.position.y =
        position[1] +
        Math.abs(
          Math.sin(time * 4)
        ) * 0.25
    }
  })

  const aura =
    getAuraColor(
      behavior?.mood
    )

  return (
    <group
      ref={ref}
      position={position}
      scale={scale}
    >

      {/* aura */}
      <mesh scale={1.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={aura}
          transparent
          opacity={0.12}
        />
      </mesh>


      {/* corpo */}
      <mesh position={[0,0,0]}>
        <sphereGeometry args={[0.8,32,32]} />
        <meshStandardMaterial color="#2F8F5B" />
      </mesh>


      {/* cabeça */}
      <mesh position={[0,1,0]}>
        <sphereGeometry args={[0.42,32,32]} />
        <meshStandardMaterial color="#43A972" />
      </mesh>


      {/* olhos */}
      <mesh position={[-0.14,1.05,0.36]}>
        <sphereGeometry args={[0.06,16,16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
        />
      </mesh>

      <mesh position={[0.14,1.05,0.36]}>
        <sphereGeometry args={[0.06,16,16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
        />
      </mesh>


      {/* braços */}
      <mesh position={[-0.85,0,0]}>
        <sphereGeometry args={[0.18,16,16]} />
        <meshStandardMaterial color="#256B46" />
      </mesh>

      <mesh position={[0.85,0,0]}>
        <sphereGeometry args={[0.18,16,16]} />
        <meshStandardMaterial color="#256B46" />
      </mesh>

    </group>
  )
}