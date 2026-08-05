"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"


type R2RevealAnimationProps = {
  active?: boolean
  target?: THREE.Group | null
}


export function R2RevealAnimation({
  active = false,
  target,
}: R2RevealAnimationProps) {

  const progress =
    useRef(0)


  useFrame(() => {

    if (!active) {
      progress.current = 0
      return
    }

    if (!target) return


    progress.current += 0.02


    const value =
      Math.min(
        progress.current,
        1
      )


    target.scale.setScalar(
      0.9 + value * 0.1
    )


    target.position.y =
      value * 0.15

  })


  return null
}