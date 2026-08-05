import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  DashboardData,
  Meeting as DashboardMeeting,
  PipelineStage as DashboardPipelineStage,
  Task as DashboardTask,
  TaskPriority as DashboardTaskPriority,
} from "@/types/dashboard"

import {
  ListOpportunitiesAsync,
} from "@/application/opportunity/list-opportunities-async"

import {
  getNextBestActions,
} from "../decision/get-next-best-actions"

import {
  mapOperationalDashboardData,
} from "./mapper"

import {
  buildGorilaR2Briefing,
} from "./build-gorilar2-briefing"

import {
  enrichGorilaR2PilotBriefing,
} from "./enrich-gorilar2-pilot-briefing"

export type GetAsyncDashboardDataInput = {
  workspaceId: string
  consultantId?: string
  now?: Date
}

export type GetAsyncDashboardDataDependencies = {
  commercialRepository:
    AsyncCommercialRepositories

  crmRepository:
    AsyncCrmRepositories
}

const DASHBOARD_TIME_ZONE =
  "America/Sao_Paulo"

const taskPriorityOrder: Record<
  DashboardTaskPriority,
  number
> = {
  high: 0,
  medium: 1,
  low: 2,
}

function getDateParts(
  value: string | Date,
): {
  year: string
  month: string
  day: string
} {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          DASHBOARD_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      value instanceof Date
        ? value
        : new Date(value),
    )

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value ?? ""

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value ?? ""

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value ?? ""

  return {
    year,
    month,
    day,
  }
}

function isSameDay(
  value: string,
  reference: Date,
): boolean {
  const valueParts =
    getDateParts(value)

  const referenceParts =
    getDateParts(reference)

  return (
    valueParts.year ===
      referenceParts.year &&
    valueParts.month ===
      referenceParts.month &&
    valueParts.day ===
      referenceParts.day
  )
}

function isSameMonth(
  value: string,
  reference: Date,
): boolean {
  const valueParts =
    getDateParts(value)

  const referenceParts =
    getDateParts(reference)

  return (
    valueParts.year ===
      referenceParts.year &&
    valueParts.month ===
      referenceParts.month
  )
}

function formatTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        DASHBOARD_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(
    new Date(value),
  )
}


function getDateKey(
  value: string | Date,
): number {
  const parts =
    getDateParts(value)

  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  )
}

function formatScheduledDateLabel(
  value: string,
  now: Date,
): string {
  const dayDifference =
    Math.round(
      (
        getDateKey(value) -
        getDateKey(now)
      ) /
      (
        24 *
        60 *
        60 *
        1000
      ),
    )

  if (dayDifference === 0) {
    return "hoje"
  }

  if (dayDifference === 1) {
    return "amanh\u00e3"
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        DASHBOARD_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
    },
  ).format(
    new Date(value),
  )
}

function hoursSince(
  value: string,
  now: Date,
): number {
  return Math.max(
    0,
    (now.getTime() - new Date(value).getTime()) /
      (1000 * 60 * 60),
  )
}

function consultantPositionTitle(
  role: "consultant" | "manager" | "admin",
): string {
  if (role === "manager") {
    return "Gestor"
  }

  if (role === "admin") {
    return "Administrador"
  }

  return "Consultor S\u00eanior"
}

function isDataCrazyReactivationStage(
  stageName: string,
): boolean {
  return (
    stageName
      .trim()
      .toLocaleLowerCase("pt-BR") ===
    "reativa\u00e7\u00e3o data crazy"
  )
}

