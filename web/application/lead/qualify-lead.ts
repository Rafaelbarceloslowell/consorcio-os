import type {
    Lead,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  export type QualifyLeadInput = {
    leadId: string
    pipelineStageId: string
    scoreIncrement?: number
    notes?: string
  }
  
  export type QualifyLeadDependencies = {
    crmRepository: CrmRepository
    now?: Date
  }
  
  function validateInput(
    input: QualifyLeadInput,
  ): void {
    if (!input.leadId.trim()) {
      throw new Error(
        "O ID do lead é obrigatório para realizar a qualificação.",
      )
    }
  
    if (!input.pipelineStageId.trim()) {
      throw new Error(
        "O estágio do pipeline é obrigatório para realizar a qualificação.",
      )
    }
  
    if (
      input.scoreIncrement !== undefined &&
      (
        !Number.isFinite(
          input.scoreIncrement,
        ) ||
        input.scoreIncrement < 0
      )
    ) {
      throw new Error(
        "O incremento de score deve ser um número maior ou igual a zero.",
      )
    }
  }
  
  export function qualifyLead(
    input: QualifyLeadInput,
    {
      crmRepository,
      now = new Date(),
    }: QualifyLeadDependencies,
  ): Lead {
    validateInput(input)
  
    const lead =
      crmRepository.getLeadById(
        input.leadId,
      )
  
    if (!lead) {
      throw new Error(
        `Lead não encontrado para o ID "${input.leadId}".`,
      )
    }
  
    if (
      lead.status === "converted" ||
      lead.status === "lost"
    ) {
      throw new Error(
        `O lead "${lead.id}" não pode ser qualificado porque está com o status "${lead.status}".`,
      )
    }
  
    const pipelineStage =
      crmRepository.getPipelineStageById(
        input.pipelineStageId,
      )
  
    if (!pipelineStage) {
      throw new Error(
        `Estágio de pipeline não encontrado para o ID "${input.pipelineStageId}".`,
      )
    }
  
    if (pipelineStage.type !== "lead") {
      throw new Error(
        `O estágio "${pipelineStage.id}" não pertence ao pipeline de leads.`,
      )
    }
  
    if (pipelineStage.isClosedStage) {
      throw new Error(
        `O estágio "${pipelineStage.id}" está fechado e não pode ser usado para qualificar um lead.`,
      )
    }
  
    const timestamp = now.toISOString()
  
    const normalizedNotes =
      input.notes?.trim()
  
    const updatedLead: Lead = {
      ...lead,
      status: "qualified",
      pipelineStageId: pipelineStage.id,
      score:
        lead.score +
        (input.scoreIncrement ?? 0),
      notes:
        normalizedNotes ||
        lead.notes,
      lastContactAt: timestamp,
      updatedAt: timestamp,
    }
  
    return crmRepository.updateLead(
      updatedLead,
    )
  }