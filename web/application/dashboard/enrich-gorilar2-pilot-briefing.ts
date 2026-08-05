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

export type GorilaR2ConversationContext = Readonly<{
  hasRecentConversationContext: boolean
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
  conversationContext?:
    GorilaR2ConversationContext,
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

  const hasRecentConversationContext =
    conversationContext
      ?.hasRecentConversationContext ===
    true

  const requiresConversationContext =
    isReactivation &&
    !hasRecentConversationContext

  const actionTitle =
    requiresConversationContext
      ? `Informar contexto recente de ${contactName}`
      : isReactivation
        ? `Revisar retomada com ${contactName}`
        : isNew
          ? `Iniciar atendimento com ${contactName}`
          : `Classificar atendimento de ${contactName}`

  const actionDescription =
    requiresConversationContext
      ? `Cole no GorillaOS as \u00faltimas mensagens trocadas com ${contactName}. O R2 precisa entender onde a conversa parou antes de preparar qualquer nova mensagem.`
      : isReactivation
        ? `O contexto recente de ${contactName} est\u00e1 salvo. Abra a oportunidade, revise a resposta preparada pelo R2 e confirme a abordagem.`
        : recommendation.description ??
          null

  const actionReason =
    requiresConversationContext
      ? "Sem o hist\u00f3rico recente, qualquer mensagem seria um chute. O R2 n\u00e3o deve formular uma abordagem sem contexto."
      : isReactivation
        ? "A mem\u00f3ria comercial foi analisada. A retomada deve continuar exatamente do ponto em que a conversa parou."
        : recommendation.reason

  const opportunityHref =
    requiresConversationContext
      ? `/opportunities/${journeyId}#opportunity-manual-whatsapp-title`
      : `/opportunities/${journeyId}`

  return {
    ...briefing,
    greeting:
      requiresConversationContext
        ? `Reativa\u00e7\u00e3o selecionada. Antes de falar com ${contactName}, o R2 precisa do contexto recente.`
        : isReactivation
          ? "Contexto da reativa\u00e7\u00e3o carregado. O R2 pode preparar uma retomada coerente."
          : isNew
            ? "Fila de novos atendimentos pronta. O R2 selecionou o pr\u00f3ximo contato."
            : "Tipo de atendimento ainda n\u00e3o definido.",
    analysis:
      actionDescription ??
      briefing.analysis,
    recommendation:
      actionTitle,
    reason:
      actionReason,
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
      opportunityHref,
      actionType:
        recommendation.actionType,
      title:
        actionTitle,
      description:
        actionDescription,
      reason:
        actionReason,
      priority:
        recommendation.priority,
      confidence:
        recommendation.confidence,
      requiresConversationContext,
    },
  }
}
