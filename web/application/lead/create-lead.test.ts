import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { MockCommercialRepository } from "@/repositories/commercial/mock-commercial-repository"
  import { MockCrmRepository } from "@/repositories/crm/mock-crm-repository"
  
  import {
    createLead,
    type CreateLeadInput,
  } from "./create-lead"
  
  const fixedNow =
    new Date("2026-07-21T15:00:00.000Z")
  
  const validInput: CreateLeadInput = {
    workspaceId: "workspace-1",
    consultantId: "consultant-1",
    name: "João da Silva",
    email: "joao@example.com",
    phone: "+55 41 99999-9999",
    source: "website",
    consortiumType: "real_estate",
    desiredCreditValue: 500_000,
    desiredTermMonths: 200,
    notes: "Interessado em imóvel residencial.",
  }
  
  function createDependencies() {
    const ids = [
      "lead-created-1",
      "journey-created-1",
    ]
  
    return {
      crmRepository:
        new MockCrmRepository(),
  
      commercialRepository:
        new MockCommercialRepository(),
  
      now: fixedNow,
  
      generateId: () => {
        const id = ids.shift()
  
        if (!id) {
          throw new Error(
            "Nenhum ID de teste disponível.",
          )
        }
  
        return id
      },
    }
  }
  
  describe("createLead", () => {
    it(
      "cria o lead e a jornada comercial inicial",
      () => {
        const dependencies =
          createDependencies()
  
        const result = createLead(
          validInput,
          dependencies,
        )
  
        expect(result.lead).toMatchObject({
          id: "lead-created-1",
          name: "João da Silva",
          email: "joao@example.com",
          status: "new",
          pipelineStageId: "stage-1",
          consultantId: "consultant-1",
          score: 0,
        })
  
        expect(result.journey).toMatchObject({
          id: "journey-created-1",
          workspaceId: "workspace-1",
          leadId: "lead-created-1",
          consultantId: "consultant-1",
          currentPhaseId:
            "journey-phase-1",
          currentStateId:
            "journey-state-1",
          priority: "NORMAL",
          outcome: null,
          version: 1,
        })
  
        expect(
          dependencies.crmRepository
            .getLeadById("lead-created-1"),
        ).toEqual(result.lead)
  
        expect(
          dependencies.commercialRepository
            .getJourneyById(
              "journey-created-1",
            ),
        ).toEqual(result.journey)
      },
    )
  
    it(
      "normaliza o e-mail antes de criar o lead",
      () => {
        const result = createLead(
          {
            ...validInput,
            email: "  JOAO@EXAMPLE.COM  ",
          },
          createDependencies(),
        )
  
        expect(result.lead.email).toBe(
          "joao@example.com",
        )
      },
    )
  
    it(
      "impede a criação com consultor inexistente",
      () => {
        expect(() =>
          createLead(
            {
              ...validInput,
              consultantId:
                "consultant-inexistente",
            },
            createDependencies(),
          ),
        ).toThrow(
          'Consultor não encontrado para o ID "consultant-inexistente".',
        )
      },
    )
  
    it(
      "impede e-mail duplicado sem diferenciar maiúsculas e minúsculas",
      () => {
        const dependencies =
          createDependencies()
  
        const existingLead =
          dependencies.crmRepository
            .getLeads()[0]
  
        expect(existingLead).toBeDefined()
  
        expect(() =>
          createLead(
            {
              ...validInput,
              email:
                existingLead.email.toUpperCase(),
            },
            dependencies,
          ),
        ).toThrow(
          "Já existe um lead cadastrado com o e-mail",
        )
      },
    )
  
    it(
      "impede telefone duplicado mesmo com formatação diferente",
      () => {
        const dependencies =
          createDependencies()
  
        const existingLead =
          dependencies.crmRepository
            .getLeads()[0]
  
        expect(existingLead).toBeDefined()
  
        const phoneWithoutFormatting =
          existingLead.phone.replace(
            /\D/g,
            "",
          )
  
        expect(() =>
          createLead(
            {
              ...validInput,
              phone: phoneWithoutFormatting,
            },
            dependencies,
          ),
        ).toThrow(
          "Já existe um lead cadastrado com o telefone informado.",
        )
      },
    )
  
    it(
      "impede valor de crédito igual ou menor que zero",
      () => {
        expect(() =>
          createLead(
            {
              ...validInput,
              desiredCreditValue: 0,
            },
            createDependencies(),
          ),
        ).toThrow(
          "O valor de crédito desejado deve ser maior que zero.",
        )
      },
    )
  
    it(
      "impede prazo inválido",
      () => {
        expect(() =>
          createLead(
            {
              ...validInput,
              desiredTermMonths: 0,
            },
            createDependencies(),
          ),
        ).toThrow(
          "O prazo desejado deve ser um número inteiro maior que zero.",
        )
      },
    )
  })