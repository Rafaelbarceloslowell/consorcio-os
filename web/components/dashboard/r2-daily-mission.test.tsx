// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { R2DailyMission } from "./r2-daily-mission"

describe("R2DailyMission", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("mostra resumo e primeira ação explicada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        target: 50,
        totalActive: 47,
        commitments: 2,
        meetings: 1,
        newLeads: 3,
        checks: 4,
        recoveries: 2,
        followUps: 6,
        now: [{
          id: "task-1",
          opportunityId: "opportunity-1",
          title: "Realizar callback combinado",
          reason: "Cliente pediu ligação às 09:00.",
          dueAt: "2026-08-10T12:00:00.000Z",
        }],
        next: [],
        notifications: [],
      }),
    }))

    render(<R2DailyMission />)

    expect(await screen.findByText("47/50")).toBeInTheDocument()
    expect(screen.getByText("Realizar callback combinado")).toBeInTheDocument()
    expect(screen.getByText("Cliente pediu ligação às 09:00.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Abrir ação" })).toHaveAttribute("href", "/opportunities/opportunity-1")
  })
})
