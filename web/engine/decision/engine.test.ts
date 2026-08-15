import { describe, expect, it } from "vitest"

import type {
  CommercialJourney,
  JourneyPhase,
  JourneyState,
  WorkflowRule,
} from "@/types/domain"

import {
  enrichCommercialContext,
} from "./context"

import { runDecisionEngine } from "./engine"

import {
  analyzeR2CustomerBoundary,
} from "@/application/r2/boundary"

function createJourney(
  now: Date,
  overrides: Partial<CommercialJourney> = {},
): CommercialJourney {
  return {
    id: "journey-1",
    workspaceId: "workspace-1",
    leadId: "lead-1",
    clientId: null,
    consultantId: "consultant-1",
    title: "Compra de veículo",
    consortiumType: "vehicle",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "NORMAL",
    score: 80,
    outcome: null,
    stateEnteredAt: now.toISOString(),
    lastInteractionAt:
      new Date(
        now.getTime() -
          10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    closedAt: null,
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  }
}

function createPhase(
  now: Date,
): JourneyPhase {
  return {
    id: "phase-1",
    workspaceId: "workspace-1",
    name: "Qualificação",
    code: "QUALIFICATION",
    order: 1,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

function createState(
  now: Date,
  overrides: Partial<JourneyState> = {},
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
    ...overrides,
  }
}

function createWorkflowRule(
  now: Date,
): WorkflowRule {
  return {
    id: "rule-inactive-high-score",
    workspaceId: "workspace-1",
    name: "Retomar jornada com score alto",
    description:
      "Recomenda contato para jornadas inativas com score alto.",
    eventType: "DECISION_ENGINE_ANALYSIS",
    conditions: [
      {
        field: "daysSinceLastInteraction",
        operator: "GREATER_THAN_OR_EQUAL",
        value: 7,
      },
      {
        field: "score",
        operator: "GREATER_THAN_OR_EQUAL",
        value: 70,
      },
      {
        field: "isClosed",
        operator: "EQUALS",
        value: false,
      },
    ],
    actions: [
      {
        type: "TRIGGER_AUTOMATION",
        payload: {
          recommendationType: "SEND_MESSAGE",
          title: "Retomar contato com o lead",
          description:
            "Envie uma mensagem personalizada para retomar a conversa.",
          reason:
            "A oportunidade possui score alto e está sem interação recente.",
          confidence: 0.9,
          priority: "HIGH",
          expiresInHours: 48,
        },
      },
    ],
    priority: 100,
    stopProcessingAfterMatch: true,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

function createContext(options?: {
  journey?: Partial<CommercialJourney>
  state?: Partial<JourneyState>
  workflowRules?: WorkflowRule[]
}) {
  const now = new Date(
    "2026-07-21T12:00:00.000Z",
  )

  const context = {
    now,
    journey: createJourney(
      now,
      options?.journey,
    ),
    lead: null,
    client: null,
    phase: createPhase(now),
    state: createState(
      now,
      options?.state,
    ),
    events: [],
    workflowRules:
      options?.workflowRules ?? [
        createWorkflowRule(now),
      ],
    actions: [],
    recommendations: [],
  }

  return enrichCommercialContext({
    context,
  })
}

describe("DecisionEngine", () => {
  it("suprime NBA e estratégia quando a Customer Boundary é terminal", () => {
    const context = createContext()
    const customerBoundaryContext =
      analyzeR2CustomerBoundary({
        opportunityId: context.journey.id,
        message: "Já falei que não quero, que merda.",
      })

    const result = runDecisionEngine({
      context,
      customerBoundaryContext,
    })

    expect(result).toMatchObject({
      nextBestActions: [],
      strategy: null,
      customerBoundaryContext: {
        terminal: true,
        signal: "HOSTILE_REJECTION",
      },
    })
    expect(result.warnings.join(" ")).toContain(
      "R2_CUSTOMER_BOUNDARY",
    )
  })

  it("deve executar a análise de um contexto comercial válido", () => {
    const context = createContext()

    const result = runDecisionEngine({
      context,
    })

    expect(result.diagnostics.length).toBeGreaterThan(0)

    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.includes(
            "Jornada journey-1 analisada",
          ),
      ),
    ).toBe(true)
  })

  it("deve rejeitar um contexto comercial inválido", () => {
    const context = createContext({
      journey: {
        score: 150,
      },
    })

    expect(() =>
      runDecisionEngine({
        context,
      }),
    ).toThrow(
      "JOURNEY_SCORE_OUT_OF_RANGE",
    )
  })

  it("deve informar quando a jornada possui score alto", () => {
    const context = createContext({
      journey: {
        score: 90,
      },
    })

    const result = runDecisionEngine({
      context,
    })

    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.includes(
            "score comercial elevado",
          ),
      ),
    ).toBe(true)

    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.includes(
            "A jornada possui score alto: 90",
          ),
      ),
    ).toBe(true)
  })

  it("deve gerar aviso para uma jornada inativa", () => {
    const context = createContext({
      journey: {
        lastInteractionAt:
          "2026-07-01T12:00:00.000Z",
      },
    })

    const result = runDecisionEngine({
      context,
    })

    expect(
      result.warnings.some(
        (warning) =>
          warning.includes(
            "comercialmente inativa",
          ),
      ),
    ).toBe(true)

    expect(
      result.warnings.some(
        (warning) =>
          warning.includes(
            "20 dias sem",
          ),
      ),
    ).toBe(true)
  })

  it("deve gerar uma recomendação quando uma regra de workflow for atendida", () => {
    const context = createContext()

    const result = runDecisionEngine({
      context,
    })

    expect(result.nextBestActions).toHaveLength(1)

    expect(result.nextBestActions[0]).toMatchObject({
      workspaceId: "workspace-1",
      journeyId: "journey-1",
      actionType: "SEND_MESSAGE",
      title: "Retomar contato com o lead",
      confidence: 0.9,
      priority: "HIGH",
      source: "RULE_ENGINE",
    })

    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.includes(
            "Regra aplicada: Retomar jornada com score alto",
          ),
      ),
    ).toBe(true)
  })

  it("não deve gerar recomendação quando a regra não for atendida", () => {
    const context = createContext({
      journey: {
        score: 40,
        lastInteractionAt:
          "2026-07-20T12:00:00.000Z",
      },
    })

    const result = runDecisionEngine({
      context,
    })

    expect(result.nextBestActions).toHaveLength(0)

    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.includes(
            "Nenhuma regra de recomendacao foi acionada",
          ),
      ),
    ).toBe(true)
  })

  it("deve identificar uma jornada encerrada como ganha", () => {
    const context = createContext({
      journey: {
        closedAt:
          "2026-07-21T10:00:00.000Z",
      },
      state: {
        isFinal: true,
        isWon: true,
        isLost: false,
      },
    })

    const result = runDecisionEngine({
      context,
    })

    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.includes(
            "encerrada como ganha",
          ),
      ),
    ).toBe(true)
  })

  it("deve identificar uma jornada encerrada como perdida", () => {
    const context = createContext({
      journey: {
        closedAt:
          "2026-07-21T10:00:00.000Z",
      },
      state: {
        isFinal: true,
        isWon: false,
        isLost: true,
      },
    })

    const result = runDecisionEngine({
      context,
    })

    expect(
      result.warnings.some(
        (warning) =>
          warning.includes(
            "encerrada como perdida",
          ),
      ),
    ).toBe(true)
  })

  it("recebe contexto de evidência e preserva a decisão normal", () => {
    const result = runDecisionEngine({
      context: createContext(),
      evidenceContext: {
        status: "SUPPORTED",
        confidence: "HIGH",
        outcome: "PASS",
        sensitivity: "HIGH",
        warnings: [],
        conflicts: [],
        humanConfirmationRequired: false,
        assessments: [],
      },
    })

    expect(result.nextBestActions).toHaveLength(1)
    expect(result.evidenceContext?.status).toBe("SUPPORTED")
    expect(result.diagnostics).toContain(
      "Contexto de evidência recebido com status SUPPORTED e resultado PASS.",
    )
  })

  it("não emite NBA quando evidência sensível exige confirmação humana", () => {
    const result = runDecisionEngine({
      context: createContext(),
      evidenceContext: {
        status: "CONFLICTING",
        confidence: "LOW",
        outcome: "HUMAN_CONFIRMATION_REQUIRED",
        sensitivity: "HIGH",
        warnings: ["Valor de lance conflitante."],
        conflicts: ["Valor de lance conflitante."],
        humanConfirmationRequired: true,
        assessments: [],
      },
    })

    expect(result.nextBestActions).toEqual([])
    expect(result.strategy).toBeNull()
    expect(result.warnings).toContain(
      "[R2_HUMAN_CONFIRMATION_REQUIRED] Um conflito sensível precisa ser confirmado antes da recomendação.",
    )
  })
})
