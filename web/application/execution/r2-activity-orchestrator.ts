import {
  ACTIVE_WORKSET_TARGET,
  MEETING_NO_SHOW_GRACE_MINUTES,
  addBusinessHours,
  getImpactPolicy,
} from "./commercial-execution-policy"

export type ActivityType =
  | "NEW_LEAD_FIRST_CONTACT"
  | "CADENCE_WHATSAPP"
  | "CADENCE_CALL"
  | "RESPONSE_CHECK"
  | "CALLBACK"
  | "CALLBACK_RECOVERY"
  | "MEETING_PREP"
  | "MEETING_START"
  | "MEETING_OUTCOME_CHECK"
  | "NO_SHOW_RECOVERY"
  | "STRATEGIC_FOLLOW_UP"
  | "REACTIVATION_CONTEXT_REQUIRED"
  | "REACTIVATION_CONTACT"
  | "PROPOSAL_FOLLOW_UP"
  | "R2_REVIEW"

export type ActivityStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "SUPERSEDED"

export type ActivityChannel = "WHATSAPP" | "CALL" | "EMAIL" | "MEETING" | "SYSTEM"

export type ExecutionActivity = Readonly<{
  id: string
  workspaceId: string
  consultantId: string
  opportunityId: string
  type: ActivityType
  status: ActivityStatus
  dueAt: string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  channel: ActivityChannel
  cadenceInstanceId: string | null
  impactNumber: number | null
  commitmentId: string | null
  sourceEventId: string | null
  idempotencyKey: string
  reason: string
  createdAt: string
  completedAt: string | null
  cancelledAt: string | null
  supersededAt: string | null
}>

export type Commitment = Readonly<{
  id: string
  workspaceId: string
  opportunityId: string
  consultantId: string
  promisedBy: "CUSTOMER" | "CONSULTANT" | "BOTH"
  type: "CALLBACK" | "MEETING" | "SEND_PROPOSAL" | "SEND_DOCUMENT" | "FOLLOW_UP" | "OTHER"
  status: "PENDING" | "COMPLETED" | "MISSED" | "CANCELLED" | "RESCHEDULED"
  dueAt: string
  description: string
  sourceEventId: string
}>

type ActivityBase = Readonly<{
  workspaceId: string
  consultantId: string
  opportunityId: string
}>

function activityId(idempotencyKey: string): string {
  return `activity-${idempotencyKey.replace(/[^a-zA-Z0-9-]/g, "-")}`
}

function createActivity(
  base: ActivityBase,
  input: Omit<ExecutionActivity, keyof ActivityBase | "id" | "createdAt" | "completedAt" | "cancelledAt" | "supersededAt">,
  now: Date,
): ExecutionActivity {
  return {
    id: activityId(input.idempotencyKey),
    ...base,
    ...input,
    createdAt: now.toISOString(),
    completedAt: null,
    cancelledAt: null,
    supersededAt: null,
  }
}

export function startNewLeadCadence(
  base: ActivityBase,
  now: Date,
  cadenceInstanceId = `new-${base.opportunityId}-${now.toISOString()}`,
): ExecutionActivity {
  return createActivity(base, {
    type: "NEW_LEAD_FIRST_CONTACT",
    status: "PENDING",
    dueAt: now.toISOString(),
    priority: "HIGH",
    channel: "WHATSAPP",
    cadenceInstanceId,
    impactNumber: 1,
    commitmentId: null,
    sourceEventId: null,
    idempotencyKey: `${cadenceInstanceId}:impact:1`,
    reason: "Lead novo ainda sem primeiro contato.",
  }, now)
}

export function createReactivationContact(
  base: ActivityBase,
  now: Date,
  reactivationCycleId: string,
  contextState: "PROVIDED" | "NEVER_REPLIED" | "NO_PREVIOUS_CONVERSATION" | "PROVIDER_SYNCHRONIZED",
): ExecutionActivity {
  return createActivity(base, {
    type: "REACTIVATION_CONTACT",
    status: "PENDING",
    dueAt: now.toISOString(),
    priority: "HIGH",
    channel: "WHATSAPP",
    cadenceInstanceId: reactivationCycleId,
    impactNumber: 1,
    commitmentId: null,
    sourceEventId: null,
    idempotencyKey: `${reactivationCycleId}:contact`,
    reason: contextState === "NEVER_REPLIED"
      ? "Contato nunca respondeu; preparar primeira reativaÃ§Ã£o sem fabricar conversa anterior."
      : contextState === "NO_PREVIOUS_CONVERSATION"
        ? "NÃ£o houve conversa anterior; preparar abertura de reativaÃ§Ã£o sem inventar histÃ³rico."
        : "Contexto atual confirmado; usar o R2 Intelligence Core para preparar a reativaÃ§Ã£o.",
  }, now)
}

