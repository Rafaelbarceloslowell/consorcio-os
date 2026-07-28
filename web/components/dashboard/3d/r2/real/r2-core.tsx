"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

type R2CoreProps = {
  color?: string
}

export function R2Core({
  color = "#2F8F5B",
}: R2CoreProps) {

  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {

    if (!ref.current) return

    const pulse =
      1 + Math.sin(
        state.clock.elapsedTime * 4
      ) * 0.08

    ref.current.scale.setScalar(
      pulse
    )

  })


  return (
    <mesh
      ref={ref}
      position={[0,0.2,0.8]}
    >

      <sphereGeometry
        args={[0.12,32,32]}
      />

      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
      />

    </mesh>
  )
}