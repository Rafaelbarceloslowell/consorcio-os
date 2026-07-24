import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

import type {
  Address,
  Client,
  CommercialJourney,
  Lead,
  PersonType,
} from "@/types/domain"

export type ConvertLeadInput = {
  leadId: string

  journeyId: string

  type: PersonType

  document: string

  address: Address

  birthDate?: string

  companyName?: string

  tradeName?: string

  stateRegistration?: string

  tags?: string[]

  notes?: string
}

export type ConvertLeadResult = {
  client: Client

  lead: Lead

  journey: CommercialJourney
}

type ConvertLeadCommonDependencies = {
  crmRepository: CrmRepository

  now?: Date

  generateId?: () => string
}

export type ConvertLeadLegacyDependencies =
  ConvertLeadCommonDependencies & {
    commercialRepository:
      CommercialRepository
  }

export type ConvertLeadAsyncDependencies =
  ConvertLeadCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories
  }

/**
 * Mantido como dependência legada para preservar
 * a compatibilidade com consumidores síncronos.
 */
export type ConvertLeadDependencies =
  ConvertLeadLegacyDependencies

export type ConvertLeadAnyDependencies =
  | ConvertLeadLegacyDependencies
  | ConvertLeadAsyncDependencies

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "journeys" in
      commercialRepository
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  if (
    typeof journeysRepository !==
      "object" ||
    journeysRepository === null
  ) {
    return false
  }

  return (
    "findById" in
      journeysRepository &&
    typeof journeysRepository.findById ===
      "function" &&
    "update" in
      journeysRepository &&
    typeof journeysRepository.update ===
      "function"
  )
}

function normalizeEmail(
  email: string,
): string {
  return email
    .trim()
    .toLowerCase()
}

function normalizeDocument(
  document: string,
): string {
  return document.replace(
    /\D/g,
    "",
  )
}

function generateDefaultId(): string {
  return `client-${globalThis.crypto.randomUUID()}`
}

function validateAddress(
  address: Address,
): void {
  if (
    !address.street.trim()
  ) {
    throw new Error(
      "A rua do cliente é obrigatória.",
    )
  }

  if (
    !address.number.trim()
  ) {
    throw new Error(
      "O número do endereço do cliente é obrigatório.",
    )
  }

  if (
    !address.neighborhood.trim()
  ) {
    throw new Error(
      "O bairro do cliente é obrigatório.",
    )
  }

  if (
    !address.city.trim()
  ) {
    throw new Error(
      "A cidade do cliente é obrigatória.",
    )
  }

  if (
    !address.state.trim()
  ) {
    throw new Error(
      "O estado do cliente é obrigatório.",
    )
  }

  if (
    !address.zipCode.trim()
  ) {
    throw new Error(
      "O CEP do cliente é obrigatório.",
    )
  }
}

function validateInput(
  input: ConvertLeadInput,
): void {
  if (
    !input.leadId.trim()
  ) {
    throw new Error(
      "O ID do lead é obrigatório para realizar a conversão.",
    )
  }

  if (
    !input.journeyId.trim()
  ) {
    throw new Error(
      "O ID da jornada é obrigatório para realizar a conversão.",
    )
  }

  if (
    !normalizeDocument(
      input.document,
    )
  ) {
    throw new Error(
      "O documento do cliente é obrigatório.",
    )
  }

  if (
    input.type === "company" &&
    !input.companyName?.trim()
  ) {
    throw new Error(
      "A razão social é obrigatória para clientes do tipo empresa.",
    )
  }

  validateAddress(
    input.address,
  )
}

function getValidatedLead({
  input,
  crmRepository,
}: {
  input: ConvertLeadInput

  crmRepository: CrmRepository
}): Lead {
  const lead =
    crmRepository.getLeadById(
      input.leadId,
    )

  if (!lead) {
    throw new Error(
      `Lead não encontrado para o ID "${input.leadId}".`,
    )
  }

  if (
    lead.status ===
    "converted"
  ) {
    throw new Error(
      `O lead "${lead.id}" já foi convertido em cliente.`,
    )
  }

  if (
    lead.status !==
    "qualified"
  ) {
    throw new Error(
      `O lead "${lead.id}" precisa estar qualificado antes da conversão.`,
    )
  }

  return lead
}

