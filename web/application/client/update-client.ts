import type {
    Address,
    Client,
    PersonType,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
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
  
  export type UpdateClientInput = {
    clientId: string
    type?: PersonType
    name?: string
    email?: string
    phone?: string
    phoneCountryCode?: string
    document?: string
    address?: Partial<Address>
    consultantId?: string
    birthDate?: string
    companyName?: string
    tradeName?: string
    stateRegistration?: string
    tags?: string[]
    notes?: string
  }
  
  export type UpdateClientOutput = {
    client: Client
  }
  
  export type UpdateClientOptions = {
    now?: Date
  }
  
  function mergeAddress(
    currentAddress: Address,
    updatedAddress:
      | Partial<Address>
      | undefined,
  ): Address {
    return {
      street:
        updatedAddress?.street ??
        currentAddress.street,
  
      number:
        updatedAddress?.number ??
        currentAddress.number,
  
      complement:
        updatedAddress &&
        "complement" in updatedAddress
          ? updatedAddress.complement
          : currentAddress.complement,
  
      neighborhood:
        updatedAddress?.neighborhood ??
        currentAddress.neighborhood,
  
      city:
        updatedAddress?.city ??
        currentAddress.city,
  
      state:
        updatedAddress?.state ??
        currentAddress.state,
  
      zipCode:
        updatedAddress?.zipCode ??
        currentAddress.zipCode,
    }
  }
  
  export class UpdateClient {
    constructor(
      private readonly crmRepository: CrmRepository,
      private readonly options: UpdateClientOptions = {},
    ) {}
  
    execute(
      input: UpdateClientInput,
    ): UpdateClientOutput {
      const clientId =
        input.clientId.trim()
  
      if (!clientId) {
        throw new Error(
          "O ID do cliente é obrigatório.",
        )
      }
  
      const currentClient =
        this.crmRepository
          .getClientById(
            clientId,
          )
  
      if (!currentClient) {
        throw new Error(
          `Cliente não encontrado para o ID "${clientId}".`,
        )
      }
  
      const type =
        input.type ??
        currentClient.type
  
      const consultantId =
        input.consultantId !== undefined
          ? input.consultantId.trim()
          : currentClient.consultantId
  
      const consultant =
        this.crmRepository
          .getConsultantById(
            consultantId,
          )
  
      if (!consultant) {
        throw new Error(
          `Consultor não encontrado para o ID "${consultantId}".`,
        )
      }
  
      const mergedAddress =
        mergeAddress(
          currentClient.address,
          input.address,
        )
  
      const companyName =
        input.companyName !== undefined
          ? input.companyName.trim() ||
            undefined
          : currentClient.companyName
  
      const individualName =
        input.name !== undefined
          ? input.name.trim()
          : currentClient.name
  
      const name =
        type === "company"
          ? companyName ?? ""
          : individualName
  
      const email =
        input.email !== undefined
          ? input.email
          : currentClient.email
  
      const phone =
        input.phone !== undefined
          ? input.phone
          : currentClient.phone
  
      const document =
        input.document !== undefined
          ? input.document
          : currentClient.document
  
      const birthDate =
        input.birthDate !== undefined
          ? input.birthDate.trim() ||
            undefined
          : currentClient.birthDate
  
      validateClientInput({
        type,
        name,
        email,
        phone,
        phoneCountryCode:
          input.phone !== undefined
            ? input.phoneCountryCode
            : undefined,
        document,
        address: mergedAddress,
        consultantId,
        birthDate,
        companyName,
      })
  
      const normalizedEmail =
        normalizeEmail(
          email,
        )
  
      const normalizedPhone =
        input.phone !== undefined
          ? normalizePhone(
              phone,
              input.phoneCountryCode,
            )
          : normalizeStoredPhone(
              currentClient.phone,
            )
  
      const normalizedDocument =
        normalizeDocument(
          document,
        )
  
      const otherClients =
        this.crmRepository
          .getClients()
          .filter(
            (client) =>
              client.id !==
              currentClient.id,
          )
  
      const duplicatedEmail =
        otherClients.some(
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
        otherClients.some(
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
        otherClients.some(
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
  
      const updatedClient: Client = {
        ...currentClient,
  
        type,
  
        name,
  
        email:
          normalizedEmail,
  
        phone:
          normalizedPhone,
  
        document:
          document.trim(),
  
        birthDate,
  
        companyName:
          type === "company"
            ? companyName
            : undefined,
  
        tradeName:
          type === "company"
            ? input.tradeName !== undefined
              ? input.tradeName.trim() ||
                undefined
              : currentClient.tradeName
            : undefined,
  
        stateRegistration:
          type === "company"
            ? input.stateRegistration !== undefined
              ? input.stateRegistration.trim() ||
                undefined
              : currentClient.stateRegistration
            : undefined,
  
        address: {
          street:
            mergedAddress.street.trim(),
  
          number:
            mergedAddress.number.trim(),
  
          complement:
            mergedAddress.complement
              ?.trim() ||
            undefined,
  
          neighborhood:
            mergedAddress
              .neighborhood
              .trim(),
  
          city:
            mergedAddress.city.trim(),
  
          state:
            mergedAddress.state
              .trim()
              .toUpperCase(),
  
          zipCode:
            mergedAddress.zipCode.trim(),
        },
  
        consultantId,
  
        tags:
          input.tags !== undefined
            ? normalizeTags(
                input.tags,
              )
            : currentClient.tags,
  
        notes:
          input.notes !== undefined
            ? input.notes.trim() ||
              undefined
            : currentClient.notes,
  
        updatedAt:
          (
            this.options.now ??
            new Date()
          ).toISOString(),
      }
  
      const savedClient =
        this.crmRepository
          .updateClient(
            updatedClient,
          )
  
      return {
        client: savedClient,
      }
    }
  }