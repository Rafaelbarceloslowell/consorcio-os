import type {
  ExternalContactAction,
  ExternalCrmConnector,
} from "@/application/integration/external-crm"

import type {
  ExternalCrmPilotActionView,
  ExternalCrmPilotScenarioId,
  ExternalCrmPilotView,
} from "@/types/external-crm-pilot"

import {
  resolveReactivationPositiveResponse,
} from "@/application/reactivation/resolve-reactivation-positive-response"

const PAUSE_REASON_LABELS: Record<
  string,
  string
> = {
  CUSTOMER_REPLIED:
    "Cliente respondeu",
  CUSTOMER_ANSWERED_CALL:
    "Cliente atendeu a ligação",
  PROPOSAL_SENT:
    "Proposta enviada",
  MEETING_SCHEDULED:
    "Reunião agendada",
  SALE_COMPLETED:
    "Venda concluída",
  NEXT_ACTION_DEFINED:
    "Próximo passo definido",
}

function humanizeCode(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .toLocaleLowerCase("pt-BR")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")

  if (!normalized) {
    return "Motivo não informado"
  }

  return (
    normalized.charAt(0).toLocaleUpperCase("pt-BR") +
    normalized.slice(1)
  )
}

export function formatExternalCadencePauseReason(
  pauseReason: string | null,
): string | null {
  if (!pauseReason?.trim()) {
    return null
  }

  const normalizedCode =
    pauseReason
      .trim()
      .toUpperCase()

  return (
    PAUSE_REASON_LABELS[
      normalizedCode
    ] ??
    humanizeCode(
      pauseReason,
    )
  )
}

function toActionView(
  action: ExternalContactAction,
): ExternalCrmPilotActionView {
  return {
    id:
      action.externalActionId,
    label:
      action.label,
    channel:
      action.channel,
    period:
      action.period,
    status:
      action.status,
    dueState:
      action.dueState,
    scheduledFor:
      action.scheduledFor,
  }
}

function selectNextAction(
  actions: readonly ExternalContactAction[],
  nextActionId: string | null,
): ExternalContactAction | null {
  const explicitNextAction =
    nextActionId
      ? actions.find(
          (action) =>
            action.externalActionId ===
            nextActionId,
        )
      : undefined

  if (
    explicitNextAction &&
    explicitNextAction.status !==
      "COMPLETED" &&
    explicitNextAction.status !==
      "CANCELLED" &&
    explicitNextAction.status !==
      "SKIPPED"
  ) {
    return explicitNextAction
  }

  return (
    [...actions]
      .filter(
        (action) =>
          action.status !==
            "COMPLETED" &&
          action.status !==
            "CANCELLED" &&
          action.status !==
            "SKIPPED",
      )
      .sort(
        (first, second) =>
          first.position -
          second.position,
      )[0] ?? null
  )
}

