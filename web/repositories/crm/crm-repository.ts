import type {
  Client,
  Consortium,
  Consultant,
  Lead,
  Meeting,
  PipelineStage,
  Proposal,
  Sale,
} from "@/types/domain"

export interface CrmRepository {
  getLeads(): Lead[]

  getLeadById(
    leadId: string,
  ): Lead | undefined

  getClients(): Client[]

  getClientById(
    clientId: string,
  ): Client | undefined

  getConsultants(): Consultant[]

  getConsultantById(
    consultantId: string,
  ): Consultant | undefined

  getPipelineStages(): PipelineStage[]

  getPipelineStageById(
    pipelineStageId: string,
  ): PipelineStage | undefined

  getMeetings(): Meeting[]

  getMeetingById(
    meetingId: string,
  ): Meeting | undefined

  getConsortiums(): Consortium[]

  getConsortiumById(
    consortiumId: string,
  ): Consortium | undefined

  getProposals(): Proposal[]

  getProposalById(
    proposalId: string,
  ): Proposal | undefined

  getSales(): Sale[]

  getSaleById(
    saleId: string,
  ): Sale | undefined

  createLead(
    lead: Lead,
  ): Lead

  updateLead(
    lead: Lead,
  ): Lead

  createClient(
    client: Client,
  ): Client

  updateClient(
    client: Client,
  ): Client

  createMeeting(
    meeting: Meeting,
  ): Meeting

  createProposal(
    proposal: Proposal,
  ): Proposal

  updateProposal(
    proposal: Proposal,
  ): Proposal

  createSale(
    sale: Sale,
  ): Sale

  deleteSale(
    saleId: string,
  ): void
}