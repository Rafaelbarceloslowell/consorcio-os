import type {
    CommercialJourney,
    NextBestAction,
    WorkflowRule,
  } from "@/types/domain"
  
  function addHours(
    date: Date,
    hours: number,
  ): Date {
    const result = new Date(date)
  
    result.setHours(
      result.getHours() + hours,
    )
  
    return result
  }
  
  export function createRecommendationFromRule(
    rule: WorkflowRule,
    journey: CommercialJourney,
    now: Date,
  ): NextBestAction | null {
    const action = rule.actions.find(
      (item) =>
        item.type === "TRIGGER_AUTOMATION",
    )
  
    if (!action) {
      return null
    }
  
    const payload = action.payload
  
    const recommendationType =
      typeof payload.recommendationType ===
      "string"
        ? payload.recommendationType
        : null
  
    const title =
      typeof payload.title === "string"
        ? payload.title
        : null
  
    const description =
      typeof payload.description === "string"
        ? payload.description
        : null
  
    const reason =
      typeof payload.reason === "string"
        ? payload.reason
        : null
  
    const confidence =
      typeof payload.confidence === "number"
        ? payload.confidence
        : null
  
    const priority =
      typeof payload.priority === "string"
        ? payload.priority
        : null
  
    const expiresInHours =
      typeof payload.expiresInHours === "number"
        ? payload.expiresInHours
        : 48
  
    if (
      recommendationType !== "SEND_MESSAGE" ||
      !title ||
      !description ||
      !reason ||
      confidence === null ||
      priority !== "HIGH"
    ) {
      return null
    }
  
    const timestamp = now.toISOString()
  
    return {
      id: `${journey.id}:${rule.id}:${timestamp}`,
      workspaceId: journey.workspaceId,
      journeyId: journey.id,
      actionType: "SEND_MESSAGE",
      title,
      description,
      reason,
      confidence,
      priority: "HIGH",
      source: "RULE_ENGINE",
      expiresAt: addHours(
        now,
        expiresInHours,
      ).toISOString(),
      acceptedAt: null,
      rejectedAt: null,
      executedActionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }