"use client"

import { R2Hoodie } from "./r2-hoodie"
import { R2Core } from "./r2-core"
import { R2Fur } from "./r2-fur"

type R2CustomizationProps = {
  hoodie?: boolean
}

export function R2Customization({
  hoodie = true,
}: R2CustomizationProps) {

  return (
    <group>

      {hoodie && (
        <R2Hoodie />
      )}

      <R2Core />

      <R2Fur />

    </group>
  )
}