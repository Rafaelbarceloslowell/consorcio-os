import type {
    NextBestAction,
    NextBestActionPriority,
  } from "@/types/domain"
  
  import {
    createStrategySteps,
  } from "./planner"
  
  import {
    selectStrategyType,
  } from "./selector"
  
  import {
    getStrategyDefinition,
  } from "./strategies"
  
  import type {
    CommercialStrategy,
    CommercialStrategyType,
    StrategyEngineInput,
    StrategyEngineOutput,
  } from "./types"
  
  const PRIORITY_WEIGHT: Record<
    NextBestActionPriority,
    number
  > = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4,
  }
  
  function getHighestPriority(
    recommendations: NextBestAction[],
  ): NextBestActionPriority {
    return recommendations.reduce<NextBestActionPriority>(
      (
        highestPriority,
        recommendation,
      ) => {
        const currentWeight =
          PRIORITY_WEIGHT[
            recommendation.priority
          ]
  
        const highestWeight =
          PRIORITY_WEIGHT[
            highestPriority
          ]
  
        return currentWeight > highestWeight
          ? recommendation.priority
          : highestPriority
      },
      "LOW",
    )
  }
  
  function getAverageConfidence(
    recommendations: NextBestAction[],
  ): number {
    if (recommendations.length === 0) {
      return 0
    }
  
    const totalConfidence =
      recommendations.reduce(
        (
          total,
          recommendation,
        ) =>
          total +
          recommendation.confidence,
        0,
      )
  
    const average =
      totalConfidence /
      recommendations.length
  
    return Number(
      average.toFixed(2),
    )
  }
  
  function createStrategyId(
    journeyId: string,
    strategyType: CommercialStrategyType,
    now: Date,
  ): string {
    return [
      journeyId,
      "strategy",
      strategyType.toLowerCase(),
      now.toISOString(),
    ].join(":")
  }
  
  function getStrategyReason(
    strategyType: CommercialStrategyType,
    recommendations: NextBestAction[],
  ): string {
    const recommendationReasons =
      recommendations
        .map(
          (recommendation) =>
            recommendation.reason,
        )
        .filter(
          (
            reason,
            index,
            allReasons,
          ) =>
            allReasons.indexOf(reason) ===
            index,
        )
  
    if (
      recommendationReasons.length > 0
    ) {
      return recommendationReasons.join(
        " ",
      )
    }
  
    switch (strategyType) {
      case "INITIAL_CONTACT":
        return "A jornada precisa iniciar o primeiro contato comercial."
  
      case "QUALIFICATION":
        return "A oportunidade precisa reunir informações antes de avançar."
  
      case "NURTURE":
        return "A oportunidade ainda não possui uma ação comercial prioritária."
  
      case "MEETING_CONVERSION":
        return "A oportunidade demonstra potencial para avançar para uma reunião."
  
      case "NEGOTIATION":
        return "A oportunidade precisa avançar na construção da proposta comercial."
  
      case "RECOVERY":
        return "A oportunidade possui potencial, mas perdeu ritmo ou está sem interação."
  
      case "CLOSING":
        return "A oportunidade está próxima de uma decisão comercial."
  
      case "POST_SALE":
        return "A venda concluída precisa ser acompanhada durante a transição para cliente."
  
      case "RETENTION":
        return "Existem sinais que exigem uma ação de retenção do cliente."
    }
  }
  
  function getStrategyExpiration(
    recommendations: NextBestAction[],
  ): string | null {
    const expirationDates =
      recommendations
        .map(
          (recommendation) =>
            recommendation.expiresAt,
        )
        .filter(
          (
            expiresAt,
          ): expiresAt is string =>
            expiresAt !== null,
        )
        .sort()
  
    return expirationDates[0] ?? null
  }
  
  function getStrategySource(
    recommendations: NextBestAction[],
  ): CommercialStrategy["source"] {
    const hasAiRecommendation =
      recommendations.some(
        (recommendation) =>
          recommendation.source === "AI",
      )
  
    return hasAiRecommendation
      ? "AI"
      : "RULE_ENGINE"
  }
  
  function createCommercialStrategy(
    input: StrategyEngineInput,
    strategyType: CommercialStrategyType,
  ): CommercialStrategy {
    const {
      journey,
      recommendations,
      now,
    } = input
  
    const definition =
      getStrategyDefinition(
        strategyType,
      )
  
    const strategyId =
      createStrategyId(
        journey.id,
        strategyType,
        now,
      )
  
    const steps =
      createStrategySteps({
        strategyId,
        recommendations,
        now,
      })
  
    const confidence =
      recommendations.length > 0
        ? getAverageConfidence(
            recommendations,
          )
        : definition.defaultConfidence
  
    const priority =
      recommendations.length > 0
        ? getHighestPriority(
            recommendations,
          )
        : definition.defaultPriority
  
    const timestamp =
      now.toISOString()
  
    return {
      id: strategyId,
  
      workspaceId:
        journey.workspaceId,
  
      journeyId: journey.id,
  
      type: strategyType,
  
      status:
        steps.length > 0
          ? "ACTIVE"
          : "PLANNED",
  
      source:
        getStrategySource(
          recommendations,
        ),
  
      title: definition.title,
  
      objective:
        definition.objective,
  
      reason:
        getStrategyReason(
          strategyType,
          recommendations,
        ),
  
      priority,
  
      confidence,
  
      steps,
  
      maxAttempts:
        definition.maxAttempts,
  
      currentAttempt: 0,
  
      currentStepPosition:
        steps.length > 0
          ? 1
          : null,
  
      stopOnResponse:
        definition.stopOnResponse,
  
      stopOnJourneyClosed:
        definition.stopOnJourneyClosed,
  
      expiresAt:
        getStrategyExpiration(
          recommendations,
        ),
  
      startedAt:
        steps.length > 0
          ? timestamp
          : null,
  
      pausedAt: null,
  
      completedAt: null,
  
      cancelledAt: null,
  
      createdAt: timestamp,
  
      updatedAt: timestamp,
    }
  }
  
  export function runStrategyEngine(
    input: StrategyEngineInput,
  ): StrategyEngineOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const {
      journey,
      recommendations,
      now,
    } = input
  
    diagnostics.push(
      `Jornada ${journey.id} analisada pelo Strategy Engine.`,
    )
  
    diagnostics.push(
      `${recommendations.length} recomendações disponíveis para planejamento.`,
    )
  
    if (journey.closedAt !== null) {
      warnings.push(
        "A jornada já está encerrada e não pode receber uma nova estratégia ativa.",
      )
  
      return {
        strategy: null,
        diagnostics,
        warnings,
      }
    }
  
    if (
      recommendations.length === 0
    ) {
      warnings.push(
        "Nenhuma recomendação foi recebida para construir uma estratégia.",
      )
  
      return {
        strategy: null,
        diagnostics,
        warnings,
      }
    }
  
    const strategyType =
      selectStrategyType({
        journey,
        recommendations,
        now,
      })
  
    diagnostics.push(
      `Estratégia selecionada: ${strategyType}.`,
    )
  
    const strategy =
      createCommercialStrategy(
        input,
        strategyType,
      )
  
    diagnostics.push(
      `${strategy.steps.length} passos foram criados para a estratégia.`,
    )
  
    diagnostics.push(
      `Planejamento estratégico executado em ${now.toISOString()}.`,
    )
  
    return {
      strategy,
      diagnostics,
      warnings,
    }
  }