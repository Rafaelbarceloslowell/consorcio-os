"use client"

import {
  useGLTF,
} from "@react-three/drei"

type R2WebModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: unknown
}

const r2WebModelPath =
  "/models/r2/r2-gorilla-web.glb?v=production-1"

export function R2WebModel({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: R2WebModelProps) {
  const {
    scene,
  } = useGLTF(
    r2WebModelPath,
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