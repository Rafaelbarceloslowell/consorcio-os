import {
  CommercialActivityType,
  R2NotificationKind,
  TaskStatus,
} from "@/lib/generated/prisma/client"

import { prisma } from "@/infrastructure/prisma/client"

const TERMINAL_OUTCOMES = [
  "WON",
  "LOST_TO_COMPETITOR",
  "NO_FINANCIAL_CAPACITY",
  "NO_RESPONSE",
  "PRODUCT_NOT_SUITABLE",
  "TRUST_CONCERN",
  "CLIENT_WITHDREW",
  "CANCELLED_BY_CONSULTANT",
] as const

function notificationKind(type: CommercialActivityType | null): R2NotificationKind {
  switch (type) {
    case CommercialActivityType.CALLBACK:
      return R2NotificationKind.CALLBACK_DUE
    case CommercialActivityType.MEETING_PREP:
    case CommercialActivityType.MEETING_START:
      return R2NotificationKind.MEETING_SOON
    case CommercialActivityType.CALLBACK_RECOVERY:
    case CommercialActivityType.NO_SHOW_RECOVERY:
      return R2NotificationKind.RECOVERY_DUE
    case CommercialActivityType.STRATEGIC_FOLLOW_UP:
      return R2NotificationKind.FOLLOW_UP_OVERDUE
    case CommercialActivityType.R2_REVIEW:
      return R2NotificationKind.STALE_OPPORTUNITY
    default:
      return R2NotificationKind.ACTIVITY_DUE
  }
}

export async function getR2DailyMission(input: Readonly<{
  workspaceId: string
  consultantId: string
  now?: Date
}>) {
  const now = input.now ?? new Date()

  await prisma.$transaction(async (transaction) => {
    const stale = await transaction.commercialJourney.findMany({
      where: {
        workspaceId: input.workspaceId,
        consultantId: input.consultantId,
        closedAt: null,
        outcome: { notIn: [...TERMINAL_OUTCOMES] },
        tasks: { none: { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } } },
        commitments: { none: { status: "PENDING", dueAt: { gte: now } } },
        commercialEvents: {
          none: {
            type: "NOTE_ADDED",
            payload: {
              path: ["category"],
              equals: "do_not_contact",
            },
          },
        },
      },
      select: { id: true, title: true },
      take: 50,
    })

    for (const journey of stale) {
      const idempotencyKey = `stale:${journey.id}:r2-review`
      await transaction.task.upsert({
        where: {
          workspaceId_idempotencyKey: {
            workspaceId: input.workspaceId,
            idempotencyKey,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          opportunityId: journey.id,
          assignedToId: input.consultantId,
          title: "Revisar oportunidade sem próxima ação",
          description: "Oportunidade ativa sem atividade pendente, compromisso futuro ou espera explícita válida.",
          reason: "Invariant STALE_OPPORTUNITY detectado.",
          type: "FOLLOW_UP",
          executionType: CommercialActivityType.R2_REVIEW,
          channel: "SYSTEM",
          status: TaskStatus.PENDING,
          priority: "HIGH",
          dueAt: now,
          idempotencyKey,
        },
        update: {},
      })
    }

    const dueTasks = await transaction.task.findMany({
      where: {
        workspaceId: input.workspaceId,
        assignedToId: input.consultantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        dueAt: { lte: now },
        executionType: { not: null },
      },
      select: { id: true, title: true, reason: true, executionType: true },
      take: 100,
    })

    for (const task of dueTasks) {
      await transaction.r2Notification.upsert({
        where: { taskId: task.id },
        create: {
          workspaceId: input.workspaceId,
          consultantId: input.consultantId,
          taskId: task.id,
          kind: notificationKind(task.executionType),
          title: task.title,
          body: task.reason ?? "Existe uma ação comercial aguardando você.",
        },
        update: {},
      })
    }
  })

  const [tasks, commitments, meetings, notifications, totalActive] = await Promise.all([
    prisma.task.findMany({
      where: {
        workspaceId: input.workspaceId,
        assignedToId: input.consultantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        executionType: { not: null },
      },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
      take: 50,
      select: {
        id: true,
        opportunityId: true,
        title: true,
        reason: true,
        executionType: true,
        dueAt: true,
        priority: true,
        impactNumber: true,
      },
    }),
    prisma.commercialCommitment.count({
      where: { workspaceId: input.workspaceId, consultantId: input.consultantId, status: "PENDING" },
    }),
    prisma.meeting.count({
      where: { workspaceId: input.workspaceId, consultantId: input.consultantId, status: "SCHEDULED", startAt: { gte: now } },
    }),
    prisma.r2Notification.findMany({
      where: { workspaceId: input.workspaceId, consultantId: input.consultantId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, kind: true, title: true, body: true, createdAt: true },
    }),
    prisma.commercialJourney.count({
      where: { workspaceId: input.workspaceId, consultantId: input.consultantId, closedAt: null },
    }),
  ])

  const counts = tasks.reduce((summary, task) => {
    if (task.executionType === CommercialActivityType.NEW_LEAD_FIRST_CONTACT) summary.newLeads += 1
    if (task.executionType === CommercialActivityType.RESPONSE_CHECK) summary.checks += 1
    if (task.executionType === CommercialActivityType.CALLBACK_RECOVERY || task.executionType === CommercialActivityType.NO_SHOW_RECOVERY) summary.recoveries += 1
    if (task.executionType === CommercialActivityType.STRATEGIC_FOLLOW_UP || task.executionType === CommercialActivityType.PROPOSAL_FOLLOW_UP) summary.followUps += 1
    return summary
  }, { newLeads: 0, checks: 0, recoveries: 0, followUps: 0 })

  return {
    target: 50,
    totalActive,
    commitments,
    meetings,
    ...counts,
    now: tasks.filter((task) => task.dueAt <= now).map((task) => ({ ...task, dueAt: task.dueAt.toISOString() })),
    next: tasks.filter((task) => task.dueAt > now).map((task) => ({ ...task, dueAt: task.dueAt.toISOString() })),
    notifications: notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })),
  }
}
