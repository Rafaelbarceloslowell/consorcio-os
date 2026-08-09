import {
  CommercialActivityChannel,
  CommercialActivityType,
  CommercialCommitmentParty,
  CommercialCommitmentStatus,
  CommercialCommitmentType,
  Prisma,
  ReactivationContextState,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/generated/prisma/client"

import { prisma } from "@/infrastructure/prisma/client"
import {
  createMeetingActivities,
  createMissedCallbackRecovery,
  createNoShowRecovery,
  markRecoveryMessageSent,
  markImpactSent,
  resolveNoResponse,
  resolveRecoveryNoResponse,
  startNewLeadCadence,
  type ExecutionActivity,
} from "./r2-activity-orchestrator"

type Transaction = Prisma.TransactionClient

const OPEN_TASK_STATUSES = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] as const

const taskTypeByExecutionType: Record<string, TaskType> = {
  NEW_LEAD_FIRST_CONTACT: TaskType.FOLLOW_UP,
  CADENCE_WHATSAPP: TaskType.FOLLOW_UP,
  CADENCE_CALL: TaskType.CALL,
  RESPONSE_CHECK: TaskType.FOLLOW_UP,
  CALLBACK: TaskType.CALL,
  CALLBACK_RECOVERY: TaskType.FOLLOW_UP,
  MEETING_PREP: TaskType.MEETING_PREP,
  MEETING_START: TaskType.MEETING_PREP,
  MEETING_OUTCOME_CHECK: TaskType.FOLLOW_UP,
  NO_SHOW_RECOVERY: TaskType.FOLLOW_UP,
  STRATEGIC_FOLLOW_UP: TaskType.FOLLOW_UP,
  REACTIVATION_CONTEXT_REQUIRED: TaskType.FOLLOW_UP,
  REACTIVATION_CONTACT: TaskType.FOLLOW_UP,
  PROPOSAL_FOLLOW_UP: TaskType.PROPOSAL_REVIEW,
  R2_REVIEW: TaskType.FOLLOW_UP,
}

const activityTypeToPrisma: Record<string, CommercialActivityType> = {
  NEW_LEAD_FIRST_CONTACT: CommercialActivityType.NEW_LEAD_FIRST_CONTACT,
  CADENCE_WHATSAPP: CommercialActivityType.CADENCE_WHATSAPP,
  CADENCE_CALL: CommercialActivityType.CADENCE_CALL,
  RESPONSE_CHECK: CommercialActivityType.RESPONSE_CHECK,
  CALLBACK: CommercialActivityType.CALLBACK,
  CALLBACK_RECOVERY: CommercialActivityType.CALLBACK_RECOVERY,
  MEETING_PREP: CommercialActivityType.MEETING_PREP,
  MEETING_START: CommercialActivityType.MEETING_START,
  MEETING_OUTCOME_CHECK: CommercialActivityType.MEETING_OUTCOME_CHECK,
  NO_SHOW_RECOVERY: CommercialActivityType.NO_SHOW_RECOVERY,
  STRATEGIC_FOLLOW_UP: CommercialActivityType.STRATEGIC_FOLLOW_UP,
  REACTIVATION_CONTEXT_REQUIRED: CommercialActivityType.REACTIVATION_CONTEXT_REQUIRED,
  REACTIVATION_CONTACT: CommercialActivityType.REACTIVATION_CONTACT,
  PROPOSAL_FOLLOW_UP: CommercialActivityType.PROPOSAL_FOLLOW_UP,
  R2_REVIEW: CommercialActivityType.R2_REVIEW,
}

const channelToPrisma: Record<string, CommercialActivityChannel> = {
  WHATSAPP: CommercialActivityChannel.WHATSAPP,
  CALL: CommercialActivityChannel.CALL,
  EMAIL: CommercialActivityChannel.EMAIL,
  MEETING: CommercialActivityChannel.MEETING,
  SYSTEM: CommercialActivityChannel.SYSTEM,
}

const priorityToPrisma: Record<string, TaskPriority> = {
  LOW: TaskPriority.LOW,
  NORMAL: TaskPriority.MEDIUM,
  HIGH: TaskPriority.HIGH,
  URGENT: TaskPriority.HIGH,
}

