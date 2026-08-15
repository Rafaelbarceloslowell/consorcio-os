import type {
  ManualWhatsAppAnalysis,
} from "./analyze-manual-whatsapp-message"

import {
  buildNextGoal,
} from "./conversation/build-next-goal"

import type {
  BuildNextGoalOutput,
} from "./conversation/build-next-goal"

import type {
  ConversationApproachType,
  ConversationStage,
} from "./conversation/conversation-stage"

export type ResolveManualWhatsAppCommercialGoalInput =
  Readonly<{
    approachType:
      ConversationApproachType
    analysis:
      ManualWhatsAppAnalysis
    stage:
      ConversationStage
  }>

export function resolveManualWhatsAppCommercialGoal({
  approachType,
  analysis,
  stage,
}: ResolveManualWhatsAppCommercialGoalInput):
  BuildNextGoalOutput {
  if (
    analysis.intent ===
    "not_interested"
  ) {
    return {
      goal:
        "close_next_step",
      label:
        "Encerrar respeitosamente",
      explanation:
        "Reconhecer a decisão do cliente sem buscar motivo, pressionar ou criar um novo próximo passo comercial.",
    }
  }

  return buildNextGoal({
    approachType,
    stage,
  })
}
