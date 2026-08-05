import type { R2Behavior } from "./r2-behavior"

type NextBestActionInput = {
  title: string
  description?: string | null
  reason: string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  confidence: number
}

export function interpretNextBestAction(
  action: NextBestActionInput
): R2Behavior {
  if (action.priority === "URGENT") {
    return {
      mood: "alert",
      animation: "warning",
      message: `Atenção: ${action.title}. ${action.reason}`,
    }
  }

  if (action.priority === "HIGH") {
    return {
      mood: "thinking",
      animation: "thinking",
      message: `Encontrei uma oportunidade importante: ${action.title}.`,
    }
  }

  return {
    mood: "idle",
    animation: "breathing",
    message: `Estou monitorando: ${action.title}.`,
  }
}