export function markImpactSent(
  activity: ExecutionActivity,
  now: Date,
): Readonly<{ completedImpact: ExecutionActivity; responseCheck: ExecutionActivity }> {
  if (activity.status !== "PENDING" && activity.status !== "IN_PROGRESS") {
    throw new Error("Somente um impacto pendente pode ser marcado como enviado.")
  }

  if (!activity.impactNumber || !activity.cadenceInstanceId) {
    throw new Error("A atividade não possui metadados de impacto e cadência.")
  }

  const policy = getImpactPolicy(activity.impactNumber)
  const completedImpact: ExecutionActivity = {
    ...activity,
    status: "COMPLETED",
    completedAt: now.toISOString(),
  }
  const dueAt = new Date(now.getTime() + policy.responseCheckMinutes * 60_000)
  const responseCheck = createActivity({
    workspaceId: activity.workspaceId,
    consultantId: activity.consultantId,
    opportunityId: activity.opportunityId,
  }, {
    type: "RESPONSE_CHECK",
    status: "PENDING",
    dueAt: dueAt.toISOString(),
    priority: "NORMAL",
    channel: "SYSTEM",
    cadenceInstanceId: activity.cadenceInstanceId,
    impactNumber: activity.impactNumber,
    commitmentId: null,
    sourceEventId: activity.sourceEventId,
    idempotencyKey: `${activity.cadenceInstanceId}:impact:${activity.impactNumber}:check`,
    reason: `Verificar o resultado do Impacto ${activity.impactNumber}/7.`,
  }, now)

  return { completedImpact, responseCheck }
}

export function markRecoveryMessageSent(
  activity: ExecutionActivity,
  now: Date,
  responseCheckMinutes = 240,
): Readonly<{ completedActivity: ExecutionActivity; responseCheck: ExecutionActivity }> {
  if (
    activity.type !== "CALLBACK_RECOVERY" &&
    activity.type !== "NO_SHOW_RECOVERY" &&
    activity.type !== "STRATEGIC_FOLLOW_UP"
  ) {
    throw new Error("Somente uma ação de recovery ou follow-up pode usar este check contextual.")
  }

  const completedActivity: ExecutionActivity = {
    ...activity,
    status: "COMPLETED",
    completedAt: now.toISOString(),
  }
  const responseCheck = createActivity({
    workspaceId: activity.workspaceId,
    consultantId: activity.consultantId,
    opportunityId: activity.opportunityId,
  }, {
    type: "RESPONSE_CHECK",
    status: "PENDING",
    dueAt: new Date(now.getTime() + responseCheckMinutes * 60_000).toISOString(),
    priority: "NORMAL",
    channel: "SYSTEM",
    cadenceInstanceId: null,
    impactNumber: null,
    commitmentId: activity.commitmentId,
    sourceEventId: activity.sourceEventId,
    idempotencyKey: `${activity.idempotencyKey}:check`,
    reason: "Verificar se houve resposta à abordagem contextual de recuperação.",
  }, now)

  return { completedActivity, responseCheck }
}

