import type {
    WorkflowRuleConditionOperator,
  } from "@/types/domain"
  
  export function compareRecommendationValues(
    actualValue: unknown,
    operator: WorkflowRuleConditionOperator,
    expectedValue: unknown,
  ): boolean {
    switch (operator) {
      case "EQUALS":
        return actualValue === expectedValue
  
      case "NOT_EQUALS":
        return actualValue !== expectedValue
  
      case "GREATER_THAN":
        return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue > expectedValue
        )
  
      case "GREATER_THAN_OR_EQUAL":
        return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue >= expectedValue
        )
  
      case "LESS_THAN":
        return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue < expectedValue
        )
  
      case "LESS_THAN_OR_EQUAL":
        return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue <= expectedValue
        )
  
      case "EXISTS":
        return (
          actualValue !== null &&
          actualValue !== undefined
        )
  
      case "NOT_EXISTS":
        return (
          actualValue === null ||
          actualValue === undefined
        )
  
      case "IN":
        return Array.isArray(expectedValue)
          ? expectedValue.includes(actualValue)
          : false
  
      case "NOT_IN":
        return Array.isArray(expectedValue)
          ? !expectedValue.includes(actualValue)
          : false
    }
  }