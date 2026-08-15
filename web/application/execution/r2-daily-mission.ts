import {
  CommercialActivityType,
  CommercialJourneyPriority,
  R2NotificationKind,
  TaskPriority,
  TaskStatus,
} from "@/lib/generated/prisma/client"

import { prisma } from "@/infrastructure/prisma/client"

import { buildR2ActionContext } from "./r2-action-context"

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

export function notificationPriority(
  taskPriority: TaskPriority,
  kind: R2NotificationKind,
  dueAt: Date,
  now: Date,
): CommercialJourneyPriority {
  if (kind === R2NotificationKind.MEETING_SOON || now.getTime() - dueAt.getTime() >= 60 * 60 * 1000) {
    return CommercialJourneyPriority.URGENT
  }
  if (taskPriority === TaskPriority.HIGH) return CommercialJourneyPriority.HIGH
  if (taskPriority === TaskPriority.LOW) return CommercialJourneyPriority.LOW
  return CommercialJourneyPriority.NORMAL
}

export function notificationTerminalState(task: Readonly<{
  status: TaskStatus
  cancelledAt: Date | null
  supersededAt: Date | null
  opportunity: { closedAt: Date | null } | null
}>): "RESOLVED" | "CANCELLED" | null {
  if (task.status === TaskStatus.COMPLETED) return "RESOLVED"
  if (
    task.status === TaskStatus.CANCELLED
    || task.cancelledAt !== null
    || task.supersededAt !== null
    || (task.opportunity !== null && task.opportunity.closedAt !== null)
  ) return "CANCELLED"
  return null
}

function notificationCopy(kind: R2NotificationKind): Readonly<{ title: string; body: string }> {
  switch (kind) {
    case R2NotificationKind.CALLBACK_DUE:
      return { title: "Callback pendente", body: "Abra o GorillaOS para retomar o compromisso comercial." }
    case R2NotificationKind.MEETING_SOON:
      return { title: "Reunião próxima", body: "Abra o GorillaOS para revisar a preparação da reunião." }
    case R2NotificationKind.RECOVERY_DUE:
      return { title: "Recovery pendente", body: "Abra o GorillaOS para revisar a próxima ação segura." }
    case R2NotificationKind.FOLLOW_UP_OVERDUE:
      return { title: "Follow-up pendente", body: "Abra o GorillaOS para continuar o acompanhamento." }
    case R2NotificationKind.STALE_OPPORTUNITY:
      return { title: "Oportunidade sem próxima ação", body: "Abra o GorillaOS para revisar a oportunidade." }
    default:
      return { title: "Ação comercial pendente", body: "Abra o GorillaOS para revisar a ação." }
  }
}

