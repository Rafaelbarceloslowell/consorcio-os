import type {
  ExternalCadence,
  ExternalConsultant,
  ExternalLead,
  ExternalMeeting,
  ExternalTimelineEvent,
} from "./types"

export type MockMaestroScenarioId =
  | "NEW_LEAD_CHECK_1"
  | "NO_RESPONSE_CHECK_3"
  | "OVERDUE_ACTIONS"
  | "CADENCE_PAUSED_NEXT_ACTION"
  | "MEETING_SCHEDULED"
  | "CADENCE_COMPLETED"

export type MockMaestroScenario = {
  id: MockMaestroScenarioId
  description: string
  consultants: ExternalConsultant[]
  leads: ExternalLead[]
  cadences: ExternalCadence[]
  meetings: ExternalMeeting[]
  timelineEvents: ExternalTimelineEvent[]
}

const CONTRACT_VERSION =
  "mock-maestro-v1"

const ORGANIZATION_ID =
  "maestro-organization-seals"

const CONSULTANT_ID =
  "maestro-consultant-rafael"

const SYNCHRONIZED_AT =
  "2026-08-05T22:00:00.000Z"

function createTrace(
  sourceRecordId: string,
  sourceUpdatedAt: string,
  sourceCode: string | null = null,
) {
  return {
    sourceSystem:
      "maestro",
    sourceRecordId,
    sourceCode,
    sourceUpdatedAt,
    synchronizedAt:
      SYNCHRONIZED_AT,
    contractVersion:
      CONTRACT_VERSION,
    dataOwner:
      "EXTERNAL_CRM" as const,
  }
}

function createConsultant(): ExternalConsultant {
  const updatedAt =
    "2026-08-05T20:00:00.000Z"

  return {
    externalConsultantId:
      CONSULTANT_ID,
    organizationId:
      ORGANIZATION_ID,
    name:
      "Rafael",
    role:
      "CONSULTANT",
    status:
      "ACTIVE",
    teamId:
      "maestro-team-invictus",
    eligibleForLeadDistribution:
      true,
    updatedAt,
    trace:
      createTrace(
        CONSULTANT_ID,
        updatedAt,
      ),
  }
}

function createLead({
  id,
  name,
  stage,
  status,
  updatedAt,
  nextActionAt = null,
}: {
  id: string
  name: string
  stage: string
  status: string
  updatedAt: string
  nextActionAt?: string | null
}): ExternalLead {
  return {
    externalLeadId:
      id,
    organizationId:
      ORGANIZATION_ID,
    ownerConsultantId:
      CONSULTANT_ID,
    assignedConsultantId:
      CONSULTANT_ID,
    name,
    phone:
      "5541999999999",
    email:
      null,
    source:
      "Lead Loja",
    stage,
    status,
    receivedAt:
      "2026-08-05T12:00:00.000Z",
    nextActionAt,
    convertedAt:
      null,
    archivedAt:
      null,
    updatedAt,
    trace:
      createTrace(
        id,
        updatedAt,
      ),
  }
}

function createAction({
  leadId,
  check,
  position,
  code,
  label,
  channel,
  period,
  status,
  dueState,
  scheduledFor,
  completedAt = null,
  resultCode = null,
}: {
  leadId: string
  check: number
  position: number
  code: string
  label: string
  channel:
    | "PHONE"
    | "WHATSAPP"
  period:
    | "MORNING"
    | "AFTERNOON"
    | "EVENING"
  status:
    | "PENDING"
    | "READY"
    | "COMPLETED"
  dueState:
    | "NOT_DUE"
    | "DUE"
    | "OVERDUE"
    | "COMPLETED"
  scheduledFor: string
  completedAt?: string | null
  resultCode?: string | null
}) {
  const actionId =
    `${leadId}-check-${check}-action-${position}`

  const updatedAt =
    completedAt ??
    scheduledFor

  return {
    externalActionId:
      actionId,
    externalActionCode:
      code,
    label,
    type:
      "CONTACT_ATTEMPT" as const,
    channel,
    period,
    position,
    status,
    dueState,
    scheduledFor,
    completedAt,
    completedByConsultantId:
      completedAt === null
        ? null
        : CONSULTANT_ID,
    resultCode,
    trace:
      createTrace(
        actionId,
        updatedAt,
        code,
      ),
  }
}

function createSevenActions({
  leadId,
  check,
  completedCount,
  overdueFromPosition = null,
}: {
  leadId: string
  check: number
  completedCount: number
  overdueFromPosition?: number | null
}) {
  const definitions = [
    [
      "morning_call_1",
      "Primeira ligação da manhã",
      "PHONE",
      "MORNING",
      "2026-08-05T12:00:00.000Z",
    ],
    [
      "morning_whatsapp",
      "WhatsApp da manhã",
      "WHATSAPP",
      "MORNING",
      "2026-08-05T13:00:00.000Z",
    ],
    [
      "morning_call_2",
      "Segunda ligação da manhã",
      "PHONE",
      "MORNING",
      "2026-08-05T14:00:00.000Z",
    ],
    [
      "afternoon_call_1",
      "Primeira ligação da tarde",
      "PHONE",
      "AFTERNOON",
      "2026-08-05T16:00:00.000Z",
    ],
    [
      "afternoon_call_2",
      "Segunda ligação da tarde",
      "PHONE",
      "AFTERNOON",
      "2026-08-05T17:00:00.000Z",
    ],
    [
      "afternoon_whatsapp",
      "WhatsApp da tarde",
      "WHATSAPP",
      "AFTERNOON",
      "2026-08-05T18:00:00.000Z",
    ],
    [
      "night_call",
      "Ligação noturna",
      "PHONE",
      "EVENING",
      "2026-08-05T22:00:00.000Z",
    ],
  ] as const

  return definitions.map(
    (
      [
        code,
        label,
        channel,
        period,
        scheduledFor,
      ],
      index,
    ) => {
      const position =
        index + 1

      const completed =
        position <=
        completedCount

      const overdue =
        !completed &&
        overdueFromPosition !==
          null &&
        position >=
          overdueFromPosition

      return createAction({
        leadId,
        check,
        position,
        code,
        label,
        channel,
        period,
        status:
          completed
            ? "COMPLETED"
            : overdue
              ? "READY"
              : "PENDING",
        dueState:
          completed
            ? "COMPLETED"
            : overdue
              ? "OVERDUE"
              : "NOT_DUE",
        scheduledFor,
        completedAt:
          completed
            ? scheduledFor
            : null,
        resultCode:
          completed
            ? "NO_ANSWER"
            : null,
      })
    },
  )
}

function createCadence({
  leadId,
  status,
  currentCheck,
  completedCount,
  paused = false,
  pauseReason = null,
  overdueFromPosition = null,
}: {
  leadId: string
  status:
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
  currentCheck: number
  completedCount: number
  paused?: boolean
  pauseReason?: string | null
  overdueFromPosition?: number | null
}): ExternalCadence {
  const actions =
    createSevenActions({
      leadId,
      check:
        currentCheck,
      completedCount,
      overdueFromPosition,
    })

  const nextAction =
    actions.find(
      (action) =>
        action.status !==
        "COMPLETED",
    ) ?? null

  const updatedAt =
    "2026-08-05T22:00:00.000Z"

  return {
    externalLeadId:
      leadId,
    organizationId:
      ORGANIZATION_ID,
    status,
    currentCheck,
    totalChecks:
      5,
    templateVersion:
      "official-v3",
    timezone:
      "America/Sao_Paulo",
    paused,
    pauseReason,
    startedAt:
      "2026-08-05T12:00:00.000Z",
    updatedAt,
    plannedActions:
      actions.length,
    completedActions:
      completedCount,
    nextActionId:
      nextAction?.externalActionId ??
      null,
    actions,
    trace:
      createTrace(
        `${leadId}-cadence`,
        updatedAt,
        "official-v3",
      ),
  }
}

