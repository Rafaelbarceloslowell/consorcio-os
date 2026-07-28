"use client"

import { useGLTF, useAnimations } from "@react-three/drei"
import type { R2Behavior } from "../../r2-behavior"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { SkeletonUtils } from "three-stdlib"

type R2RealModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: R2Behavior
}


export function R2RealModel({
  scale = 1,
  position = [0,0,0],
  rotation = [0,0,0],
  behavior,
}: R2RealModelProps) {


  const { scene, animations } = useGLTF(
    "/models/r2/r2-gorilla.glb"
  )

  const { actions } =
    useAnimations(
      animations,
      scene
    )


  useEffect(() => {

    if (!behavior) return

    const animation =
      behavior.animation

    const action =
      actions[animation]

    if (!action) return

    action
      .reset()
      .fadeIn(0.4)
      .play()

    return () => {
      action.fadeOut(0.4)
    }

  }, [behavior, actions])


  const model = useMemo(() => {
    const clone =
      SkeletonUtils.clone(scene)

    clone.traverse((object) => {

      if (
        object instanceof THREE.Mesh
      ) {

        object.castShadow = true
        object.receiveShadow = true

      }

    })

    return clone

  }, [scene])


  return (
    <primitive
      object={model}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  )
}


useGLTF.preload(
  "/models/r2/r2-gorilla.glb"
)