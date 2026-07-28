"use client"

import { Suspense } from "react"
import { R2Model } from "./r2-model"

export function R2Scene() {
  return (
    <Suspense fallback={null}>
      <R2Model
        scale={1.5}
        position={[0, -1, 0]}
      />
    </Suspense>
  )
}