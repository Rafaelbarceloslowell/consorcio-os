import type {
  ExternalCrmConnector,
} from "./connector"

import {
  createMockMaestroScenario,
} from "./mock-maestro-scenarios"

import type {
  MockMaestroScenarioId,
} from "./mock-maestro-scenarios"

import type {
  ExternalCadence,
  ExternalConsultant,
  ExternalCrmHealth,
  ExternalLead,
  ExternalLeadListInput,
  ExternalLeadPage,
  ExternalMeeting,
  ExternalMeetingListInput,
  ExternalTimelineEvent,
} from "./types"

const PROVIDER_ID =
  "MOCK_MAESTRO"

const CONTRACT_VERSION =
  "mock-maestro-v1"

function normalizeRequiredId(
  value: string,
  label: string,
): string {
  const normalized =
    value.trim()

  if (!normalized) {
    throw new Error(
      `${label} é obrigatório.`,
    )
  }

  return normalized
}

function normalizeLimit(
  limit: number | undefined,
): number {
  if (limit === undefined) {
    return 50
  }

  if (
    !Number.isInteger(
      limit,
    ) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error(
      "O limite deve ser um número inteiro entre 1 e 100.",
    )
  }

  return limit
}

function decodeCursor(
  cursor: string | null | undefined,
): number {
  if (
    cursor === null ||
    cursor === undefined
  ) {
    return 0
  }

  const match =
    /^index:(\d+)$/.exec(
      cursor.trim(),
    )

  if (match === null) {
    throw new Error(
      "Cursor inválido para o conector Maestro simulado.",
    )
  }

  return Number(
    match[1],
  )
}

function cloneConsultant(
  consultant: ExternalConsultant,
): ExternalConsultant {
  return {
    ...consultant,
    trace: {
      ...consultant.trace,
    },
  }
}

function cloneLead(
  lead: ExternalLead,
): ExternalLead {
  return {
    ...lead,
    trace: {
      ...lead.trace,
    },
  }
}

function cloneCadence(
  cadence: ExternalCadence,
): ExternalCadence {
  return {
    ...cadence,
    actions:
      cadence.actions.map(
        (action) => ({
          ...action,
          trace: {
            ...action.trace,
          },
        }),
      ),
    trace: {
      ...cadence.trace,
    },
  }
}

function cloneMeeting(
  meeting: ExternalMeeting,
): ExternalMeeting {
  return {
    ...meeting,
    trace: {
      ...meeting.trace,
    },
  }
}

function cloneTimelineEvent(
  event: ExternalTimelineEvent,
): ExternalTimelineEvent {
  return {
    ...event,
    trace: {
      ...event.trace,
    },
  }
}

