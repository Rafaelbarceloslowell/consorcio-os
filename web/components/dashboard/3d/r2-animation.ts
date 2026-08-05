import type { R2Animation } from "./r2-behavior"

export function getR2AnimationClass(
  animation: R2Animation
) {
  switch (animation) {
    case "thinking":
      return "animate-pulse"

    case "warning":
      return "animate-bounce"

    case "celebrating":
      return "animate-bounce"

    case "breathing":
    default:
      return "animate-[pulse_4s_ease-in-out_infinite]"
  }
}