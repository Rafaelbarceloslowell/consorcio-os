import type { OperationalNextBestAction } from "@/application/decision/get-next-best-actions"
import type { DecisionEngineOutput } from "@/engine/decision/types"
import type {
  DashboardData,
  Task,
  TaskPriority,
} from "@/types/dashboard"
import type {
  CommercialJourney,
  NextBestAction,
} from "@/types/domain"

export type MapDashboardDataInput = {
  baseDashboardData: DashboardData
  journey: CommercialJourney
  decisionOutput: DecisionEngineOutput
}

export type MapOperationalDashboardDataInput = {
  baseDashboardData: DashboardData
  operationalActions: OperationalNextBestAction[]
}

function mapRecommendationPriority(
  priority: NextBestAction["priority"],
): TaskPriority {
  if (
    priority === "URGENT" ||
    priority === "HIGH"
  ) {
    return "high"
  }

  if (priority === "NORMAL") {
    return "medium"
  }

  return "low"
}

function mapRecommendationToTask(
  recommendation: NextBestAction,
): Task {
  return {
    id: `decision-${recommendation.id}`,
    title: recommendation.title,
    time: "Agora",
    priority: mapRecommendationPriority(
      recommendation.priority,
    ),
  }
}

function mapOperationalActionToTask(
  operationalAction: OperationalNextBestAction,
): Task {
  return {
    id: `decision-${operationalAction.recommendation.id}`,
    title:
      operationalAction.recommendation.title,
    time: "Agora",
    priority: mapRecommendationPriority(
      operationalAction.recommendation.priority,
    ),
  }
}

export function mapDashboardData({
  baseDashboardData,
  journey,
  decisionOutput,
}: MapDashboardDataInput): DashboardData {
  const recommendationTasks =
    decisionOutput.nextBestActions.map(
      mapRecommendationToTask,
    )

  const tasks = [
    ...recommendationTasks,
    ...baseDashboardData.tasks,
  ]

  return {
    ...baseDashboardData,
    summary:
      recommendationTasks.length > 0
        ? `${recommendationTasks.length} próxima(s) ação(ões) recomendada(s) para ${journey.title}.`
        : `Nenhuma nova ação recomendada para ${journey.title}.`,
    metrics: {
      ...baseDashboardData.metrics,
      pendingTasks: tasks.length,
    },
    tasks,
  }
}

export function mapOperationalDashboardData({
  baseDashboardData,
  operationalActions,
}: MapOperationalDashboardDataInput): DashboardData {
  const recommendationTasks =
    operationalActions.map(
      mapOperationalActionToTask,
    )

  const tasks = [
    ...recommendationTasks,
    ...baseDashboardData.tasks,
  ]

  return {
    ...baseDashboardData,
    summary:
      recommendationTasks.length > 0
        ? `${recommendationTasks.length} ação(ões) prioritária(s) recomendada(s) para sua operação hoje.`
        : "Nenhuma nova ação prioritária foi recomendada para sua operação.",
    metrics: {
      ...baseDashboardData.metrics,
      pendingTasks: tasks.length,
    },
    tasks,
  }
}