export function resolveNoResponse(
  check: ExecutionActivity,
  now: Date,
): Readonly<{
  completedCheck: ExecutionActivity
  nextActivity: ExecutionActivity | null
  cadenceCompleted: boolean
  outcome: "NO_RESPONSE_AFTER_CADENCE" | null
}> {
  if (check.type !== "RESPONSE_CHECK" || !check.impactNumber || !check.cadenceInstanceId) {
    throw new Error("Somente um check de resposta válido pode registrar ausência de resposta.")
  }

  const completedCheck: ExecutionActivity = {
    ...check,
    status: "COMPLETED",
    completedAt: now.toISOString(),
  }

  if (check.impactNumber >= 7) {
    return {
      completedCheck,
      nextActivity: null,
      cadenceCompleted: true,
      outcome: "NO_RESPONSE_AFTER_CADENCE",
    }
  }

  const nextNumber = check.impactNumber + 1
  const policy = getImpactPolicy(nextNumber)
  const dueAt = addBusinessHours(now, policy.delayAfterPreviousHours)
  const nextActivity = createActivity({
    workspaceId: check.workspaceId,
    consultantId: check.consultantId,
    opportunityId: check.opportunityId,
  }, {
    type: policy.channel === "CALL" ? "CADENCE_CALL" : "CADENCE_WHATSAPP",
    status: "PENDING",
    dueAt: dueAt.toISOString(),
    priority: nextNumber === 2 ? "HIGH" : "NORMAL",
    channel: policy.channel,
    cadenceInstanceId: check.cadenceInstanceId,
    impactNumber: nextNumber,
    commitmentId: null,
    sourceEventId: null,
    idempotencyKey: `${check.cadenceInstanceId}:impact:${nextNumber}`,
    reason: nextNumber === 2
      ? "Sem resposta ao WhatsApp inicial; realizar ligação como Impacto 2/7."
      : `Executar Impacto ${nextNumber}/7 na janela comercial configurada.`,
  }, now)

  return { completedCheck, nextActivity, cadenceCompleted: false, outcome: null }
}

export function resolveRecoveryNoResponse(
  check: ExecutionActivity,
  now: Date,
): Readonly<{ completedCheck: ExecutionActivity; nextActivity: ExecutionActivity }> {
  if (check.type !== "RESPONSE_CHECK" || check.impactNumber !== null) {
    throw new Error("O check informado não pertence a uma recuperação contextual.")
  }

  const completedCheck: ExecutionActivity = {
    ...check,
    status: "COMPLETED",
    completedAt: now.toISOString(),
  }
  const nextActivity = createActivity({
    workspaceId: check.workspaceId,
    consultantId: check.consultantId,
    opportunityId: check.opportunityId,
  }, {
    type: "STRATEGIC_FOLLOW_UP",
    status: "PENDING",
    dueAt: addBusinessHours(now, 24).toISOString(),
    priority: "NORMAL",
    channel: "WHATSAPP",
    cadenceInstanceId: null,
    impactNumber: null,
    commitmentId: check.commitmentId,
    sourceEventId: check.sourceEventId,
    idempotencyKey: `${check.idempotencyKey}:strategic-follow-up`,
    reason: "Não houve resposta ao recovery; retomar em janela futura com contexto, sem reiniciar cadência NEW.",
  }, now)

  return { completedCheck, nextActivity }
}

export function supersedeIncompatibleActivities(
  activities: readonly ExecutionActivity[],
  now: Date,
  reason: string,
): ExecutionActivity[] {
  return activities.map((activity) => {
    if (activity.status !== "PENDING" && activity.status !== "IN_PROGRESS") {
      return activity
    }

    return {
      ...activity,
      status: "SUPERSEDED" as const,
      reason,
      supersededAt: now.toISOString(),
    }
  })
}

export function createCommitmentActivity(
  commitment: Commitment,
  now: Date,
): ExecutionActivity {
  const type: ActivityType = commitment.type === "CALLBACK"
    ? "CALLBACK"
    : commitment.type === "MEETING"
      ? "MEETING_START"
      : commitment.type === "SEND_PROPOSAL"
        ? "PROPOSAL_FOLLOW_UP"
        : "STRATEGIC_FOLLOW_UP"

  return createActivity({
    workspaceId: commitment.workspaceId,
    consultantId: commitment.consultantId,
    opportunityId: commitment.opportunityId,
  }, {
    type,
    status: "PENDING",
    dueAt: commitment.dueAt,
    priority: "URGENT",
    channel: type === "CALLBACK" ? "CALL" : type === "MEETING_START" ? "MEETING" : "SYSTEM",
    cadenceInstanceId: null,
    impactNumber: null,
    commitmentId: commitment.id,
    sourceEventId: commitment.sourceEventId,
    idempotencyKey: `commitment:${commitment.id}:activity`,
    reason: `Compromisso explícito: ${commitment.description}`,
  }, now)
}

