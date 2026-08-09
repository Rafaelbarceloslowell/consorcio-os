import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getContext: vi.fn(), execute: vi.fn() }))

vi.mock("@/lib/auth/get-authenticated-commercial-context", () => ({
  getApiCommercialContext: mocks.getContext,
}))
vi.mock("@/application/execution/r2-notification-actions", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/application/execution/r2-notification-actions")>()
  return { ...original, executeR2NotificationAction: mocks.execute }
})

import { PATCH } from "./route"

const context = { params: Promise.resolve({ notificationId: "notification-1" }) }

describe("R2 notification route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getContext.mockResolvedValue({ workspaceId: "workspace-1", consultantId: "consultant-1" })
    mocks.execute.mockResolvedValue({})
  })

  it("encaminha snooze no escopo autenticado", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ type: "SNOOZE", minutes: 10 }),
    }), context)
    expect(response.status).toBe(200)
    expect(mocks.execute).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      notificationId: "notification-1",
      action: { type: "SNOOZE", minutes: 10 },
    })
  })

  it("rejeita duração de snooze não suportada", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ type: "SNOOZE", minutes: 60 }),
    }), context)
    expect(response.status).toBe(400)
    expect(mocks.execute).not.toHaveBeenCalled()
  })
})
