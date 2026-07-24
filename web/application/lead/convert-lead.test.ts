import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { MockCommercialRepository } from "@/repositories/commercial/mock-commercial-repository"
  import { MockCrmRepository } from "@/repositories/crm/mock-crm-repository"
  
  import {
    convertLead,
  } from "./convert-lead"
  
  const address = {
    street: "Avenida Central",
    number: "100",
    complement: "Sala 5",
    neighborhood: "Centro",
    city: "Curitiba",
    state: "pr",
    zipCode: "80000-000",
  }
  
  function createRepositories() {
    return {
      crmRepository:
        new MockCrmRepository(),
      commercialRepository:
        new MockCommercialRepository(),
    }
  }
  
  describe("convertLead", () => {
    it(
      "converte um lead qualificado em cliente",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        const result = convertLead(
          {
            leadId: "lead-2",
            journeyId: "journey-2",
            type: "company",
            document:
              "98.765.432/0001-10",
            companyName:
              "Santos Comércio LTDA",
            tradeName:
              "Santos Comércio",
            address,
            tags: [
              "veículo",
              "corporativo",
            ],
          },
          {
            crmRepository,
            commercialRepository,
            now: new Date(
              "2026-07-21T23:00:00.000Z",
            ),
            generateId: () =>
              "client-created",
          },
        )
  
        expect(result.client.id).toBe(
          "client-created",
        )
  
        expect(result.client.type).toBe(
          "company",
        )
  
        expect(result.client.name).toBe(
          "Santos Comércio LTDA",
        )
  
        expect(
          result.client.leadId,
        ).toBe(
          "lead-2",
        )
  
        expect(
          result.client.consultantId,
        ).toBe(
          "consultant-1",
        )
  
        expect(
          result.client.address.state,
        ).toBe(
          "PR",
        )
  
        expect(result.lead.status).toBe(
          "converted",
        )
  
        expect(
          result.lead.convertedClientId,
        ).toBe(
          "client-created",
        )
  
        expect(
          result.lead.pipelineStageId,
        ).toBe(
          "stage-6",
        )
  
        expect(
          result.journey.clientId,
        ).toBe(
          "client-created",
        )
  
        expect(result.journey.version).toBe(
          4,
        )
  
        expect(
          result.journey.lastInteractionAt,
        ).toBe(
          "2026-07-21T23:00:00.000Z",
        )
      },
    )
  
    it(
      "persiste cliente, lead e jornada atualizados",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        convertLead(
          {
            leadId: "lead-2",
            journeyId: "journey-2",
            type: "company",
            document:
              "98.765.432/0001-10",
            companyName:
              "Santos Comércio LTDA",
            address,
          },
          {
            crmRepository,
            commercialRepository,
            generateId: () =>
              "client-persisted",
          },
        )
  
        const persistedClient =
          crmRepository.getClientById(
            "client-persisted",
          )
  
        const persistedLead =
          crmRepository.getLeadById(
            "lead-2",
          )
  
        const persistedJourney =
          commercialRepository
            .getJourneyById(
              "journey-2",
            )
  
        expect(
          persistedClient?.leadId,
        ).toBe(
          "lead-2",
        )
  
        expect(
          persistedLead?.convertedClientId,
        ).toBe(
          "client-persisted",
        )
  
        expect(
          persistedJourney?.clientId,
        ).toBe(
          "client-persisted",
        )
      },
    )
  
    it(
      "lança erro quando o lead não existe",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        expect(() =>
          convertLead(
            {
              leadId:
                "lead-inexistente",
              journeyId: "journey-2",
              type: "individual",
              document:
                "123.456.789-00",
              address,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'Lead não encontrado para o ID "lead-inexistente".',
        )
      },
    )
  
    it(
      "não converte um lead que ainda não está qualificado",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        expect(() =>
          convertLead(
            {
              leadId: "lead-4",
              journeyId: "journey-4",
              type: "individual",
              document:
                "123.456.789-00",
              address,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'O lead "lead-4" precisa estar qualificado antes da conversão.',
        )
      },
    )
  
    it(
      "não converte novamente um lead já convertido",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        expect(() =>
          convertLead(
            {
              leadId: "lead-5",
              journeyId: "journey-5",
              type: "company",
              document:
                "12.345.678/0001-90",
              companyName:
                "Grupo Alpha Investimentos S.A.",
              address,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'O lead "lead-5" já foi convertido em cliente.',
        )
      },
    )
  
    it(
      "lança erro quando a jornada não existe",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        expect(() =>
          convertLead(
            {
              leadId: "lead-2",
              journeyId:
                "journey-inexistente",
              type: "company",
              document:
                "98.765.432/0001-10",
              companyName:
                "Santos Comércio LTDA",
              address,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'Jornada comercial não encontrada para o ID "journey-inexistente".',
        )
      },
    )
  
    it(
      "não permite usar uma jornada pertencente a outro lead",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        expect(() =>
          convertLead(
            {
              leadId: "lead-2",
              journeyId: "journey-1",
              type: "company",
              document:
                "98.765.432/0001-10",
              companyName:
                "Santos Comércio LTDA",
              address,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          'A jornada "journey-1" não pertence ao lead "lead-2".',
        )
      },
    )
  
    it(
      "não permite cadastrar um documento já utilizado por outro cliente",
      () => {
        const {
          crmRepository,
          commercialRepository,
        } = createRepositories()
  
        expect(() =>
          convertLead(
            {
              leadId: "lead-2",
              journeyId: "journey-2",
              type: "company",
              document:
                "12.345.678/0001-90",
              companyName:
                "Santos Comércio LTDA",
              address,
            },
            {
              crmRepository,
              commercialRepository,
            },
          ),
        ).toThrowError(
          "Já existe um cliente cadastrado com o documento informado.",
        )
      },
    )
  })