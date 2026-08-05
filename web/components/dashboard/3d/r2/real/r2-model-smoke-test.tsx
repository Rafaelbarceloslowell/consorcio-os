"use client"

import { useGLTF } from "@react-three/drei"

type R2ModelSmokeTestProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: unknown
}

export function R2ModelSmokeTest({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: R2ModelSmokeTestProps) {
  const { scene } = useGLTF("/models/r2/r2-gorilla.glb")

  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  )
}

useGLTF.preload("/models/r2/r2-gorilla.glb")