"use client"

import { useState } from "react"
import { R2Scene } from "./r2-scene"

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

    </div>
  )
}