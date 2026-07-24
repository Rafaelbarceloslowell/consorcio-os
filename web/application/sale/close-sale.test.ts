import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    mockCrmData,
  } from "@/data/mock-crm"
  
  import {
    mockCommercialData,
  } from "@/data/mock-commercial"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    closeSale,
  } from "./close-sale"
  
  function createRepositoriesWithoutSaleOne() {
    const crmRepository =
      new MockCrmRepository({
        leads: [
          ...mockCrmData.leads,
        ],
        clients: [
          ...mockCrmData.clients,
        ],
        consultants: [
          ...mockCrmData.consultants,
        ],
        pipelineStages: [
          ...mockCrmData.pipelineStages,
        ],
        meetings: [
          ...mockCrmData.meetings,
        ],
        consortiums: [
          ...mockCrmData.consortiums,
        ],
        proposals: [
          ...mockCrmData.proposals,
        ],
        sales:
          mockCrmData.sales.filter(
            (sale) =>
              sale.id !== "sale-1",
          ),
      })
  
    const commercialRepository =
      new MockCommercialRepository({
        commercialJourneys: [
          ...mockCommercialData
            .commercialJourneys,
        ],
        journeyPhases: [
          ...mockCommercialData
            .journeyPhases,
        ],
        journeyStates: [
          ...mockCommercialData
            .journeyStates,
        ],
        commercialEvents: [
          ...mockCommercialData
            .commercialEvents,
        ],
        commercialActions: [
          ...mockCommercialData
            .commercialActions,
        ],
        nextBestActions: [
          ...mockCommercialData
            .nextBestActions,
        ],
        workflowRules: [
          ...mockCommercialData
            .workflowRules,
        ],
      })
  
    return {
      crmRepository,
      commercialRepository,
    }
  }
  
  function createDefaultRepositories() {
    return {
      crmRepository:
        new MockCrmRepository(),
      commercialRepository:
        new MockCommercialRepository(),
    }
  }
  
  describe("closeSale", () => {
    it(
      "fecha uma venda com proposta aceita",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        const sale = closeSale(
          {
            proposalId:
              "proposal-1",
            journeyId:
              "journey-5",
            contractNumber:
              "ctr-2026-0200",
            quotaNumber: 400,
            paymentMethod:
              "bank_slip",
            firstInstallmentDate:
              "2026-08-10T00:00:00.000Z",
            commissionPercent: 3,
            notes:
              "Contrato aguardando assinatura digital.",
          },
          {
            crmRepository,
            commercialRepository,
            now: new Date(
              "2026-07-22T10:00:00.000Z",
            ),
            generateId: () =>
              "sale-created",
          },
        )
  
        expect(sale.id).toBe(
          "sale-created",
        )
  
        expect(
          sale.contractNumber,
        ).toBe(
          "CTR-2026-0200",
        )
  
        expect(sale.status).toBe(
          "pending_signature",
        )
  
        expect(sale.clientId).toBe(
          "client-1",
        )
  
        expect(
          sale.consultantId,
        ).toBe(
          "consultant-1",
        )
  
        expect(
          sale.consortiumId,
        ).toBe(
          "consortium-1",
        )
  
        expect(
          sale.groupNumber,
        ).toBe(
          "GRP-2026-0142",
        )
  
        expect(
          sale.creditValue,
        ).toBe(
          1_200_000,
        )
  
        expect(
          sale.commissionValue,
        ).toBe(
          36_000,
        )
      },
    )
  
    it(
      "persiste a venda criada",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        closeSale(
          {
            proposalId:
              "proposal-1",
            journeyId:
              "journey-5",
            contractNumber:
              "CTR-2026-0201",
            quotaNumber: 401,
            paymentMethod: "pix",
            firstInstallmentDate:
              "2026-08-10T00:00:00.000Z",
            commissionPercent: 3,
          },
          {
            crmRepository,
            commercialRepository,
            now: new Date(
              "2026-07-22T10:00:00.000Z",
            ),
            generateId: () =>
              "sale-persisted",
          },
        )
  
        const persistedSale =
          crmRepository.getSaleById(
            "sale-persisted",
          )
  
        expect(
          persistedSale?.proposalId,
        ).toBe(
          "proposal-1",
        )
  
        expect(
          persistedSale?.quotaNumber,
        ).toBe(
          401,
        )
      },
    )
  
    it(
      "encerra a jornada como ganha",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        closeSale(
          {
            proposalId:
              "proposal-1",
            journeyId:
              "journey-5",
            contractNumber:
              "CTR-2026-0202",
            quotaNumber: 402,
            paymentMethod:
              "direct_debit",
            firstInstallmentDate:
              "2026-08-10T00:00:00.000Z",
            commissionPercent: 3,
          },
          {
            crmRepository,
            commercialRepository,
            now: new Date(
              "2026-07-22T10:00:00.000Z",
            ),
            generateId: () =>
              "sale-journey",
          },
        )
  
        const journey =
          commercialRepository
            .getJourneyById(
              "journey-5",
            )
  
        expect(
          journey?.currentPhaseId,
        ).toBe(
          "journey-phase-6",
        )
  
        expect(
          journey?.currentStateId,
        ).toBe(
          "journey-state-13",
        )
  
        expect(journey?.outcome).toBe(
          "WON",
        )
  
        expect(journey?.closedAt).toBe(
          "2026-07-22T10:00:00.000Z",
        )
  
        expect(journey?.version).toBe(
          9,
        )
      },
    )
  
    it(
      "não fecha venda com proposta inexistente",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createDefaultRepositories()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-inexistente",
              journeyId:
                "journey-5",
              contractNumber:
                "CTR-2026-0300",
              quotaNumber: 450,
              paymentMethod: "pix",
              firstInstallmentDate:
                "2026-08-10T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'Proposta não encontrada para o ID "proposal-inexistente".',
        )
      },
    )
  
    it(
      "não fecha venda com proposta não aceita",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createDefaultRepositories()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-2",
              journeyId:
                "journey-1",
              contractNumber:
                "CTR-2026-0301",
              quotaNumber: 451,
              paymentMethod: "pix",
              firstInstallmentDate:
                "2026-08-10T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'A proposta "proposal-2" precisa estar aceita antes do fechamento da venda.',
        )
      },
    )
  
    it(
      "não permite uma segunda venda para a mesma proposta",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createDefaultRepositories()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-1",
              journeyId:
                "journey-5",
              contractNumber:
                "CTR-2026-0302",
              quotaNumber: 452,
              paymentMethod:
                "bank_slip",
              firstInstallmentDate:
                "2026-08-10T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'A proposta "proposal-1" já possui uma venda registrada.',
        )
      },
    )
  
    it(
      "não permite número de contrato duplicado",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-1",
              journeyId:
                "journey-5",
              contractNumber:
                "ctr-2026-0124",
              quotaNumber: 453,
              paymentMethod: "pix",
              firstInstallmentDate:
                "2026-08-10T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'O contrato "CTR-2026-0124" já está vinculado a outra venda.',
        )
      },
    )
  
    it(
      "não permite cota duplicada no mesmo consórcio",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-1",
              journeyId:
                "journey-5",
              contractNumber:
                "CTR-2026-0303",
              quotaNumber: 312,
              paymentMethod: "pix",
              firstInstallmentDate:
                "2026-08-10T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'A cota "312" já está vinculada a uma venda ativa neste consórcio.',
        )
      },
    )
  
    it(
      "não fecha uma jornada já encerrada",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-1",
              journeyId:
                "journey-6",
              contractNumber:
                "CTR-2026-0304",
              quotaNumber: 454,
              paymentMethod: "pix",
              firstInstallmentDate:
                "2026-08-10T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'A jornada comercial "journey-6" já está encerrada.',
        )
      },
    )
  
    it(
      "não aceita primeira parcela anterior à venda",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } =
          createRepositoriesWithoutSaleOne()
  
        expect(() =>
          closeSale(
            {
              proposalId:
                "proposal-1",
              journeyId:
                "journey-5",
              contractNumber:
                "CTR-2026-0305",
              quotaNumber: 455,
              paymentMethod: "pix",
              firstInstallmentDate:
                "2026-07-20T00:00:00.000Z",
              commissionPercent: 3,
            },
            {
              crmRepository,
              commercialRepository,
              now: new Date(
                "2026-07-22T10:00:00.000Z",
              ),
            },
          ),
        ).toThrowError(
          "A data da primeira parcela não pode ser anterior à data da venda.",
        )
      },
    )
  })