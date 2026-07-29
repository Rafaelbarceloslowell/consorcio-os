"use client"

import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { R2Rig } from "./r2-rig"
import type { R2Behavior } from "../../r2-behavior"
import { getR2Attention } from "./r2-attention"

type R2EyeControllerProps = {
  rig: R2Rig
  behavior?: R2Behavior
}


export function R2EyeController({
  rig,
  behavior,
}: R2EyeControllerProps) {


  useFrame((state) => {

    const time =
      state.clock.elapsedTime


    const target =
      getR2Attention(
        behavior?.mood
      )

    const movement =
      target.x +
      Math.sin(time * 2) * 0.02


    if (rig.leftEye) {
      rig.leftEye.rotation.y =
        movement
    }


    if (rig.rightEye) {
      rig.rightEye.rotation.y =
        movement
    }

  })


  return null
}