import type {
    WorkflowRule,
  } from "@/types/domain"
  
  import {
    compareRecommendationValues,
  } from "./comparator"
  
  import type {
    RecommendationRuleContext,
  } from "./types"
  
  export function recommendationRuleMatches(
    rule: WorkflowRule,
    context: RecommendationRuleContext,
  ): boolean {
    if (!rule.isActive) {
      return false
    }
  
    return rule.conditions.every((condition) => {
      const field =
        condition.field as keyof RecommendationRuleContext
  
      const actualValue = context[field]
  
      return compareRecommendationValues(
        actualValue,
        condition.operator,
        condition.value,
      )
    })
  }