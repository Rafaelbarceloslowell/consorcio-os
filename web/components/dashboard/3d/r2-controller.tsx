"use client"

import { R2Model } from "./r2-model"
import { decideR2Behavior } from "./r2-behavior"

type R2ControllerProps = {
  event?: string
}

export function R2Controller({
  event,
}: R2ControllerProps) {
  const behavior = decideR2Behavior(event)

  return (
    <R2Model
      scale={1.5}
      position={[0, -1, 0]}
    />
  )
}