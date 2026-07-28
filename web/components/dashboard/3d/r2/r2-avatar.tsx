"use client"

import type { R2Behavior } from "../r2-behavior"
import { R2Body } from "./r2-body"
import { R2Face } from "./r2-face"
import { R2Head } from "./head/r2-head"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

type R2AvatarProps = {
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

    default:
      return "#2F8F5B"
  }
}

export function R2Avatar({
  behavior,
}: R2AvatarProps) {

  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return

    const time =
      state.clock.elapsedTime

    ref.current.position.y =
      Math.sin(time * 2) * 0.03
  })

  const aura =
    getAuraColor(
      behavior?.mood
    )

  return (
    <group ref={ref}>

      <mesh scale={1.7}>
        <sphereGeometry args={[1,32,32]} />
        <meshStandardMaterial
          color={aura}
          transparent
          opacity={0.08}
        />
      </mesh>

      <R2Body />

      <group
        position={[0,1.55,0]}
        scale={1.6}
      >
        <R2Face
          behavior={behavior}
        />
      </group>

    </group>
  )
}