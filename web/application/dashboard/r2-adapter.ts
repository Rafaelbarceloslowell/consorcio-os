import type { GorilaR2Briefing } from "@/types/dashboard"
import type { R2Behavior } from "@/components/dashboard/3d/r2-behavior"

export function adaptGorilaR2ToBehavior(
  briefing: GorilaR2Briefing
): R2Behavior {

  if (briefing.confidence === "low") {
    return {
      mood: "alert",
      animation: "warning",
      message: briefing.analysis,
    }
  }

  if (briefing.nextAction?.priority === "high") {
    return {
      mood: "thinking",
      animation: "thinking",
      message: briefing.recommendation,
    }
  }

  return {
    mood: "idle",
    animation: "breathing",
    message: briefing.analysis,
  }
}