function validateJourney({
  journey,
  journeyId,
  lead,
}: {
  journey:
    | CommercialJourney
    | undefined

  journeyId: string

  lead: Lead
}): CommercialJourney {
  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${journeyId}".`,
    )
  }

  if (
    journey.leadId !==
    lead.id
  ) {
    throw new Error(
      `A jornada "${journey.id}" não pertence ao lead "${lead.id}".`,
    )
  }

  if (
    journey.clientId
  ) {
    throw new Error(
      `A jornada "${journey.id}" já possui um cliente vinculado.`,
    )
  }

  if (
    journey.closedAt !==
      null ||
    journey.outcome !==
      null
  ) {
    throw new Error(
      `A jornada "${journey.id}" está encerrada e não pode receber um cliente.`,
    )
  }

  if (
    journey.consultantId !==
    lead.consultantId
  ) {
    throw new Error(
      `O consultor da jornada "${journey.id}" é diferente do consultor responsável pelo lead "${lead.id}".`,
    )
  }

  return journey
}

function validateCrmDuplicatesAndGetWonStage({
  lead,
  input,
  crmRepository,
}: {
  lead: Lead

  input: ConvertLeadInput

  crmRepository: CrmRepository
}) {
  const normalizedEmail =
    normalizeEmail(
      lead.email,
    )

  const normalizedDocument =
    normalizeDocument(
      input.document,
    )

  const duplicatedEmail =
    crmRepository
      .getClients()
      .some(
        (client) =>
          normalizeEmail(
            client.email,
          ) ===
          normalizedEmail,
      )

  if (
    duplicatedEmail
  ) {
    throw new Error(
      `Já existe um cliente cadastrado com o e-mail "${normalizedEmail}".`,
    )
  }

  const duplicatedDocument =
    crmRepository
      .getClients()
      .some(
        (client) =>
          normalizeDocument(
            client.document,
          ) ===
          normalizedDocument,
      )

  if (
    duplicatedDocument
  ) {
    throw new Error(
      "Já existe um cliente cadastrado com o documento informado.",
    )
  }

  const wonPipelineStage =
    crmRepository
      .getPipelineStages()
      .filter(
        (pipelineStage) =>
          pipelineStage
            .isClosedStage &&
          pipelineStage
            .isWonStage,
      )
      .sort(
        (
          firstStage,
          secondStage,
        ) =>
          firstStage.order -
          secondStage.order,
      )[0]

  if (
    !wonPipelineStage
  ) {
    throw new Error(
      "Nenhum estágio ganho foi encontrado no pipeline do CRM.",
    )
  }

  return {
    normalizedEmail,
    wonPipelineStage,
  }
}

function buildConversionEntities({
  input,
  lead,
  journey,
  normalizedEmail,
  wonPipelineStageId,
  now,
  generateId,
}: {
  input: ConvertLeadInput

  lead: Lead

  journey: CommercialJourney

  normalizedEmail: string

  wonPipelineStageId: string

  now: Date

  generateId: () => string
}): {
  client: Client

  updatedLead: Lead

  updatedJourney: CommercialJourney
} {
  const timestamp =
    now.toISOString()

  const client: Client = {
    id:
      generateId(),

    type:
      input.type,

    name:
      input.type ===
      "company"
        ? input
            .companyName!
            .trim()
        : lead.name.trim(),

    email:
      normalizedEmail,

    phone:
      lead.phone.trim(),

    document:
      input.document.trim(),

    birthDate:
      input.birthDate
        ?.trim() ||
      undefined,

    companyName:
      input.type ===
      "company"
        ? input
            .companyName!
            .trim()
        : input
            .companyName
            ?.trim() ||
          lead
            .companyName
            ?.trim() ||
          undefined,

    tradeName:
      input.tradeName
        ?.trim() ||
      undefined,

    stateRegistration:
      input
        .stateRegistration
        ?.trim() ||
      undefined,

    address: {
      street:
        input.address
          .street
          .trim(),

      number:
        input.address
          .number
          .trim(),

      complement:
        input.address
          .complement
          ?.trim() ||
        undefined,

      neighborhood:
        input.address
          .neighborhood
          .trim(),

      city:
        input.address
          .city
          .trim(),

      state:
        input.address
          .state
          .trim()
          .toUpperCase(),

      zipCode:
        input.address
          .zipCode
          .trim(),
    },

    consultantId:
      lead.consultantId,

    leadId:
      lead.id,

    status:
      "active",

    tags:
      input.tags
        ?.map(
          (tag) =>
            tag.trim(),
        )
        .filter(Boolean) ??
      [],

    notes:
      input.notes
        ?.trim() ||
      lead.notes
        ?.trim() ||
      undefined,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  }

  const updatedLead: Lead = {
    ...lead,

    status:
      "converted",

    pipelineStageId:
      wonPipelineStageId,

    convertedClientId:
      client.id,

    lastContactAt:
      timestamp,

    updatedAt:
      timestamp,
  }

  const updatedJourney:
    CommercialJourney = {
      ...journey,

      clientId:
        client.id,

      lastInteractionAt:
        timestamp,

      version:
        journey.version + 1,

      updatedAt:
        timestamp,
    }

  return {
    client,
    updatedLead,
    updatedJourney,
  }
}

