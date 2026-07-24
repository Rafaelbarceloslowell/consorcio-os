import type {
    Lead,
    LeadStatus,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  export type ListLeadsInput = {
    consultantId?: string
    status?: LeadStatus
    source?: Lead["source"]
    search?: string
  }
  
  export type ListLeadsOutput = {
    leads: Lead[]
    total: number
  }
  
  const normalizeText = (
    value: string,
  ): string =>
    value
      .trim()
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
  
  const normalizeComparableValue = (
    value: string,
  ): string =>
    normalizeText(value).replace(
      /[^a-z0-9]/g,
      "",
    )
  
  const matchesSearch = (
    lead: Lead,
    search: string,
  ): boolean => {
    const normalizedSearch =
      normalizeComparableValue(
        search,
      )
  
    if (!normalizedSearch) {
      return true
    }
  
    const searchableValues = [
      lead.name,
      lead.email,
      lead.phone,
      lead.document ?? "",
      lead.companyName ?? "",
    ]
  
    return searchableValues.some(
      (value) =>
        normalizeComparableValue(
          value,
        ).includes(
          normalizedSearch,
        ),
    )
  }
  
  export class ListLeads {
    constructor(
      private readonly crmRepository: CrmRepository,
    ) {}
  
    execute(
      input: ListLeadsInput = {},
    ): ListLeadsOutput {
      const consultantId =
        input.consultantId?.trim()
  
      const leads =
        this.crmRepository
          .getLeads()
          .filter(
            (lead) =>
              !consultantId ||
              lead.consultantId ===
                consultantId,
          )
          .filter(
            (lead) =>
              !input.status ||
              lead.status ===
                input.status,
          )
          .filter(
            (lead) =>
              !input.source ||
              lead.source ===
                input.source,
          )
          .filter(
            (lead) =>
              !input.search ||
              matchesSearch(
                lead,
                input.search,
              ),
          )
          .sort(
            (firstLead, secondLead) =>
              firstLead.name.localeCompare(
                secondLead.name,
                "pt-BR",
                {
                  sensitivity: "base",
                },
              ),
          )
  
      return {
        leads,
        total: leads.length,
      }
    }
  }