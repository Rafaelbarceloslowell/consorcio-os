// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { OpportunityExecutionCard } from "./opportunity-execution-card"

const fetchMock = vi.fn()

function response(body: unknown) {
  return Promise.resolve({ ok: true, json: async () => body })
}

const firstContact = {
  mode: "MANUAL_MESSAGING_MODE",
  activity: {
    id: "activity-1",
    title: "Fazer primeiro contato",
    description: "Lead novo ainda sem primeiro contato.",
    executionType: "NEW_LEAD_FIRST_CONTACT",
    channel: "WHATSAPP",
    dueAt: "2026-08-10T12:00:00.000Z",
    due: true,
    impactNumber: 1,
    cadenceInstanceId: "cadence-1",
    reason: "Lead novo ainda sem primeiro contato.",
  },
  commitments: [],
  reactivation: { contextRequired: false, canRecommendMessage: true },
}

describe("OpportunityExecutionCard", () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it("marca mensagem manual e não pergunta resposta imediatamente", async () => {
    fetchMock
      .mockImplementationOnce(() => response(firstContact))
      .mockImplementationOnce(() => response({
        ...firstContact,
        activity: {
          ...firstContact.activity,
          id: "check-1",
          title: "Verificar resposta — Impacto 1/7",
          executionType: "RESPONSE_CHECK",
          channel: "SYSTEM",
          due: false,
          dueAt: "2026-08-10T12:05:00.000Z",
        },
      }))

    render(<OpportunityExecutionCard opportunityId="opportunity-1" />)

    fireEvent.click(await screen.findByRole("button", { name: "Mensagem enviada" }))

    await waitFor(() => expect(screen.getByText("Verificar resposta — Impacto 1/7")).toBeInTheDocument())
    expect(screen.queryByText("O cliente respondeu?")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/opportunities/opportunity-1/execution",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ type: "MESSAGE_SENT", activityId: "activity-1" }),
      }),
    )
  })

  it("bloqueia reativação até contexto do ciclo atual", async () => {
    fetchMock.mockImplementationOnce(() => response({
      ...firstContact,
      activity: {
        ...firstContact.activity,
        executionType: "REACTIVATION_CONTEXT_REQUIRED",
        impactNumber: null,
        cadenceInstanceId: "cycle-2",
        title: "Informar contexto atual da reativação",
      },
      reactivation: { contextRequired: true, canRecommendMessage: false },
    }))

    render(<OpportunityExecutionCard opportunityId="opportunity-1" />)

    expect(await screen.findByText(/preciso saber onde a conversa parou/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Analisar contexto" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Nunca respondeu" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Mensagem enviada" })).not.toBeInTheDocument()
  })
})
