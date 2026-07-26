import type {
  Client,
} from "@/types/domain"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  CreateClientInput,
  CreateClientOptions,
  CreateClientOutput,
} from "./create-client"

import {
  normalizeDocument,
  normalizeEmail,
  normalizePhone,
  normalizeStoredPhone,
  normalizeTags,
} from "./shared/client-normalizer"

import {
  validateClientInput,
} from "./shared/client-validator"

export type CreateClientAsyncDependencies = Pick<
  AsyncCrmRepositories,
  "clients" | "consultants"
>

function generateDefaultId(): string {
  return `client-${globalThis.crypto.randomUUID()}`
}

export class CreateClientAsync {
  constructor(
    private readonly dependencies:
      CreateClientAsyncDependencies,
    private readonly options:
      CreateClientOptions = {},
  ) {}

  async execute(
    input: CreateClientInput,
  ): Promise<CreateClientOutput> {
    validateClientInput(
      input,
    )

    const consultantId =
      input.consultantId.trim()

    const consultant =
      await this.dependencies
        .consultants
        .findById(
          consultantId,
        )

    if (!consultant) {
      throw new Error(
        `Consultor não encontrado para o ID "${consultantId}".`,
      )
    }

    const normalizedEmail =
      normalizeEmail(
        input.email,
      )

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
      await this.dependencies
        .clients
        .findAll()

    const duplicatedEmail =
      clients.some(
        (client) =>
          normalizeEmail(
            client.email,
          ) === normalizedEmail,
      )

    if (duplicatedEmail) {
      throw new Error(
        `Já existe um cliente cadastrado com o e-mail "${normalizedEmail}".`,
      )
    }

    const duplicatedPhone =
      clients.some(
        (client) =>
          normalizeStoredPhone(
            client.phone,
          ) === normalizedPhone,
      )

    if (duplicatedPhone) {
      throw new Error(
        "Já existe um cliente cadastrado com o telefone informado.",
      )
    }

    const duplicatedDocument =
      clients.some(
        (client) =>
          normalizeDocument(
            client.document,
          ) === normalizedDocument,
      )

    if (duplicatedDocument) {
      throw new Error(
        "Já existe um cliente cadastrado com o documento informado.",
      )
    }

    const timestamp =
      (
        this.options.now ??
        new Date()
      ).toISOString()

    const generateId =
      this.options.generateId ??
      generateDefaultId

    const clientName =
      input.type === "company"
        ? input.companyName!.trim()
        : input.name.trim()

    const client: Client = {
      id: generateId(),
      type: input.type,
      name: clientName,
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
          ?.trim() ||
        undefined,
      address: {
        street:
          input.address.street.trim(),
        number:
          input.address.number.trim(),
        complement:
          input.address.complement
            ?.trim() ||
          undefined,
        neighborhood:
          input.address
            .neighborhood
            .trim(),
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
      leadId:
        input.leadId?.trim() ||
        undefined,
      status: "active",
      tags:
        normalizeTags(
          input.tags,
        ),
      notes:
        input.notes?.trim() ||
        undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const createdClient =
      await this.dependencies
        .clients
        .create(
          client,
        )

    return {
      client: createdClient,
    }
  }
}
