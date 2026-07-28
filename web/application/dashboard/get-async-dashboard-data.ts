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
      "O workspace é obrigatório para carregar o Mission Control.",
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
    }),

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

  const baseDashboardData: DashboardData = {
    user: selectedConsultant
      ? {
          id:
            selectedConsultant.id,
          name:
            selectedConsultant.name,
        }
      : {
          id: "commercial-team",
          name: "Equipe Comercial",
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
      operationalActions,
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

  const newLeads =
    consultantLeads.filter(
      (lead) =>
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
                  "Lead não identificado"
                )
              : (
                  client?.name ??
                  "Cliente não identificado"
                ),
          consultantName:
            consultant?.name ??
            "Consultor não identificado",
          priority:
            opportunity.priority,
          score:
            opportunity.score,
          phaseName:
            phase?.name ??
            "Fase indisponível",
          stateName:
            state?.name ??
            "Estado indisponível",
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
              "Contato não identificado",
          }
        },
      )

  const dashboardTasks =
    tasks
      .filter(
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

  const topOpportunity =
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

  const gorilaR2 =
    buildGorilaR2Briefing({
      intelligence,
    })

  return {
    ...dashboardData,

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
      criticalCount > 0
        ? `Hoje existem ${criticalCount} oportunidades críticas. Resolver a primeira ação aumenta sua chance de avançar ainda hoje.`
        : unpreparedMeetings > 0
          ? `Você possui ${unpreparedMeetings} reuniões sem preparação. Organize o contexto antes do próximo compromisso.`
          : staleOpportunities > 0
            ? `${staleOpportunities} oportunidades aguardam retomada há mais de 48 horas.`
            : "Sua operação está organizada. Comece pela próxima ação recomendada.",

    intelligence,
  }
}
