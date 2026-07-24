import { mockCrmData } from "@/data/mock-crm"

import type {
  Client,
  Consortium,
  Consultant,
  CrmDomain,
  Lead,
  Meeting,
  PipelineStage,
  Proposal,
  Sale,
} from "@/types/domain"

import type {
  CrmRepository,
} from "./crm-repository"

type MockCrmRepositoryData = Pick<
  CrmDomain,
  | "leads"
  | "clients"
  | "consultants"
  | "pipelineStages"
  | "meetings"
  | "consortiums"
  | "proposals"
  | "sales"
>

export class MockCrmRepository
  implements CrmRepository
{
  private readonly leads: Lead[]
  private readonly clients: Client[]
  private readonly consultants: Consultant[]
  private readonly pipelineStages: PipelineStage[]
  private readonly meetings: Meeting[]
  private readonly consortiums: Consortium[]
  private readonly proposals: Proposal[]
  private readonly sales: Sale[]

  constructor(
    data: MockCrmRepositoryData = mockCrmData,
  ) {
    this.leads = [
      ...data.leads,
    ]

    this.clients = [
      ...data.clients,
    ]

    this.consultants = [
      ...data.consultants,
    ]

    this.pipelineStages = [
      ...data.pipelineStages,
    ]

    this.meetings = [
      ...data.meetings,
    ]

    this.consortiums = [
      ...data.consortiums,
    ]

    this.proposals = [
      ...data.proposals,
    ]

    this.sales = [
      ...data.sales,
    ]
  }

  getLeads(): Lead[] {
    return [
      ...this.leads,
    ]
  }

  getLeadById(
    leadId: string,
  ): Lead | undefined {
    return this.leads.find(
      (lead) =>
        lead.id === leadId,
    )
  }

  getClients(): Client[] {
    return [
      ...this.clients,
    ]
  }

  getClientById(
    clientId: string,
  ): Client | undefined {
    return this.clients.find(
      (client) =>
        client.id === clientId,
    )
  }

  getConsultants(): Consultant[] {
    return [
      ...this.consultants,
    ]
  }

  getConsultantById(
    consultantId: string,
  ): Consultant | undefined {
    return this.consultants.find(
      (consultant) =>
        consultant.id === consultantId,
    )
  }

  getPipelineStages(): PipelineStage[] {
    return [
      ...this.pipelineStages,
    ]
  }

  getPipelineStageById(
    pipelineStageId: string,
  ): PipelineStage | undefined {
    return this.pipelineStages.find(
      (pipelineStage) =>
        pipelineStage.id === pipelineStageId,
    )
  }

  getMeetings(): Meeting[] {
    return [
      ...this.meetings,
    ]
  }

  getMeetingById(
    meetingId: string,
  ): Meeting | undefined {
    return this.meetings.find(
      (meeting) =>
        meeting.id === meetingId,
    )
  }

  getConsortiums(): Consortium[] {
    return [
      ...this.consortiums,
    ]
  }

  getConsortiumById(
    consortiumId: string,
  ): Consortium | undefined {
    return this.consortiums.find(
      (consortium) =>
        consortium.id === consortiumId,
    )
  }

  getProposals(): Proposal[] {
    return [
      ...this.proposals,
    ]
  }

  getProposalById(
    proposalId: string,
  ): Proposal | undefined {
    return this.proposals.find(
      (proposal) =>
        proposal.id === proposalId,
    )
  }

  getSales(): Sale[] {
    return [
      ...this.sales,
    ]
  }

  getSaleById(
    saleId: string,
  ): Sale | undefined {
    return this.sales.find(
      (sale) =>
        sale.id === saleId,
    )
  }

  createLead(
    lead: Lead,
  ): Lead {
    this.leads.push(
      lead,
    )

    return lead
  }

  updateLead(
    lead: Lead,
  ): Lead {
    const leadIndex =
      this.leads.findIndex(
        (currentLead) =>
          currentLead.id === lead.id,
      )

    if (leadIndex === -1) {
      throw new Error(
        `Lead não encontrado para o ID "${lead.id}".`,
      )
    }

    this.leads[leadIndex] =
      lead

    return lead
  }

  createClient(
    client: Client,
  ): Client {
    this.clients.push(
      client,
    )

    return client
  }

  updateClient(
    client: Client,
  ): Client {
    const clientIndex =
      this.clients.findIndex(
        (currentClient) =>
          currentClient.id === client.id,
      )

    if (clientIndex === -1) {
      throw new Error(
        `Cliente não encontrado para o ID "${client.id}".`,
      )
    }

    this.clients[clientIndex] =
      client

    return client
  }

  createMeeting(
    meeting: Meeting,
  ): Meeting {
    this.meetings.push(
      meeting,
    )

    return meeting
  }

  createProposal(
    proposal: Proposal,
  ): Proposal {
    this.proposals.push(
      proposal,
    )

    return proposal
  }

  updateProposal(
    proposal: Proposal,
  ): Proposal {
    const proposalIndex =
      this.proposals.findIndex(
        (currentProposal) =>
          currentProposal.id === proposal.id,
      )

    if (proposalIndex === -1) {
      throw new Error(
        `Proposta não encontrada para o ID "${proposal.id}".`,
      )
    }

    this.proposals[proposalIndex] =
      proposal

    return proposal
  }

  createSale(
    sale: Sale,
  ): Sale {
    this.sales.push(
      sale,
    )

    return sale
  }

  deleteSale(
    saleId: string,
  ): void {
    const saleIndex =
      this.sales.findIndex(
        (sale) =>
          sale.id === saleId,
      )

    if (saleIndex === -1) {
      throw new Error(
        `Venda não encontrada para o ID "${saleId}".`,
      )
    }

    this.sales.splice(
      saleIndex,
      1,
    )
  }
}

export const mockCrmRepository =
  new MockCrmRepository()