import type { R2Animation } from "../../r2-behavior"

export const R2AnimationMap: Record<
  R2Animation,
  string[]
> = {

  breathing: [
    "Idle",
    "Breathing",
  ],

  looking: [
    "Look",
    "LookAround",
  ],

  thinking: [
    "Thinking",
    "LookAround",
  ],

  warning: [
    "Alert",
    "Attack",
  ],

  celebrating: [
    "Celebrate",
    "Victory",
  ],

}