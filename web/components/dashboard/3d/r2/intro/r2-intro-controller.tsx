"use client"

import { useState } from "react"
import {
  hasSeenR2Intro,
  completeR2Intro,
} from "./r2-intro-storage"

import type {
  R2IntroState,
} from "./r2-intro-state"


export function R2IntroController() {

  const [state,setState] =
    useState<R2IntroState>(
      hasSeenR2Intro()
        ? "complete"
        : "sleeping"
    )


  function reveal() {

    setState(
      "revealing"
    )

    completeR2Intro()

  }


  return {
    state,
    reveal,
  }
}