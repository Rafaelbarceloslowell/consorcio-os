"use client"

import { R2Avatar } from "./r2/r2-avatar"
import { decideR2Behavior } from "./r2-behavior"

type R2ControllerProps = {
  event?: string
}

export function R2Controller({
  event,
}: R2ControllerProps) {

  const behavior =
    decideR2Behavior(event)

  return (
    <R2Avatar
      behavior={behavior}
    />
  )
}