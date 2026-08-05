import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  Client,
} from "@/types/domain"

export type ListClientsAsyncOutput = {
  clients: Client[]
  total: number
}

export type ListClientsAsyncDependencies =
  Pick<
    AsyncCrmRepositories,
    "clients"
  >

function compareClients(
  first: Client,
  second: Client,
): number {
  const nameDifference =
    first.name.localeCompare(
      second.name,
      "pt-BR",
      {
        sensitivity: "base",
      },
    )

  if (nameDifference !== 0) {
    return nameDifference
  }

  return first.id.localeCompare(
    second.id,
  )
}

export class ListClientsAsync {
  constructor(
    private readonly dependencies:
      ListClientsAsyncDependencies,
  ) {}

  async execute():
    Promise<ListClientsAsyncOutput> {
    const repositoryClients =
      await this.dependencies
        .clients
        .findAll()

    const clients =
      [...repositoryClients]
        .sort(compareClients)

    return {
      clients,
      total: clients.length,
    }
  }
}