function taskTitle(activity: ExecutionActivity): string {
  const labels: Record<string, string> = {
    NEW_LEAD_FIRST_CONTACT: "Fazer primeiro contato",
    CADENCE_WHATSAPP: `Enviar mensagem — Impacto ${activity.impactNumber}/7`,
    CADENCE_CALL: `Realizar ligação — Impacto ${activity.impactNumber}/7`,
    RESPONSE_CHECK: `Verificar resposta — Impacto ${activity.impactNumber}/7`,
    CALLBACK: "Realizar callback combinado",
    CALLBACK_RECOVERY: "Recuperar callback não atendido",
    MEETING_PREP: "Preparar reunião",
    MEETING_START: "Abrir briefing da reunião",
    MEETING_OUTCOME_CHECK: "Registrar resultado da reunião",
    NO_SHOW_RECOVERY: "Recuperar reunião não realizada",
    STRATEGIC_FOLLOW_UP: "Executar follow-up estratégico",
    REACTIVATION_CONTEXT_REQUIRED: "Informar contexto atual da reativação",
    REACTIVATION_CONTACT: "Executar abordagem de reativação",
    PROPOSAL_FOLLOW_UP: "Cumprir compromisso da proposta",
    R2_REVIEW: "Revisar oportunidade sem próxima ação",
  }

  return labels[activity.type] ?? activity.reason
}

function activityCreateData(activity: ExecutionActivity): Prisma.TaskUncheckedCreateInput {
  return {
    id: activity.id,
    workspaceId: activity.workspaceId,
    title: taskTitle(activity),
    description: activity.reason,
    type: taskTypeByExecutionType[activity.type],
    status: TaskStatus.PENDING,
    priority: priorityToPrisma[activity.priority],
    dueAt: new Date(activity.dueAt),
    assignedToId: activity.consultantId,
    opportunityId: activity.opportunityId,
    executionType: activityTypeToPrisma[activity.type],
    channel: channelToPrisma[activity.channel],
    cadenceInstanceId: activity.cadenceInstanceId,
    impactNumber: activity.impactNumber,
    commitmentId: activity.commitmentId,
    sourceEventId: activity.sourceEventId,
    idempotencyKey: activity.idempotencyKey,
    reason: activity.reason,
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(activity.createdAt),
  }
}

async function createActivityIdempotently(
  transaction: Transaction,
  activity: ExecutionActivity,
): Promise<void> {
  await transaction.task.upsert({
    where: {
      workspaceId_idempotencyKey: {
        workspaceId: activity.workspaceId,
        idempotencyKey: activity.idempotencyKey,
      },
    },
    create: activityCreateData(activity),
    update: {},
  })
}

function persistedTaskToActivity(task: {
  id: string
  workspaceId: string
  assignedToId: string
  opportunityId: string | null
  executionType: CommercialActivityType | null
  status: TaskStatus
  dueAt: Date
  priority: TaskPriority
  channel: CommercialActivityChannel | null
  cadenceInstanceId: string | null
  impactNumber: number | null
  commitmentId: string | null
  sourceEventId: string | null
  idempotencyKey: string | null
  reason: string | null
  createdAt: Date
  completedAt: Date | null
  cancelledAt: Date | null
  supersededAt: Date | null
}): ExecutionActivity {
  if (!task.opportunityId || !task.executionType || !task.channel || !task.idempotencyKey) {
    throw new Error("A tarefa não possui metadados de execução comercial.")
  }

  return {
    id: task.id,
    workspaceId: task.workspaceId,
    consultantId: task.assignedToId,
    opportunityId: task.opportunityId,
    type: task.executionType as ExecutionActivity["type"],
    status: task.supersededAt
      ? "SUPERSEDED"
      : task.status === TaskStatus.COMPLETED
        ? "COMPLETED"
        : task.status === TaskStatus.CANCELLED
          ? "CANCELLED"
          : task.status === TaskStatus.IN_PROGRESS
            ? "IN_PROGRESS"
            : "PENDING",
    dueAt: task.dueAt.toISOString(),
    priority: task.priority === TaskPriority.HIGH ? "HIGH" : task.priority === TaskPriority.LOW ? "LOW" : "NORMAL",
    channel: task.channel as ExecutionActivity["channel"],
    cadenceInstanceId: task.cadenceInstanceId,
    impactNumber: task.impactNumber,
    commitmentId: task.commitmentId,
    sourceEventId: task.sourceEventId,
    idempotencyKey: task.idempotencyKey,
    reason: task.reason ?? "Ação comercial persistida.",
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt?.toISOString() ?? null,
    cancelledAt: task.cancelledAt?.toISOString() ?? null,
    supersededAt: task.supersededAt?.toISOString() ?? null,
  }
}

