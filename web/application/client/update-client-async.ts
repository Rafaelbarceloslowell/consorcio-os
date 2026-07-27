import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  Address,
  Client,
  EntityId,
  PersonType,
} from "@/types/domain"

import type {
  CreateClientInput,
} from "./create-client"

import {
  normalizeDocument,
  normalizeEmail,
  normalizePhone,
  normalizeStoredPhone,
} from "./shared/client-normalizer"

import {
  validateClientInput,
} from "./shared/client-validator"

export type UpdateClientInput = {
  workspaceId: EntityId
  clientId: EntityId
  type: PersonType
  name: string
  email: string
  phone: string
  phoneCountryCode?: string
  document: string
  birthDate?: string
  companyName?: string
  tradeName?: string
  stateRegistration?: string
  address: Address
  consultantId: EntityId
}

export type UpdateClientOutput = {
  client: Client
}

export type UpdateClientOptions = {
  now?: Date
}

export type UpdateClientAsyncDependencies = {
  workspaceId: EntityId
  clients:
    Pick<
      AsyncCrmRepositories["clients"],
      "findById" | "findAll" | "update"
    >
  consultants:
    Pick<
      AsyncCrmRepositories["consultants"],
      "findById"
    >
}

export class UpdateClientAsync {
  constructor(
    private readonly dependencies:
      UpdateClientAsyncDependencies,
    private readonly options:
      UpdateClientOptions = {},
  ) {}

  async execute(
    input: UpdateClientInput,
  ): Promise<UpdateClientOutput> {
    const workspaceId =
      input.workspaceId.trim()
    const clientId =
      input.clientId.trim()

    if (!workspaceId) {
      throw new Error(
        "O workspace é obrigatório para atualizar o cliente.",
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

    const validationInput:
      CreateClientInput = {
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      document: input.document,
      consultantId:
        input.consultantId,
      address: input.address,
      ...(input.phoneCountryCode !==
      undefined
        ? {
            phoneCountryCode:
              input.phoneCountryCode,
          }
        : {}),
      ...(input.birthDate !==
      undefined
        ? {
            birthDate:
              input.birthDate,
          }
        : {}),
      ...(input.companyName !==
      undefined
        ? {
            companyName:
              input.companyName,
          }
        : {}),
      ...(input.tradeName !==
      undefined
        ? {
            tradeName:
              input.tradeName,
          }
        : {}),
      ...(input.stateRegistration !==
      undefined
        ? {
            stateRegistration:
              input.stateRegistration,
          }
        : {}),
    }

    validateClientInput(
      validationInput,
    )

    const currentClient =
      await this.dependencies.clients
        .findById(clientId)

    if (!currentClient) {
      throw new Error(
        `Cliente não encontrado para o ID "${clientId}".`,
      )
    }

    const consultantId =
      input.consultantId.trim()
    const consultant =
      await this.dependencies
        .consultants
        .findById(consultantId)

    if (!consultant) {
      throw new Error(
        `Consultor não encontrado para o ID "${consultantId}".`,
      )
    }

    const normalizedEmail =
      normalizeEmail(input.email)
    const normalizedPhone =
      normalizePhone(
        input.phone,
        input.phoneCountryCode,
      )
    const normalizedDocument =
      normalizeDocument(
        input.document,
      )
    const clients =
      await this.dependencies.clients
        .findAll()
    const otherClients =
      clients.filter(
        (client) =>
          client.id !== clientId,
      )

    if (
      otherClients.some(
        (client) =>
          normalizeEmail(
            client.email,
          ) === normalizedEmail,
      )
    ) {
      throw new Error(
        `Já existe um cliente cadastrado com o e-mail "${normalizedEmail}".`,
      )
    }

    if (
      otherClients.some(
        (client) =>
          normalizeStoredPhone(
            client.phone,
          ) === normalizedPhone,
      )
    ) {
      throw new Error(
        "Já existe um cliente cadastrado com o telefone informado.",
      )
    }

    if (
      otherClients.some(
        (client) =>
          normalizeDocument(
            client.document,
          ) === normalizedDocument,
      )
    ) {
      throw new Error(
        "Já existe um cliente cadastrado com o documento informado.",
      )
    }

    const updatedClient: Client = {
      ...currentClient,
      type: input.type,
      name:
        input.type === "company"
          ? input.companyName!.trim()
          : input.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      document:
        input.document.trim(),
      birthDate:
        input.birthDate?.trim() ||
        undefined,
      companyName:
        input.companyName?.trim() ||
        undefined,
      tradeName:
        input.tradeName?.trim() ||
        undefined,
      stateRegistration:
        input.stateRegistration
          ?.trim() || undefined,
      address: {
        street:
          input.address.street.trim(),
        number:
          input.address.number.trim(),
        complement:
          input.address.complement
            ?.trim() || undefined,
        neighborhood:
          input.address
            .neighborhood.trim(),
        city:
          input.address.city.trim(),
        state:
          input.address.state
            .trim()
            .toUpperCase(),
        zipCode:
          input.address.zipCode.trim(),
      },
      consultantId,
      updatedAt:
        (
          this.options.now ??
          new Date()
        ).toISOString(),
    }

    const persistedClient =
      await this.dependencies.clients
        .update(updatedClient)

    if (!persistedClient) {
      throw new Error(
        `O cliente "${clientId}" não pôde ser atualizado.`,
      )
    }

    return {
      client: {
        ...persistedClient,
        address: {
          ...persistedClient.address,
        },
        tags: [
          ...persistedClient.tags,
        ],
      },
    }
  }
}
