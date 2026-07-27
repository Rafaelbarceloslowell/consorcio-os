import type {
  CommercialJourney,
  CommercialJourneyOutcome,
  JourneyPhase,
  JourneyState,
  Lead,
  LeadStatus,
  PipelineStage,
} from "@/types/domain"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

export type SynchronizeCommercialJourneyWithCrmCommonInput = {
  journey: CommercialJourney

  crmRepository:
    CrmRepository

  now?: Date
}

export type SynchronizeCommercialJourneyWithCrmLegacyInput =
  SynchronizeCommercialJourneyWithCrmCommonInput & {
    commercialRepository:
      CommercialRepository
  }

export type SynchronizeCommercialJourneyWithCrmAsyncInput =
  SynchronizeCommercialJourneyWithCrmCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type SynchronizeCommercialJourneyWithCrmInput =
  | SynchronizeCommercialJourneyWithCrmLegacyInput
  | SynchronizeCommercialJourneyWithCrmAsyncInput

export type SynchronizeCommercialJourneyWithCrmResult = {
  journey:
    CommercialJourney

  lead:
    Lead | null

  previousLead:
    Lead | null

  state:
    JourneyState

  phase:
    JourneyPhase

  pipelineStage:
    PipelineStage | null

  changed:
    boolean

  diagnostics:
    string[]

  warnings:
    string[]
}

type LeadSynchronizationTarget = {
  status:
    LeadStatus | null

  pipelineStage:
    PipelineStage | null

  lostReason:
    string | undefined

  updateLastContactAt:
    boolean
}

const LOST_REASON_BY_OUTCOME:
  Record<
    Exclude<
      CommercialJourneyOutcome,
      "WON"
    >,
    string
  > = {
    LOST_TO_COMPETITOR:
      "O lead optou por um concorrente.",

    NO_FINANCIAL_CAPACITY:
      "O lead não possui capacidade financeira no momento.",

    NO_RESPONSE:
      "O lead não respondeu às tentativas de contato.",

    POSTPONED:
      "O lead decidiu adiar a contratação.",

    PRODUCT_NOT_SUITABLE:
      "O produto não é adequado à necessidade do lead.",

    TRUST_CONCERN:
      "O lead apresentou objeções relacionadas à confiança.",

    CLIENT_WITHDREW:
      "O lead desistiu da contratação.",

    CANCELLED_BY_CONSULTANT:
      "A oportunidade foi encerrada pelo consultor.",

    OTHER:
      "A oportunidade foi encerrada sem conversão.",
  }

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "states" in
      commercialRepository
    ) ||
    !(
      "phases" in
      commercialRepository
    )
  ) {
    return false
  }

  return (
    typeof commercialRepository
      .states
      .findById ===
      "function" &&
    typeof commercialRepository
      .phases
      .findById ===
      "function"
  )
}

function findPipelineStageByOrder(
  pipelineStages: PipelineStage[],
  order: number,
): PipelineStage | null {
  return (
    pipelineStages.find(
      (pipelineStage) =>
        pipelineStage.order ===
        order,
    ) ?? null
  )
}

function findWonPipelineStage(
  pipelineStages: PipelineStage[],
): PipelineStage | null {
  return (
    pipelineStages
      .filter(
        (pipelineStage) =>
          pipelineStage.isClosedStage &&
          pipelineStage.isWonStage,
      )
      .sort(
        (
          firstStage,
          secondStage,
        ) =>
          firstStage.order -
          secondStage.order,
      )[0] ?? null
  )
}

function findLostPipelineStage(
  pipelineStages: PipelineStage[],
): PipelineStage | null {
  return (
    pipelineStages
      .filter(
        (pipelineStage) =>
          pipelineStage.isClosedStage &&
          !pipelineStage.isWonStage,
      )
      .sort(
        (
          firstStage,
          secondStage,
        ) =>
          firstStage.order -
          secondStage.order,
      )[0] ?? null
  )
}

