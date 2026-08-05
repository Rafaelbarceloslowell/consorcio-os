import {
  CommercialConversationGoal as PrismaCommercialConversationGoal,
  CommercialConversationStage as PrismaCommercialConversationStage,
} from "@/lib/generated/prisma/client"

import type {
  CommercialConversationMemory as PrismaCommercialConversationMemory,
} from "@/lib/generated/prisma/client"

import type {
  CommercialConversationGoal,
  CommercialConversationMemory,
  CommercialConversationStage,
} from "@/types/domain"

const stageToDomain: Record<
  PrismaCommercialConversationStage,
  CommercialConversationStage
> = {
  [PrismaCommercialConversationStage.OPENING]:
    "opening",
  [PrismaCommercialConversationStage.RAPPORT]:
    "rapport",
  [PrismaCommercialConversationStage.DISCOVERY]:
    "discovery",
  [PrismaCommercialConversationStage.QUALIFICATION]:
    "qualification",
  [PrismaCommercialConversationStage.DIAGNOSIS]:
    "diagnosis",
  [PrismaCommercialConversationStage.STRATEGY]:
    "strategy",
  [PrismaCommercialConversationStage.MEETING]:
    "meeting",
  [PrismaCommercialConversationStage.FOLLOW_UP]:
    "follow_up",
  [PrismaCommercialConversationStage.CLOSING]:
    "closing",
}

const goalToDomain: Record<
  PrismaCommercialConversationGoal,
  CommercialConversationGoal
> = {
  [PrismaCommercialConversationGoal.GET_FIRST_RESPONSE]:
    "get_first_response",
  [PrismaCommercialConversationGoal.UNDERSTAND_INTEREST_AREA]:
    "understand_interest_area",
  [PrismaCommercialConversationGoal.UNDERSTAND_PROJECT_PURPOSE]:
    "understand_project_purpose",
  [PrismaCommercialConversationGoal.UNDERSTAND_TIMING]:
    "understand_timing",
  [PrismaCommercialConversationGoal.UNDERSTAND_BUDGET]:
    "understand_budget",
  [PrismaCommercialConversationGoal.UNDERSTAND_OBJECTION]:
    "understand_objection",
  [PrismaCommercialConversationGoal.PRESENT_STRATEGY]:
    "present_strategy",
  [PrismaCommercialConversationGoal.SCHEDULE_MEETING]:
    "schedule_meeting",
  [PrismaCommercialConversationGoal.CONFIRM_FOLLOW_UP]:
    "confirm_follow_up",
  [PrismaCommercialConversationGoal.CLOSE_NEXT_STEP]:
    "close_next_step",
}

export class CommercialConversationMemoryMapper {
  static toDomain(
    raw: PrismaCommercialConversationMemory,
  ): CommercialConversationMemory {
    return {
      id:
        raw.id,
      workspaceId:
        raw.workspaceId,
      journeyId:
        raw.journeyId,
      stage:
        stageToDomain[
          raw.stage
        ],
      goal:
        goalToDomain[
          raw.goal
        ],
      lastIntent:
        raw.lastIntent,
      lastIncomingMessage:
        raw.lastIncomingMessage,
      lastSuggestedReply:
        raw.lastSuggestedReply,
      analyzedAt:
        raw.analyzedAt?.toISOString() ??
        null,
      createdAt:
        raw.createdAt.toISOString(),
      updatedAt:
        raw.updatedAt.toISOString(),
    }
  }
}