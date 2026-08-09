import { describe, expect, it } from "vitest"

import {
  buildReactivationCycleId,
  buildActiveWorkset,
  cancelAllOutreachForDoNotContact,
  createCommitmentActivity,
  createMeetingActivities,
  createMissedCallbackRecovery,
  createNoShowRecovery,
  isStaleOpportunity,
  markImpactSent,
  markRecoveryMessageSent,
  prioritizeActivities,
  resolveNoResponse,
  resolveRecoveryNoResponse,
  resolveReactivationGate,
  startNewLeadCadence,
  supersedeIncompatibleActivities,
  type Commitment,
  type ExecutionActivity,
} from "./r2-activity-orchestrator"

const now = new Date("2026-08-10T12:00:00.000Z")
const base = {
  workspaceId: "workspace-a",
  consultantId: "consultant-a",
  opportunityId: "opportunity-a",
}

function pending(overrides: Partial<ExecutionActivity> = {}): ExecutionActivity {
  return {
    ...startNewLeadCadence(base, now, "cadence-a"),
    ...overrides,
  }
}

describe("R2ActivityOrchestrator", () => {
  it("inicia lead novo com primeiro contato WhatsApp prioritário", () => {
    const activity = startNewLeadCadence(base, now, "cadence-a")

    expect(activity.type).toBe("NEW_LEAD_FIRST_CONTACT")
    expect(activity.channel).toBe("WHATSAPP")
    expect(activity.impactNumber).toBe(1)
    expect(activity.dueAt).toBe(now.toISOString())
  })

  it("cria check persistível cinco minutos após o primeiro impacto", () => {
    const result = markImpactSent(pending(), now)

    expect(result.completedImpact.status).toBe("COMPLETED")
    expect(result.responseCheck.type).toBe("RESPONSE_CHECK")
    expect(result.responseCheck.dueAt).toBe("2026-08-10T12:05:00.000Z")
  })

  it("não conta check como novo impacto", () => {
    const { responseCheck } = markImpactSent(pending(), now)

    expect(responseCheck.impactNumber).toBe(1)
    expect(responseCheck.type).toBe("RESPONSE_CHECK")
  })

  it("promove ligação como impacto 2 após primeiro check sem resposta", () => {
    const { responseCheck } = markImpactSent(pending(), now)
    const result = resolveNoResponse(responseCheck, new Date("2026-08-10T12:05:00.000Z"))

    expect(result.nextActivity?.type).toBe("CADENCE_CALL")
    expect(result.nextActivity?.impactNumber).toBe(2)
    expect(result.nextActivity?.priority).toBe("HIGH")
  })

  it("encerra o ciclo após o check do impacto 7", () => {
    const result = resolveNoResponse(pending({
      type: "RESPONSE_CHECK",
      channel: "SYSTEM",
      impactNumber: 7,
    }), now)

    expect(result.cadenceCompleted).toBe(true)
    expect(result.nextActivity).toBeNull()
    expect(result.outcome).toBe("NO_RESPONSE_AFTER_CADENCE")
  })

  it("mantém idempotência por ciclo e número do impacto", () => {
    const first = startNewLeadCadence(base, now, "cadence-a")
    const duplicate = startNewLeadCadence(base, now, "cadence-a")

    expect(first.idempotencyKey).toBe(duplicate.idempotencyKey)
    expect(first.id).toBe(duplicate.id)
  })

  it("supersede atividades incompatíveis quando chega resposta", () => {
    const result = supersedeIncompatibleActivities([pending()], now, "Cliente respondeu.")

    expect(result[0].status).toBe("SUPERSEDED")
    expect(result[0].supersededAt).toBe(now.toISOString())
  })

  it("não altera atividade já concluída ao recalcular", () => {
    const completed = pending({ status: "COMPLETED", completedAt: now.toISOString() })
    expect(supersedeIncompatibleActivities([completed], now, "novo evento")[0]).toEqual(completed)
  })

  it("prioriza compromisso explícito e cria callback", () => {
    const commitment: Commitment = {
      id: "commitment-a",
      ...base,
      promisedBy: "CUSTOMER",
      type: "CALLBACK",
      status: "PENDING",
      dueAt: "2026-08-11T13:00:00.000Z",
      description: "Ligar amanhã às 10h",
      sourceEventId: "event-a",
    }

    const activity = createCommitmentActivity(commitment, now)
    expect(activity.type).toBe("CALLBACK")
    expect(activity.priority).toBe("URGENT")
    expect(activity.commitmentId).toBe("commitment-a")
  })

  it("também representa compromisso prometido pelo consultor", () => {
    const commitment: Commitment = {
      id: "commitment-b",
      ...base,
      promisedBy: "CONSULTANT",
      type: "SEND_PROPOSAL",
      status: "PENDING",
      dueAt: "2026-08-11T13:00:00.000Z",
      description: "Enviar proposta amanhã",
      sourceEventId: "event-b",
    }

    expect(createCommitmentActivity(commitment, now).type).toBe("PROPOSAL_FOLLOW_UP")
  })

  it("callback perdido cria recovery e não volta à cadência NEW", () => {
    const recovery = createMissedCallbackRecovery(pending({
      type: "CALLBACK",
      commitmentId: "commitment-a",
      impactNumber: null,
      cadenceInstanceId: null,
      channel: "CALL",
    }), now)

    expect(recovery.type).toBe("CALLBACK_RECOVERY")
    expect(recovery.cadenceInstanceId).toBeNull()
    expect(recovery.reason).not.toMatch(/é urgente|responda agora/i)
  })

  it("agenda preparação, início e check de resultado da reunião", () => {
    const activities = createMeetingActivities(
      base,
      "meeting-a",
      new Date("2026-08-10T15:00:00.000Z"),
      now,
    )

    expect(activities.map((activity) => activity.type)).toEqual([
      "MEETING_PREP",
      "MEETING_START",
      "MEETING_OUTCOME_CHECK",
    ])
    expect(activities[0].dueAt).toBe("2026-08-10T14:30:00.000Z")
    expect(activities[1].dueAt).toBe("2026-08-10T14:55:00.000Z")
    expect(activities[2].dueAt).toBe("2026-08-10T15:10:00.000Z")
  })

  it("no-show cria recovery contextual sem cadência NEW", () => {
    const recovery = createNoShowRecovery(base, "meeting-a", now)

    expect(recovery.type).toBe("NO_SHOW_RECOVERY")
    expect(recovery.cadenceInstanceId).toBeNull()
    expect(recovery.idempotencyKey).toBe("meeting:meeting-a:no-show-recovery")
  })

  it("mensagem de recovery cria check sem contar novo impacto", () => {
    const recovery = createNoShowRecovery(base, "meeting-a", now)
    const result = markRecoveryMessageSent(recovery, now)

    expect(result.responseCheck.type).toBe("RESPONSE_CHECK")
    expect(result.responseCheck.impactNumber).toBeNull()
    expect(result.responseCheck.cadenceInstanceId).toBeNull()
  })

  it("recovery sem resposta vira follow-up estratégico e não NEW", () => {
    const recovery = createNoShowRecovery(base, "meeting-a", now)
    const { responseCheck } = markRecoveryMessageSent(recovery, now)
    const result = resolveRecoveryNoResponse(responseCheck, now)

    expect(result.nextActivity.type).toBe("STRATEGIC_FOLLOW_UP")
    expect(result.nextActivity.cadenceInstanceId).toBeNull()
  })

  it("reativação sem contexto bloqueia mensagem mesmo com memória antiga fora do ciclo", () => {
    const gate = resolveReactivationGate({
      approachType: "REACTIVATION",
      reactivationCycleId: "cycle-new",
      contexts: [{ reactivationCycleId: "cycle-old", state: "PROVIDED" }],
    })

    expect(gate.contextRequired).toBe(true)
    expect(gate.canRecommendMessage).toBe(false)
  })

  it("mesmo ciclo com contexto não pergunta novamente", () => {
    const gate = resolveReactivationGate({
      approachType: "REACTIVATION",
      reactivationCycleId: "cycle-a",
      contexts: [{ reactivationCycleId: "cycle-a", state: "PROVIDED" }],
    })

    expect(gate.contextRequired).toBe(false)
    expect(gate.canRecommendMessage).toBe(true)
  })

  it("novo ciclo futuro exige contexto novamente", () => {
    const gate = resolveReactivationGate({
      approachType: "REACTIVATION",
      reactivationCycleId: "cycle-b",
      contexts: [{ reactivationCycleId: "cycle-a", state: "PROVIDED" }],
    })

    expect(gate.canRecommendMessage).toBe(false)
  })

  it("identifica ciclos distintos no mesmo dia pela versÃ£o da abordagem", () => {
    const firstCycle = buildReactivationCycleId(
      "opportunity-a",
      new Date("2026-08-10T12:00:00.000Z"),
      0,
    )
    const secondCycle = buildReactivationCycleId(
      "opportunity-a",
      new Date("2026-08-10T12:30:00.000Z"),
      0,
    )

    expect(firstCycle).not.toBe(secondCycle)
  })

  it("incrementa o ciclo sem depender da data do calendÃ¡rio", () => {
    expect(buildReactivationCycleId("opportunity-a", now, 1)).toBe(
      "reactivation-opportunity-a-2026-08-10T12:00:00.000Z-2",
    )
  })

  it("caminho nunca respondeu resolve gate sem fabricar conversa", () => {
    const gate = resolveReactivationGate({
      approachType: "REACTIVATION",
      reactivationCycleId: "cycle-a",
      contexts: [{ reactivationCycleId: "cycle-a", state: "NEVER_REPLIED" }],
    })

    expect(gate.canRecommendMessage).toBe(true)
    expect(gate.reason).toMatch(/nunca respondeu/i)
  })

  it("provider oficial sincronizado pode resolver gate no futuro", () => {
    const gate = resolveReactivationGate({
      approachType: "REACTIVATION",
      reactivationCycleId: "cycle-a",
      contexts: [],
      conversationContextSynchronized: true,
    })

    expect(gate.canRecommendMessage).toBe(true)
  })

  it("lead NEW não é bloqueado pelo gate de reativação", () => {
    expect(resolveReactivationGate({
      approachType: "NEW",
      reactivationCycleId: "cycle-a",
      contexts: [],
    }).canRecommendMessage).toBe(true)
  })

  it("workset preserva compromissos mesmo acima do alvo", () => {
    const candidates = Array.from({ length: 53 }, (_, index) => ({
      id: `opportunity-${index}`,
      ...base,
      opportunityId: undefined,
      priorityScore: 100 - index,
      hasActiveCommitment: true,
      alreadyActive: true,
      terminal: false,
      doNotContact: false,
    })).map(({ opportunityId: _ignored, ...candidate }) => candidate)

    expect(buildActiveWorkset(candidates, "workspace-a", "consultant-a")).toHaveLength(53)
  })

  it("workset preenche capacidade por prioridade", () => {
    const candidates = Array.from({ length: 60 }, (_, index) => ({
      id: `opportunity-${index}`,
      workspaceId: "workspace-a",
      consultantId: "consultant-a",
      priorityScore: index,
      hasActiveCommitment: false,
      alreadyActive: false,
      terminal: false,
      doNotContact: false,
    }))
    const result = buildActiveWorkset(candidates, "workspace-a", "consultant-a")

    expect(result).toHaveLength(50)
    expect(result[0].id).toBe("opportunity-59")
  })

  it("workset isola workspace e consultor", () => {
    const result = buildActiveWorkset([
      { id: "a", workspaceId: "workspace-a", consultantId: "consultant-a", priorityScore: 1, hasActiveCommitment: false, alreadyActive: false, terminal: false, doNotContact: false },
      { id: "b", workspaceId: "workspace-b", consultantId: "consultant-a", priorityScore: 100, hasActiveCommitment: true, alreadyActive: true, terminal: false, doNotContact: false },
    ], "workspace-a", "consultant-a")

    expect(result.map((item) => item.id)).toEqual(["a"])
  })

  it("detecta oportunidade ativa sem ação, compromisso ou espera válida", () => {
    expect(isStaleOpportunity({
      isClosed: false,
      doNotContact: false,
      inactive: false,
      hasPendingActivity: false,
      hasFutureCommitment: false,
      hasExplicitWaitingState: false,
    })).toBe(true)
  })

  it("ignora jornada fechada no detector stale", () => {
    expect(isStaleOpportunity({
      isClosed: true,
      doNotContact: false,
      inactive: false,
      hasPendingActivity: false,
      hasFutureCommitment: false,
      hasExplicitWaitingState: false,
    })).toBe(false)
  })

  it("guardrail do-not-contact cancela todo outreach pendente", () => {
    const result = cancelAllOutreachForDoNotContact([pending()], now)

    expect(result[0].status).toBe("CANCELLED")
    expect(result[0].cancelledAt).toBe(now.toISOString())
  })

  it("fila prioriza callback sobre cadência genérica", () => {
    const ordered = prioritizeActivities([
      pending({ id: "cadence", type: "CADENCE_WHATSAPP" }),
      pending({ id: "callback", type: "CALLBACK" }),
    ])

    expect(ordered.map((activity) => activity.id)).toEqual(["callback", "cadence"])
  })
})
