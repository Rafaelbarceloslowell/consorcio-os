"use client"

import type { R2Behavior } from "./r2-behavior"
import { R2Avatar } from "./r2/r2-avatar"
import { R2RealModel } from "./r2/real/r2-real-model"
import { decideR2Behavior } from "./r2-behavior"

type R2ControllerProps = {
  event?: string
  realModel?: boolean
}

export function R2Controller({
  event,
  realModel = false,
}: R2ControllerProps) {

  const behavior =
    decideR2Behavior(event)

  if (realModel) {
    return (
      <R2RealModel
        scale={1.5}
        position={[0,-1,0]}
        behavior={behavior}
      />
    )
  }

  return (
    <R2Avatar
      behavior={behavior}
    />
  )
}