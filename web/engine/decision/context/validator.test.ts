import { describe, expect, it } from "vitest"

import type {
  CommercialJourney,
  JourneyState,
} from "@/types/domain"

import type {
  CommercialContext,
} from "./types"

import { validateCommercialContext } from "./validator"

function createJourney(
  now: Date,
): CommercialJourney {
  return {
    id: "journey-1",
    workspaceId: "workspace-1",
    leadId: "lead-1",
    clientId: null,
    consultantId: "consultant-1",
    title: "Teste",
    consortiumType: "vehicle",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "NORMAL",
    score: 80,
    outcome: null,
    stateEnteredAt: now.toISOString(),
    lastInteractionAt: now.toISOString(),
    closedAt: null,
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

function createState(
  now: Date,
): JourneyState {
  return {
    id: "state-1",
    workspaceId: "workspace-1",
    phaseId: "phase-1",
    name: "Em andamento",
    code: "IN_PROGRESS",
    order: 1,
    isInitial: true,
    isFinal: false,
    isWon: false,
    isLost: false,
    allowReopen: true,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

function createContext(): CommercialContext {
  const now = new Date(
    "2026-07-21T12:00:00.000Z",
  )

  return {
    now,
    journey: createJourney(now),
    lead: null,
    client: null,
    phase: {
      id: "phase-1",
      workspaceId: "workspace-1",
      name: "Qualificação",
      code: "QUALIFICATION",
      order: 1,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    state: createState(now),
    events: [],
    workflowRules: [],
    actions: [],
    recommendations: [],
  }
}

describe("CommercialContextValidator", () => {
  it("deve validar um contexto comercial válido", () => {
    const context = createContext()

    const result =
      validateCommercialContext({
        context,
      })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("deve rejeitar score fora do intervalo permitido", () => {
    const context = createContext()

    context.journey.score = 150

    const result =
      validateCommercialContext({
        context,
      })

    expect(result.isValid).toBe(false)

    expect(
      result.errors.some(
        (error) =>
          error.code ===
          "JOURNEY_SCORE_OUT_OF_RANGE",
      ),
    ).toBe(true)
  })

  it("deve rejeitar estado marcado como ganho e perdido", () => {
    const context = createContext()

    context.state = {
      ...createState(context.now),
      isFinal: true,
      isWon: true,
      isLost: true,
    }

    const result =
      validateCommercialContext({
        context,
      })

    expect(result.isValid).toBe(false)

    expect(
      result.errors.some(
        (error) =>
          error.code ===
          "STATE_WON_AND_LOST",
      ),
    ).toBe(true)
  })
})