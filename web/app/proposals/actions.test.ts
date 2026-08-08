import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  transaction: vi.fn(),
  findExistingSale: vi.fn(),
  findProposal: vi.fn(),
  updateProposal: vi.fn(),
  findJourney: vi.fn(),
  updateJourney: vi.fn(),
  findLead: vi.fn(),
  updateLead: vi.fn(),
  findClient: vi.fn(),
  createClient: vi.fn(),
  findPipelineStage: vi.fn(),
  findConsultant: vi.fn(),
  findConsortium: vi.fn(),
  findWonState: vi.fn(),
  findWonPhase: vi.fn(),
  findSales: vi.fn(),
  createSale: vi.fn(),
  createEvent: vi.fn(),
  updateTasks: vi.fn(),
  revalidatePath: vi.fn(),
  closeSaleDomain: vi.fn(),
  proposalToDomain: vi.fn(),
  journeyToDomain: vi.fn(),
  clientToDomain: vi.fn(),
  consultantToDomain: vi.fn(),
  consortiumToDomain: vi.fn(),
  stateToDomain: vi.fn(),
  phaseToDomain: vi.fn(),
  saleToDomain: vi.fn(),
  saleToPersistence: vi.fn(),
}))

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
      sale: {
        findUnique:
          mocks.findExistingSale,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

vi.mock("next/cache", () => ({
  revalidatePath:
    mocks.revalidatePath,
}))

vi.mock(
  "@/application/sale/close-sale",
  () => ({
    closeSale:
      mocks.closeSaleDomain,
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/proposal-mapper",
  () => ({
    ProposalMapper: {
      toDomain:
        mocks.proposalToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/commercial-journey-mapper",
  () => ({
    CommercialJourneyMapper: {
      toDomain:
        mocks.journeyToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/client-mapper",
  () => ({
    ClientMapper: {
      toDomain:
        mocks.clientToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/consultant-mapper",
  () => ({
    ConsultantMapper: {
      toDomain:
        mocks.consultantToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/consortium-mapper",
  () => ({
    ConsortiumMapper: {
      toDomain:
        mocks.consortiumToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/journey-state-mapper",
  () => ({
    JourneyStateMapper: {
      toDomain:
        mocks.stateToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/journey-phase-mapper",
  () => ({
    JourneyPhaseMapper: {
      toDomain:
        mocks.phaseToDomain,
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/mappers/sale-mapper",
  () => ({
    SaleMapper: {
      toDomain:
        mocks.saleToDomain,
      toPersistence:
        mocks.saleToPersistence,
    },
  }),
)

import {
  acceptProposalAction,
  closeProposalSaleAction,
} from "./actions"

const proposalRecord = {
  id: "proposal-1",
  status: "ACCEPTED",
  leadId: "lead-1",
  clientId: null,
  consultantId: "consultant-1",
  consortiumId: "consortium-1",
  sale: null,
}

const journeyRecord = {
  id: "journey-1",
  version: 3,
}

const leadRecord = {
  id: "lead-1",
  name: "Maria Oliveira",
  email: "maria@example.com",
  phone: "5541999999999",
  companyName: null,
  consultantId: "consultant-1",
  convertedClientId: null,
  notes: "Cliente residencial",
}

const saleDomain = {
  id: "sale-1",
  proposalId: "proposal-1",
  clientId: "client-1",
  consultantId: "consultant-1",
  consortiumId: "consortium-1",
  contractNumber: "CTR-001",
  groupNumber: "GRUPO-1",
  quotaNumber: 42,
  creditValue: 500000,
  commissionValue: 10000,
  saleDate:
    "2026-08-08T12:00:00.000Z",
}

function createFormData(): FormData {
  const formData = new FormData()
  const values = {
    proposalId: "proposal-1",
    contractNumber: "ctr-001",
    quotaNumber: "42",
    paymentMethod: "pix",
    firstInstallmentDate:
      "2026-09-10",
    commissionPercent: "2",
    personType: "individual",
    document: "123.456.789-01",
    companyName: "",
    addressStreet: "Rua Um",
    addressNumber: "10",
    addressComplement: "",
    addressNeighborhood:
      "Centro",
    addressCity: "Curitiba",
    addressState: "pr",
    addressZipCode: "80000-000",
    saleNotes: "Venda confirmada",
  }

  for (const [key, value] of
    Object.entries(values)) {
    formData.set(key, value)
  }

  return formData
}

function transactionClient() {
  return {
    proposal: {
      findFirst:
        mocks.findProposal,
      update:
        mocks.updateProposal,
    },
    commercialJourney: {
      findFirst:
        mocks.findJourney,
      updateMany:
        mocks.updateJourney,
    },
    lead: {
      findFirst: mocks.findLead,
      update: mocks.updateLead,
    },
    client: {
      findFirst: mocks.findClient,
      create: mocks.createClient,
    },
    pipelineStage: {
      findFirst:
        mocks.findPipelineStage,
    },
    consultant: {
      findFirst:
        mocks.findConsultant,
    },
    consortium: {
      findFirst:
        mocks.findConsortium,
    },
    journeyState: {
      findFirst:
        mocks.findWonState,
    },
    journeyPhase: {
      findFirst:
        mocks.findWonPhase,
    },
    sale: {
      findMany: mocks.findSales,
      create: mocks.createSale,
    },
    commercialEvent: {
      create: mocks.createEvent,
    },
    task: {
      updateMany:
        mocks.updateTasks,
    },
  }
}

describe("proposal sale actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.findProposal.mockResolvedValue(
      proposalRecord,
    )
    mocks.findJourney.mockResolvedValue(
      journeyRecord,
    )
    mocks.findLead.mockResolvedValue(
      leadRecord,
    )
    mocks.findClient.mockImplementation(
      (query: {
        include?: unknown
      }) =>
        query.include
          ? Promise.resolve({
              id: "client-1",
            })
          : Promise.resolve(null),
    )
    mocks.createClient.mockResolvedValue({
      id: "client-1",
    })
    mocks.findPipelineStage
      .mockResolvedValue({
        id: "stage-won",
      })
    mocks.findConsultant.mockResolvedValue({
      id: "consultant-1",
    })
    mocks.findConsortium.mockResolvedValue({
      id: "consortium-1",
    })
    mocks.findWonState.mockResolvedValue({
      id: "state-won",
      phaseId: "phase-won",
    })
    mocks.findWonPhase.mockResolvedValue({
      id: "phase-won",
    })
    mocks.findSales.mockResolvedValue([])
    mocks.updateJourney.mockResolvedValue({
      count: 1,
    })
    mocks.createEvent.mockResolvedValue({
      id: "event-1",
    })
    mocks.findExistingSale.mockResolvedValue(
      null,
    )

    mocks.proposalToDomain.mockReturnValue({
      id: "proposal-1",
    })
    mocks.journeyToDomain.mockReturnValue({
      id: "journey-1",
    })
    mocks.clientToDomain.mockReturnValue({
      id: "client-1",
    })
    mocks.consultantToDomain.mockReturnValue({
      id: "consultant-1",
    })
    mocks.consortiumToDomain.mockReturnValue({
      id: "consortium-1",
    })
    mocks.stateToDomain.mockReturnValue({
      id: "state-won",
    })
    mocks.phaseToDomain.mockReturnValue({
      id: "phase-won",
    })
    mocks.closeSaleDomain.mockReturnValue(
      saleDomain,
    )
    mocks.saleToPersistence.mockReturnValue({
      id: "sale-1",
    })

    mocks.transaction.mockImplementation(
      async (
        operation: (
          transaction: ReturnType<
            typeof transactionClient
          >,
        ) => unknown,
      ) => operation(transactionClient()),
    )
  })

  it("converte lead, cria venda e fecha jornada como ganha", async () => {
    await closeProposalSaleAction(
      createFormData(),
    )

    expect(
      mocks.createClient,
    ).toHaveBeenCalledWith({
      data:
        expect.objectContaining({
          workspaceId:
            "workspace-1",
          name: "Maria Oliveira",
          document:
            "12345678901",
          consultantId:
            "consultant-1",
        }),
      select: {
        id: true,
      },
    })
    expect(
      mocks.updateLead,
    ).toHaveBeenCalledWith({
      where: {
        id: "lead-1",
      },
      data:
        expect.objectContaining({
          status: "CONVERTED",
          convertedClientId:
            "client-1",
          pipelineStageId:
            "stage-won",
        }),
    })
    expect(
      mocks.updateProposal,
    ).toHaveBeenCalledWith({
      where: {
        id: "proposal-1",
      },
      data: {
        clientId: "client-1",
      },
    })
    expect(
      mocks.createSale,
    ).toHaveBeenCalledExactlyOnceWith({
      data: {
        id: "sale-1",
      },
    })
    expect(
      mocks.updateJourney,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where:
          expect.objectContaining({
            id: "journey-1",
            version: 3,
          }),
        data:
          expect.objectContaining({
            clientId: "client-1",
            currentStateId:
              "state-won",
            outcome: "WON",
            closedAt:
              expect.any(Date),
          }),
      }),
    )
    expect(
      mocks.createEvent,
    ).toHaveBeenCalledTimes(2)
    expect(
      mocks.createEvent,
    ).toHaveBeenNthCalledWith(
      2,
      {
        data:
          expect.objectContaining({
            type:
              "SALE_COMPLETED",
            journeyId:
              "journey-1",
          }),
      },
    )
    expect(
      mocks.revalidatePath,
    ).toHaveBeenCalledWith("/")
    expect(
      mocks.revalidatePath,
    ).toHaveBeenCalledWith(
      "/finance",
    )
  })

  it("vende para cliente existente sem criar outro cliente", async () => {
    mocks.findProposal.mockResolvedValue({
      ...proposalRecord,
      leadId: null,
      clientId: "client-1",
    })

    await closeProposalSaleAction(
      createFormData(),
    )

    expect(
      mocks.findLead,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createClient,
    ).not.toHaveBeenCalled()
    expect(
      mocks.updateLead,
    ).not.toHaveBeenCalled()
    expect(
      mocks.updateProposal,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createSale,
    ).toHaveBeenCalledOnce()
    expect(
      mocks.createEvent,
    ).toHaveBeenCalledOnce()
  })

  it("recusa venda quando a proposta não está aceita", async () => {
    mocks.findProposal.mockResolvedValue({
      ...proposalRecord,
      status: "SENT",
    })

    await expect(
      closeProposalSaleAction(
        createFormData(),
      ),
    ).rejects.toThrow(
      "A proposta precisa estar aceita",
    )
    expect(
      mocks.createSale,
    ).not.toHaveBeenCalled()
  })

  it("é idempotente quando a proposta já possui venda", async () => {
    mocks.findProposal.mockResolvedValue({
      ...proposalRecord,
      sale: {
        id: "sale-existing",
      },
    })

    await closeProposalSaleAction(
      createFormData(),
    )

    expect(
      mocks.createClient,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createSale,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createEvent,
    ).not.toHaveBeenCalled()
  })

  it("bloqueia cliente duplicado antes da conversão", async () => {
    mocks.findClient.mockImplementation(
      (query: {
        include?: unknown
      }) =>
        query.include
          ? Promise.resolve({
              id: "client-1",
            })
          : Promise.resolve({
              id: "client-existing",
            }),
    )

    await expect(
      closeProposalSaleAction(
        createFormData(),
      ),
    ).rejects.toThrow(
      "Já existe um cliente",
    )
    expect(
      mocks.createClient,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createSale,
    ).not.toHaveBeenCalled()
  })

  it("propaga falha de evento dentro da transação sem revalidar", async () => {
    mocks.createEvent
      .mockResolvedValueOnce({
        id: "event-conversion",
      })
      .mockRejectedValueOnce(
        new Error(
          "event persistence failed",
        ),
      )

    await expect(
      closeProposalSaleAction(
        createFormData(),
      ),
    ).rejects.toThrow(
      "event persistence failed",
    )
    expect(
      mocks.transaction,
    ).toHaveBeenCalledOnce()
    expect(
      mocks.revalidatePath,
    ).not.toHaveBeenCalled()
  })

  it("aceita proposta vinculada a cliente existente", async () => {
    mocks.findProposal.mockResolvedValue({
      id: "proposal-1",
      code: "GOS-001",
      status: "SENT",
      leadId: null,
      clientId: "client-1",
      consultantId:
        "consultant-1",
    })

    const formData = new FormData()
    formData.set(
      "proposalId",
      "proposal-1",
    )

    await acceptProposalAction(formData)

    expect(
      mocks.updateProposal,
    ).toHaveBeenCalledWith({
      where: {
        id: "proposal-1",
      },
      data: {
        status: "ACCEPTED",
        acceptedAt:
          expect.any(Date),
        rejectedAt: null,
        rejectionReason: null,
      },
    })
    expect(
      mocks.findJourney,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where:
          expect.objectContaining({
            OR: [
              {
                clientId:
                  "client-1",
              },
            ],
          }),
      }),
    )
  })
})
