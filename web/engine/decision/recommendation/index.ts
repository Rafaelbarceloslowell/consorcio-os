export type {
    GenerateRecommendationsInput,
    RecommendationResult,
    RecommendationRuleContext,
  } from "./types"
  
  export {
    compareRecommendationValues,
  } from "./comparator"
  
  export {
    recommendationRuleMatches,
  } from "./matcher"
  
  export {
    createRecommendationFromRule,
  } from "./factory"
  
  export {
    generateRecommendations,
  } from "./engine"