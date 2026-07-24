import type {
    NextBestAction,
  } from "@/types/domain"
  
  import {
    createRecommendationFromRule,
  } from "./factory"
  
  import {
    recommendationRuleMatches,
  } from "./matcher"
  
  import type {
    GenerateRecommendationsInput,
    RecommendationResult,
    RecommendationRuleContext,
  } from "./types"
  
  export function generateRecommendations(
    input: GenerateRecommendationsInput,
  ): RecommendationResult {
    const {
      journey,
      timelineAnalysis,
      journeyDiagnostics,
      workflowRules,
      now,
    } = input
  
    const nextBestActions: NextBestAction[] = []
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const context: RecommendationRuleContext = {
      daysSinceLastInteraction:
        timelineAnalysis.daysSinceLastInteraction,
      score: journey.score,
      isClosed: journeyDiagnostics.isClosed,
    }
  
    const activeRules = workflowRules
      .filter((rule) => rule.isActive)
      .sort((firstRule, secondRule) => {
        return (
          secondRule.priority -
          firstRule.priority
        )
      })
  
    for (const rule of activeRules) {
      if (
        !recommendationRuleMatches(
          rule,
          context,
        )
      ) {
        continue
      }
  
      const recommendation =
        createRecommendationFromRule(
          rule,
          journey,
          now,
        )
  
      if (recommendation) {
        nextBestActions.push(recommendation)
  
        diagnostics.push(
          `Regra aplicada: ${rule.name}.`,
        )
      } else {
        warnings.push(
          `A regra ${rule.name} foi acionada, mas nao gerou uma recomendacao valida.`,
        )
      }
  
      if (rule.stopProcessingAfterMatch) {
        break
      }
    }
  
    if (nextBestActions.length === 0) {
      diagnostics.push(
        "Nenhuma regra de recomendacao foi acionada.",
      )
    }
  
    diagnostics.push(
      `Analise de recomendacoes executada em ${now.toISOString()}.`,
    )
  
    return {
      nextBestActions,
      diagnostics,
      warnings,
    }
  }