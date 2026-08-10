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
        "understand_objection",
      label:
        "Entender o motivo da decisão",
      explanation:
        "Distinguir adiamento de encerramento definitivo e registrar o desfecho correto sem pressionar o cliente.",
    }
  }

  return buildNextGoal({
    approachType,
    stage,
  })
}