export async function getAsyncDashboardData(
  {
    workspaceId,
    consultantId,
    now = new Date(),
  }: GetAsyncDashboardDataInput,
  dependencies:
    GetAsyncDashboardDataDependencies,
): Promise<DashboardData> {
  const normalizedWorkspaceId =
    workspaceId.trim()

  if (!normalizedWorkspaceId) {
    throw new Error(
      "O workspace \u00e9 obrigat\u00f3rio para carregar o Mission Control.",
    )
  }

  const consultants =
    await dependencies
      .crmRepository
      .consultants
      .findAll()

  const selectedConsultant =
    consultantId
      ? consultants.find(
          (consultant) =>
            consultant.id ===
            consultantId,
        )
      : (
          consultants.find(
            (consultant) =>
              consultant.status ===
              "active",
          ) ??
          consultants[0]
        )

  const resolvedConsultantId =
    consultantId ??
    selectedConsultant?.id

  const [
    listedOpportunities,
    operationalActions,
    openCommercialActions,
    leads,
    clients,
    meetings,
    sales,
    pipelineStages,
    tasks,
    phases,
    states,
  ] = await Promise.all([
    new ListOpportunitiesAsync({
      journeys:
        dependencies
          .commercialRepository
          .journeys,
    }).execute({
      workspaceId:
        normalizedWorkspaceId,
      consultantId:
        resolvedConsultantId,
    }),

    getNextBestActions({
      commercialRepository:
        dependencies
          .commercialRepository,

      consultantId:
        resolvedConsultantId,

      now,
      limit: 1,
    }),

    dependencies
      .commercialRepository
      .actions
      .findOpen(),

    dependencies
      .crmRepository
      .leads
      .findAll(),

    dependencies
      .crmRepository
      .clients
      .findAll(),

    dependencies
      .crmRepository
      .meetings
      .findAll(),

    dependencies
      .crmRepository
      .sales
      .findAll(),

    dependencies
      .crmRepository
      .pipelineStages
      .findAll(),

    dependencies
      .crmRepository
      .tasks
      .findAll(),

    dependencies
      .commercialRepository
      .phases
      .findAll(),

    dependencies
      .commercialRepository
      .states
      .findAll(),
  ])

  const enrichedOperationalActions =
    operationalActions.map(
      (action) => {
        const lead =
          action.leadId
            ? leads.find(
                (item) =>
                  item.id ===
                  action.leadId,
              )
            : undefined

        const client =
          action.clientId
            ? clients.find(
                (item) =>
                  item.id ===
                  action.clientId,
              )
            : undefined

        return {
          ...action,
          contactName:
            lead?.name ??
            client?.name ??
            null,
          approachType:
            lead?.approachType ??
            null,
        }
      },
    )

  const baseDashboardData: DashboardData = {
    user: selectedConsultant
      ? {
          id:
            selectedConsultant.id,
          name:
            selectedConsultant.name,
          positionTitle:
            consultantPositionTitle(
              selectedConsultant.role,
            ),
        }
      : {
          id: "commercial-team",
          name: "Equipe Comercial",
          positionTitle:
            "Opera\u00e7\u00e3o comercial",
        },

    summary: "",

    metrics: {
      newLeads: 0,
      meetingsToday: 0,
      monthlySales: 0,
      pendingTasks: 0,
    },

    meetings: [],
    tasks: [],
    pipeline: [],
    opportunities: [],
  }

  const dashboardData =
    mapOperationalDashboardData({
      baseDashboardData,
      operationalActions:
        enrichedOperationalActions,
    })

  const consultantLeads =
    resolvedConsultantId
      ? leads.filter(
          (lead) =>
            lead.consultantId ===
            resolvedConsultantId,
        )
      : leads

  const consultantMeetings =
    resolvedConsultantId
      ? meetings.filter(
          (meeting) =>
            meeting.consultantId ===
            resolvedConsultantId,
        )
      : meetings

  const consultantSales =
    resolvedConsultantId
      ? sales.filter(
          (sale) =>
            sale.consultantId ===
            resolvedConsultantId,
        )
      : sales

  const dataCrazyReactivationStageIds =
    new Set(
      pipelineStages
        .filter(
          (stage) =>
            isDataCrazyReactivationStage(
              stage.name,
            ),
        )
        .map(
          (stage) => stage.id,
        ),
    )

  const reactivatedLeads =
    consultantLeads.filter(
      (lead) =>
        dataCrazyReactivationStageIds.has(
          lead.pipelineStageId,
        ),
    )

  const newLeads =
    consultantLeads.filter(
      (lead) =>
        !dataCrazyReactivationStageIds.has(
          lead.pipelineStageId,
        ) &&
        isSameDay(
          lead.createdAt,
          now,
        ),
    ).length

  const meetingsToday =
    consultantMeetings.filter(
      (meeting) =>
        meeting.status !==
          "cancelled" &&
        isSameDay(
          meeting.startAt,
          now,
        ),
    ).length

  const monthlySales =
    consultantSales
      .filter(
        (sale) =>
          sale.status !==
            "cancelled" &&
          isSameMonth(
            sale.saleDate,
            now,
          ),
      )
      .reduce(
        (total, sale) =>
          total +
          sale.creditValue,
        0,
      )

  const pipeline =
    pipelineStages
      .filter(
        (pipelineStage) =>
          pipelineStage.type ===
          "lead",
      )
      .sort(
        (
          firstStage,
          secondStage,
        ) =>
          firstStage.order -
          secondStage.order,
      )
      .map<DashboardPipelineStage>(
        (pipelineStage) => {
          const stageLeads =
            consultantLeads.filter(
              (lead) =>
                lead.pipelineStageId ===
                pipelineStage.id,
            )

          const value =
            stageLeads.reduce(
              (total, lead) =>
                total +
                lead.desiredCreditValue,
              0,
            )

          return {
            id:
              pipelineStage.id,
            name:
              pipelineStage.name,
            count:
              stageLeads.length,
            value,
          }
        },
      )

  const leadsById =
    new Map(
      leads.map((lead) => [
        lead.id,
        lead,
      ]),
    )

  const clientsById =
    new Map(
      clients.map((client) => [
        client.id,
        client,
      ]),
    )

  const consultantsById =
    new Map(
      consultants.map(
        (consultant) => [
          consultant.id,
          consultant,
        ],
      ),
    )

  const phasesById =
    new Map(
      phases.map((phase) => [
        phase.id,
        phase,
      ]),
    )

  const statesById =
    new Map(
      states.map((state) => [
        state.id,
        state,
      ]),
    )

  const opportunities =
    listedOpportunities
      .opportunities
      .map((opportunity) => {
        const lead =
          opportunity.leadId
            ? leadsById.get(
                opportunity.leadId,
              )
            : undefined
        const client =
          opportunity.clientId
            ? clientsById.get(
                opportunity.clientId,
              )
            : undefined
        const consultant =
          consultantsById.get(
            opportunity.consultantId,
          )
        const phase =
          phasesById.get(
            opportunity
              .currentPhaseId,
          )
        const state =
          statesById.get(
            opportunity
              .currentStateId,
          )

        return {
          id: opportunity.id,
          title: opportunity.title,
          origin:
            opportunity.leadId
              ? "lead" as const
              : "client" as const,
          originName:
            opportunity.leadId
              ? (
                  lead?.name ??
                  "Lead n\u00e3o identificado"
                )
              : (
                  client?.name ??
                  "Cliente n\u00e3o identificado"
                ),
          consultantName:
            consultant?.name ??
            "Consultor n\u00e3o identificado",
          priority:
            opportunity.priority,
          score:
            opportunity.score,
          phaseName:
            phase?.name ??
            "Fase indispon\u00edvel",
          stateName:
            state?.name ??
            "Estado indispon\u00edvel",
          consortiumType:
            opportunity
              .consortiumType,
          lastInteractionAt:
            opportunity
              .lastInteractionAt,
          updatedAt:
            opportunity.updatedAt,
          status:
            opportunity.closedAt !==
              null ||
            opportunity.outcome !==
              null
              ? "closed" as const
              : "open" as const,
          outcome:
            opportunity.outcome,
        }
      })

  const dashboardMeetings =
    consultantMeetings
      .filter(
        (meeting) =>
          meeting.status !==
            "cancelled" &&
          isSameDay(
            meeting.startAt,
            now,
          ),
      )
      .sort(
        (
          firstMeeting,
          secondMeeting,
        ) =>
          new Date(
            firstMeeting.startAt,
          ).getTime() -
          new Date(
            secondMeeting.startAt,
          ).getTime(),
      )
      .map<DashboardMeeting>(
        (meeting) => {
          const client =
            meeting.clientId
              ? clientsById.get(
                  meeting.clientId,
                )
              : undefined

          const lead =
            meeting.leadId
              ? leadsById.get(
                  meeting.leadId,
                )
              : undefined

          return {
            id:
              meeting.id,
            title:
              meeting.title,
            time:
              formatTime(
                meeting.startAt,
              ),
            clientName:
              client?.name ??
              lead?.name ??
              "Contato nÃƒÂ£o identificado",
          }
        },
      )

  const openConsultantTasks =
    tasks.filter(
      (task) =>
        (
          task.status ===
            "pending" ||
          task.status ===
            "in_progress"
        ) &&
        (
          !resolvedConsultantId ||
          task.assignedToId ===
            resolvedConsultantId
        ),
    )

  const scheduledFollowUpTask =
    openConsultantTasks
      .filter(
        (task) =>
          task.type ===
            "follow_up" &&
          new Date(
            task.dueAt,
          ).getTime() >
            now.getTime(),
      )
      .sort(
        (
          firstTask,
          secondTask,
        ) =>
          new Date(
            firstTask.dueAt,
          ).getTime() -
          new Date(
            secondTask.dueAt,
          ).getTime(),
      )[0]

  const scheduledFollowUp =
    scheduledFollowUpTask
      ? {
          taskId:
            scheduledFollowUpTask.id,
          title:
            scheduledFollowUpTask.title,
          contactName:
            (
              scheduledFollowUpTask.leadId
                ? leadsById.get(
                    scheduledFollowUpTask.leadId,
                  )?.name
                : undefined
            ) ??
            (
              scheduledFollowUpTask.clientId
                ? clientsById.get(
                    scheduledFollowUpTask.clientId,
                  )?.name
                : undefined
            ) ??
            "contato",
          dueAt:
            scheduledFollowUpTask.dueAt,
          dateLabel:
            formatScheduledDateLabel(
              scheduledFollowUpTask.dueAt,
              now,
            ),
          time:
            formatTime(
              scheduledFollowUpTask.dueAt,
            ),
        }
      : undefined

  const dashboardTasks =
    openConsultantTasks
      .sort(
        (
          firstTask,
          secondTask,
        ) => {
          const priorityDifference =
            taskPriorityOrder[
              firstTask.priority
            ] -
            taskPriorityOrder[
              secondTask.priority
            ]

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference
          }

          return (
            new Date(
              firstTask.dueAt,
            ).getTime() -
            new Date(
              secondTask.dueAt,
            ).getTime()
          )
        },
      )
      .map<DashboardTask>(
        (task) => ({
          id:
            task.id,
          title:
            task.title,
          time:
            formatTime(
              task.dueAt,
            ),
          priority:
            task.priority,
        }),
      )

  const recommendationTasks =
    dashboardData.tasks

  const prioritizedTasks = [
    ...recommendationTasks,
    ...dashboardTasks,
  ].filter(
    (task, index, collection) =>
      collection.findIndex(
        (candidate) =>
          candidate.id === task.id,
      ) === index,
  )

  const activeLeads =
    consultantLeads.filter(
      (lead) =>
        lead.status !== "converted" &&
        lead.status !== "lost",
    )

  const staleOpportunities =
    activeLeads.filter(
      (lead) =>
        !dataCrazyReactivationStageIds.has(
          lead.pipelineStageId,
        ) &&
        hoursSince(
          lead.lastContactAt ??
            lead.createdAt,
          now,
        ) >= 48,
    ).length

  const unpreparedMeetings =
    consultantMeetings.filter(
      (meeting) =>
        meeting.status === "scheduled" &&
        isSameDay(meeting.startAt, now) &&
        !meeting.notes?.trim() &&
        !meeting.description?.trim(),
    ).length

  const recommendedLead =
    enrichedOperationalActions[0]?.leadId
      ? leadsById.get(
          enrichedOperationalActions[0].leadId,
        )
      : undefined

  const topOpportunity =
    recommendedLead ??
    [...activeLeads].sort(
      (firstLead, secondLead) =>
        secondLead.score -
          firstLead.score ||
        secondLead.desiredCreditValue -
          firstLead.desiredCreditValue,
    )[0]

  const criticalCount =
    prioritizedTasks.filter(
      (task) => task.priority === "high",
    ).length

  const importantCount =
    prioritizedTasks.filter(
      (task) => task.priority === "medium",
    ).length

  const monitoringCount =
    prioritizedTasks.filter(
      (task) => task.priority === "low",
    ).length

  const intelligence = {
    criticalCount,
    importantCount,
    monitoringCount,
    reactivatedLeads:
      reactivatedLeads.length,
    unpreparedMeetings,
    staleOpportunities,
    pipelineValue:
      activeLeads.reduce(
        (total, lead) =>
          total +
          lead.desiredCreditValue,
        0,
      ),
    nextAction:
      prioritizedTasks[0]?.title,
    scheduledFollowUp,
    topOpportunity:
      topOpportunity
        ? {
            id: topOpportunity.id,
            name: topOpportunity.name,
            value:
              topOpportunity
                .desiredCreditValue,
            score:
              topOpportunity.score,
          }
        : undefined,
  }

  const pendingCommercialAction =
    openCommercialActions.find(
      (action) =>
        action.origin ===
          "NEXT_BEST_ACTION" &&
        (
          !resolvedConsultantId ||
          action.actorId ===
            resolvedConsultantId
        ) &&
        (
          action.scheduledFor === null ||
          new Date(
            action.scheduledFor,
          ).getTime() <= now.getTime()
        ),
    )

  const pendingActionOpportunity =
    pendingCommercialAction
      ? listedOpportunities
          .opportunities
          .find(
            (opportunity) =>
              opportunity.id ===
              pendingCommercialAction
                .journeyId,
          )
      : undefined

  const gorilaR2 =
    enrichGorilaR2PilotBriefing(
      buildGorilaR2Briefing({
        intelligence,
      }),
      enrichedOperationalActions,
      pendingCommercialAction
        ? {
            action:
              pendingCommercialAction,
            journeyTitle:
              pendingActionOpportunity
                ?.title ??
              pendingCommercialAction
                .title,
          }
        : undefined,
    )

  return {
    ...dashboardData,
    workspaceId: normalizedWorkspaceId,

    gorilaR2,

    metrics: {
      newLeads,
      meetingsToday,
      monthlySales,
      pendingTasks:
        prioritizedTasks.length,
    },

    meetings:
      dashboardMeetings,

    tasks:
      prioritizedTasks,

    opportunities,

    pipeline,

    summary:
      enrichedOperationalActions[0]
        ?.approachType ===
      "reactivation"
        ? `O R2 organizou ${reactivatedLeads.length} leads reativados e selecionou o pr\u00f3ximo contato da fila.`
        : enrichedOperationalActions[0]
              ?.approachType ===
            "new"
          ? "O R2 selecionou o pr\u00f3ximo novo atendimento da fila."
          : criticalCount > 0
          ? `Hoje existem ${criticalCount} oportunidades crÃƒÂ­ticas. Resolver a primeira aÃƒÂ§ÃƒÂ£o aumenta sua chance de avanÃƒÂ§ar ainda hoje.`
        : unpreparedMeetings > 0
          ? `VocÃƒÂª possui ${unpreparedMeetings} reuniÃƒÂµes sem preparaÃƒÂ§ÃƒÂ£o. Organize o contexto antes do prÃƒÂ³ximo compromisso.`
          : staleOpportunities > 0
            ? `${staleOpportunities} oportunidades aguardam retomada hÃƒÂ¡ mais de 48 horas.`
            : scheduledFollowUp
              ? `PrÃƒÂ³ximo retorno com ${scheduledFollowUp.contactName}: ${scheduledFollowUp.dateLabel} ÃƒÂ s ${scheduledFollowUp.time}.`
              : "Sua operaÃƒÂ§ÃƒÂ£o estÃƒÂ¡ organizada. Comece pela prÃƒÂ³xima aÃƒÂ§ÃƒÂ£o recomendada.",

    intelligence,
  }
}
