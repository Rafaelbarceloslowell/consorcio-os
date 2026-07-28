"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

function R2Placeholder() {
  return (
    <mesh position={[0,0,0]}>
      <sphereGeometry args={[1,32,32]} />
      <meshStandardMaterial color="#2F8F5B" />
    </mesh>
  )
}

export function R2Scene() {
  return (
    <div className="h-80 w-80">
      <Canvas camera={{ position:[0,0,4] }}>
        <ambientLight intensity={1} />

        <directionalLight
          position={[3,3,3]}
          intensity={2}
        />

        <R2Placeholder />

        <OrbitControls />
      </Canvas>
    </div>
  )
}