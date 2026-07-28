"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { R2Controller } from "./r2-controller"

type R2SceneProps = {
  event?: string
}

export function R2Scene({
  event,
}: R2SceneProps) {
  return (
    <div className="h-80 w-80">
      <Canvas camera={{ position:[0,0,4] }}>
        <ambientLight intensity={1} />

        <directionalLight
          position={[3,3,3]}
          intensity={2}
        />

        <R2Controller event={event} />

        <OrbitControls />
      </Canvas>
    </div>
  )
}