import {
  runDecisionEngine,
} from "@/engine/decision"

import {
  buildCommercialContext,
  enrichCommercialContext,
} from "@/engine/decision/context"

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
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import type {
  R2EvidenceDecisionContext,
} from "@/application/r2/evidence/types"

import type {
  R2CustomerBoundaryContext,
} from "@/application/r2/boundary"

export type RunApplicationDecisionEngineCommonInput = {
  journeyId: string

  now?: Date

  evidenceContext?:
    R2EvidenceDecisionContext

  customerBoundaryContext?:
    R2CustomerBoundaryContext
}

export type RunApplicationDecisionEngineLegacyInput =
  RunApplicationDecisionEngineCommonInput & {
    commercialRepository:
      CommercialRepository

    crmRepository:
      CrmRepository
  }

export type RunApplicationDecisionEngineAsyncInput =
  RunApplicationDecisionEngineCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories

    crmRepository:
      | CrmRepository
      | AsyncCrmRepositories
  }

export type RunApplicationDecisionEngineInput =
  | RunApplicationDecisionEngineLegacyInput
  | RunApplicationDecisionEngineAsyncInput

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
      "function"
  )
}

function runLegacyApplicationDecisionEngine({
  commercialRepository,
  crmRepository,
  journeyId,
  now = new Date(),
  evidenceContext,
  customerBoundaryContext,
}: RunApplicationDecisionEngineLegacyInput) {
  const journey =
    commercialRepository.getJourneyById(
      journeyId,
    )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${journeyId}".`,
    )
  }

  const lead = journey.leadId
    ? crmRepository.getLeadById(
        journey.leadId,
      ) ?? null
    : null

  const client = journey.clientId
    ? crmRepository.getClientById(
        journey.clientId,
      ) ?? null
    : null

  const phase =
    journey.currentPhaseId
      ? commercialRepository.getPhaseById(
          journey.currentPhaseId,
        ) ?? null
      : null

  const state =
    journey.currentStateId
      ? commercialRepository.getStateById(
          journey.currentStateId,
        ) ?? null
      : null

  const events =
    commercialRepository.getEventsByJourneyId(
      journey.id,
    )

  const workflowRules =
    commercialRepository.getWorkflowRules()

  const actions =
    commercialRepository.getActionsByJourneyId(
      journey.id,
    )

  const recommendations =
    commercialRepository.getNextBestActionsByJourneyId(
      journey.id,
    )

  const context =
    buildCommercialContext({
      now,
      journey,
      lead,
      client,
      phase,
      state,
      events,
      workflowRules,
      actions,
      recommendations,
    })

  const enrichedContext =
    enrichCommercialContext({
      context,
    })

  return runDecisionEngine({
    context: enrichedContext,
    evidenceContext,
    customerBoundaryContext,
  })
}

async function runAsyncApplicationDecisionEngine({
  commercialRepository,
  crmRepository,
  journeyId,
  now = new Date(),
  evidenceContext,
  customerBoundaryContext,
}: RunApplicationDecisionEngineAsyncInput) {
  const journey =
    await commercialRepository.journeys.findById(
      journeyId,
    )

  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${journeyId}".`,
    )
  }

  const [
    lead,
    client,
    phase,
    state,
    events,
    workflowRules,
    actions,
    recommendations,
  ] = await Promise.all([
    journey.leadId
      ? isAsyncCrmRepositories(crmRepository)
        ? crmRepository.leads.findById(
            journey.leadId,
          )
        : Promise.resolve(
            crmRepository.getLeadById(
              journey.leadId,
            ),
          )
      : Promise.resolve(undefined),

    journey.clientId
      ? isAsyncCrmRepositories(crmRepository)
        ? crmRepository.clients.findById(
            journey.clientId,
          )
        : Promise.resolve(
            crmRepository.getClientById(
              journey.clientId,
            ),
          )
      : Promise.resolve(undefined),

    journey.currentPhaseId
      ? commercialRepository.phases.findById(
          journey.currentPhaseId,
        )
      : Promise.resolve(undefined),

    journey.currentStateId
      ? commercialRepository.states.findById(
          journey.currentStateId,
        )
      : Promise.resolve(undefined),

    commercialRepository.events.findByJourneyId(
      journey.id,
    ),

    commercialRepository.workflowRules.findAll(),

    commercialRepository.actions.findByJourneyId(
      journey.id,
    ),

    commercialRepository.nextBestActions.findByJourneyId(
      journey.id,
    ),
  ])

  const context =
    buildCommercialContext({
      now,
      journey,
      lead: lead ?? null,
      client: client ?? null,
      phase: phase ?? null,
      state: state ?? null,
      events,
      workflowRules,
      actions,
      recommendations,
    })

  const enrichedContext =
    enrichCommercialContext({
      context,
    })

  return runDecisionEngine({
    context: enrichedContext,
    evidenceContext,
    customerBoundaryContext,
  })
}

export function runApplicationDecisionEngine(
  input:
    RunApplicationDecisionEngineAsyncInput,
): Promise<
  ReturnType<typeof runDecisionEngine>
>

export function runApplicationDecisionEngine(
  input:
    RunApplicationDecisionEngineLegacyInput,
): ReturnType<typeof runDecisionEngine>

export function runApplicationDecisionEngine(
  input:
    RunApplicationDecisionEngineInput,
):
  | ReturnType<typeof runDecisionEngine>
  | Promise<
      ReturnType<typeof runDecisionEngine>
    > {
  if (
    isAsyncCommercialRepositories(
      input.commercialRepository,
    )
  ) {
    return runAsyncApplicationDecisionEngine({
      ...input,

      commercialRepository:
        input.commercialRepository,
    })
  }

  const crmRepository = input.crmRepository

  if (isAsyncCrmRepositories(crmRepository)) {
    throw new Error(
      "Repositórios CRM assíncronos exigem repositórios comerciais assíncronos.",
    )
  }

  return runLegacyApplicationDecisionEngine({
    commercialRepository:
      input.commercialRepository,
    crmRepository,
    journeyId: input.journeyId,
    now: input.now,
    evidenceContext:
      input.evidenceContext,
    customerBoundaryContext:
      input.customerBoundaryContext,
  })
}

function isAsyncCrmRepositories(
  crmRepository:
    | CrmRepository
    | AsyncCrmRepositories,
): crmRepository is AsyncCrmRepositories {
  return "leads" in crmRepository &&
    typeof crmRepository.leads === "object" &&
    crmRepository.leads !== null &&
    "findById" in crmRepository.leads &&
    typeof crmRepository.leads.findById === "function"
}
