import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    AsyncCommercialRepositories,
  } from "@/repositories/commercial/async-commercial-repositories"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    PrismaCommercialActionRepository,
  } from "./commercial/prisma-commercial-action-repository"
  
  import {
    PrismaCommercialEventRepository,
  } from "./commercial/prisma-commercial-event-repository"
  
  
  import {
    PrismaCommercialConversationMemoryRepository,
  } from "./commercial/prisma-commercial-conversation-memory-repository"
import {
    PrismaCommercialJourneyRepository,
  } from "./commercial/prisma-commercial-journey-repository"
  
  import {
    PrismaCommercialTransactionRepository,
  } from "./commercial/prisma-commercial-transaction-repository"
  
  import {
    PrismaJourneyPhaseRepository,
  } from "./commercial/prisma-journey-phase-repository"
  
  import {
    PrismaJourneyStateRepository,
  } from "./commercial/prisma-journey-state-repository"
  
  import {
    PrismaNextBestActionRepository,
  } from "./commercial/prisma-next-best-action-repository"
  
  import {
    PrismaWorkflowRuleRepository,
  } from "./commercial/prisma-workflow-rule-repository"
  
  export type CreatePrismaCommercialRepositoriesInput = {
    workspaceId: string
    database?: PrismaClient
  }
  
  export function createPrismaCommercialRepositories({
    workspaceId,
    database = prisma,
  }: CreatePrismaCommercialRepositoriesInput): AsyncCommercialRepositories {
    if (!workspaceId.trim()) {
      throw new Error(
        "O workspaceId dos repositorios comerciais Prisma nao pode estar vazio.",
      )
    }
  
    return {
      conversationMemories:
        new PrismaCommercialConversationMemoryRepository(
          workspaceId,
          database,
        ),

      journeys:
        new PrismaCommercialJourneyRepository(
          workspaceId,
          database,
        ),
  
      events:
        new PrismaCommercialEventRepository(
          workspaceId,
          database,
        ),
  
      actions:
        new PrismaCommercialActionRepository(
          workspaceId,
          database,
        ),
  
      nextBestActions:
        new PrismaNextBestActionRepository(
          workspaceId,
          database,
        ),
  
      phases:
        new PrismaJourneyPhaseRepository(
          workspaceId,
          database,
        ),
  
      states:
        new PrismaJourneyStateRepository(
          workspaceId,
          database,
        ),
  
      workflowRules:
        new PrismaWorkflowRuleRepository(
          workspaceId,
          database,
        ),
  
      transactions:
        new PrismaCommercialTransactionRepository(
          workspaceId,
          database,
        ),
    }
  }