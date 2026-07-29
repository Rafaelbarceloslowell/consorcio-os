"use client"

import {
  R2RealModel,
} from "./real/r2-real-model"

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

      <R2RealModel

        scale={1.5}

        position={[
          0,
          -1,
          0,
        ]}

        behavior={behavior}

      />

    </R2FirstLogin>

  )

}