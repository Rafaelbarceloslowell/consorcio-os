import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  CommercialJourney,
  CommercialJourneyPriority,
  ConsortiumType,
  EntityId,
} from "@/types/domain"

export type CreateOpportunityInput = {
  workspaceId: EntityId
  clientId: EntityId
  consultantId?: EntityId
  title?: string
  consortiumType: ConsortiumType
  priority?: CommercialJourneyPriority
  score?: number
}

export type CreateOpportunityOutput = {
  opportunity: CommercialJourney
}

export type CreateOpportunityOptions = {
  now?: Date
  generateId?: () => string
}

export type CreateOpportunityAsyncDependencies =
  Pick<
    AsyncCrmRepositories,
    "clients" | "consultants"
  > &
  Pick<
    AsyncCommercialRepositories,
    "journeys" | "phases" | "states"
  >

const CONSORTIUM_TYPES:
  ConsortiumType[] = [
    "real_estate",
    "vehicle",
    "heavy_vehicle",
    "services",
    "other",
  ]

const OPPORTUNITY_PRIORITIES:
  CommercialJourneyPriority[] = [
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
  ]

function generateDefaultId(): string {
  return `journey-${globalThis.crypto.randomUUID()}`
}

function validateInput(
  input: CreateOpportunityInput,
): void {
  if (!input.workspaceId.trim()) {
    throw new Error(
      "O workspace é obrigatório para criar a oportunidade.",
    )
  }

  if (!input.clientId.trim()) {
    throw new Error(
      "O cliente é obrigatório para criar a oportunidade.",
    )
  }

  if (
    !CONSORTIUM_TYPES.includes(
      input.consortiumType,
    )
  ) {
    throw new Error(
      "O tipo de consórcio informado é inválido.",
    )
  }

  if (
    input.priority !== undefined &&
    !OPPORTUNITY_PRIORITIES.includes(
      input.priority,
    )
  ) {
    throw new Error(
      "A prioridade da oportunidade é inválida.",
    )
  }

  if (
    input.score !== undefined &&
    (
      !Number.isInteger(input.score) ||
      input.score < 0 ||
      input.score > 100
    )
  ) {
    throw new Error(
      "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
    )
  }
}

export class CreateOpportunityAsync {
  constructor(
    private readonly dependencies:
      CreateOpportunityAsyncDependencies,
    private readonly options:
      CreateOpportunityOptions = {},
  ) {}

  async execute(
    input: CreateOpportunityInput,
  ): Promise<CreateOpportunityOutput> {
    validateInput(input)

    const workspaceId =
      input.workspaceId.trim()

    const clientId =
      input.clientId.trim()

    const client =
      await this.dependencies
        .clients
        .findById(clientId)

    if (!client) {
      throw new Error(
        `Cliente não encontrado para o ID "${clientId}".`,
      )
    }

    const consultantId =
      input.consultantId?.trim() ||
      client.consultantId

    const consultant =
      await this.dependencies
        .consultants
        .findById(consultantId)

    if (!consultant) {
      throw new Error(
        `Consultor não encontrado para o ID "${consultantId}".`,
      )
    }

    const phases =
      await this.dependencies
        .phases
        .findAll()

    const states =
      await this.dependencies
        .states
        .findAll()

    const initialState =
      states
        .filter(
          (state) =>
            state.workspaceId ===
              workspaceId &&
            state.isActive &&
            state.isInitial &&
            !state.isFinal,
        )
        .sort(
          (firstState, secondState) =>
            firstState.order -
            secondState.order,
        )[0]

    if (!initialState) {
      throw new Error(
        `Nenhum estado comercial inicial foi encontrado para o workspace "${workspaceId}".`,
      )
    }

    const initialPhase =
      phases.find(
        (phase) =>
          phase.id ===
          initialState.phaseId,
      )

    if (
      !initialPhase ||
      !initialPhase.isActive ||
      initialPhase.workspaceId !==
        workspaceId
    ) {
      throw new Error(
        `A fase comercial inicial vinculada ao estado "${initialState.id}" não está disponível.`,
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

    const title =
      input.title?.trim() ||
      `Oportunidade - ${client.name.trim()}`

    const opportunity:
      CommercialJourney = {
        id: generateId(),
        workspaceId,
        leadId: null,
        clientId,
        consultantId,
        title,
        consortiumType:
          input.consortiumType,
        currentPhaseId:
          initialPhase.id,
        currentStateId:
          initialState.id,
        priority:
          input.priority ??
          "NORMAL",
        score:
          input.score ??
          0,
        outcome: null,
        stateEnteredAt:
          timestamp,
        lastInteractionAt:
          null,
        closedAt: null,
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

    const createdOpportunity =
      await this.dependencies
        .journeys
        .create(opportunity)

    return {
      opportunity:
        createdOpportunity,
    }
  }
}
