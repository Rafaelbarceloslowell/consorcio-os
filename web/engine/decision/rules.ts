import type { WorkflowRule } from "@/types/domain"

export const decisionWorkflowRules: WorkflowRule[] = [
  {
    id: "rule-inactive-high-score",
    workspaceId: null,
    name: "Retomar jornada com score alto e inativa",
    description:
      "Recomenda retomar o contato quando uma jornada ativa possui score alto e está sem interação recente.",
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
            "Envie uma mensagem personalizada para retomar a conversa e confirmar se o interesse no consórcio continua ativo.",
          reason:
            "A oportunidade possui score alto, mas está sem interação recente.",
          confidence: 0.9,
          priority: "HIGH",
          expiresInHours: 48,
        },
      },
    ],
    priority: 100,
    stopProcessingAfterMatch: true,
    isActive: true,
    createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z",
  },
]