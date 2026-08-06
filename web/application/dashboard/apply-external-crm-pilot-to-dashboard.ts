import type {
  DashboardData,
  TaskPriority,
} from "@/types/dashboard"

import type {
  ExternalCrmPilotView,
} from "@/types/external-crm-pilot"

const DASHBOARD_TIME_ZONE =
  "America/Sao_Paulo"

function formatTime(
  value: string | null,
  timezone: string | null,
): string {
  if (!value) {
    return "Agora"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Agora"
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        timezone ??
        DASHBOARD_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(date)
}

function resolveTaskPriority(
  view: ExternalCrmPilotView,
): TaskPriority {
  if (view.reactivation) {
    return "high"
  }

  if (
    view.cadence
      ?.overdueActions
  ) {
    return "high"
  }

  if (view.meeting) {
    return "high"
  }

  if (
    view.cadence?.paused ||
    view.cadence?.status ===
      "PAUSED"
  ) {
    return "medium"
  }

  if (
    view.cadence?.status ===
    "COMPLETED"
  ) {
    return "low"
  }

  return "high"
}

function resolveTaskTitle(
  view: ExternalCrmPilotView,
): string {
  const leadName =
    view.lead.name

  if (view.meeting) {
    return `Preparar reunião com ${leadName}`
  }

  if (view.reactivation) {
    return `Responder e qualificar ${leadName}`
  }

  if (
    view.cadence?.paused ||
    view.cadence?.status ===
      "PAUSED"
  ) {
    return `Cumprir próximo passo de ${leadName}`
  }

  if (
    view.cadence?.status ===
    "COMPLETED"
  ) {
    return `Revisar conclusão da cadência de ${leadName}`
  }

  const overdueActions =
    view.cadence
      ?.overdueActions ??
    0

  if (overdueActions > 0) {
    return `Concluir ${overdueActions} ações atrasadas de ${leadName}`
  }

  if (view.nextAction) {
    return `${view.nextAction.label} com ${leadName}`
  }

  return `Revisar atendimento de ${leadName}`
}

function resolveTaskTime(
  view: ExternalCrmPilotView,
): string {
  const scheduledFor =
    view.meeting
      ?.scheduledFor ??
    view.lead.nextActionAt ??
    view.nextAction
      ?.scheduledFor ??
    null

  return formatTime(
    scheduledFor,
    view.cadence
      ?.timezone ??
    null,
  )
}

function buildSummary(
  view: ExternalCrmPilotView,
): string {
  const leadName =
    view.lead.name

  if (view.meeting) {
    return `O Maestro simulado informa uma reunião com ${leadName}. O R2 priorizou a preparação do contexto antes do compromisso.`
  }

  if (view.reactivation) {
    return `${leadName} respondeu com interesse durante a reativação. O R2 encerrou a sequência, voltou ao atendimento ativo e bloqueou o retorno automático aos Checks.`
  }

  if (
    view.cadence?.paused ||
    view.cadence?.status ===
      "PAUSED"
  ) {
    return `A cadência de ${leadName} está pausada no Maestro simulado. Execute o próximo passo oficial antes de qualquer nova tentativa.`
  }

  if (
    view.cadence?.status ===
    "COMPLETED"
  ) {
    return `A cadência oficial de ${leadName} foi concluída no Maestro simulado. O R2 não recomenda novos contatos sem uma decisão de reativação ou encerramento.`
  }

  const overdueActions =
    view.cadence
      ?.overdueActions ??
    0

  if (overdueActions > 0) {
    return `${overdueActions} ações do Check ${view.cadence?.currentCheck ?? "atual"} estão atrasadas para ${leadName}. O R2 colocou esse atendimento no topo da execução.`
  }

  if (view.nextAction) {
    return `${leadName} está no Check ${view.cadence?.currentCheck ?? "atual"} de ${view.cadence?.totalChecks ?? "?"}. A próxima ação oficial é ${view.nextAction.label}.`
  }

  return `O R2 está acompanhando ${leadName} pelo cenário simulado do Maestro.`
}

export function applyExternalCrmPilotToDashboard({
  dashboardData,
  externalCrmPilot,
}: {
  dashboardData: DashboardData
  externalCrmPilot:
    ExternalCrmPilotView | undefined
}): DashboardData {
  if (!externalCrmPilot) {
    return dashboardData
  }

  const taskTitle =
    resolveTaskTitle(
      externalCrmPilot,
    )

  const taskPriority =
    resolveTaskPriority(
      externalCrmPilot,
    )

  const pilotTask = {
    id:
      `external-crm-pilot-${externalCrmPilot.scenarioId}`,
    title:
      taskTitle,
    time:
      resolveTaskTime(
        externalCrmPilot,
      ),
    priority:
      taskPriority,
  }

  const tasks = [
    pilotTask,
    ...dashboardData.tasks.filter(
      (task) =>
        task.id !==
        pilotTask.id,
    ),
  ]

  return {
    ...dashboardData,
    summary:
      buildSummary(
        externalCrmPilot,
      ),
    tasks,
    intelligence:
      dashboardData.intelligence
        ? {
            ...dashboardData.intelligence,
            nextAction:
              taskTitle,
            topOpportunity:
              undefined,
          }
        : undefined,
    gorilaR2: {
      greeting:
        `R2 alinhado ao ${externalCrmPilot.providerLabel}`,
      analysis:
        externalCrmPilot.r2.analysis,
      recommendation:
        externalCrmPilot.r2.recommendation,
      reason:
        externalCrmPilot.r2.reason,
      confidence:
        "high",
      nextAction: {
        title:
          taskTitle,
        priority:
          taskPriority,
      },
      generatedAt:
        externalCrmPilot.synchronizedAt,
    },
  }
}
