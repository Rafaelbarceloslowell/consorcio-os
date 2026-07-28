"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { R2Controller } from "./r2-controller"

export function R2Scene() {
  return (
    <div className="h-80 w-80">
      <Canvas camera={{ position:[0,0,4] }}>
        <ambientLight intensity={1} />

        <directionalLight
          position={[3,3,3]}
          intensity={2}
        />

        <R2Controller event="dashboard_open" />

        <OrbitControls />
      </Canvas>
    </div>
  )
}