function buildR2Reading({
  leadName,
  currentCheck,
  totalChecks,
  completedActions,
  plannedActions,
  overdueActions,
  paused,
  pauseReasonLabel,
  cadenceCompleted,
  nextAction,
  hasMeeting,
  positiveReactivationResponse,
}: {
  leadName: string
  currentCheck: number | null
  totalChecks: number | null
  completedActions: number
  plannedActions: number
  overdueActions: number
  paused: boolean
  pauseReasonLabel: string | null
  cadenceCompleted: boolean
  nextAction: ExternalContactAction | null
  hasMeeting: boolean
  positiveReactivationResponse: boolean
}): ExternalCrmPilotView["r2"] {
  if (hasMeeting) {
    return {
      headline:
        "Reunião identificada no Maestro",
      analysis:
        `O Maestro informa que ${leadName} já possui uma conversa comercial agendada.`,
      recommendation:
        "Preparar o contexto e os pontos da reunião antes do horário marcado.",
      reason:
        "O R2 usa o compromisso oficial do Maestro e acrescenta preparação comercial, sem criar uma segunda agenda.",
    }
  }

  if (positiveReactivationResponse) {
    return {
      headline:
        "Resposta positiva na reativação",
      analysis:
        `${leadName} respondeu com interesse. A sequência de reativação foi interrompida e o atendimento voltou ao modo ativo.`,
      recommendation:
        "Responder, qualificar e definir o próximo passo antes de qualquer nova cadência.",
      reason:
        "Os Checks permanecem bloqueados. Eles só podem retornar após uma nova ausência de resposta e autorização oficial do Maestro.",
    }
  }

  if (paused) {
    return {
      headline:
        "Cadência pausada pelo Maestro",
      analysis:
        pauseReasonLabel
          ? `O Padrão A está pausado pelo motivo oficial: ${pauseReasonLabel}.`
          : "O Padrão A está pausado por uma regra oficial do Maestro.",
      recommendation:
        `Cumprir o próximo passo registrado para ${leadName} antes de retomar qualquer tentativa.`,
      reason:
        "O R2 respeita o estado oficial da cadência e não cria contatos paralelos.",
    }
  }

  if (cadenceCompleted) {
    return {
      headline:
        "Padrão A concluído no Maestro",
      analysis:
        `Os ${plannedActions} impactos do Check ${currentCheck ?? 5} foram registrados para ${leadName}.`,
      recommendation:
        "Revisar o histórico e aguardar a decisão oficial sobre reativação ou encerramento.",
      reason:
        "A conclusão da cadência pertence ao Maestro; o GorillaOS apenas interpreta o resultado para o consultor.",
    }
  }

  if (overdueActions > 0) {
    return {
      headline:
        "Ações atrasadas identificadas",
      analysis:
        `${overdueActions} ações do Check ${currentCheck ?? "atual"} estão atrasadas para ${leadName}.`,
      recommendation:
        `Concluir as ${overdueActions} ações atrasadas antes de avançar para novos contatos.`,
      reason:
        "A prioridade vem do estado oficial do Maestro; o R2 organiza a execução sem duplicar a cadência.",
    }
  }

  if (
    currentCheck !== null &&
    currentCheck > 1
  ) {
    return {
      headline:
        "Cadência oficial em andamento",
      analysis:
        `${leadName} está no Check ${currentCheck} de ${totalChecks ?? 5}, com ${completedActions} de ${plannedActions} ações concluídas.`,
      recommendation:
        nextAction
          ? `Executar agora: ${nextAction.label}.`
          : "Conferir a próxima ação liberada pelo Maestro.",
      reason:
        "O R2 acompanha o Padrão A como fonte externa de verdade e acrescenta orientação ao consultor.",
    }
  }

  return {
    headline:
      "Novo lead recebido do Maestro",
    analysis:
      `${leadName} está no primeiro Check, com ${completedActions} de ${plannedActions} ações concluídas.`,
    recommendation:
      nextAction
        ? `Começar pela ação oficial: ${nextAction.label}.`
        : "Abrir o atendimento e conferir a primeira ação oficial.",
    reason:
      "O Maestro controla o processo; o R2 ajuda o consultor a executar com contexto e consistência.",
  }
}

