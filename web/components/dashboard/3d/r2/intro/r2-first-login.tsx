"use client"

import { useRef } from "react"
import * as THREE from "three"

import {
  R2IntroController,
} from "./r2-intro-controller"

import {
  R2IntroLook,
} from "./r2-intro-look"

import {
  R2RevealAnimation,
} from "./r2-reveal-animation"


type R2FirstLoginProps = {
  children?: React.ReactNode
}


export function R2FirstLogin({
  children,
}: R2FirstLoginProps) {

  const group =
    useRef<THREE.Group>(null)


  const {
    state,
    reveal,
  } = R2IntroController()


  return (
    <group
      ref={group}
      onClick={() => {
        reveal()
      }}
    >

      {children}


      <R2IntroLook
        target={
          group.current
        }
      />


      <R2RevealAnimation
        active={
          state === "revealing"
        }
        target={
          group.current
        }
      />

    </group>
  )
}