export function createMissedCallbackRecovery(
  callback: ExecutionActivity,
  now: Date,
): ExecutionActivity {
  if (callback.type !== "CALLBACK") {
    throw new Error("A recuperação de callback exige uma atividade CALLBACK.")
  }

  return createActivity({
    workspaceId: callback.workspaceId,
    consultantId: callback.consultantId,
    opportunityId: callback.opportunityId,
  }, {
    type: "CALLBACK_RECOVERY",
    status: "PENDING",
    dueAt: now.toISOString(),
    priority: "HIGH",
    channel: "WHATSAPP",
    cadenceInstanceId: null,
    impactNumber: null,
    commitmentId: callback.commitmentId,
    sourceEventId: callback.sourceEventId,
    idempotencyKey: `callback:${callback.commitmentId ?? callback.id}:recovery`,
    reason: "O cliente pediu o horário, o consultor ligou e não houve atendimento. Retomar sem tom acusatório ou falsa urgência.",
  }, now)
}

export function createMeetingActivities(
  base: ActivityBase,
  meetingId: string,
  startAt: Date,
  now: Date,
): ExecutionActivity[] {
  const prepAt = new Date(startAt.getTime() - 30 * 60_000)
  const startBriefingAt = new Date(startAt.getTime() - 5 * 60_000)
  const outcomeCheckAt = new Date(startAt.getTime() + MEETING_NO_SHOW_GRACE_MINUTES * 60_000)
  const entries: ReadonlyArray<[ActivityType, Date, "HIGH" | "URGENT", string]> = [
    ["MEETING_PREP", prepAt, "HIGH", "Preparar briefing com a memória viva da oportunidade."],
    ["MEETING_START", startBriefingAt, "URGENT", "Reunião começa em 5 minutos; abrir contexto atualizado."],
    ["MEETING_OUTCOME_CHECK", outcomeCheckAt, "HIGH", "Registrar comparecimento somente após a janela de tolerância."],
  ]

  return entries.map(([type, dueAt, priority, reason]) => createActivity(base, {
    type,
    status: "PENDING",
    dueAt: dueAt.toISOString(),
    priority,
    channel: type === "MEETING_PREP" ? "SYSTEM" : "MEETING",
    cadenceInstanceId: null,
    impactNumber: null,
    commitmentId: null,
    sourceEventId: meetingId,
    idempotencyKey: `meeting:${meetingId}:${startAt.toISOString()}:${type.toLowerCase()}`,
    reason,
  }, now))
}

export function createNoShowRecovery(
  base: ActivityBase,
  meetingId: string,
  now: Date,
): ExecutionActivity {
  return createActivity(base, {
    type: "NO_SHOW_RECOVERY",
    status: "PENDING",
    dueAt: now.toISOString(),
    priority: "HIGH",
    channel: "WHATSAPP",
    cadenceInstanceId: null,
    impactNumber: null,
    commitmentId: null,
    sourceEventId: meetingId,
    idempotencyKey: `meeting:${meetingId}:no-show-recovery`,
    reason: "A reunião não aconteceu; propor retomada contextual sem cobrança agressiva e sem retornar à cadência NEW.",
  }, now)
}

export type ReactivationContext = Readonly<{
  reactivationCycleId: string
  state: "PROVIDED" | "NEVER_REPLIED" | "NO_PREVIOUS_CONVERSATION" | "PROVIDER_SYNCHRONIZED"
}>

export function buildReactivationCycleId(
  opportunityId: string,
  approachUpdatedAt: Date,
  existingCycleCount: number,
): string {
  return `reactivation-${opportunityId}-${approachUpdatedAt.toISOString()}-${existingCycleCount + 1}`
}

