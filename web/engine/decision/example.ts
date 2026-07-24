import type {
    CommercialJourney,
    JourneyPhase,
    JourneyState,
  } from "@/types/domain"
  
  import {
    buildCommercialContext,
    enrichCommercialContext,
    runDecisionEngine,
  } from "./index"
  
  import { decisionWorkflowRules } from "./rules"
  
  const now = new Date("2026-07-21T12:00:00.000Z")
  
  const journey: CommercialJourney = {
    id: "journey-001",
    workspaceId: "workspace-001",
    leadId: "lead-001",
    clientId: null,
    consultantId: "consultant-001",
    title: "Consórcio de veículo - Rafael",
    consortiumType: "vehicle",
    currentPhaseId: "phase-negotiation",
    currentStateId: "state-awaiting-response",
    priority: "HIGH",
    score: 85,
    outcome: null,
    stateEnteredAt: "2026-07-10T12:00:00.000Z",
    lastInteractionAt: "2026-07-10T12:00:00.000Z",
    closedAt: null,
    version: 1,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-10T12:00:00.000Z",
  }
  
  const phase: JourneyPhase = {
    id: "phase-negotiation",
    workspaceId: "workspace-001",
    name: "Negociação",
    code: "NEGOTIATION",
    order: 3,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
  
  const state: JourneyState = {
    id: "state-awaiting-response",
    workspaceId: "workspace-001",
    phaseId: phase.id,
    name: "Aguardando resposta",
    code: "AWAITING_RESPONSE",
    order: 1,
    isInitial: false,
    isFinal: false,
    isWon: false,
    isLost: false,
    allowReopen: true,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
  
  const commercialContext = buildCommercialContext({
    now,
    journey,
    lead: null,
    client: null,
    phase,
    state,
    events: [],
    workflowRules: decisionWorkflowRules,
    actions: [],
    recommendations: [],
  })
  
  const enrichedContext = enrichCommercialContext({
    context: commercialContext,
  })
  
  export const decisionEngineExample =
    runDecisionEngine({
      context: enrichedContext,
    })
  
  console.log(
    JSON.stringify(
      decisionEngineExample,
      null,
      2,
    ),
  )