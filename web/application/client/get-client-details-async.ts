import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  EntityId,
} from "@/types/domain"

import type {
  ClientDetailsView,
} from "@/types/client-details"

export type GetClientDetailsInput = {
  workspaceId: EntityId
  clientId: EntityId
}

export type GetClientDetailsOutput = {
  client: ClientDetailsView
}

export type GetClientDetailsAsyncDependencies = {
  workspaceId: EntityId
  clients:
    Pick<
      AsyncCrmRepositories["clients"],
      "findById"
    >
  consultants:
    Pick<
      AsyncCrmRepositories["consultants"],
      "findById"
    >
}

export class GetClientDetailsAsync {
  constructor(
    private readonly dependencies:
      GetClientDetailsAsyncDependencies,
  ) {}

  async execute(
    input: GetClientDetailsInput,
  ): Promise<GetClientDetailsOutput> {
    const workspaceId =
      input.workspaceId.trim()
    const clientId =
      input.clientId.trim()

    if (!workspaceId) {
      throw new Error(
        "O workspace é obrigatório para consultar o cliente.",
      )
    }

    if (!clientId) {
      throw new Error(
        "O ID do cliente é obrigatório.",
      )
    }

    if (
      workspaceId !==
      this.dependencies.workspaceId
    ) {
      throw new Error(
        `Cliente não encontrado para o ID "${clientId}".`,
      )
    }

    const client =
      await this.dependencies.clients
        .findById(clientId)

    if (!client) {
      throw new Error(
        `Cliente não encontrado para o ID "${clientId}".`,
      )
    }

    const consultant =
      await this.dependencies
        .consultants
        .findById(
          client.consultantId,
        )

    return {
      client: {
        id: client.id,
        name: client.name,
        type: client.type,
        email: client.email,
        phone: client.phone,
        document: client.document,
        birthDate:
          client.birthDate ?? null,
        companyName:
          client.companyName ?? null,
        tradeName:
          client.tradeName ?? null,
        stateRegistration:
          client.stateRegistration ??
          null,
        address: {
          street:
            client.address.street,
          number:
            client.address.number,
          complement:
            client.address
              .complement ?? null,
          neighborhood:
            client.address
              .neighborhood,
          city: client.address.city,
          state: client.address.state,
          zipCode:
            client.address.zipCode,
        },
        consultantId:
          client.consultantId,
        consultantName:
          consultant?.name ??
          "Consultor não identificado",
        status: client.status,
        createdAt:
          client.createdAt,
        updatedAt:
          client.updatedAt,
      },
    }
  }
}
