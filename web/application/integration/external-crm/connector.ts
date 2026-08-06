import type {
  ExternalCadence,
  ExternalConsultant,
  ExternalCrmConnectorCapabilities,
  ExternalCrmHealth,
  ExternalLead,
  ExternalLeadListInput,
  ExternalLeadPage,
  ExternalMeeting,
  ExternalMeetingListInput,
  ExternalTimelineEvent,
} from "./types"

export interface ExternalCrmConnector {
  readonly providerId: string
  readonly contractVersion: string
  readonly capabilities: ExternalCrmConnectorCapabilities

  getHealth(): Promise<ExternalCrmHealth>

  listConsultants(): Promise<ExternalConsultant[]>

  listLeads(
    input?: ExternalLeadListInput,
  ): Promise<ExternalLeadPage>

  getLead(
    externalLeadId: string,
  ): Promise<ExternalLead | null>

  getLeadCadence(
    externalLeadId: string,
  ): Promise<ExternalCadence | null>

  getLeadTimeline(
    externalLeadId: string,
  ): Promise<ExternalTimelineEvent[]>

  listMeetings(
    input?: ExternalMeetingListInput,
  ): Promise<ExternalMeeting[]>

  getMeeting(
    externalMeetingId: string,
  ): Promise<ExternalMeeting | null>
}
