"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"
import type { R2Behavior } from "../../r2-behavior"

type R2FaceControllerProps = {
  behavior?: R2Behavior
}

export function R2FaceController({
  behavior,
}: R2FaceControllerProps) {

  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {

    if (!ref.current) return

    const time =
      state.clock.elapsedTime


    if (
      behavior?.mood === "thinking"
    ) {
      ref.current.rotation.x =
        Math.sin(time * 2) * 0.05
    }


    if (
      behavior?.mood === "alert"
    ) {
      ref.current.rotation.x =
        -0.05
    }


    if (
      behavior?.mood === "success"
    ) {
      ref.current.rotation.y =
        Math.sin(time * 3) * 0.08
    }

  })


  return (
    <group ref={ref} />
  )
}