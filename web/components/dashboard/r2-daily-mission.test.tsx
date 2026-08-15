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

  it("resume pessoa, situação, motivo e recomendação sem exigir o clique", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...emptyMission(),
        now: [{
          id: "task-2",
          opportunityId: "opportunity-2",
          title: "Revisar oportunidade sem próxima ação",
          reason: "Invariant STALE_OPPORTUNITY detectado.",
          dueAt: "2026-08-15T12:00:00.000Z",
          actionContext: {
            actionId: "task-2",
            opportunityId: "opportunity-2",
            personName: "Nair Silva",
            contextLabel: "Aquisição · Novo lead",
            actionTitle: "Nair Silva está sem próxima ação",
            actionReason: "A oportunidade está ativa sem atividade pendente.",
            whyNow: "Não há compromisso futuro ou espera válida.",
            r2Recommendation: "Defina o próximo passo comercial.",
            priority: "HIGH",
            actionType: "R2_REVIEW",
            href: "/opportunities/opportunity-2#r2-action-controls",
          },
        }],
      }),
    }))

    render(<R2DailyMission />)

    expect(await screen.findByText("Nair Silva")).toBeInTheDocument()
    expect(screen.getByText(/Aquisição · Novo lead · Nair Silva está sem próxima ação/)).toBeInTheDocument()
    expect(screen.getByText(/A oportunidade está ativa sem atividade pendente/)).toBeInTheDocument()
    expect(screen.getByText(/Defina o próximo passo comercial/)).toBeInTheDocument()
    expect(screen.queryByText("Invariant STALE_OPPORTUNITY detectado.")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Abrir ação" })).toHaveAttribute(
      "href",
      "/opportunities/opportunity-2#r2-action-controls",
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