export async function buildExternalCrmPilotView({
  connector,
  scenarioId,
}: {
  connector: ExternalCrmConnector
  scenarioId: ExternalCrmPilotScenarioId
}): Promise<ExternalCrmPilotView> {
  const [
    health,
    leadPage,
  ] = await Promise.all([
    connector.getHealth(),
    connector.listLeads({
      limit: 1,
    }),
  ])

  const lead =
    leadPage.items[0]

  if (!lead) {
    throw new Error(
      "O conector externo não retornou um lead para o piloto do dashboard.",
    )
  }

  const [
    cadence,
    meetings,
    timeline,
  ] = await Promise.all([
    connector.getLeadCadence(
      lead.externalLeadId,
    ),
    connector.listMeetings({
      externalLeadId:
        lead.externalLeadId,
    }),
    connector.getLeadTimeline(
      lead.externalLeadId,
    ),
  ])

  const meeting =
    meetings[0] ?? null

  const cadenceBlocksContactAction =
    cadence?.paused ===
      true ||
    cadence?.status ===
      "PAUSED" ||
    cadence?.status ===
      "COMPLETED" ||
    cadence?.status ===
      "CANCELLED" ||
    meeting !== null

  const nextActionSource =
    cadence &&
    !cadenceBlocksContactAction
      ? selectNextAction(
          cadence.actions,
          cadence.nextActionId,
        )
      : null

  const overdueActions =
    cadence?.actions.filter(
      (action) =>
        action.dueState ===
        "OVERDUE",
    ).length ?? 0

  const dueActions =
    cadence?.actions.filter(
      (action) =>
        action.dueState ===
          "DUE" ||
        action.dueState ===
          "OVERDUE",
    ).length ?? 0

  const latestTimelineEvent =
    [...timeline]
      .sort(
        (first, second) =>
          second.occurredAt.localeCompare(
            first.occurredAt,
          ),
      )[0] ?? null

  const pauseReasonLabel =
    formatExternalCadencePauseReason(
      cadence?.pauseReason ??
      null,
    )

  const reactivationPositiveResponseScenario =
    scenarioId ===
    "REACTIVATION_POSITIVE_RESPONSE"

  const customerReplied =
    cadence?.pauseReason ===
      "CUSTOMER_REPLIED" ||
    timeline.some(
      (event) =>
        event.eventType ===
        "CUSTOMER_REPLIED",
    )

  const reactivationTransition =
    resolveReactivationPositiveResponse({
      reactivationActive:
        reactivationPositiveResponseScenario,
      customerReplied,
      intent:
        reactivationPositiveResponseScenario
          ? "POSITIVE_INTEREST"
          : "UNCLEAR",
      nextStepDefined:
        cadence?.pauseReason ===
        "NEXT_ACTION_DEFINED",
      meetingScheduled:
        meeting !== null,
    })

  const r2 =
    buildR2Reading({
      leadName:
        lead.name,
      currentCheck:
        cadence?.currentCheck ??
        null,
      totalChecks:
        cadence?.totalChecks ??
        null,
      completedActions:
        cadence?.completedActions ??
        0,
      plannedActions:
        cadence?.plannedActions ??
        0,
      overdueActions,
      paused:
        cadence?.paused ??
        false,
      pauseReasonLabel,
      cadenceCompleted:
        cadence?.status ===
        "COMPLETED",
      nextAction:
        nextActionSource,
      hasMeeting:
        meeting !== null,
      positiveReactivationResponse:
        reactivationTransition.handled,
    })

  return {
    providerId:
      connector.providerId,
    providerLabel:
      "Maestro simulado",
    contractVersion:
      health.contractVersion,
    scenarioId,
    simulation:
      true,
    readOnly:
      true,
    healthStatus:
      health.status,
    synchronizedAt:
      leadPage.synchronizedAt,
    lead: {
      id:
        lead.externalLeadId,
      name:
        lead.name,
      source:
        lead.source,
      stage:
        lead.stage,
      status:
        lead.status,
      nextActionAt:
        lead.nextActionAt,
    },
    cadence:
      cadence
        ? {
            status:
              cadence.status,
            currentCheck:
              cadence.currentCheck,
            totalChecks:
              cadence.totalChecks,
            plannedActions:
              cadence.plannedActions,
            completedActions:
              cadence.completedActions,
            overdueActions,
            dueActions,
            paused:
              cadence.paused,
            pauseReason:
              cadence.pauseReason,
            pauseReasonLabel,
            templateVersion:
              cadence.templateVersion,
            timezone:
              cadence.timezone,
          }
        : null,
    nextAction:
      nextActionSource
        ? toActionView(
            nextActionSource,
          )
        : null,
    meeting:
      meeting
        ? {
            id:
              meeting.externalMeetingId,
            title:
              meeting.title,
            status:
              meeting.status,
            scheduledFor:
              meeting.scheduledFor,
          }
        : null,
    latestTimelineSummary:
      latestTimelineEvent
        ?.summary ??
      null,
    reactivation:
      reactivationTransition.handled
        ? {
            positiveResponseHandled:
              true,
            sequenceStopped:
              true,
            serviceState:
              "ACTIVE_CONVERSATION",
            checksBlocked:
              true,
            resumeRequiresNewNoResponse:
              true,
            resumeRequiresMaestroAuthorization:
              true,
          }
        : null,
    r2,
  }
}
