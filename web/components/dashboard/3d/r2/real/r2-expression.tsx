"use client"

import type { R2Behavior } from "../../r2-behavior"

type R2ExpressionProps = {
  behavior?: R2Behavior
}

export function R2Expression({
  behavior,
}: R2ExpressionProps) {

  const mood =
    behavior?.mood ?? "welcome"


  return null
}