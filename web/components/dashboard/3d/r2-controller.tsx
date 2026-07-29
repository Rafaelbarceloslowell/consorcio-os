"use client"

import type { R2Behavior } from "./r2-behavior"
import { R2Avatar } from "./r2/r2-avatar"
import { R2DashboardAvatar } from "./r2/r2-dashboard-avatar"
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
      <R2DashboardAvatar
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