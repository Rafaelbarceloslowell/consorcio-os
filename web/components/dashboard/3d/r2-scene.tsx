"use client"

import { R2Controller } from "./r2-controller"

type R2SceneProps = {
  event?: string
}


export function R2Scene({
  event,
}: R2SceneProps) {

  return (
    <>
      <ambientLight intensity={1} />

      <directionalLight
        position={[3,3,3]}
        intensity={2}
      />

      <R2Controller event={event} />

    </>
  )
}