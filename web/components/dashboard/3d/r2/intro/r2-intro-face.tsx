"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

import type {
  R2Presence,
} from "./r2-intro-presence"


type R2IntroFaceProps = {
  presence?: R2Presence
  target?: THREE.Group | null
}


export function R2IntroFace({
  presence,
  target,
}: R2IntroFaceProps) {


  const smile =
    useRef(0)


  useFrame(() => {

    if (!target) return
    if (!presence) return


    const targetSmile =
      presence.eye === "happy"
        ? 1
        : 0


    smile.current +=
      (
        targetSmile -
        smile.current
      ) * 0.08


    // micro expressão facial
    target.rotation.x =
      presence.head === "up"
        ? -0.05
        : 0


    // intensidade emocional
    target.scale.y =
      1 +
      smile.current * 0.02

  })


  return null
}