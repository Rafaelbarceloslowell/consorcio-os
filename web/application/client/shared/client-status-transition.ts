import type {
    Client,
    ClientStatus,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  export type ClientStatusTransitionInput = {
    clientId: string
  }
  
  export type ClientStatusTransitionOutput = {
    client: Client
  }
  
  export type ClientStatusTransitionOptions = {
    now?: Date
  }
  
  type ClientStatusTransitionConfig = {
    targetStatus: ClientStatus
    allowedCurrentStatuses: ClientStatus[]
    alreadyInTargetStatusMessage: string
    invalidCurrentStatusMessage: string
  }
  
  export function executeClientStatusTransition(
    crmRepository: CrmRepository,
    input: ClientStatusTransitionInput,
    config: ClientStatusTransitionConfig,
    options: ClientStatusTransitionOptions = {},
  ): ClientStatusTransitionOutput {
    const clientId =
      input.clientId.trim()
  
    if (!clientId) {
      throw new Error(
        "O ID do cliente é obrigatório.",
      )
    }
  
    const currentClient =
      crmRepository.getClientById(
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
        config.alreadyInTargetStatusMessage,
      )
    }
  
    if (
      !config.allowedCurrentStatuses.includes(
        currentClient.status,
      )
    ) {
      throw new Error(
        config.invalidCurrentStatusMessage,
      )
    }
  
    const updatedClient: Client = {
      ...currentClient,
  
      status:
        config.targetStatus,
  
      updatedAt:
        (
          options.now ??
          new Date()
        ).toISOString(),
    }
  
    const savedClient =
      crmRepository.updateClient(
        updatedClient,
      )
  
    return {
      client:
        savedClient,
    }
  }