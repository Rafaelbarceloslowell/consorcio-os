import type {
  OperationalNextBestAction,
} from "@/application/decision/get-next-best-actions"

import type {
  GorilaR2Briefing,
  GorilaR2Confidence,
  TaskPriority,
} from "@/types/dashboard"

import type {
  CommercialAction,
  NextBestActionPriority,
} from "@/types/domain"

const taskPriorityByRecommendationPriority: Record<
  NextBestActionPriority,
  TaskPriority
> = {
  URGENT: "high",
  HIGH: "high",
  NORMAL: "medium",
  LOW: "low",
}

export type GorilaR2PendingActionContext = Readonly<{
  action: CommercialAction
  journeyTitle: string
}>

function mapConfidence(
  confidence: number,
): GorilaR2Confidence {
  if (confidence >= 0.8) {
    return "high"
  }

  if (confidence >= 0.55) {
    return "medium"
  }

  return "low"
}

function enrichWithPendingAction(
  briefing: GorilaR2Briefing,
  context: GorilaR2PendingActionContext,
): GorilaR2Briefing {
  const {
    action,
    journeyTitle,
  } = context

  return {
    ...briefing,
    greeting:
      "A\u00e7\u00e3o em andamento. Vamos concluir o pr\u00f3ximo passo.",
    recommendation:
      action.title,
    analysis:
      action.description ??
      `Execute a a\u00e7\u00e3o para ${journeyTitle} e registre o resultado no GorillaOS.`,
    reason:
      `Voc\u00ea aceitou esta a\u00e7\u00e3o para ${journeyTitle}. O R2 vai mant\u00ea-la em foco at\u00e9 a conclus\u00e3o.`,
    confidence: "high",
    nextAction: {
      title: action.title,
      priority: "high",
    },
    pilotAction: undefined,
    pendingAction: {
      actionId:
        action.id,
      journeyId:
        action.journeyId,
      journeyTitle,
      opportunityHref:
        `/opportunities/${action.journeyId}`,
      actionType:
        action.type,
      status:
        action.status,
      title:
        action.title,
      description:
        action.description ?? null,
      scheduledFor:
        action.scheduledFor,
    },
  }
}

export function enrichGorilaR2PilotBriefing(
  briefing: GorilaR2Briefing,
  operationalActions:
    readonly OperationalNextBestAction[],
  pendingActionContext?:
    GorilaR2PendingActionContext,
): GorilaR2Briefing {
  if (pendingActionContext) {
    return enrichWithPendingAction(
      briefing,
      pendingActionContext,
    )
  }

  const primaryAction = operationalActions[0]

  if (!primaryAction) {
    return briefing
  }

  const {
    recommendation,
    journeyId,
    journeyTitle,
  } = primaryAction

  const approachType =
    primaryAction.approachType ??
    null

  const isReactivation =
    approachType ===
    "reactivation"

  const isNew =
    approachType ===
    "new"

  const contactName =
    primaryAction.contactName ??
    "o contato"

  const actionTitle =
    isReactivation
      ? `Retomar contato com ${contactName}`
      : isNew
        ? `Iniciar atendimento com ${contactName}`
        : `Classificar atendimento de ${contactName}`

  return {
    ...briefing,
    greeting:
      isReactivation
        ? "Fila de reativa\u00e7\u00e3o pronta. O R2 selecionou o pr\u00f3ximo contato."
        : isNew
          ? "Fila de novos atendimentos pronta. O R2 selecionou o pr\u00f3ximo contato."
          : "Tipo de atendimento ainda n\u00e3o definido.",
    analysis:
      isReactivation
        ? (
            recommendation.description ??
            `Retome o relacionamento com ${journeyTitle} e registre o resultado no GorillaOS.`
          )
        : briefing.analysis,
    recommendation:
      actionTitle,
    reason: recommendation.reason,
    confidence:
      mapConfidence(
        recommendation.confidence,
      ),
    nextAction: {
      title: actionTitle,
      priority:
        taskPriorityByRecommendationPriority[
          recommendation.priority
        ],
    },
    pendingAction: undefined,
    pilotAction: {
      recommendationId:
        recommendation.id,
      journeyId,
      journeyTitle,
      opportunityHref:
        `/opportunities/${journeyId}`,
      actionType:
        recommendation.actionType,
      title:
        recommendation.title,
      description:
        recommendation.description ?? null,
      reason:
        recommendation.reason,
      priority:
        recommendation.priority,
      confidence:
        recommendation.confidence,
    },
  }
}
