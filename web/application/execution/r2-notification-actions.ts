import { prisma } from "@/infrastructure/prisma/client"

export type R2NotificationAction =
  | Readonly<{ type: "READ" }>
  | Readonly<{ type: "SNOOZE"; minutes: 10 | 30 }>
  | Readonly<{ type: "CLAIM"; deliveryVersion: number }>

export class R2NotificationNotFoundError extends Error {}

export async function executeR2NotificationAction(input: Readonly<{
  workspaceId: string
  consultantId: string
  notificationId: string
  action: R2NotificationAction
  now?: Date
}>): Promise<Readonly<{ claimed?: boolean }>> {
  const now = input.now ?? new Date()
  const notification = await prisma.r2Notification.findFirst({
    where: {
      id: input.notificationId,
      workspaceId: input.workspaceId,
      consultantId: input.consultantId,
      resolvedAt: null,
      cancelledAt: null,
    },
    select: { id: true },
  })

  if (!notification) throw new R2NotificationNotFoundError("Notificação não encontrada.")

  if (input.action.type === "READ") {
    await prisma.r2Notification.update({
      where: { id: notification.id },
      data: { readAt: now },
    })
    return {}
  }

  if (input.action.type === "SNOOZE") {
    const snoozedUntil = new Date(now.getTime() + input.action.minutes * 60 * 1000)
    await prisma.r2Notification.update({
      where: { id: notification.id },
      data: {
        snoozedUntil,
        deliveryDueAt: snoozedUntil,
        deliveryVersion: { increment: 1 },
        nativeDeliveredAt: null,
        readAt: null,
      },
    })
    return {}
  }

  const result = await prisma.r2Notification.updateMany({
    where: {
      id: notification.id,
      workspaceId: input.workspaceId,
      consultantId: input.consultantId,
      resolvedAt: null,
      cancelledAt: null,
      readAt: null,
      nativeDeliveredAt: null,
      deliveryDueAt: { lte: now },
      deliveryVersion: input.action.deliveryVersion,
    },
    data: { nativeDeliveredAt: now },
  })

  return { claimed: result.count === 1 }
}
