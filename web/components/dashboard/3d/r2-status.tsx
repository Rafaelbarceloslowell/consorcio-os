"use client"

import { getR2State } from "./r2-state"

export function R2Status() {
  const state = getR2State()

  const label = {
    idle: "Monitorando operação",
    thinking: "Analisando dados",
    alert: "Atenção necessária",
    success: "Resultado positivo",
    welcome: "R2 online",
  }[state.mood]

  return (
    <div className="rounded-2xl border border-[#2F8F5B]/30 bg-[#15191F]/80 px-4 py-3 shadow-lg">
      <div className="text-sm font-semibold text-white">
        {label}
      </div>

      <div className="mt-1 text-xs text-white/60">
        {state.message}
      </div>
    </div>
  )
}