import type {
    Client,
    ClientStatus,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  export type ListClientsInput = {
    consultantId?: string
    status?: ClientStatus
    type?: Client["type"]
    search?: string
    tags?: string[]
  }
  
  export type ListClientsOutput = {
    clients: Client[]
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
    client: Client,
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
      client.name,
      client.email,
      client.phone,
      client.document,
      client.companyName ?? "",
      client.tradeName ?? "",
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
  
  const matchesTags = (
    client: Client,
    tags: string[],
  ): boolean => {
    const normalizedTags = tags
      .map(normalizeText)
      .filter(Boolean)
  
    if (
      normalizedTags.length === 0
    ) {
      return true
    }
  
    const clientTags =
      client.tags.map(
        normalizeText,
      )
  
    return normalizedTags.every(
      (tag) =>
        clientTags.includes(
          tag,
        ),
    )
  }
  
  export class ListClients {
    constructor(
      private readonly crmRepository: CrmRepository,
    ) {}
  
    execute(
      input: ListClientsInput = {},
    ): ListClientsOutput {
      const consultantId =
        input.consultantId?.trim()
  
      const clients =
        this.crmRepository
          .getClients()
          .filter(
            (client) =>
              !consultantId ||
              client.consultantId ===
                consultantId,
          )
          .filter(
            (client) =>
              !input.status ||
              client.status ===
                input.status,
          )
          .filter(
            (client) =>
              !input.type ||
              client.type ===
                input.type,
          )
          .filter(
            (client) =>
              !input.search ||
              matchesSearch(
                client,
                input.search,
              ),
          )
          .filter(
            (client) =>
              !input.tags ||
              matchesTags(
                client,
                input.tags,
              ),
          )
          .sort(
            (firstClient, secondClient) =>
              firstClient.name.localeCompare(
                secondClient.name,
                "pt-BR",
                {
                  sensitivity: "base",
                },
              ),
          )
  
      return {
        clients,
        total:
          clients.length,
      }
    }
  }