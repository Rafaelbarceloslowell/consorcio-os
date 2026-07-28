"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

type R2FurProps = {
  intensity?: number
}

export function R2Fur({
  intensity = 0.02,
}: R2FurProps) {

  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {

    if (!ref.current) return

    const time =
      state.clock.elapsedTime

    ref.current.rotation.y =
      Math.sin(time * 0.5) *
      intensity

  })

  return (
    <group ref={ref} />
  )
}