export function resolveReactivationGate(input: Readonly<{
  approachType: "NEW" | "REACTIVATION"
  reactivationCycleId: string
  contexts: readonly ReactivationContext[]
  conversationContextSynchronized?: boolean
}>): Readonly<{ contextRequired: boolean; canRecommendMessage: boolean; reason: string }> {
  if (input.approachType !== "REACTIVATION") {
    return { contextRequired: false, canRecommendMessage: true, reason: "A oportunidade não está em reativação." }
  }

  if (input.conversationContextSynchronized) {
    return { contextRequired: false, canRecommendMessage: true, reason: "O provider oficial sincronizou o contexto atual." }
  }

  const currentCycleContext = input.contexts.find(
    (context) => context.reactivationCycleId === input.reactivationCycleId,
  )

  if (!currentCycleContext) {
    return {
      contextRequired: true,
      canRecommendMessage: false,
      reason: "Antes de reativar este contato, preciso saber onde a conversa parou.",
    }
  }

  return {
    contextRequired: false,
    canRecommendMessage: true,
    reason: currentCycleContext.state === "NEVER_REPLIED"
      ? "O consultor confirmou explicitamente que o contato nunca respondeu."
      : "O ciclo atual possui contexto confirmado.",
  }
}

export type WorksetCandidate = Readonly<{
  id: string
  workspaceId: string
  consultantId: string
  priorityScore: number
  hasActiveCommitment: boolean
  alreadyActive: boolean
  terminal: boolean
  doNotContact: boolean
}>

export function buildActiveWorkset(
  candidates: readonly WorksetCandidate[],
  workspaceId: string,
  consultantId: string,
  target = ACTIVE_WORKSET_TARGET,
): WorksetCandidate[] {
  const eligible = candidates.filter((candidate) =>
    candidate.workspaceId === workspaceId &&
    candidate.consultantId === consultantId &&
    !candidate.terminal &&
    !candidate.doNotContact,
  )
  const protectedActive = eligible.filter((candidate) => candidate.alreadyActive || candidate.hasActiveCommitment)
  const protectedIds = new Set(protectedActive.map((candidate) => candidate.id))
  const slots = Math.max(0, target - protectedActive.length)
  const additions = eligible
    .filter((candidate) => !protectedIds.has(candidate.id))
    .sort((first, second) => second.priorityScore - first.priorityScore)
    .slice(0, slots)

  return [...protectedActive, ...additions]
}

export function isStaleOpportunity(input: Readonly<{
  isClosed: boolean
  doNotContact: boolean
  inactive: boolean
  hasPendingActivity: boolean
  hasFutureCommitment: boolean
  hasExplicitWaitingState: boolean
}>): boolean {
  if (input.isClosed || input.doNotContact || input.inactive) {
    return false
  }

  return !input.hasPendingActivity && !input.hasFutureCommitment && !input.hasExplicitWaitingState
}

const ACTIVITY_PRIORITY: Record<ActivityType, number> = {
  R2_REVIEW: 100,
  CALLBACK: 95,
  MEETING_START: 95,
  NEW_LEAD_FIRST_CONTACT: 90,
  CALLBACK_RECOVERY: 80,
  NO_SHOW_RECOVERY: 80,
  RESPONSE_CHECK: 70,
  CADENCE_CALL: 65,
  CADENCE_WHATSAPP: 60,
  STRATEGIC_FOLLOW_UP: 55,
  PROPOSAL_FOLLOW_UP: 55,
  REACTIVATION_CONTEXT_REQUIRED: 45,
  REACTIVATION_CONTACT: 40,
  MEETING_PREP: 85,
  MEETING_OUTCOME_CHECK: 75,
}

export function prioritizeActivities(
  activities: readonly ExecutionActivity[],
): ExecutionActivity[] {
  return activities
    .filter((activity) => activity.status === "PENDING" || activity.status === "IN_PROGRESS")
    .sort((first, second) => {
      const typeDifference = ACTIVITY_PRIORITY[second.type] - ACTIVITY_PRIORITY[first.type]
      return typeDifference || first.dueAt.localeCompare(second.dueAt) || first.id.localeCompare(second.id)
    })
}

export function cancelAllOutreachForDoNotContact(
  activities: readonly ExecutionActivity[],
  now: Date,
): ExecutionActivity[] {
  return activities.map((activity) => {
    if (activity.status !== "PENDING" && activity.status !== "IN_PROGRESS") {
      return activity
    }

    return {
      ...activity,
      status: "CANCELLED" as const,
      cancelledAt: now.toISOString(),
      reason: "Contato bloqueado por solicitação inequívoca do cliente.",
    }
  })
}
