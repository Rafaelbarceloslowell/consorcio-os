"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

type R2LifeControllerProps = {
  target?: THREE.Group | null
}


export function R2LifeController({
  target,
}: R2LifeControllerProps) {

  const baseY =
    useRef(0)


  useFrame((state) => {

    if (!target) return


    const time =
      state.clock.elapsedTime


    // respiração suave
    target.position.y =
      baseY.current +
      Math.sin(time * 1.8) * 0.015


    // micro movimento corporal
    target.rotation.y =
      Math.sin(time * 0.5) * 0.02

  })


  return null
}