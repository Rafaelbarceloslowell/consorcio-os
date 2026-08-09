import {
  MeetingStatus,
  TaskStatus,
} from "@/lib/generated/prisma/client"

import {
  AgendaBoard,
} from "@/components/agenda/agenda-board"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  AgendaView,
} from "@/types/agenda"

import {
  completeAgendaMeetingAction,
  completeAgendaTaskAction,
  rescheduleAgendaMeetingAction,
  rescheduleAgendaTaskAction,
} from "./actions"

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  )

function toDateTimeLocal(
  value: Date,
): string {
  const offset =
    value.getTimezoneOffset()
  const localDate =
    new Date(
      value.getTime() -
        offset * 60_000,
    )

  return localDate
    .toISOString()
    .slice(0, 16)
}

export const dynamic = "force-dynamic"

export default async function AgendaPage() {
  const workspace =
    await prisma.workspace.findUnique({
      where: {
        slug: "consorcio-os",
      },
      select: {
        id: true,
      },
    })

  if (!workspace) {
    throw new Error(
      'Workspace "consorcio-os" não encontrado.',
    )
  }

  const [tasks, meetings] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          workspaceId: workspace.id,
          status: {
            in: [
              TaskStatus.PENDING,
              TaskStatus.IN_PROGRESS,
            ],
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueAt: true,
          lead: {
            select: {
              name: true,
              commercialJourneys: {
                where: {
                  closedAt: null,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
                select: {
                  id: true,
                },
              },
            },
          },
          client: {
            select: {
              name: true,
              commercialJourneys: {
                where: {
                  closedAt: null,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            priority: "asc",
          },
        ],
      }),
      prisma.meeting.findMany({
        where: {
          workspaceId: workspace.id,
          status:
            MeetingStatus.SCHEDULED,
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          startAt: true,
          endAt: true,
          location: true,
          meetingUrl: true,
          opportunity: {
            select: {
              id: true,
              title: true,
              conversationMemory: {
                select: {
                  narrativeSummary: true,
                  lastIncomingMessage: true,
                  goal: true,
                  observedAt: true,
                },
              },
            },
          },
          lead: {
            select: {
              name: true,
              commercialJourneys: {
                where: {
                  closedAt: null,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
                select: {
                  id: true,
                },
              },
            },
          },
          client: {
            select: {
              name: true,
              commercialJourneys: {
                where: {
                  closedAt: null,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: {
          startAt: "asc",
        },
      }),
    ])

  const now = new Date()

  const view: AgendaView = {
    tasks: tasks.map((task) => {
      const relation =
        task.lead ?? task.client
      const journey =
        task.lead
          ?.commercialJourneys[0] ??
        task.client
          ?.commercialJourneys[0]

      return {
        id: task.id,
        title: task.title,
        description:
          task.description,
        statusLabel:
          task.status ===
          TaskStatus.IN_PROGRESS
            ? "Em andamento"
            : "Pendente",
        priorityLabel:
          task.priority === "HIGH"
            ? "Alta"
            : task.priority === "LOW"
              ? "Baixa"
              : "Média",
        dueAtLabel:
          dateTimeFormatter.format(
            task.dueAt,
          ),
        dueAtInput:
          toDateTimeLocal(
            task.dueAt,
          ),
        overdue:
          task.dueAt.getTime() <
          now.getTime(),
        relatedName:
          relation?.name ??
          "Sem contato vinculado",
        opportunityHref:
          journey
            ? `/opportunities/${encodeURIComponent(
                journey.id,
              )}`
            : null,
      }
    }),
    meetings: meetings.map(
      (meeting) => {
        const relation =
          meeting.lead ??
          meeting.client
        const journey =
          meeting.opportunity ??
          meeting.lead
            ?.commercialJourneys[0] ??
          meeting.client
            ?.commercialJourneys[0]

        return {
          id: meeting.id,
          title: meeting.title,
          description:
            meeting.description,
          typeLabel:
            meeting.type ===
            "IN_PERSON"
              ? "Presencial"
              : meeting.type ===
                  "ONLINE"
                ? "Online"
                : "Telefone",
          startAtLabel:
            dateTimeFormatter.format(
              meeting.startAt,
            ),
          startAtInput:
            toDateTimeLocal(
              meeting.startAt,
            ),
          endAtInput:
            toDateTimeLocal(
              meeting.endAt,
            ),
          relatedName:
            relation?.name ??
            "Sem contato vinculado",
          location:
            meeting.location,
          meetingUrl:
            meeting.meetingUrl,
          liveBriefing:
            meeting.opportunity
              ?.conversationMemory
              ?.narrativeSummary ??
            meeting.opportunity
              ?.conversationMemory
              ?.lastIncomingMessage ??
            null,
          opportunityHref:
            journey
              ? `/opportunities/${encodeURIComponent(
                  journey.id,
                )}`
              : null,
        }
      },
    ),
  }

  return (
    <AgendaBoard
      view={view}
      completeTaskAction={
        completeAgendaTaskAction
      }
      rescheduleTaskAction={
        rescheduleAgendaTaskAction
      }
      completeMeetingAction={
        completeAgendaMeetingAction
      }
      rescheduleMeetingAction={
        rescheduleAgendaMeetingAction
      }
    />
  )
}