export async function getR2DailyMission(input: Readonly<{
  workspaceId: string
  consultantId: string
  now?: Date
}>) {
  const now = input.now ?? new Date()

  await prisma.$transaction(async (transaction) => {
    const activeNotifications = await transaction.r2Notification.findMany({
      where: {
        workspaceId: input.workspaceId,
        consultantId: input.consultantId,
        resolvedAt: null,
        cancelledAt: null,
      },
      select: {
        id: true,
        task: {
          select: {
            status: true,
            cancelledAt: true,
            supersededAt: true,
            opportunity: { select: { closedAt: true } },
          },
        },
      },
    })

    for (const notification of activeNotifications) {
      const terminalState = notificationTerminalState(notification.task)
      if (terminalState) {
        await transaction.r2Notification.update({
          where: { id: notification.id },
          data: terminalState === "RESOLVED" ? { resolvedAt: now } : { cancelledAt: now },
        })
      }
    }

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
            OR: [
              {
                payload: {
                  path: ["category"],
                  equals: "do_not_contact",
                },
              },
              {
                AND: [
                  {
                    payload: {
                      path: ["category"],
                      equals:
                        "r2_customer_boundary_detected",
                    },
                  },
                  {
                    payload: {
                      path: ["terminal"],
                      equals: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      select: { id: true },
      take: 50,
    })

    for (const journey of stale) {
      const idempotencyKey = `stale:${journey.id}:r2-review`
      await transaction.task.upsert({
        where: { workspaceId_idempotencyKey: { workspaceId: input.workspaceId, idempotencyKey } },
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
      select: {
        id: true,
        opportunityId: true,
        dueAt: true,
        priority: true,
        executionType: true,
      },
      take: 100,
    })

    for (const task of dueTasks) {
      const kind = notificationKind(task.executionType)
      const copy = notificationCopy(kind)
      const priority = notificationPriority(task.priority, kind, task.dueAt, now)
      const href = task.opportunityId
        ? `/opportunities/${encodeURIComponent(task.opportunityId)}#r2-action-controls`
        : "/"

      await transaction.r2Notification.upsert({
        where: { taskId: task.id },
        create: {
          workspaceId: input.workspaceId,
          consultantId: input.consultantId,
          taskId: task.id,
          kind,
          priority,
          title: copy.title,
          body: copy.body,
          href,
          originalDueAt: task.dueAt,
          deliveryDueAt: task.dueAt,
        },
        update: { kind, priority, title: copy.title, body: copy.body, href },
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
        description: true,
        reason: true,
        executionType: true,
        dueAt: true,
        priority: true,
        impactNumber: true,
        opportunity: {
          select: {
            title: true,
            lastInteractionAt: true,
            lead: { select: { name: true } },
            client: { select: { name: true } },
            currentPhase: { select: { name: true } },
            currentState: { select: { name: true } },
            conversationMemory: {
              select: {
                lastIncomingMessage: true,
                observedAt: true,
                analyzedAt: true,
              },
            },
            nextBestActions: {
              where: {
                acceptedAt: null,
                rejectedAt: null,
                executedActionId: null,
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
      },
    }),
    prisma.commercialCommitment.count({
      where: { workspaceId: input.workspaceId, consultantId: input.consultantId, status: "PENDING" },
    }),
    prisma.meeting.count({
      where: { workspaceId: input.workspaceId, consultantId: input.consultantId, status: "SCHEDULED", startAt: { gte: now } },
    }),
    prisma.r2Notification.findMany({
      where: {
        workspaceId: input.workspaceId,
        consultantId: input.consultantId,
        readAt: null,
        resolvedAt: null,
        cancelledAt: null,
        deliveryDueAt: { lte: now },
      },
      orderBy: [{ priority: "desc" }, { deliveryDueAt: "asc" }],
      take: 20,
      select: {
        id: true,
        taskId: true,
        kind: true,
        priority: true,
        title: true,
        body: true,
        href: true,
        originalDueAt: true,
        deliveryDueAt: true,
        snoozedUntil: true,
        nativeDeliveredAt: true,
        deliveryVersion: true,
        createdAt: true,
      },
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

  const missionTasks = tasks.map((task) => {
    const opportunity = task.opportunity
    const actionContext = task.opportunityId && opportunity
      ? buildR2ActionContext({
          actionId: task.id,
          opportunityId: task.opportunityId,
          personName: opportunity.lead?.name ?? opportunity.client?.name ?? opportunity.title,
          phaseName: opportunity.currentPhase.name,
          stateName: opportunity.currentState.name,
          taskTitle: task.title,
          taskDescription: task.description,
          taskReason: task.reason,
          r2Recommendation: opportunity.nextBestActions[0]?.description
            ?? opportunity.nextBestActions[0]?.title,
          lastRelevantInteraction: opportunity.conversationMemory?.lastIncomingMessage,
          lastInteractionAt: opportunity.conversationMemory?.observedAt
            ?? opportunity.conversationMemory?.analyzedAt
            ?? opportunity.lastInteractionAt,
          priority: task.priority,
          actionType: task.executionType,
          href: `/opportunities/${encodeURIComponent(task.opportunityId)}#r2-action-controls`,
        })
      : undefined

    return {
      id: task.id,
      opportunityId: task.opportunityId,
      title: task.title,
      reason: task.reason,
      executionType: task.executionType,
      dueAt: task.dueAt.toISOString(),
      priority: task.priority,
      impactNumber: task.impactNumber,
      actionContext,
    }
  })

  return {
    target: 50,
    totalActive,
    commitments,
    meetings,
    ...counts,
    now: missionTasks.filter((task) => new Date(task.dueAt) <= now),
    next: missionTasks.filter((task) => new Date(task.dueAt) > now),
    notifications: notifications.map((notification) => ({
      ...notification,
      originalDueAt: notification.originalDueAt.toISOString(),
      deliveryDueAt: notification.deliveryDueAt.toISOString(),
      snoozedUntil: notification.snoozedUntil?.toISOString() ?? null,
      nativeDeliveredAt: notification.nativeDeliveredAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    })),
  }
}