export class MockMaestroConnector
implements ExternalCrmConnector {
  readonly providerId =
    PROVIDER_ID

  readonly contractVersion =
    CONTRACT_VERSION

  readonly capabilities = {
    healthRead: true,
    consultantsRead: true,
    leadsRead: true,
    cadenceRead: true,
    timelineRead: true,
    meetingsRead: true,
    writes: false,
  } as const

  private readonly scenario

  constructor(
    scenarioId:
      MockMaestroScenarioId =
        "NEW_LEAD_CHECK_1",
  ) {
    this.scenario =
      createMockMaestroScenario(
        scenarioId,
      )
  }

  async getHealth(): Promise<ExternalCrmHealth> {
    return {
      providerId:
        this.providerId,
      status:
        "AVAILABLE",
      contractVersion:
        this.contractVersion,
      readOnly:
        true,
      checkedAt:
        "2026-08-05T22:00:00.000Z",
      diagnostics: [
        `Cenário ativo: ${this.scenario.id}.`,
        "Nenhum acesso ao Maestro real foi realizado.",
      ],
    }
  }

  async listConsultants(): Promise<ExternalConsultant[]> {
    return this.scenario.consultants.map(
      cloneConsultant,
    )
  }

  async listLeads(
    input: ExternalLeadListInput = {},
  ): Promise<ExternalLeadPage> {
    const limit =
      normalizeLimit(
        input.limit,
      )

    const startIndex =
      decodeCursor(
        input.cursor,
      )

    const filteredLeads =
      this.scenario.leads.filter(
        (lead) => {
          if (
            input.updatedSince &&
            lead.updatedAt <=
              input.updatedSince
          ) {
            return false
          }

          if (
            input.assignedConsultantId &&
            lead.assignedConsultantId !==
              input.assignedConsultantId
          ) {
            return false
          }

          if (
            input.status &&
            lead.status !==
              input.status
          ) {
            return false
          }

          if (
            input.stage &&
            lead.stage !==
              input.stage
          ) {
            return false
          }

          if (
            input.source &&
            lead.source !==
              input.source
          ) {
            return false
          }

          return true
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.updatedAt.localeCompare(
            second.updatedAt,
          ) ||
          first.externalLeadId.localeCompare(
            second.externalLeadId,
          ),
      )

    const items =
      filteredLeads
        .slice(
          startIndex,
          startIndex +
            limit,
        )
        .map(
          cloneLead,
        )

    const nextIndex =
      startIndex +
      items.length

    const hasMore =
      nextIndex <
      filteredLeads.length

    return {
      items,
      nextCursor:
        hasMore
          ? `index:${nextIndex}`
          : null,
      hasMore,
      synchronizedAt:
        "2026-08-05T22:00:00.000Z",
    }
  }

  async getLead(
    externalLeadId: string,
  ): Promise<ExternalLead | null> {
    const normalizedLeadId =
      normalizeRequiredId(
        externalLeadId,
        "O ID externo do lead",
      )

    const lead =
      this.scenario.leads.find(
        (candidate) =>
          candidate.externalLeadId ===
          normalizedLeadId,
      )

    return lead
      ? cloneLead(
          lead,
        )
      : null
  }

  async getLeadCadence(
    externalLeadId: string,
  ): Promise<ExternalCadence | null> {
    const normalizedLeadId =
      normalizeRequiredId(
        externalLeadId,
        "O ID externo do lead",
      )

    const cadence =
      this.scenario.cadences.find(
        (candidate) =>
          candidate.externalLeadId ===
          normalizedLeadId,
      )

    return cadence
      ? cloneCadence(
          cadence,
        )
      : null
  }

  async getLeadTimeline(
    externalLeadId: string,
  ): Promise<ExternalTimelineEvent[]> {
    const normalizedLeadId =
      normalizeRequiredId(
        externalLeadId,
        "O ID externo do lead",
      )

    return this.scenario.timelineEvents
      .filter(
        (event) =>
          event.externalLeadId ===
          normalizedLeadId,
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.occurredAt.localeCompare(
            second.occurredAt,
          ),
      )
      .map(
        cloneTimelineEvent,
      )
  }

  async listMeetings(
    input: ExternalMeetingListInput = {},
  ): Promise<ExternalMeeting[]> {
    return this.scenario.meetings
      .filter(
        (meeting) => {
          if (
            input.externalLeadId &&
            meeting.externalLeadId !==
              input.externalLeadId
          ) {
            return false
          }

          if (
            input.responsibleConsultantId &&
            meeting.responsibleConsultantId !==
              input.responsibleConsultantId
          ) {
            return false
          }

          if (
            input.status &&
            meeting.status !==
              input.status
          ) {
            return false
          }

          return true
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.scheduledFor.localeCompare(
            second.scheduledFor,
          ),
      )
      .map(
        cloneMeeting,
      )
  }

  async getMeeting(
    externalMeetingId: string,
  ): Promise<ExternalMeeting | null> {
    const normalizedMeetingId =
      normalizeRequiredId(
        externalMeetingId,
        "O ID externo da reunião",
      )

    const meeting =
      this.scenario.meetings.find(
        (candidate) =>
          candidate.externalMeetingId ===
          normalizedMeetingId,
      )

    return meeting
      ? cloneMeeting(
          meeting,
        )
      : null
  }
}
