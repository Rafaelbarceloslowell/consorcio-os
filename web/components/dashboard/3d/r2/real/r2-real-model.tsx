"use client"

import { useGLTF } from "@react-three/drei"

type R2RealModelProps = {
  scale?: number
  position?: [number, number, number]
}


export function R2RealModel({
  scale = 1,
  position = [0,0,0],
}: R2RealModelProps) {


  const { scene } = useGLTF(
    "/models/r2/r2-gorilla.glb"
  )


  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
    />
  )
}


useGLTF.preload(
  "/models/r2/r2-gorilla.glb"
)