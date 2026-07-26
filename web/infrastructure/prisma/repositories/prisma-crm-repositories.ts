import type {
  PrismaClient,
} from "@/lib/generated/prisma/client"

import type {
  AsyncCrmRepositories,
} from "@/repositories/crm/async-crm-repositories"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  PrismaClientRepository,
} from "./prisma-client-repository"

import {
  PrismaConsortiumRepository,
} from "./prisma-consortium-repository"

import {
  PrismaConsultantRepository,
} from "./prisma-consultant-repository"

import {
  PrismaLeadRepository,
} from "./prisma-lead-repository"

import {
  PrismaMeetingRepository,
} from "./prisma-meeting-repository"

import {
  PrismaPipelineStageRepository,
} from "./prisma-pipeline-stage-repository"

import {
  PrismaProposalRepository,
} from "./prisma-proposal-repository"

import {
  PrismaSaleRepository,
} from "./prisma-sale-repository"

import {
  PrismaTaskRepository,
} from "./prisma-task-repository"

export type CreatePrismaCrmRepositoriesInput = {
  workspaceId: string
  database?: PrismaClient
}

export function createPrismaCrmRepositories({
  workspaceId,
  database = prisma,
}: CreatePrismaCrmRepositoriesInput): AsyncCrmRepositories {
  if (!workspaceId.trim()) {
    throw new Error(
      "O workspaceId dos repositórios CRM Prisma não pode estar vazio.",
    )
  }

  return {
    leads:
      new PrismaLeadRepository(
        workspaceId,
        database,
      ),

    clients:
      new PrismaClientRepository(
        workspaceId,
        database,
      ),

    consultants:
      new PrismaConsultantRepository(
        workspaceId,
        database,
      ),

    pipelineStages:
      new PrismaPipelineStageRepository(
        workspaceId,
        database,
      ),

    meetings:
      new PrismaMeetingRepository(
        workspaceId,
        database,
      ),

    consortiums:
      new PrismaConsortiumRepository(
        workspaceId,
        database,
      ),

    proposals:
      new PrismaProposalRepository(
        workspaceId,
        database,
      ),

    sales:
      new PrismaSaleRepository(
        workspaceId,
        database,
      ),

    tasks:
      new PrismaTaskRepository(
        workspaceId,
        database,
      ),
  }
}