function createTimelineEvent({
  leadId,
  id,
  eventType,
  summary,
  occurredAt,
}: {
  leadId: string
  id: string
  eventType: string
  summary: string
  occurredAt: string
}): ExternalTimelineEvent {
  return {
    externalEventId:
      id,
    externalLeadId:
      leadId,
    organizationId:
      ORGANIZATION_ID,
    eventType,
    occurredAt,
    actorConsultantId:
      CONSULTANT_ID,
    summary,
    trace:
      createTrace(
        id,
        occurredAt,
        eventType,
      ),
  }
}

function createMeeting(
  leadId: string,
): ExternalMeeting {
  const updatedAt =
    "2026-08-06T15:00:00.000Z"

  return {
    externalMeetingId:
      `${leadId}-meeting-1`,
    externalLeadId:
      leadId,
    organizationId:
      ORGANIZATION_ID,
    responsibleConsultantId:
      CONSULTANT_ID,
    title:
      "Conversa comercial",
    status:
      "SCHEDULED",
    scheduledFor:
      "2026-08-07T18:00:00.000Z",
    completedAt:
      null,
    updatedAt,
    trace:
      createTrace(
        `${leadId}-meeting-1`,
        updatedAt,
      ),
  }
}

function buildScenario(
  id: MockMaestroScenarioId,
): MockMaestroScenario {
  const consultant =
    createConsultant()

  if (
    id === "NEW_LEAD_CHECK_1"
  ) {
    const lead =
      createLead({
        id:
          "maestro-lead-new-001",
        name:
          "Lead novo",
        stage:
          "primeiro_contato",
        status:
          "active",
        updatedAt:
          "2026-08-05T12:00:00.000Z",
      })

    return {
      id,
      description:
        "Lead novo no primeiro Check, ainda sem ações concluídas.",
      consultants: [
        consultant,
      ],
      leads: [
        lead,
      ],
      cadences: [
        createCadence({
          leadId:
            lead.externalLeadId,
          status:
            "ACTIVE",
          currentCheck:
            1,
          completedCount:
            0,
        }),
      ],
      meetings: [],
      timelineEvents: [],
    }
  }

  if (
    id === "NO_RESPONSE_CHECK_3"
  ) {
    const lead =
      createLead({
        id:
          "maestro-lead-check-3",
        name:
          "Lead sem resposta",
        stage:
          "primeiro_contato",
        status:
          "active",
        updatedAt:
          "2026-08-05T18:00:00.000Z",
      })

    return {
      id,
      description:
        "Lead no terceiro Check após tentativas sem resposta.",
      consultants: [
        consultant,
      ],
      leads: [
        lead,
      ],
      cadences: [
        createCadence({
          leadId:
            lead.externalLeadId,
          status:
            "ACTIVE",
          currentCheck:
            3,
          completedCount:
            4,
        }),
      ],
      meetings: [],
      timelineEvents: [
        createTimelineEvent({
          leadId:
            lead.externalLeadId,
          id:
            "maestro-event-check-3",
          eventType:
            "CHECK_ACTION_COMPLETED",
          summary:
            "Tentativa registrada sem resposta.",
          occurredAt:
            "2026-08-05T18:00:00.000Z",
        }),
      ],
    }
  }

  if (
    id === "OVERDUE_ACTIONS"
  ) {
    const lead =
      createLead({
        id:
          "maestro-lead-overdue",
        name:
          "Lead com ações atrasadas",
        stage:
          "primeiro_contato",
        status:
          "active",
        updatedAt:
          "2026-08-05T22:00:00.000Z",
      })

    return {
      id,
      description:
        "Lead com ações do Check atual em atraso.",
      consultants: [
        consultant,
      ],
      leads: [
        lead,
      ],
      cadences: [
        createCadence({
          leadId:
            lead.externalLeadId,
          status:
            "ACTIVE",
          currentCheck:
            2,
          completedCount:
            2,
          overdueFromPosition:
            3,
        }),
      ],
      meetings: [],
      timelineEvents: [],
    }
  }

  if (
    id ===
    "CADENCE_PAUSED_NEXT_ACTION"
  ) {
    const lead =
      createLead({
        id:
          "maestro-lead-paused",
        name:
          "Lead com próximo passo",
        stage:
          "qualificado",
        status:
          "active",
        updatedAt:
          "2026-08-05T21:00:00.000Z",
        nextActionAt:
          "2026-08-06T18:00:00.000Z",
      })

    return {
      id,
      description:
        "Cadência pausada porque existe próximo passo definido.",
      consultants: [
        consultant,
      ],
      leads: [
        lead,
      ],
      cadences: [
        createCadence({
          leadId:
            lead.externalLeadId,
          status:
            "PAUSED",
          currentCheck:
            1,
          completedCount:
            2,
          paused:
            true,
          pauseReason:
            "NEXT_ACTION_DEFINED",
        }),
      ],
      meetings: [],
      timelineEvents: [
        createTimelineEvent({
          leadId:
            lead.externalLeadId,
          id:
            "maestro-event-next-action",
          eventType:
            "NEXT_ACTION_DEFINED",
          summary:
            "Próximo passo comercial definido.",
          occurredAt:
            "2026-08-05T21:00:00.000Z",
        }),
      ],
    }
  }

  if (
    id === "MEETING_SCHEDULED"
  ) {
    const lead =
      createLead({
        id:
          "maestro-lead-meeting",
        name:
          "Lead com reunião",
        stage:
          "qualificado",
        status:
          "active",
        updatedAt:
          "2026-08-06T15:00:00.000Z",
        nextActionAt:
          "2026-08-07T18:00:00.000Z",
      })

    return {
      id,
      description:
        "Lead com reunião marcada e cadência pausada.",
      consultants: [
        consultant,
      ],
      leads: [
        lead,
      ],
      cadences: [
        createCadence({
          leadId:
            lead.externalLeadId,
          status:
            "PAUSED",
          currentCheck:
            2,
          completedCount:
            3,
          paused:
            true,
          pauseReason:
            "MEETING_SCHEDULED",
        }),
      ],
      meetings: [
        createMeeting(
          lead.externalLeadId,
        ),
      ],
      timelineEvents: [
        createTimelineEvent({
          leadId:
            lead.externalLeadId,
          id:
            "maestro-event-meeting",
          eventType:
            "MEETING_SCHEDULED",
          summary:
            "Reunião comercial marcada.",
          occurredAt:
            "2026-08-06T15:00:00.000Z",
        }),
      ],
    }
  }

  const lead =
    createLead({
      id:
        "maestro-lead-completed",
      name:
        "Lead com cadência concluída",
      stage:
        "primeiro_contato",
      status:
        "active",
      updatedAt:
        "2026-08-09T22:00:00.000Z",
    })

  return {
    id,
    description:
      "Lead que concluiu o quinto Check sem avanço registrado.",
    consultants: [
      consultant,
    ],
    leads: [
      lead,
    ],
    cadences: [
      createCadence({
        leadId:
          lead.externalLeadId,
        status:
          "COMPLETED",
        currentCheck:
          5,
        completedCount:
          7,
      }),
    ],
    meetings: [],
    timelineEvents: [
      createTimelineEvent({
        leadId:
          lead.externalLeadId,
        id:
          "maestro-event-cadence-completed",
        eventType:
          "CADENCE_COMPLETED",
        summary:
          "Cadência oficial concluída.",
        occurredAt:
          "2026-08-09T22:00:00.000Z",
      }),
    ],
  }
}

export const MOCK_MAESTRO_SCENARIO_IDS: MockMaestroScenarioId[] = [
  "NEW_LEAD_CHECK_1",
  "NO_RESPONSE_CHECK_3",
  "OVERDUE_ACTIONS",
  "CADENCE_PAUSED_NEXT_ACTION",
  "MEETING_SCHEDULED",
  "CADENCE_COMPLETED",
]

export function createMockMaestroScenario(
  id: MockMaestroScenarioId,
): MockMaestroScenario {
  return buildScenario(
    id,
  )
}
