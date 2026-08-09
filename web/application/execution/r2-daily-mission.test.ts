import {
  CommercialJourneyPriority,
  R2NotificationKind,
  TaskPriority,
  TaskStatus,
} from "@/lib/generated/prisma/client"
import { describe, expect, it } from "vitest"

import { notificationPriority, notificationTerminalState } from "./r2-daily-mission"

describe("R2 notification lifecycle", () => {
  const openTask = {
    status: TaskStatus.PENDING,
    cancelledAt: null,
    supersededAt: null,
    opportunity: { closedAt: null },
  }

  it("remove a notificação quando a tarefa é concluída", () => {
    expect(notificationTerminalState({ ...openTask, status: TaskStatus.COMPLETED })).toBe("RESOLVED")
  })

  it("remove a notificação após o guardrail de não contatar", () => {
    expect(notificationTerminalState({
      ...openTask,
      status: TaskStatus.CANCELLED,
      cancelledAt: new Date("2026-08-09T12:00:00.000Z"),
    })).toBe("CANCELLED")
  })

  it("remove a notificação quando a venda encerra a oportunidade", () => {
    expect(notificationTerminalState({
      ...openTask,
      opportunity: { closedAt: new Date("2026-08-09T12:00:00.000Z") },
    })).toBe("CANCELLED")
  })

  it("mantém tarefa aberta elegível", () => {
    expect(notificationTerminalState(openTask)).toBeNull()
    expect(notificationTerminalState({ ...openTask, opportunity: null })).toBeNull()
  })

  it("promove atraso relevante e reunião próxima para urgente", () => {
    const now = new Date("2026-08-09T15:00:00.000Z")
    expect(notificationPriority(
      TaskPriority.LOW,
      R2NotificationKind.ACTIVITY_DUE,
      new Date("2026-08-09T13:59:59.000Z"),
      now,
    )).toBe(CommercialJourneyPriority.URGENT)
    expect(notificationPriority(
      TaskPriority.LOW,
      R2NotificationKind.MEETING_SOON,
      now,
      now,
    )).toBe(CommercialJourneyPriority.URGENT)
  })
})