function resolveLostReason(
  outcome:
    CommercialJourneyOutcome | null,
): string {
  if (
    !outcome ||
    outcome === "WON"
  ) {
    return LOST_REASON_BY_OUTCOME
      .OTHER
  }

  return LOST_REASON_BY_OUTCOME[
    outcome
  ]
}

function resolveTarget(
  journey: CommercialJourney,
  state: JourneyState,
  phase: JourneyPhase,
  pipelineStages: PipelineStage[],
): LeadSynchronizationTarget {
  if (
    state.isWon ||
    state.code === "WON"
  ) {
    return {
      status:
        "converted",

      pipelineStage:
        findWonPipelineStage(
          pipelineStages,
        ),

      lostReason:
        undefined,

      updateLastContactAt:
        true,
    }
  }

  if (
    state.isLost ||
    state.code === "LOST"
  ) {
    return {
      status:
        "lost",

      pipelineStage:
        findLostPipelineStage(
          pipelineStages,
        ),

      lostReason:
        resolveLostReason(
          journey.outcome,
        ),

      updateLastContactAt:
        true,
    }
  }

  if (
    state.code ===
      "POSTPONED"
  ) {
    return {
      status:
        null,

      pipelineStage:
        null,

      lostReason:
        undefined,

      updateLastContactAt:
        false,
    }
  }

  switch (phase.code) {
    case "ACQUISITION":
      return {
        status:
          state.code ===
          "NEW_LEAD"
            ? "new"
            : "contacted",

        pipelineStage:
          findPipelineStageByOrder(
            pipelineStages,
            1,
          ),

        lostReason:
          undefined,

        updateLastContactAt:
          state.code !==
          "NEW_LEAD",
      }

    case "QUALIFICATION":
      return {
        status:
          state.code ===
          "QUALIFIED"
            ? "qualified"
            : "contacted",

        pipelineStage:
          findPipelineStageByOrder(
            pipelineStages,
            2,
          ),

        lostReason:
          undefined,

        updateLastContactAt:
          true,
      }

    case "SOLUTION_DESIGN":
      return {
        status:
          "qualified",

        pipelineStage:
          findPipelineStageByOrder(
            pipelineStages,
            3,
          ),

        lostReason:
          undefined,

        updateLastContactAt:
          true,
      }

    case "NEGOTIATION":
      return {
        status:
          "negotiating",

        pipelineStage:
          findPipelineStageByOrder(
            pipelineStages,
            4,
          ),

        lostReason:
          undefined,

        updateLastContactAt:
          true,
      }

    case "ACTIVATION":
      return {
        status:
          "negotiating",

        pipelineStage:
          findPipelineStageByOrder(
            pipelineStages,
            5,
          ),

        lostReason:
          undefined,

        updateLastContactAt:
          true,
      }

    case "CLOSED":
      return {
        status:
          null,

        pipelineStage:
          null,

        lostReason:
          undefined,

        updateLastContactAt:
          false,
      }

    default:
      return {
        status:
          null,

        pipelineStage:
          null,

        lostReason:
          undefined,

        updateLastContactAt:
          false,
      }
  }
}

function resolveLastContactAt(
  journey: CommercialJourney,
  lead: Lead,
  shouldUpdate: boolean,
): string | undefined {
  if (!shouldUpdate) {
    return lead.lastContactAt
  }

  return (
    journey.lastInteractionAt ??
    journey.updatedAt
  )
}

function leadsHaveSameBusinessState(
  firstLead: Lead,
  secondLead: Lead,
): boolean {
  return (
    firstLead.status ===
      secondLead.status &&
    firstLead.pipelineStageId ===
      secondLead.pipelineStageId &&
    firstLead.score ===
      secondLead.score &&
    firstLead.lostReason ===
      secondLead.lostReason &&
    firstLead.convertedClientId ===
      secondLead.convertedClientId &&
    firstLead.lastContactAt ===
      secondLead.lastContactAt
  )
}

