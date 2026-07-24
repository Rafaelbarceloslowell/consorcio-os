import type { Lead } from "@/types/domain"

import type { CrmRepository } from "@/repositories/crm/crm-repository"

export type GetLeadInput = {
  leadId: string
}

export type GetLeadOutput = {
  lead: Lead
}

export class GetLead {
  constructor(
    private readonly crmRepository: CrmRepository,
  ) {}

  execute(
    input: GetLeadInput,
  ): GetLeadOutput {
    const leadId =
      input.leadId.trim()

    if (!leadId) {
      throw new Error(
        "O ID do lead é obrigatório.",
      )
    }

    const lead =
      this.crmRepository.getLeadById(
        leadId,
      )

    if (!lead) {
      throw new Error(
        `Lead não encontrado para o ID "${leadId}".`,
      )
    }

    return {
      lead,
    }
  }
}