export async function ensureOpportunityExecutionState(input: Readonly<{
  workspaceId: string
  opportunityId: string
  now?: Date
}>): Promise<void> {
  const now = input.now ?? new Date()

  await prisma.$transaction(async (transaction) => {
    const journey = await transaction.commercialJourney.findFirst({
      where: { id: input.opportunityId, workspaceId: input.workspaceId, closedAt: null },
      select: {
        id: true,
        consultantId: true,
        lead: { select: { approachType: true } },
        tasks: {
          where: { status: { in: [...OPEN_TASK_STATUSES] } },
          select: { id: true },
          take: 1,
        },
        commitments: {
          where: { status: CommercialCommitmentStatus.PENDING, dueAt: { gte: now } },
          select: { id: true },
          take: 1,
        },
        commercialEvents: {
          where: {
            type: "NOTE_ADDED",
            payload: {
              path: ["category"],
              equals: "do_not_contact",
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    })

    if (
      !journey ||
      journey.tasks.length > 0 ||
      journey.commitments.length > 0 ||
      journey.commercialEvents.length > 0
    ) {
      return
    }

    const isReactivation = journey.lead?.approachType === "REACTIVATION"
    const cycleId = `reactivation-${journey.id}-${now.toISOString().slice(0, 10)}`
    const activity = isReactivation
      ? {
          ...startNewLeadCadence({
            workspaceId: input.workspaceId,
            consultantId: journey.consultantId,
            opportunityId: journey.id,
          }, now, cycleId),
          type: "REACTIVATION_CONTEXT_REQUIRED" as const,
          channel: "SYSTEM" as const,
          impactNumber: null,
          idempotencyKey: `${cycleId}:context-required`,
          reason: "Antes de reativar este contato, preciso saber onde a conversa parou.",
        }
      : startNewLeadCadence({
          workspaceId: input.workspaceId,
          consultantId: journey.consultantId,
          opportunityId: journey.id,
        }, now)

    await createActivityIdempotently(transaction, activity)
  })
}

export async function getOpportunityExecutionView(input: Readonly<{
  workspaceId: string
  opportunityId: string
  now?: Date
}>) {
  const now = input.now ?? new Date()
  await ensureOpportunityExecutionState(input)

  const journey = await prisma.commercialJourney.findFirst({
    where: { id: input.opportunityId, workspaceId: input.workspaceId },
    select: {
      id: true,
      consultantId: true,
      closedAt: true,
      outcome: true,
      lead: { select: { approachType: true } },
      tasks: {
        where: { status: { in: [...OPEN_TASK_STATUSES] } },
        orderBy: [{ dueAt: "asc" }, { priority: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          executionType: true,
          channel: true,
          dueAt: true,
          priority: true,
          impactNumber: true,
          cadenceInstanceId: true,
          commitmentId: true,
          reason: true,
        },
      },
      commitments: {
        where: { status: CommercialCommitmentStatus.PENDING },
        orderBy: { dueAt: "asc" },
        select: { id: true, promisedBy: true, type: true, dueAt: true, description: true },
      },
      reactivationContexts: {
        orderBy: { providedAt: "desc" },
        take: 1,
        select: { reactivationCycleId: true, contextState: true, providedAt: true },
      },
    },
  })

  if (!journey) {
    throw new Error("Oportunidade não encontrada no workspace autenticado.")
  }

  const activity = journey.tasks[0] ?? null
  const contextRequired = activity?.executionType === CommercialActivityType.REACTIVATION_CONTEXT_REQUIRED

  return {
    mode: "MANUAL_MESSAGING_MODE" as const,
    now: now.toISOString(),
    activity: activity
      ? {
          ...activity,
          dueAt: activity.dueAt.toISOString(),
          due: activity.dueAt.getTime() <= now.getTime(),
        }
      : null,
    commitments: journey.commitments.map((commitment) => ({
      ...commitment,
      dueAt: commitment.dueAt.toISOString(),
    })),
    reactivation: {
      contextRequired,
      canRecommendMessage: !contextRequired,
      latestContext: journey.reactivationContexts[0]
        ? {
            ...journey.reactivationContexts[0],
            providedAt: journey.reactivationContexts[0].providedAt.toISOString(),
          }
        : null,
    },
  }
}

export type ExecutionCommand =
  | { type: "MESSAGE_SENT"; activityId: string }
  | { type: "NO_RESPONSE"; activityId: string }
  | { type: "REPLIED"; activityId: string; context: string }
  | { type: "CALL_NO_ANSWER"; activityId: string }
  | { type: "CALL_ANSWERED"; activityId: string; context: string }
  | { type: "CALLBACK_ANSWERED"; activityId: string; context: string }
  | { type: "REACTIVATION_CONTEXT"; activityId: string; cycleId: string; context: string }
  | { type: "NEVER_REPLIED"; activityId: string; cycleId: string }
  | { type: "NO_PREVIOUS_CONVERSATION"; activityId: string; cycleId: string }
  | { type: "SCHEDULE_CALLBACK"; dueAt: string; description: string; promisedBy: "CUSTOMER" | "CONSULTANT" | "BOTH"; sourceEventId: string }
  | { type: "CALLBACK_NO_ANSWER"; activityId: string }
  | { type: "DO_NOT_CONTACT" }

async function supersedeOpenTasks(
  transaction: Transaction,
  workspaceId: string,
  opportunityId: string,
  now: Date,
  reason: string,
  exceptTaskId?: string,
): Promise<void> {
  await transaction.task.updateMany({
    where: {
      workspaceId,
      opportunityId,
      status: { in: [...OPEN_TASK_STATUSES] },
      ...(exceptTaskId ? { id: { not: exceptTaskId } } : {}),
    },
    data: {
      status: TaskStatus.CANCELLED,
      cancelledAt: now,
      supersededAt: now,
      reason,
    },
  })
}

async function recordExecutionTelemetry(
  transaction: Transaction,
  input: Readonly<{
    workspaceId: string
    opportunityId: string
    consultantId: string
    category: string
    activity?: ExecutionActivity
    result: string
    occurredAt: Date
    extra?: Prisma.InputJsonObject
  }>,
): Promise<void> {
  await transaction.commercialEvent.create({
    data: {
      workspaceId: input.workspaceId,
      journeyId: input.opportunityId,
      type: "NOTE_ADDED",
      actorType: "CONSULTANT",
      actorId: input.consultantId,
      payload: {
        category: input.category,
        approachType: input.activity?.cadenceInstanceId?.startsWith("new-") ? "NEW" : null,
        activityType: input.activity?.type ?? null,
        channel: input.activity?.channel ?? null,
        impactNumber: input.activity?.impactNumber ?? null,
        cadenceInstanceId: input.activity?.cadenceInstanceId ?? null,
        commitmentId: input.activity?.commitmentId ?? null,
        sentAt: input.result === "MESSAGE_SENT" ? input.occurredAt.toISOString() : null,
        result: input.result,
        ...input.extra,
      },
      occurredAt: input.occurredAt,
    },
  })
}

export async function executeOpportunityCommand(input: Readonly<{
  workspaceId: string
  opportunityId: string
  consultantId: string
  command: ExecutionCommand
  now?: Date
}>) {
  const now = input.now ?? new Date()

  await prisma.$transaction(async (transaction) => {
    const journey = await transaction.commercialJourney.findFirst({
      where: {
        id: input.opportunityId,
        workspaceId: input.workspaceId,
        consultantId: input.consultantId,
        closedAt: null,
      },
      select: { id: true, consultantId: true },
    })

    if (!journey) {
      throw new Error("Oportunidade ativa não encontrada para o consultor autenticado.")
    }

    if (input.command.type === "DO_NOT_CONTACT") {
      await supersedeOpenTasks(transaction, input.workspaceId, input.opportunityId, now, "Contato interrompido por solicitação inequívoca do cliente.")
      await transaction.commercialEvent.create({
        data: {
          workspaceId: input.workspaceId,
          journeyId: input.opportunityId,
          type: "NOTE_ADDED",
          actorType: "CONSULTANT",
          actorId: input.consultantId,
          payload: { category: "do_not_contact", outreachCancelled: true },
          occurredAt: now,
        },
      })
      return
    }

    if (input.command.type === "SCHEDULE_CALLBACK") {
      const dueAt = new Date(input.command.dueAt)
      if (Number.isNaN(dueAt.getTime()) || dueAt <= now) {
        throw new Error("O callback precisa possuir data futura válida.")
      }
      const commitmentId = `commitment-${globalThis.crypto.randomUUID()}`
      const commitment = await transaction.commercialCommitment.upsert({
        where: {
          workspaceId_sourceEventId: {
            workspaceId: input.workspaceId,
            sourceEventId: input.command.sourceEventId,
          },
        },
        create: {
          id: commitmentId,
          workspaceId: input.workspaceId,
          opportunityId: input.opportunityId,
          consultantId: input.consultantId,
          promisedBy: CommercialCommitmentParty[input.command.promisedBy],
          type: CommercialCommitmentType.CALLBACK,
          status: CommercialCommitmentStatus.PENDING,
          dueAt,
          description: input.command.description.trim(),
          sourceEventId: input.command.sourceEventId,
        },
        update: {},
      })
      await supersedeOpenTasks(transaction, input.workspaceId, input.opportunityId, now, "Callback explícito substituiu a cadência genérica.")
      const callback = {
        ...startNewLeadCadence({
          workspaceId: input.workspaceId,
          consultantId: input.consultantId,
          opportunityId: input.opportunityId,
        }, now, `callback-${commitment.id}`),
        type: "CALLBACK" as const,
        channel: "CALL" as const,
        dueAt: dueAt.toISOString(),
        impactNumber: null,
        commitmentId: commitment.id,
        sourceEventId: input.command.sourceEventId,
        priority: "URGENT" as const,
        idempotencyKey: `commitment:${commitment.id}:activity`,
        reason: `Compromisso explícito: ${commitment.description}`,
      }
      await createActivityIdempotently(transaction, callback)
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_callback_scheduled",
        result: "CALLBACK_REQUESTED",
        occurredAt: now,
        extra: { callbackRequested: true, dueAt: dueAt.toISOString(), commitmentId: commitment.id },
      })
      return
    }

    const task = await transaction.task.findFirst({
      where: {
        id: input.command.activityId,
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        assignedToId: input.consultantId,
        status: { in: [...OPEN_TASK_STATUSES] },
      },
    })
    if (!task) {
      throw new Error("Atividade já processada ou indisponível.")
    }
    const activity = persistedTaskToActivity(task)

    if (input.command.type === "MESSAGE_SENT") {
      const responseCheck = activity.impactNumber
        ? markImpactSent(activity, now).responseCheck
        : markRecoveryMessageSent(activity, now).responseCheck
      const completed = await transaction.task.updateMany({
        where: { id: task.id, workspaceId: input.workspaceId, status: { in: [...OPEN_TASK_STATUSES] } },
        data: { status: TaskStatus.COMPLETED, completedAt: now },
      })
      if (completed.count !== 1) {
        throw new Error("A atividade já foi concluída por outra requisição.")
      }
      await createActivityIdempotently(transaction, responseCheck)
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_activity_outcome",
        activity,
        result: "MESSAGE_SENT",
        occurredAt: now,
      })
      return
    }

    if (input.command.type === "NO_RESPONSE") {
      const result = activity.impactNumber
        ? resolveNoResponse(activity, now)
        : {
            ...resolveRecoveryNoResponse(activity, now),
            cadenceCompleted: false,
            outcome: null,
          }
      await transaction.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.COMPLETED, completedAt: now },
      })
      if (result.nextActivity) {
        await createActivityIdempotently(transaction, result.nextActivity)
      }
      if (result.cadenceCompleted) {
        await transaction.commercialEvent.create({
          data: {
            workspaceId: input.workspaceId,
            journeyId: input.opportunityId,
            type: "NOTE_ADDED",
            actorType: "SYSTEM",
            payload: { category: "NO_RESPONSE_AFTER_CADENCE", impactNumber: 7 },
            occurredAt: now,
          },
        })
      }
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_activity_outcome",
        activity,
        result: "NO_RESPONSE",
        occurredAt: now,
      })
      return
    }

    if (input.command.type === "CALL_NO_ANSWER") {
      if (activity.type !== "CADENCE_CALL") {
        throw new Error("A atividade informada não é uma ligação da cadência.")
      }
      const { responseCheck } = markImpactSent(activity, now)
      await transaction.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.COMPLETED, completedAt: now },
      })
      await createActivityIdempotently(transaction, responseCheck)
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_call_outcome",
        activity,
        result: "NO_ANSWER",
        occurredAt: now,
      })
      return
    }

    if (
      input.command.type === "REPLIED" ||
      input.command.type === "CALL_ANSWERED" ||
      input.command.type === "CALLBACK_ANSWERED"
    ) {
      if (!input.command.context.trim()) {
        throw new Error("Cole o contexto atual da resposta antes de continuar.")
      }
      await transaction.task.update({ where: { id: task.id }, data: { status: TaskStatus.COMPLETED, completedAt: now } })
      await supersedeOpenTasks(transaction, input.workspaceId, input.opportunityId, now, "A resposta do cliente invalidou a cadência anterior.", task.id)
      await transaction.commercialConversationMemory.upsert({
        where: { journeyId: input.opportunityId },
        create: {
          workspaceId: input.workspaceId,
          journeyId: input.opportunityId,
          stage: "DISCOVERY",
          goal: "UNDERSTAND_PROJECT_PURPOSE",
          lastIncomingMessage: input.command.context.trim(),
          narrativeSummary: "Cliente respondeu; o R2 deve recalcular a próxima ação a partir do contexto atual.",
          factProvenance: { lastIncomingMessage: "manual_context" },
          observedAt: now,
          analyzedAt: now,
        },
        update: {
          lastIncomingMessage: input.command.context.trim(),
          narrativeSummary: "Cliente respondeu; o R2 deve recalcular a próxima ação a partir do contexto atual.",
          factProvenance: { lastIncomingMessage: "manual_context" },
          observedAt: now,
          analyzedAt: now,
        },
      })
      const review = {
        ...startNewLeadCadence({ workspaceId: input.workspaceId, consultantId: input.consultantId, opportunityId: input.opportunityId }, now, `reply-${task.id}`),
        type: "R2_REVIEW" as const,
        channel: "SYSTEM" as const,
        impactNumber: null,
        idempotencyKey: `reply:${task.id}:r2-review`,
        reason: "Cliente respondeu e aguarda análise do R2 com contexto atual.",
      }
      await createActivityIdempotently(transaction, review)
      if (input.command.type === "CALLBACK_ANSWERED" && task.commitmentId) {
        await transaction.commercialCommitment.updateMany({
          where: {
            id: task.commitmentId,
            workspaceId: input.workspaceId,
            status: CommercialCommitmentStatus.PENDING,
          },
          data: {
            status: CommercialCommitmentStatus.COMPLETED,
            completedAt: now,
          },
        })
      }
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_activity_outcome",
        activity,
        result: input.command.type === "REPLIED" ? "REPLIED" : "ANSWERED",
        occurredAt: now,
        extra: {
          responseAt: now.toISOString(),
          callbackAttended:
            input.command.type === "CALLBACK_ANSWERED" ? true : null,
        },
      })
      return
    }

    if (
      input.command.type === "REACTIVATION_CONTEXT" ||
      input.command.type === "NEVER_REPLIED" ||
      input.command.type === "NO_PREVIOUS_CONVERSATION"
    ) {
      const contextState = input.command.type === "NEVER_REPLIED"
        ? ReactivationContextState.NEVER_REPLIED
        : input.command.type === "NO_PREVIOUS_CONVERSATION"
          ? ReactivationContextState.NO_PREVIOUS_CONVERSATION
        : ReactivationContextState.PROVIDED
      const contextSummary = input.command.type === "REACTIVATION_CONTEXT"
        ? input.command.context.trim()
        : null
      if (input.command.type === "REACTIVATION_CONTEXT" && !contextSummary) {
        throw new Error("O contexto atual é obrigatório.")
      }
      await transaction.reactivationContext.upsert({
        where: {
          workspaceId_opportunityId_reactivationCycleId: {
            workspaceId: input.workspaceId,
            opportunityId: input.opportunityId,
            reactivationCycleId: input.command.cycleId,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          opportunityId: input.opportunityId,
          consultantId: input.consultantId,
          reactivationCycleId: input.command.cycleId,
          contextState,
          contextSummary,
          providedAt: now,
        },
        update: { contextState, contextSummary, providedAt: now },
      })
      await transaction.task.update({ where: { id: task.id }, data: { status: TaskStatus.COMPLETED, completedAt: now } })
      const contact = {
        ...startNewLeadCadence({ workspaceId: input.workspaceId, consultantId: input.consultantId, opportunityId: input.opportunityId }, now, input.command.cycleId),
        type: "REACTIVATION_CONTACT" as const,
        idempotencyKey: `${input.command.cycleId}:contact`,
        reason: contextState === ReactivationContextState.NEVER_REPLIED
          ? "Contato nunca respondeu; preparar primeira reativação sem fabricar conversa anterior."
          : contextState === ReactivationContextState.NO_PREVIOUS_CONVERSATION
            ? "Não houve conversa anterior; preparar abertura de reativação sem inventar histórico."
          : "Contexto atual confirmado; usar o R2 Intelligence Core para preparar a reativação.",
      }
      await createActivityIdempotently(transaction, contact)
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_reactivation_context",
        activity,
        result: contextState,
        occurredAt: now,
        extra: { reactivationCycleId: input.command.cycleId },
      })
      return
    }

    if (input.command.type === "CALLBACK_NO_ANSWER") {
      const recovery = createMissedCallbackRecovery(activity, now)
      await transaction.task.update({ where: { id: task.id }, data: { status: TaskStatus.COMPLETED, completedAt: now } })
      if (task.commitmentId) {
        await transaction.commercialCommitment.updateMany({
          where: { id: task.commitmentId, workspaceId: input.workspaceId, status: CommercialCommitmentStatus.PENDING },
          data: { status: CommercialCommitmentStatus.MISSED, missedAt: now },
        })
      }
      await createActivityIdempotently(transaction, recovery)
      await recordExecutionTelemetry(transaction, {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        category: "r2_callback_outcome",
        activity,
        result: "NO_ANSWER",
        occurredAt: now,
        extra: { callbackAttended: false },
      })
    }
  })

  return getOpportunityExecutionView(input)
}