function validateStateAndPhase({
  journey,
  state,
  phase,
}: {
  journey:
    CommercialJourney

  state:
    JourneyState | undefined

  phase:
    JourneyPhase | undefined
}): {
  state:
    JourneyState

  phase:
    JourneyPhase
} {
  if (!state) {
    throw new Error(
      `Estado comercial não encontrado para o ID "${journey.currentStateId}".`,
    )
  }

  if (
    state.workspaceId !==
      journey.workspaceId
  ) {
    throw new Error(
      `O estado comercial "${state.id}" não pertence ao workspace da jornada "${journey.id}".`,
    )
  }

  if (!phase) {
    throw new Error(
      `Fase comercial não encontrada para o ID "${state.phaseId}".`,
    )
  }

  if (
    phase.workspaceId !== null &&
    phase.workspaceId !==
      journey.workspaceId
  ) {
    throw new Error(
      `A fase comercial "${phase.id}" não pertence ao workspace da jornada "${journey.id}".`,
    )
  }

  return {
    state,
    phase,
  }
}

function synchronizeResolvedCommercialJourneyWithCrm({
  journey,
  state,
  phase,
  crmRepository,
  now,
}: {
  journey:
    CommercialJourney

  state:
    JourneyState

  phase:
    JourneyPhase

  crmRepository:
    CrmRepository

  now:
    Date
}): SynchronizeCommercialJourneyWithCrmResult {
  if (!journey.leadId) {
    const client =
      journey.clientId
        ? crmRepository.getClientById(
            journey.clientId,
          )
        : undefined

    return {
      journey,

      lead:
        null,

      previousLead:
        null,

      state,

      phase,

      pipelineStage:
        null,

      changed:
        false,

      diagnostics: [
        `A jornada comercial "${journey.id}" foi analisada para sincronização com o CRM sem um lead vinculado.`,
      ],

      warnings:
        client
          ? []
          : [
              "Cliente não encontrado para a jornada comercial.",
            ],
    }
  }

  const lead =
    crmRepository.getLeadById(
      journey.leadId,
    )

  if (!lead) {
    return {
      journey,

      lead:
        null,

      previousLead:
        null,

      state,

      phase,

      pipelineStage:
        null,

      changed:
        false,

      diagnostics: [
        `A jornada comercial "${journey.id}" foi analisada para sincronização com o CRM.`,
      ],

      warnings: [
        `O lead "${journey.leadId}" vinculado à jornada comercial não foi encontrado no CRM.`,
      ],
    }
  }

  const pipelineStages =
    crmRepository.getPipelineStages()

  const target =
    resolveTarget(
      journey,
      state,
      phase,
      pipelineStages,
    )

  if (
    target.status === null &&
    target.pipelineStage === null
  ) {
    return {
      journey,

      lead,

      previousLead:
        lead,

      state,

      phase,

      pipelineStage:
        null,

      changed:
        false,

      diagnostics: [
        `A jornada comercial "${journey.id}" não exige alteração no cadastro do lead "${lead.id}".`,
      ],

      warnings: [],
    }
  }

  if (
    target.status !== null &&
    target.pipelineStage === null
  ) {
    throw new Error(
      `Nenhum estágio de pipeline compatível foi encontrado para sincronizar o lead "${lead.id}" com o estado comercial "${state.code}".`,
    )
  }

  if (
    target.status ===
      "converted" &&
    !journey.clientId &&
    !lead.convertedClientId
  ) {
    return {
      journey,

      lead,

      previousLead:
        lead,

      state,

      phase,

      pipelineStage:
        target.pipelineStage,

      changed:
        false,

      diagnostics: [
        `A jornada comercial "${journey.id}" chegou ao estado ganho.`,
      ],

      warnings: [
        `O lead "${lead.id}" não foi marcado como convertido porque a jornada ainda não possui um cliente vinculado.`,
      ],
    }
  }

  const candidateLead: Lead = {
    ...lead,

    status:
      target.status ??
      lead.status,

    pipelineStageId:
      target.pipelineStage?.id ??
      lead.pipelineStageId,

    score:
      journey.score,

    lostReason:
      target.status ===
        "lost"
        ? target.lostReason
        : undefined,

    convertedClientId:
      target.status ===
        "converted"
        ? (
            journey.clientId ??
            lead.convertedClientId
          )
        : lead.convertedClientId,

    lastContactAt:
      resolveLastContactAt(
        journey,
        lead,
        target.updateLastContactAt,
      ),
  }

  if (
    leadsHaveSameBusinessState(
      lead,
      candidateLead,
    )
  ) {
    return {
      journey,

      lead,

      previousLead:
        lead,

      state,

      phase,

      pipelineStage:
        target.pipelineStage,

      changed:
        false,

      diagnostics: [
        `O lead "${lead.id}" já está sincronizado com a jornada comercial "${journey.id}".`,
      ],

      warnings: [],
    }
  }

  const updatedLead: Lead = {
    ...candidateLead,

    updatedAt:
      now.toISOString(),
  }

  const persistedLead =
    crmRepository.updateLead(
      updatedLead,
    )

  return {
    journey,

    lead:
      persistedLead,

    previousLead:
      lead,

    state,

    phase,

    pipelineStage:
      target.pipelineStage,

    changed:
      true,

    diagnostics: [
      `O lead "${lead.id}" foi sincronizado com o estado comercial "${state.code}".`,
      `O status do lead está definido como "${persistedLead.status}".`,
      `O estágio do pipeline está definido como "${persistedLead.pipelineStageId}".`,
    ],

    warnings: [],
  }
}

