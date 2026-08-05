"use client"

import {
  useGLTF,
} from "@react-three/drei"

type R2GeometrySmokeTestProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: unknown
}

const diagnosticModelPath =
  "/models/r2/r2-gorilla-geometry-uv.glb?diagnostic=uv-load-only-v1"

export function R2GeometrySmokeTest({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: R2GeometrySmokeTestProps) {
  const {
    scene,
  } = useGLTF(
    diagnosticModelPath,
  )

  void scene

  return (
    <mesh
      scale={scale}
      position={position}
      rotation={rotation}
    >
      <boxGeometry
        args={[
          1,
          1,
          1,
        ]}
      />

      <meshBasicMaterial
        color="#22c55e"
      />
    </mesh>
  )
}