function convertLegacyLead(
  input: ConvertLeadInput,
  {
    crmRepository,
    commercialRepository,
    now = new Date(),
    generateId =
      generateDefaultId,
  }: ConvertLeadLegacyDependencies,
): ConvertLeadResult {
  validateInput(
    input,
  )

  const lead =
    getValidatedLead({
      input,
      crmRepository,
    })

  const journey =
    validateJourney({
      journey:
        commercialRepository
          .getJourneyById(
            input.journeyId,
          ),

      journeyId:
        input.journeyId,

      lead,
    })

  const {
    normalizedEmail,
    wonPipelineStage,
  } =
    validateCrmDuplicatesAndGetWonStage({
      lead,
      input,
      crmRepository,
    })

  const {
    client,
    updatedLead,
    updatedJourney,
  } =
    buildConversionEntities({
      input,

      lead,

      journey,

      normalizedEmail,

      wonPipelineStageId:
        wonPipelineStage.id,

      now,

      generateId,
    })

  const createdClient =
    crmRepository.createClient(
      client,
    )

  const persistedLead =
    crmRepository.updateLead(
      updatedLead,
    )

  const persistedJourney =
    commercialRepository
      .updateJourney(
        updatedJourney,
      )

  return {
    client:
      createdClient,

    lead:
      persistedLead,

    journey:
      persistedJourney,
  }
}

async function convertAsyncLead(
  input: ConvertLeadInput,
  {
    crmRepository,
    commercialRepository,
    now = new Date(),
    generateId =
      generateDefaultId,
  }: ConvertLeadAsyncDependencies,
): Promise<ConvertLeadResult> {
  validateInput(
    input,
  )

  const lead =
    getValidatedLead({
      input,
      crmRepository,
    })

  const foundJourney =
    await commercialRepository
      .journeys
      .findById(
        input.journeyId,
      )

  const journey =
    validateJourney({
      journey:
        foundJourney,

      journeyId:
        input.journeyId,

      lead,
    })

  const {
    normalizedEmail,
    wonPipelineStage,
  } =
    validateCrmDuplicatesAndGetWonStage({
      lead,
      input,
      crmRepository,
    })

  const {
    client,
    updatedLead,
    updatedJourney,
  } =
    buildConversionEntities({
      input,

      lead,

      journey,

      normalizedEmail,

      wonPipelineStageId:
        wonPipelineStage.id,

      now,

      generateId,
    })

  const createdClient =
    crmRepository.createClient(
      client,
    )

  const persistedLead =
    crmRepository.updateLead(
      updatedLead,
    )

  const persistedJourney =
    await commercialRepository
      .journeys
      .update(
        updatedJourney,
      )

  if (!persistedJourney) {
    throw new Error(
      `Não foi possível atualizar a jornada comercial "${updatedJourney.id}".`,
    )
  }

  return {
    client:
      createdClient,

    lead:
      persistedLead,

    journey:
      persistedJourney,
  }
}

export function convertLead(
  input: ConvertLeadInput,
  dependencies:
    ConvertLeadAsyncDependencies,
): Promise<ConvertLeadResult>

export function convertLead(
  input: ConvertLeadInput,
  dependencies:
    ConvertLeadLegacyDependencies,
): ConvertLeadResult

export function convertLead(
  input: ConvertLeadInput,
  dependencies:
    ConvertLeadAnyDependencies,
):
  | ConvertLeadResult
  | Promise<ConvertLeadResult> {
  if (
    isAsyncCommercialRepositories(
      dependencies
        .commercialRepository,
    )
  ) {
    return convertAsyncLead(
      input,
      {
        ...dependencies,

        commercialRepository:
          dependencies
            .commercialRepository,
      },
    )
  }

  return convertLegacyLead(
    input,
    {
      ...dependencies,

      commercialRepository:
        dependencies
          .commercialRepository,
    },
  )
}