function synchronizeLegacyCommercialJourneyWithCrm({
  journey,
  commercialRepository,
  crmRepository,
  now = new Date(),
}: SynchronizeCommercialJourneyWithCrmLegacyInput):
  SynchronizeCommercialJourneyWithCrmResult {
  const state =
    commercialRepository.getStateById(
      journey.currentStateId,
    )

  const phase =
    state
      ? commercialRepository
          .getPhaseById(
            state.phaseId,
          )
      : undefined

  const resolved =
    validateStateAndPhase({
      journey,
      state,
      phase,
    })

  return synchronizeResolvedCommercialJourneyWithCrm({
    journey,

    state:
      resolved.state,

    phase:
      resolved.phase,

    crmRepository,

    now,
  })
}

async function synchronizeAsyncCommercialJourneyWithCrm({
  journey,
  commercialRepository,
  crmRepository,
  now = new Date(),
}: SynchronizeCommercialJourneyWithCrmAsyncInput):
  Promise<SynchronizeCommercialJourneyWithCrmResult> {
  const state =
    await commercialRepository
      .states
      .findById(
        journey.currentStateId,
      )

  const phase =
    state
      ? await commercialRepository
          .phases
          .findById(
            state.phaseId,
          )
      : undefined

  const resolved =
    validateStateAndPhase({
      journey,
      state,
      phase,
    })

  return synchronizeResolvedCommercialJourneyWithCrm({
    journey,

    state:
      resolved.state,

    phase:
      resolved.phase,

    crmRepository,

    now,
  })
}

export function synchronizeCommercialJourneyWithCrm(
  input:
    SynchronizeCommercialJourneyWithCrmAsyncInput,
): Promise<SynchronizeCommercialJourneyWithCrmResult>

export function synchronizeCommercialJourneyWithCrm(
  input:
    SynchronizeCommercialJourneyWithCrmLegacyInput,
): SynchronizeCommercialJourneyWithCrmResult

export function synchronizeCommercialJourneyWithCrm(
  input:
    SynchronizeCommercialJourneyWithCrmInput,
):
  | SynchronizeCommercialJourneyWithCrmResult
  | Promise<SynchronizeCommercialJourneyWithCrmResult> {
  if (
    isAsyncCommercialRepositories(
      input.commercialRepository,
    )
  ) {
    return synchronizeAsyncCommercialJourneyWithCrm({
      ...input,

      commercialRepository:
        input.commercialRepository,
    })
  }

  return synchronizeLegacyCommercialJourneyWithCrm({
    ...input,

    commercialRepository:
      input.commercialRepository,
  })
}
