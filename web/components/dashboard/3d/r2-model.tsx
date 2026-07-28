"use client"

import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

type R2ModelProps = {
  scale?: number
  position?: [number, number, number]
}

export function R2Model({
  scale = 1,
  position = [0, 0, 0],
}: R2ModelProps) {
  const group = useRef<THREE.Group>(null)

  const { scene } = useGLTF("/models/gorila-r2/R2.glb")

  useFrame(({ clock }) => {
    if (!group.current) return

    const time = clock.getElapsedTime()

    group.current.position.y =
      position[1] + Math.sin(time * 1.5) * 0.03

    group.current.rotation.y =
      Math.sin(time * 0.5) * 0.02
  })

  return (
    <group
      ref={group}
      scale={scale}
      position={position}
    >
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload("/models/gorila-r2/R2.glb")