export async function scheduleMeetingExecution(input: Readonly<{
  workspaceId: string
  opportunityId: string
  consultantId: string
  meetingId: string
  startAt: Date
  now?: Date
}>): Promise<void> {
  const now = input.now ?? new Date()
  const activities = createMeetingActivities(input, input.meetingId, input.startAt, now)
  await prisma.$transaction(async (transaction) => {
    await supersedeOpenTasks(transaction, input.workspaceId, input.opportunityId, now, "Reunião agendada; a cadência genérica perdeu prioridade.")
    const commitment = await transaction.commercialCommitment.upsert({
      where: {
        workspaceId_sourceEventId: {
          workspaceId: input.workspaceId,
          sourceEventId: `meeting:${input.meetingId}`,
        },
      },
      create: {
        workspaceId: input.workspaceId,
        opportunityId: input.opportunityId,
        consultantId: input.consultantId,
        promisedBy: CommercialCommitmentParty.BOTH,
        type: CommercialCommitmentType.MEETING,
        dueAt: input.startAt,
        description: "Reunião comercial agendada.",
        sourceEventId: `meeting:${input.meetingId}`,
      },
      update: {
        status: CommercialCommitmentStatus.PENDING,
        dueAt: input.startAt,
        rescheduledAt: now,
      },
    })
    for (const activity of activities) {
      await createActivityIdempotently(transaction, {
        ...activity,
        commitmentId: commitment.id,
      })
    }
  })
}

export async function registerMeetingNoShowExecution(input: Readonly<{
  workspaceId: string
  opportunityId: string
  consultantId: string
  meetingId: string
  now?: Date
}>): Promise<void> {
  const now = input.now ?? new Date()
  const recovery = createNoShowRecovery(input, input.meetingId, now)
  await prisma.$transaction(async (transaction) => {
    await supersedeOpenTasks(transaction, input.workspaceId, input.opportunityId, now, "Reunião marcada como não realizada; iniciar recovery contextual.")
    await createActivityIdempotently(transaction, recovery)
  })
}
