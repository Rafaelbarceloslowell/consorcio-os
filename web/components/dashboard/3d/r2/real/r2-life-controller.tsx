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


  const initialized =
    useRef(false)


  const baseY =
    useRef(0)



  useFrame((state) => {


    if (!target) return



    if (!initialized.current) {

      baseY.current =
        target.position.y

      initialized.current =
        true

    }



    const time =
      state.clock.elapsedTime



    target.position.y =
      baseY.current +
      Math.sin(time * 1.8) * 0.015



    target.rotation.y =
      Math.sin(time * 0.5) * 0.02


  })


  return null
}