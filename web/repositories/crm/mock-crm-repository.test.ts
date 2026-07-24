import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    mockClients,
    mockConsortiums,
    mockConsultants,
    mockLeads,
    mockMeetings,
    mockPipelineStages,
    mockProposals,
    mockSales,
  } from "@/data/mock-crm"
  
  import type {
    Client,
    Lead,
    Meeting,
    Proposal,
    Sale,
  } from "@/types/domain"
  
  import {
    MockCrmRepository,
  } from "./mock-crm-repository"
  
  const EMPTY_DATA = {
    leads: [],
    clients: [],
    consultants: [],
    pipelineStages: [],
    meetings: [],
    consortiums: [],
    proposals: [],
    sales: [],
  }
  
  describe(
    "MockCrmRepository",
    () => {
      it(
        "deve iniciar sem dados quando receber coleções vazias",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          expect(
            repository.getLeads(),
          ).toEqual([])
  
          expect(
            repository.getClients(),
          ).toEqual([])
  
          expect(
            repository.getConsultants(),
          ).toEqual([])
  
          expect(
            repository.getPipelineStages(),
          ).toEqual([])
  
          expect(
            repository.getMeetings(),
          ).toEqual([])
  
          expect(
            repository.getConsortiums(),
          ).toEqual([])
  
          expect(
            repository.getProposals(),
          ).toEqual([])
  
          expect(
            repository.getSales(),
          ).toEqual([])
        },
      )
  
      it(
        "deve utilizar os dados mockados por padrão",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getLeads(),
          ).toEqual(
            mockLeads,
          )
  
          expect(
            repository.getClients(),
          ).toEqual(
            mockClients,
          )
  
          expect(
            repository.getConsultants(),
          ).toEqual(
            mockConsultants,
          )
  
          expect(
            repository.getPipelineStages(),
          ).toEqual(
            mockPipelineStages,
          )
  
          expect(
            repository.getMeetings(),
          ).toEqual(
            mockMeetings,
          )
  
          expect(
            repository.getConsortiums(),
          ).toEqual(
            mockConsortiums,
          )
  
          expect(
            repository.getProposals(),
          ).toEqual(
            mockProposals,
          )
  
          expect(
            repository.getSales(),
          ).toEqual(
            mockSales,
          )
        },
      )
  
      it(
        "deve consultar um lead pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const lead =
            mockLeads[0]
  
          expect(
            repository.getLeadById(
              lead.id,
            ),
          ).toEqual(
            lead,
          )
        },
      )
  
      it(
        "deve retornar undefined quando o lead não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getLeadById(
              "lead-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar um cliente pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const client =
            mockClients[0]
  
          expect(
            repository.getClientById(
              client.id,
            ),
          ).toEqual(
            client,
          )
        },
      )
  
      it(
        "deve retornar undefined quando o cliente não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getClientById(
              "client-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar um consultor pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const consultant =
            mockConsultants[0]
  
          expect(
            repository.getConsultantById(
              consultant.id,
            ),
          ).toEqual(
            consultant,
          )
        },
      )
  
      it(
        "deve retornar undefined quando o consultor não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getConsultantById(
              "consultant-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar uma etapa do pipeline pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const pipelineStage =
            mockPipelineStages[0]
  
          expect(
            repository.getPipelineStageById(
              pipelineStage.id,
            ),
          ).toEqual(
            pipelineStage,
          )
        },
      )
  
      it(
        "deve retornar undefined quando a etapa do pipeline não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getPipelineStageById(
              "stage-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar uma reunião pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const meeting =
            mockMeetings[0]
  
          expect(
            repository.getMeetingById(
              meeting.id,
            ),
          ).toEqual(
            meeting,
          )
        },
      )
  
      it(
        "deve retornar undefined quando a reunião não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getMeetingById(
              "meeting-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar um consórcio pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const consortium =
            mockConsortiums[0]
  
          expect(
            repository.getConsortiumById(
              consortium.id,
            ),
          ).toEqual(
            consortium,
          )
        },
      )
  
      it(
        "deve retornar undefined quando o consórcio não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getConsortiumById(
              "consortium-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar uma proposta pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const proposal =
            mockProposals[0]
  
          expect(
            repository.getProposalById(
              proposal.id,
            ),
          ).toEqual(
            proposal,
          )
        },
      )
  
      it(
        "deve retornar undefined quando a proposta não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getProposalById(
              "proposal-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve consultar uma venda pelo ID",
        () => {
          const repository =
            new MockCrmRepository()
  
          const sale =
            mockSales[0]
  
          expect(
            repository.getSaleById(
              sale.id,
            ),
          ).toEqual(
            sale,
          )
        },
      )
  
      it(
        "deve retornar undefined quando a venda não existir",
        () => {
          const repository =
            new MockCrmRepository()
  
          expect(
            repository.getSaleById(
              "sale-inexistente",
            ),
          ).toBeUndefined()
        },
      )
  
      it(
        "deve criar um lead",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const lead: Lead = {
            ...mockLeads[0],
            id:
              "lead-created",
            email:
              "novo.lead@email.com",
          }
  
          expect(
            repository.createLead(
              lead,
            ),
          ).toEqual(
            lead,
          )
  
          expect(
            repository.getLeads(),
          ).toEqual([
            lead,
          ])
  
          expect(
            repository.getLeadById(
              lead.id,
            ),
          ).toEqual(
            lead,
          )
        },
      )
  
      it(
        "deve atualizar um lead existente",
        () => {
          const originalLead =
            mockLeads[0]
  
          const repository =
            new MockCrmRepository({
              ...EMPTY_DATA,
  
              leads: [
                originalLead,
              ],
            })
  
          const updatedLead: Lead = {
            ...originalLead,
  
            name:
              "João Silva Atualizado",
  
            status:
              "qualified",
  
            score:
              90,
  
            updatedAt:
              "2026-07-22T19:00:00.000Z",
          }
  
          expect(
            repository.updateLead(
              updatedLead,
            ),
          ).toEqual(
            updatedLead,
          )
  
          expect(
            repository.getLeadById(
              originalLead.id,
            ),
          ).toEqual(
            updatedLead,
          )
  
          expect(
            repository.getLeads(),
          ).toEqual([
            updatedLead,
          ])
        },
      )
  
      it(
        "deve rejeitar a atualização de um lead inexistente",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const lead: Lead = {
            ...mockLeads[0],
  
            id:
              "lead-inexistente",
          }
  
          expect(() =>
            repository.updateLead(
              lead,
            ),
          ).toThrow(
            `Lead não encontrado para o ID "${lead.id}".`,
          )
        },
      )
  
      it(
        "deve criar um cliente",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const client: Client = {
            ...mockClients[0],
  
            id:
              "client-created",
  
            email:
              "novo.cliente@email.com",
          }
  
          expect(
            repository.createClient(
              client,
            ),
          ).toEqual(
            client,
          )
  
          expect(
            repository.getClients(),
          ).toEqual([
            client,
          ])
  
          expect(
            repository.getClientById(
              client.id,
            ),
          ).toEqual(
            client,
          )
        },
      )
  
      it(
        "deve criar uma reunião",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const meeting: Meeting = {
            ...mockMeetings[0],
  
            id:
              "meeting-created",
  
            title:
              "Reunião de apresentação",
          }
  
          expect(
            repository.createMeeting(
              meeting,
            ),
          ).toEqual(
            meeting,
          )
  
          expect(
            repository.getMeetings(),
          ).toEqual([
            meeting,
          ])
  
          expect(
            repository.getMeetingById(
              meeting.id,
            ),
          ).toEqual(
            meeting,
          )
        },
      )
  
      it(
        "deve criar uma proposta",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const proposal: Proposal = {
            ...mockProposals[0],
  
            id:
              "proposal-created",
  
            code:
              "PROP-2026-9999",
  
            status:
              "draft",
  
            sentAt:
              undefined,
  
            acceptedAt:
              undefined,
  
            createdAt:
              "2026-07-22T20:00:00.000Z",
  
            updatedAt:
              "2026-07-22T20:00:00.000Z",
          }
  
          expect(
            repository.createProposal(
              proposal,
            ),
          ).toEqual(
            proposal,
          )
  
          expect(
            repository.getProposals(),
          ).toEqual([
            proposal,
          ])
  
          expect(
            repository.getProposalById(
              proposal.id,
            ),
          ).toEqual(
            proposal,
          )
        },
      )
  
      it(
        "deve atualizar uma proposta existente",
        () => {
          const originalProposal =
            mockProposals[1]
  
          const repository =
            new MockCrmRepository({
              ...EMPTY_DATA,
  
              proposals: [
                originalProposal,
              ],
            })
  
          const updatedProposal: Proposal = {
            ...originalProposal,
  
            status:
              "accepted",
  
            acceptedAt:
              "2026-07-22T21:00:00.000Z",
  
            updatedAt:
              "2026-07-22T21:00:00.000Z",
          }
  
          expect(
            repository.updateProposal(
              updatedProposal,
            ),
          ).toEqual(
            updatedProposal,
          )
  
          expect(
            repository.getProposalById(
              originalProposal.id,
            ),
          ).toEqual(
            updatedProposal,
          )
  
          expect(
            repository.getProposals(),
          ).toEqual([
            updatedProposal,
          ])
        },
      )
  
      it(
        "deve rejeitar a atualização de uma proposta inexistente",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const proposal: Proposal = {
            ...mockProposals[0],
  
            id:
              "proposal-inexistente",
          }
  
          expect(() =>
            repository.updateProposal(
              proposal,
            ),
          ).toThrow(
            `Proposta não encontrada para o ID "${proposal.id}".`,
          )
        },
      )
  
      it(
        "deve criar uma venda",
        () => {
          const repository =
            new MockCrmRepository(
              EMPTY_DATA,
            )
  
          const sale: Sale = {
            ...mockSales[0],
  
            id:
              "sale-created",
  
            contractNumber:
              "CTR-2026-9999",
          }
  
          expect(
            repository.createSale(
              sale,
            ),
          ).toEqual(
            sale,
          )
  
          expect(
            repository.getSales(),
          ).toEqual([
            sale,
          ])
  
          expect(
            repository.getSaleById(
              sale.id,
            ),
          ).toEqual(
            sale,
          )
        },
      )
  
      it(
        "deve proteger as coleções internas contra alterações externas",
        () => {
          const repository =
            new MockCrmRepository()
  
          const leads =
            repository.getLeads()
  
          const clients =
            repository.getClients()
  
          const consultants =
            repository.getConsultants()
  
          const pipelineStages =
            repository.getPipelineStages()
  
          const meetings =
            repository.getMeetings()
  
          const consortiums =
            repository.getConsortiums()
  
          const proposals =
            repository.getProposals()
  
          const sales =
            repository.getSales()
  
          leads.length = 0
          clients.length = 0
          consultants.length = 0
          pipelineStages.length = 0
          meetings.length = 0
          consortiums.length = 0
          proposals.length = 0
          sales.length = 0
  
          expect(
            repository.getLeads(),
          ).toHaveLength(
            mockLeads.length,
          )
  
          expect(
            repository.getClients(),
          ).toHaveLength(
            mockClients.length,
          )
  
          expect(
            repository.getConsultants(),
          ).toHaveLength(
            mockConsultants.length,
          )
  
          expect(
            repository.getPipelineStages(),
          ).toHaveLength(
            mockPipelineStages.length,
          )
  
          expect(
            repository.getMeetings(),
          ).toHaveLength(
            mockMeetings.length,
          )
  
          expect(
            repository.getConsortiums(),
          ).toHaveLength(
            mockConsortiums.length,
          )
  
          expect(
            repository.getProposals(),
          ).toHaveLength(
            mockProposals.length,
          )
  
          expect(
            repository.getSales(),
          ).toHaveLength(
            mockSales.length,
          )
        },
      )
  
      it(
        "deve copiar as coleções recebidas pelo construtor",
        () => {
          const leads = [
            mockLeads[0],
          ]
  
          const clients = [
            mockClients[0],
          ]
  
          const proposals = [
            mockProposals[0],
          ]
  
          const repository =
            new MockCrmRepository({
              ...EMPTY_DATA,
  
              leads,
              clients,
              proposals,
            })
  
          leads.length = 0
          clients.length = 0
          proposals.length = 0
  
          expect(
            repository.getLeads(),
          ).toEqual([
            mockLeads[0],
          ])
  
          expect(
            repository.getClients(),
          ).toEqual([
            mockClients[0],
          ])
  
          expect(
            repository.getProposals(),
          ).toEqual([
            mockProposals[0],
          ])
        },
      )
    },
  )