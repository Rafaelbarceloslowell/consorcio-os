"use client"

import {
  R2FullCharacterErrorBoundary,
  R2FullCharacterModel,
} from "./real/r2-full-character-model"

import {
  R2FirstLogin,
} from "./intro/r2-first-login"

import type {
  R2Behavior,
} from "../r2-behavior"

type R2DashboardAvatarProps = {
  behavior?: R2Behavior
}

export function R2DashboardAvatar({
  behavior,
}: R2DashboardAvatarProps) {
  return (
    <R2FirstLogin>
      <R2FullCharacterErrorBoundary>
        <R2FullCharacterModel
          scale={1.5}
          position={[
            0,
            -1,
            0,
          ]}
          behavior={behavior}
        />
      </R2FullCharacterErrorBoundary>
    </R2FirstLogin>
  )
}
