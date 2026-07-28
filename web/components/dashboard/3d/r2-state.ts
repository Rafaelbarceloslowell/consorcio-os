import type { R2Behavior } from "./r2-behavior"

export type R2State = {
  mood: R2Behavior["mood"]
  animation: R2Behavior["animation"]
  message: string
  updatedAt: Date
}

let currentState: R2State = {
  mood: "idle",
  animation: "breathing",
  message: "Monitorando sua operação.",
  updatedAt: new Date(),
}

export function setR2State(
  behavior: R2Behavior
) {
  currentState = {
    mood: behavior.mood,
    animation: behavior.animation,
    message: behavior.message,
    updatedAt: new Date(),
  }

  return currentState
}

export function getR2State() {
  return currentState
}