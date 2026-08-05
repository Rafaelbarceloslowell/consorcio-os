"use client"

import { useGLTF } from "@react-three/drei"

type R2GLTFModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function R2GLTFModel({
  scale = 1,
  position = [0,0,0],
  rotation = [0,0,0],
}: R2GLTFModelProps) {
  const { scene } = useGLTF(
    "/models/gorila-r2/gorila-r2.glb"
  )

  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  )
}

useGLTF.preload(
  "/models/gorila-r2/gorila-r2.glb"
)