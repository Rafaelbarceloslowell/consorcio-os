"use client"

type R2WebGLSmokeTestProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: unknown
}

export function R2WebGLSmokeTest({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: R2WebGLSmokeTestProps) {
  return (
    <mesh
      scale={scale}
      position={position}
      rotation={rotation}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#22c55e" />
    </mesh>
  )
}