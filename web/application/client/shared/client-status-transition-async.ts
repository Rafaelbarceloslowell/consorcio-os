import type {
  Client,
  ClientStatus,
  EntityId,
} from "@/types/domain"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

export type ClientStatusTransitionAsyncInput = {
  workspaceId: EntityId
  clientId: EntityId
}

export type ClientStatusTransitionAsyncOutput = {
  client: Client
}

export type ClientStatusTransitionAsyncOptions = {
  now?: Date
}

export type ClientStatusTransitionAsyncDependencies = {
  workspaceId: EntityId
  clients:
    Pick<
      AsyncCrmRepositories["clients"],
      "findById" | "update"
    >
}

export type ClientStatusTransitionAsyncConfig = {
  targetStatus: ClientStatus
  allowedCurrentStatuses:
    ClientStatus[]
  alreadyInTargetStatusMessage:
    string
  invalidCurrentStatusMessage:
    string
}

export async function executeClientStatusTransitionAsync(
  dependencies:
    ClientStatusTransitionAsyncDependencies,
  input:
    ClientStatusTransitionAsyncInput,
  config:
    ClientStatusTransitionAsyncConfig,
  options:
    ClientStatusTransitionAsyncOptions = {},
): Promise<ClientStatusTransitionAsyncOutput> {
  const workspaceId =
    input.workspaceId.trim()

  const clientId =
    input.clientId.trim()

  if (!workspaceId) {
    throw new Error(
      "O workspace é obrigatório.",
    )
  }

  if (!clientId) {
    throw new Error(
      "O ID do cliente é obrigatório.",
    )
  }

  if (
    workspaceId !==
    dependencies.workspaceId
  ) {
    throw new Error(
      `Cliente não encontrado para o ID "${clientId}".`,
    )
  }

  const currentClient =
    await dependencies.clients
      .findById(
        clientId,
      )

  if (!currentClient) {
    throw new Error(
      `Cliente não encontrado para o ID "${clientId}".`,
    )
  }

  if (
    currentClient.status ===
    config.targetStatus
  ) {
    throw new Error(
      config
        .alreadyInTargetStatusMessage,
    )
  }

  if (
    !config.allowedCurrentStatuses
      .includes(
        currentClient.status,
      )
  ) {
    throw new Error(
      config
        .invalidCurrentStatusMessage,
    )
  }

  const updatedClient: Client = {
    ...currentClient,

    address: {
      ...currentClient.address,
    },

    tags: [
      ...currentClient.tags,
    ],

    status:
      config.targetStatus,

    updatedAt:
      (
        options.now ??
        new Date()
      ).toISOString(),
  }

  const savedClient =
    await dependencies.clients
      .update(
        updatedClient,
      )

  if (!savedClient) {
    throw new Error(
      `O cliente "${clientId}" não pôde ser atualizado.`,
    )
  }

  return {
    client: {
      ...savedClient,

      address: {
        ...savedClient.address,
      },

      tags: [
        ...savedClient.tags,
      ],
    },
  }
}
