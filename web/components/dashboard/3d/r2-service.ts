import { interpretNextBestAction } from "./r2-intelligence"
import type { R2Behavior } from "./r2-behavior"

export type R2CommercialSignal = {
  title: string
  description?: string | null
  reason: string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  confidence: number
}

export function generateR2Reaction(
  signal?: R2CommercialSignal
): R2Behavior {
  if (!signal) {
    return {
      mood: "idle",
      animation: "breathing",
      message: "Monitorando sua operação.",
    }
  }

  return interpretNextBestAction(signal)
}