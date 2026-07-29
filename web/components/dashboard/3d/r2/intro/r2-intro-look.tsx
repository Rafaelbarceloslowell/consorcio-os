"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"


type R2IntroLookProps = {
  target?: THREE.Group | null
}


export function R2IntroLook({
  target,
}: R2IntroLookProps) {

  const mouse =
    useThree(
      (state) => state.pointer
    )


  const smooth =
    useRef({
      x: 0,
      y: 0,
    })


  useFrame(() => {

    if (!target) return


    smooth.current.x +=
      (
        mouse.x -
        smooth.current.x
      ) * 0.05


    smooth.current.y +=
      (
        mouse.y -
        smooth.current.y
      ) * 0.05


    target.rotation.y =
      smooth.current.x * 0.25


    target.rotation.x =
      -smooth.current.y * 0.12

  })


  return null
}