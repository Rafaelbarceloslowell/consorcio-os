import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import { MockCrmRepository } from "@/repositories/crm/mock-crm-repository"
  
  import {
    qualifyLead,
  } from "./qualify-lead"
  
  function createRepository() {
    return new MockCrmRepository()
  }
  
  function getAvailableLeadStage(
    repository: MockCrmRepository,
  ) {
    const pipelineStage =
      repository
        .getPipelineStages()
        .find(
          (stage) =>
            stage.type === "lead" &&
            !stage.isClosedStage,
        )
  
    if (!pipelineStage) {
      throw new Error(
        "O mock do CRM precisa possuir um estágio aberto de lead.",
      )
    }
  
    return pipelineStage
  }
  
  describe("qualifyLead", () => {
    it(
      "qualifica um lead existente",
      () => {
        const crmRepository =
          createRepository()
  
        const lead =
          crmRepository.getLeads()[0]
  
        const pipelineStage =
          getAvailableLeadStage(
            crmRepository,
          )
  
        const now =
          new Date(
            "2026-07-21T22:45:00.000Z",
          )
  
        const result = qualifyLead(
          {
            leadId: lead.id,
            pipelineStageId:
              pipelineStage.id,
            scoreIncrement: 25,
            notes:
              "Lead possui interesse confirmado.",
          },
          {
            crmRepository,
            now,
          },
        )
  
        expect(result.status).toBe(
          "qualified",
        )
  
        expect(
          result.pipelineStageId,
        ).toBe(
          pipelineStage.id,
        )
  
        expect(result.score).toBe(
          lead.score + 25,
        )
  
        expect(result.notes).toBe(
          "Lead possui interesse confirmado.",
        )
  
        expect(
          result.lastContactAt,
        ).toBe(
          "2026-07-21T22:45:00.000Z",
        )
  
        expect(result.updatedAt).toBe(
          "2026-07-21T22:45:00.000Z",
        )
      },
    )
  
    it(
      "persiste o lead atualizado no repositório",
      () => {
        const crmRepository =
          createRepository()
  
        const lead =
          crmRepository.getLeads()[0]
  
        const pipelineStage =
          getAvailableLeadStage(
            crmRepository,
          )
  
        qualifyLead(
          {
            leadId: lead.id,
            pipelineStageId:
              pipelineStage.id,
            scoreIncrement: 10,
          },
          {
            crmRepository,
          },
        )
  
        const persistedLead =
          crmRepository.getLeadById(
            lead.id,
          )
  
        expect(
          persistedLead?.status,
        ).toBe(
          "qualified",
        )
  
        expect(
          persistedLead?.score,
        ).toBe(
          lead.score + 10,
        )
      },
    )
  
    it(
      "mantém as observações anteriores quando nenhuma nova observação é informada",
      () => {
        const crmRepository =
          createRepository()
  
        const lead =
          crmRepository.getLeads()[0]
  
        const pipelineStage =
          getAvailableLeadStage(
            crmRepository,
          )
  
        const leadWithNotes = {
          ...lead,
          notes:
            "Observação anterior.",
        }
  
        crmRepository.updateLead(
          leadWithNotes,
        )
  
        const result = qualifyLead(
          {
            leadId: lead.id,
            pipelineStageId:
              pipelineStage.id,
          },
          {
            crmRepository,
          },
        )
  
        expect(result.notes).toBe(
          "Observação anterior.",
        )
      },
    )
  
    it(
      "lança erro quando o lead não existe",
      () => {
        const crmRepository =
          createRepository()
  
        const pipelineStage =
          getAvailableLeadStage(
            crmRepository,
          )
  
        expect(() =>
          qualifyLead(
            {
              leadId:
                "lead-inexistente",
              pipelineStageId:
                pipelineStage.id,
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          'Lead não encontrado para o ID "lead-inexistente".',
        )
      },
    )
  
    it(
      "lança erro quando o estágio não existe",
      () => {
        const crmRepository =
          createRepository()
  
        const lead =
          crmRepository.getLeads()[0]
  
        expect(() =>
          qualifyLead(
            {
              leadId: lead.id,
              pipelineStageId:
                "stage-inexistente",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          'Estágio de pipeline não encontrado para o ID "stage-inexistente".',
        )
      },
    )
  
    it(
      "lança erro quando o incremento de score é negativo",
      () => {
        const crmRepository =
          createRepository()
  
        const lead =
          crmRepository.getLeads()[0]
  
        const pipelineStage =
          getAvailableLeadStage(
            crmRepository,
          )
  
        expect(() =>
          qualifyLead(
            {
              leadId: lead.id,
              pipelineStageId:
                pipelineStage.id,
              scoreIncrement: -1,
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          "O incremento de score deve ser um número maior ou igual a zero.",
        )
      },
    )
  
    it(
      "não permite qualificar um lead convertido",
      () => {
        const crmRepository =
          createRepository()
  
        const lead =
          crmRepository.getLeads()[0]
  
        const pipelineStage =
          getAvailableLeadStage(
            crmRepository,
          )
  
        crmRepository.updateLead({
          ...lead,
          status: "converted",
        })
  
        expect(() =>
          qualifyLead(
            {
              leadId: lead.id,
              pipelineStageId:
                pipelineStage.id,
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          `O lead "${lead.id}" não pode ser qualificado porque está com o status "converted".`,
        )
      },
    )
  })