// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { R2DailyMission } from "./r2-daily-mission"

function emptyMission() {
  return {
    target: 50,
    totalActive: 0,
    commitments: 0,
    meetings: 0,
    newLeads: 0,
    checks: 0,
    recoveries: 0,
    followUps: 0,
    now: [],
    next: [],
    notifications: [],
  }
}

describe("R2DailyMission", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("mostra resumo e primeira ação explicada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...emptyMission(),
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
      }),
    }))

    render(<R2DailyMission />)

    expect(await screen.findByText("47/50")).toBeInTheDocument()
    expect(screen.getByText("Realizar callback combinado")).toBeInTheDocument()
    expect(screen.getByText("Cliente pediu ligação às 09:00.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Abrir ação" })).toHaveAttribute(
      "href",
      "/opportunities/opportunity-1#r2-action-controls",
    )
  })

  it("oferece ativação explícita quando a permissão ainda não foi decidida", async () => {
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => emptyMission() }))

    render(<R2DailyMission />)
    expect(await screen.findByRole("button", { name: "Ativar notificações do R2" })).toBeInTheDocument()
  })

  it("explica quando o navegador bloqueou a permissão", async () => {
    vi.stubGlobal("Notification", { permission: "denied", requestPermission: vi.fn() })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => emptyMission() }))

    render(<R2DailyMission />)
    expect(await screen.findByText(/Alertas bloqueados pelo navegador/i)).toBeInTheDocument()
  })
})
