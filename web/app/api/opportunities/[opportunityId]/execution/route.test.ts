import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  getView: vi.fn(),
  execute: vi.fn(),
}))

vi.mock("@/lib/auth/get-authenticated-commercial-context", () => ({
  getApiCommercialContext: mocks.getContext,
}))

vi.mock("@/application/execution/r2-execution-service", () => ({
  getOpportunityExecutionView: mocks.getView,
  executeOpportunityCommand: mocks.execute,
}))

import { GET, POST } from "./route"

const context = {
  params: Promise.resolve({ opportunityId: "opportunity-1" }),
}

describe("opportunity execution route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getContext.mockResolvedValue({
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
    })
  })

  it("isola GET pelo workspace autenticado", async () => {
    mocks.getView.mockResolvedValue({ mode: "MANUAL_MESSAGING_MODE", activity: null })
    const response = await GET(new Request("http://localhost"), context)

    expect(response.status).toBe(200)
    expect(mocks.getView).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      opportunityId: "opportunity-1",
    })
  })

  it("envia comando com consultor autenticado", async () => {
    mocks.execute.mockResolvedValue({ activity: { id: "check-1" } })
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ type: "MESSAGE_SENT", activityId: "activity-1" }),
    }), context)

    expect(response.status).toBe(200)
    expect(mocks.execute).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      opportunityId: "opportunity-1",
      consultantId: "consultant-1",
      command: { type: "MESSAGE_SENT", activityId: "activity-1" },
    })
  })

  it("retorna conflito para conclusão concorrente", async () => {
    mocks.execute.mockRejectedValue(new Error("Atividade já processada ou indisponível."))
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ type: "NO_RESPONSE", activityId: "check-1" }),
    }), context)

    expect(response.status).toBe(409)
  })
})
