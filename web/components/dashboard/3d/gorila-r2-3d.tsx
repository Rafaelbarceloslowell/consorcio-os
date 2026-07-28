"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { R2Scene } from "./r2-scene"

export function GorilaR23D() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
        <ambientLight intensity={1} />

        <directionalLight
          position={[3, 3, 3]}
          intensity={2}
        />

        <R2Scene />

        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}