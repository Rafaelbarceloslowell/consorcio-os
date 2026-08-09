import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}))

vi.mock("@/infrastructure/prisma/client", () => ({
  prisma: {
    r2Notification: {
      findFirst: mocks.findFirst,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
  },
}))

import {
  executeR2NotificationAction,
  R2NotificationNotFoundError,
} from "./r2-notification-actions"

const now = new Date("2026-08-09T15:00:00.000Z")

describe("executeR2NotificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findFirst.mockResolvedValue({ id: "notification-1" })
    mocks.update.mockResolvedValue({})
    mocks.updateMany.mockResolvedValue({ count: 1 })
  })

  it("isola a notificação pelo workspace e consultor autenticados", async () => {
    await executeR2NotificationAction({
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      notificationId: "notification-1",
      action: { type: "READ" },
      now,
    })

    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ workspaceId: "workspace-1", consultantId: "consultant-1" }),
    }))
  })

  it("adia somente a entrega e preserva o vencimento original da tarefa", async () => {
    await executeR2NotificationAction({
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      notificationId: "notification-1",
      action: { type: "SNOOZE", minutes: 30 },
      now,
    })

    const data = mocks.update.mock.calls[0][0].data
    expect(data.deliveryDueAt).toEqual(new Date("2026-08-09T15:30:00.000Z"))
    expect(data.snoozedUntil).toEqual(data.deliveryDueAt)
    expect(data.deliveryVersion).toEqual({ increment: 1 })
    expect(data).not.toHaveProperty("originalDueAt")
    expect(data).not.toHaveProperty("task")
  })

  it("permite apenas um claim atômico por versão de entrega", async () => {
    await expect(executeR2NotificationAction({
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      notificationId: "notification-1",
      action: { type: "CLAIM", deliveryVersion: 3 },
      now,
    })).resolves.toEqual({ claimed: true })

    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ nativeDeliveredAt: null, deliveryVersion: 3 }),
      data: { nativeDeliveredAt: now },
    }))
  })

  it("não revela notificações fora do escopo autenticado", async () => {
    mocks.findFirst.mockResolvedValue(null)
    await expect(executeR2NotificationAction({
      workspaceId: "workspace-2",
      consultantId: "consultant-2",
      notificationId: "notification-1",
      action: { type: "READ" },
      now,
    })).rejects.toBeInstanceOf(R2NotificationNotFoundError)
  })
})
