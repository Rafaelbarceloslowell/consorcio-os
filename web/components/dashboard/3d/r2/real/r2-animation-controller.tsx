"use client"

import type { R2Behavior } from "../../r2-behavior"

type R2AnimationControllerProps = {
  behavior?: R2Behavior
}


export function R2AnimationController({
  behavior,
}: R2AnimationControllerProps) {


  const animation =
    behavior?.animation ?? "breathing"


  return null
}