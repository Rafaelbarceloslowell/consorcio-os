"use client"

import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"
import { SkeletonUtils } from "three-stdlib"

type R2RealModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}


export function R2RealModel({
  scale = 1,
  position = [0,0,0],
  rotation = [0,0,0],
}: R2RealModelProps) {


  const { scene, animations } = useGLTF(
    "/models/r2/r2-gorilla.glb"
  )


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