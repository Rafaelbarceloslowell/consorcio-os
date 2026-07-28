import type {
  DashboardIntelligence,
  GorilaR2Briefing,
} from "@/types/dashboard"

export type BuildGorilaR2BriefingInput = {
  intelligence: DashboardIntelligence
}

function getConfidence(
  intelligence: DashboardIntelligence,
): GorilaR2Briefing["confidence"] {
  if (
    intelligence.criticalCount === 0 &&
    intelligence.unpreparedMeetings === 0 &&
    intelligence.staleOpportunities === 0
  ) {
    return "high"
  }

  if (intelligence.criticalCount <= 3) {
    return "medium"
  }

  return "low"
}

function buildAnalysis(
  intelligence: DashboardIntelligence,
): string {
  if (intelligence.criticalCount > 0) {
    return `Existem ${intelligence.criticalCount} oportunidade(s) crítica(s) que merecem atenção imediata.`
  }

  if (intelligence.unpreparedMeetings > 0) {
    return `Você possui ${intelligence.unpreparedMeetings} reunião(ões) sem preparação.`
  }

  if (intelligence.staleOpportunities > 0) {
    return `${intelligence.staleOpportunities} oportunidade(s) estão paradas há mais de 48 horas.`
  }

  return "Nenhum alerta crítico identificado. A operação está estável e pronta para acelerar novas conversões."
}

function buildRecommendation(
  intelligence: DashboardIntelligence,
): string {
  if (intelligence.nextAction) {
    return intelligence.nextAction
  }

  return "Priorize os próximos contatos e mantenha o pipeline avançando."
}

function buildReason(
  intelligence: DashboardIntelligence,
): string {
  return [
    `Críticas: ${intelligence.criticalCount}`,
    `Importantes: ${intelligence.importantCount}`,
    `Monitoramento: ${intelligence.monitoringCount}`,
    `Pipeline: ${intelligence.pipelineValue}`,
  ].join(" • ")
}

export function buildGorilaR2Briefing(
  input: BuildGorilaR2BriefingInput,
): GorilaR2Briefing {
  const { intelligence } = input

  return {
    greeting:
      intelligence.criticalCount > 0
        ? "Atenção. Identifiquei pontos que precisam de decisão hoje."
        : intelligence.staleOpportunities > 0
          ? "Encontrei oportunidades que precisam voltar para o radar."
          : "Operação estável. Vamos buscar o próximo avanço comercial.",

    analysis: buildAnalysis(intelligence),

    recommendation:
      buildRecommendation(intelligence),

    reason: buildReason(intelligence),

    confidence:
      getConfidence(intelligence),

    nextAction: intelligence.nextAction
      ? {
          title: intelligence.nextAction,
          priority: "high",
        }
      : undefined,

    generatedAt:
      new Date().toISOString(),
  }
}
