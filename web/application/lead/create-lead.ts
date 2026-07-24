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
  CommercialJourney,
  ConsortiumType,
  Lead,
  LeadSource,
} from "@/types/domain"

export type CreateLeadInput = {
  workspaceId: string

  consultantId: string

  name: string

  email: string

  phone: string

  source: LeadSource

  consortiumType: ConsortiumType

  desiredCreditValue: number

  desiredTermMonths: number

  document?: string

  companyName?: string

  notes?: string
}

export type CreateLeadResult = {
  lead: Lead

  journey: CommercialJourney
}

type CreateLeadCommonDependencies = {
  crmRepository: CrmRepository

  now?: Date

  generateId?: (
    entity: "lead" | "journey",
  ) => string
}

export type CreateLeadLegacyDependencies =
  CreateLeadCommonDependencies & {
    commercialRepository:
      CommercialRepository
  }

export type CreateLeadAsyncDependencies =
  CreateLeadCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories
  }

/**
 * Mantido como dependência legada para preservar
 * a compatibilidade com os testes e consumidores
 * síncronos existentes.
 */
export type CreateLeadDependencies =
  CreateLeadLegacyDependencies

export type CreateLeadAnyDependencies =
  | CreateLeadLegacyDependencies
  | CreateLeadAsyncDependencies

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "journeys" in
      commercialRepository
    ) ||
    !(
      "phases" in
      commercialRepository
    ) ||
    !(
      "states" in
      commercialRepository
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  const phasesRepository =
    commercialRepository.phases

  const statesRepository =
    commercialRepository.states

  if (
    typeof journeysRepository !==
      "object" ||
    journeysRepository === null ||
    typeof phasesRepository !==
      "object" ||
    phasesRepository === null ||
    typeof statesRepository !==
      "object" ||
    statesRepository === null
  ) {
    return false
  }

  return (
    "create" in
      journeysRepository &&
    typeof journeysRepository.create ===
      "function" &&
    "findById" in
      phasesRepository &&
    typeof phasesRepository.findById ===
      "function" &&
    "findAll" in
      statesRepository &&
    typeof statesRepository.findAll ===
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

function normalizePhone(
  phone: string,
): string {
  return phone.replace(
    /\D/g,
    "",
  )
}

function generateDefaultId(
  entity:
    | "lead"
    | "journey",
): string {
  return `${entity}-${globalThis.crypto.randomUUID()}`
}

function validateInput(
  input: CreateLeadInput,
): void {
  if (
    !input.workspaceId.trim()
  ) {
    throw new Error(
      "O workspace é obrigatório para criar o lead.",
    )
  }

  if (
    !input.consultantId.trim()
  ) {
    throw new Error(
      "O consultor é obrigatório para criar o lead.",
    )
  }

  if (
    !input.name.trim()
  ) {
    throw new Error(
      "O nome do lead é obrigatório.",
    )
  }

  if (
    !input.email.trim()
  ) {
    throw new Error(
      "O e-mail do lead é obrigatório.",
    )
  }

  if (
    !input.email.includes("@")
  ) {
    throw new Error(
      "O e-mail informado é inválido.",
    )
  }

  if (
    !normalizePhone(
      input.phone,
    )
  ) {
    throw new Error(
      "O telefone do lead é obrigatório.",
    )
  }

  if (
    !Number.isFinite(
      input.desiredCreditValue,
    ) ||
    input.desiredCreditValue <= 0
  ) {
    throw new Error(
      "O valor de crédito desejado deve ser maior que zero.",
    )
  }

  if (
    !Number.isInteger(
      input.desiredTermMonths,
    ) ||
    input.desiredTermMonths <= 0
  ) {
    throw new Error(
      "O prazo desejado deve ser um número inteiro maior que zero.",
    )
  }
}

function validateCrmAndGetInitialStage({
  input,
  crmRepository,
}: {
  input: CreateLeadInput

  crmRepository: CrmRepository
}) {
  const normalizedEmail =
    normalizeEmail(
      input.email,
    )

  const normalizedPhone =
    normalizePhone(
      input.phone,
    )

  const consultant =
    crmRepository
      .getConsultantById(
        input.consultantId,
      )

  if (!consultant) {
    throw new Error(
      `Consultor não encontrado para o ID "${input.consultantId}".`,
    )
  }

  const duplicatedEmail =
    crmRepository
      .getLeads()
      .some(
        (lead) =>
          normalizeEmail(
            lead.email,
          ) ===
          normalizedEmail,
      )

  if (
    duplicatedEmail
  ) {
    throw new Error(
      `Já existe um lead cadastrado com o e-mail "${normalizedEmail}".`,
    )
  }

  const duplicatedPhone =
    crmRepository
      .getLeads()
      .some(
        (lead) =>
          normalizePhone(
            lead.phone,
          ) ===
          normalizedPhone,
      )

  if (
    duplicatedPhone
  ) {
    throw new Error(
      "Já existe um lead cadastrado com o telefone informado.",
    )
  }

  const initialPipelineStage =
    crmRepository
      .getPipelineStages()
      .filter(
        (pipelineStage) =>
          pipelineStage.type ===
            "lead" &&
          !pipelineStage
            .isClosedStage,
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
    !initialPipelineStage
  ) {
    throw new Error(
      "Nenhum estágio inicial de lead foi encontrado no CRM.",
    )
  }

  return {
    normalizedEmail,
    initialPipelineStage,
  }
}

function buildLeadAndJourney({
  input,
  normalizedEmail,
  initialPipelineStageId,
  initialPhaseId,
  initialStateId,
  now,
  generateId,
}: {
  input: CreateLeadInput

  normalizedEmail: string

  initialPipelineStageId: string

  initialPhaseId: string

  initialStateId: string

  now: Date

  generateId: (
    entity:
      | "lead"
      | "journey",
  ) => string
}): {
  lead: Lead

  journey: CommercialJourney
} {
  const timestamp =
    now.toISOString()

  const lead: Lead = {
    id:
      generateId(
        "lead",
      ),

    name:
      input.name.trim(),

    email:
      normalizedEmail,

    phone:
      input.phone.trim(),

    document:
      input.document
        ?.trim() ||
      undefined,

    companyName:
      input.companyName
        ?.trim() ||
      undefined,

    source:
      input.source,

    status:
      "new",

    consortiumType:
      input.consortiumType,

    desiredCreditValue:
      input.desiredCreditValue,

    desiredTermMonths:
      input.desiredTermMonths,

    consultantId:
      input.consultantId,

    pipelineStageId:
      initialPipelineStageId,

    score:
      0,

    notes:
      input.notes
        ?.trim() ||
      undefined,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  }

  const journey:
    CommercialJourney = {
      id:
        generateId(
          "journey",
        ),

      workspaceId:
        input.workspaceId,

      leadId:
        lead.id,

      clientId:
        null,

      consultantId:
        input.consultantId,

      title:
        `Oportunidade - ${lead.name}`,

      consortiumType:
        input.consortiumType,

      currentPhaseId:
        initialPhaseId,

      currentStateId:
        initialStateId,

      priority:
        "NORMAL",

      score:
        0,

      outcome:
        null,

      stateEnteredAt:
        timestamp,

      lastInteractionAt:
        null,

      closedAt:
        null,

      version:
        1,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    }

  return {
    lead,
    journey,
  }
}

function createLegacyLead(
  input:
    CreateLeadInput,
  {
    crmRepository,
    commercialRepository,
    now = new Date(),
    generateId =
      generateDefaultId,
  }: CreateLeadLegacyDependencies,
): CreateLeadResult {
  validateInput(
    input,
  )

  const {
    normalizedEmail,
    initialPipelineStage,
  } =
    validateCrmAndGetInitialStage({
      input,
      crmRepository,
    })

  const initialState =
    commercialRepository
      .getStates()
      .filter(
        (state) =>
          state.workspaceId ===
            input.workspaceId &&
          state.isInitial &&
          state.isActive &&
          !state.isFinal,
      )
      .sort(
        (
          firstState,
          secondState,
        ) =>
          firstState.order -
          secondState.order,
      )[0]

  if (
    !initialState
  ) {
    throw new Error(
      `Nenhum estado comercial inicial foi encontrado para o workspace "${input.workspaceId}".`,
    )
  }

  const initialPhase =
    commercialRepository
      .getPhaseById(
        initialState.phaseId,
      )

  if (
    !initialPhase ||
    !initialPhase.isActive ||
    (
      initialPhase.workspaceId !==
        null &&
      initialPhase.workspaceId !==
        input.workspaceId
    )
  ) {
    throw new Error(
      `A fase comercial inicial vinculada ao estado "${initialState.id}" não está disponível.`,
    )
  }

  const {
    lead,
    journey,
  } =
    buildLeadAndJourney({
      input,

      normalizedEmail,

      initialPipelineStageId:
        initialPipelineStage.id,

      initialPhaseId:
        initialPhase.id,

      initialStateId:
        initialState.id,

      now,

      generateId,
    })

  const createdLead =
    crmRepository
      .createLead(
        lead,
      )

  const createdJourney =
    commercialRepository
      .createJourney(
        journey,
      )

  return {
    lead:
      createdLead,

    journey:
      createdJourney,
  }
}

async function createAsyncLead(
  input:
    CreateLeadInput,
  {
    crmRepository,
    commercialRepository,
    now = new Date(),
    generateId =
      generateDefaultId,
  }: CreateLeadAsyncDependencies,
): Promise<CreateLeadResult> {
  validateInput(
    input,
  )

  const {
    normalizedEmail,
    initialPipelineStage,
  } =
    validateCrmAndGetInitialStage({
      input,
      crmRepository,
    })

  const states =
    await commercialRepository
      .states
      .findAll()

  const initialState =
    states
      .filter(
        (state) =>
          state.workspaceId ===
            input.workspaceId &&
          state.isInitial &&
          state.isActive &&
          !state.isFinal,
      )
      .sort(
        (
          firstState,
          secondState,
        ) =>
          firstState.order -
          secondState.order,
      )[0]

  if (
    !initialState
  ) {
    throw new Error(
      `Nenhum estado comercial inicial foi encontrado para o workspace "${input.workspaceId}".`,
    )
  }

  const initialPhase =
    await commercialRepository
      .phases
      .findById(
        initialState.phaseId,
      )

  if (
    !initialPhase ||
    !initialPhase.isActive ||
    (
      initialPhase.workspaceId !==
        null &&
      initialPhase.workspaceId !==
        input.workspaceId
    )
  ) {
    throw new Error(
      `A fase comercial inicial vinculada ao estado "${initialState.id}" não está disponível.`,
    )
  }

  const {
    lead,
    journey,
  } =
    buildLeadAndJourney({
      input,

      normalizedEmail,

      initialPipelineStageId:
        initialPipelineStage.id,

      initialPhaseId:
        initialPhase.id,

      initialStateId:
        initialState.id,

      now,

      generateId,
    })

  const createdLead =
    crmRepository
      .createLead(
        lead,
      )

  const createdJourney =
    await commercialRepository
      .journeys
      .create(
        journey,
      )

  return {
    lead:
      createdLead,

    journey:
      createdJourney,
  }
}

export function createLead(
  input:
    CreateLeadInput,
  dependencies:
    CreateLeadAsyncDependencies,
): Promise<CreateLeadResult>

export function createLead(
  input:
    CreateLeadInput,
  dependencies:
    CreateLeadLegacyDependencies,
): CreateLeadResult

export function createLead(
  input:
    CreateLeadInput,
  dependencies:
    CreateLeadAnyDependencies,
):
  | CreateLeadResult
  | Promise<CreateLeadResult> {
  if (
    isAsyncCommercialRepositories(
      dependencies
        .commercialRepository,
    )
  ) {
    return createAsyncLead(
      input,
      {
        ...dependencies,

        commercialRepository:
          dependencies
            .commercialRepository,
      },
    )
  }

  return createLegacyLead(
    input,
    {
      ...dependencies,

      commercialRepository:
        dependencies
          .commercialRepository,
    },
  )
}