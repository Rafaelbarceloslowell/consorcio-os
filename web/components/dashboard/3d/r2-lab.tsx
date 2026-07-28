"use client"

import { useState } from "react"
import { R2Scene } from "./r2-scene"
import { decideR2Behavior } from "./r2-behavior"

const events = [
  {
    id: "dashboard_open",
    label: "Entrada no Dashboard",
  },
  {
    id: "hot_lead_found",
    label: "Lead Quente",
  },
  {
    id: "proposal_analysis",
    label: "Analisando Proposta",
  },
  {
    id: "sale_completed",
    label: "Venda Concluída",
  },
]

export function R2Lab() {
  const [event, setEvent] = useState(
    "dashboard_open"
  )

  const behavior =
    decideR2Behavior(event)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#15191F]">

      <div className="flex flex-wrap justify-center gap-3">
        {events.map((item) => (
          <button
            key={item.id}
            onClick={() => setEvent(item.id)}
            className="rounded-xl border border-[#2F8F5B]/40 px-4 py-2 text-sm text-white hover:bg-[#2F8F5B]/20"
          >
            {item.label}
          </button>
        ))}
      </div>

      <R2Scene event={event} />

      <div className="w-96 rounded-2xl border border-[#2F8F5B]/30 bg-black/20 p-6 text-white">

        <h2 className="mb-4 text-lg font-bold">
          🦍 R2 Brain
        </h2>

        <div className="space-y-2 text-sm">
          <p>
            Humor:
            <span className="ml-2 text-[#3FB980]">
              {behavior.mood}
            </span>
          </p>

          <p>
            Animação:
            <span className="ml-2 text-[#E8B04A]">
              {behavior.animation}
            </span>
          </p>

          <p className="mt-4 text-gray-300">
            "{behavior.message}"
          </p>
        </div>

      </div>

    </div>
  )
}