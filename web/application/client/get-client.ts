import type { Client } from "@/types/domain"

import type { CrmRepository } from "@/repositories/crm/crm-repository"

export type GetClientInput = {
  clientId: string
}

export type GetClientOutput = {
  client: Client
}

export class GetClient {
  constructor(
    private readonly crmRepository: CrmRepository,
  ) {}

  execute(
    input: GetClientInput,
  ): GetClientOutput {
    const clientId =
      input.clientId.trim()

    if (!clientId) {
      throw new Error(
        "O ID do cliente é obrigatório.",
      )
    }

    const client =
      this.crmRepository.getClientById(
        clientId,
      )

    if (!client) {
      throw new Error(
        `Cliente não encontrado para o ID "${clientId}".`,
      )
    }

    return {
      client,
    }
  }
}