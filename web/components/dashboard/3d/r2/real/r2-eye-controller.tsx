"use client"

import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { R2Rig } from "./r2-rig"

type R2EyeControllerProps = {
  rig: R2Rig
}


export function R2EyeController({
  rig,
}: R2EyeControllerProps) {


  useFrame((state) => {

    const time =
      state.clock.elapsedTime


    const movement =
      Math.sin(time * 1.5) * 0.15


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