import type {
  PrismaClient,
} from "@/lib/generated/prisma/client"

import type {
  CommercialConversationMemory,
} from "@/types/domain"

import type {
  AsyncCommercialConversationMemoryRepository,
} from "@/repositories/commercial/async-commercial-repositories"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  CommercialConversationMemoryMapper,
} from "@/infrastructure/prisma/mappers/commercial-conversation-memory-mapper"

export class PrismaCommercialConversationMemoryRepository
  implements AsyncCommercialConversationMemoryRepository
{
  constructor(
    private readonly workspaceId: string,
    private readonly database: PrismaClient = prisma,
  ) {
    if (!workspaceId.trim()) {
      throw new Error(
        "O workspaceId do repositorio de memoria comercial nao pode estar vazio.",
      )
    }
  }

  async findByJourneyId(
    journeyId: string,
  ): Promise<CommercialConversationMemory | undefined> {
    const normalizedJourneyId =
      journeyId.trim()

    if (!normalizedJourneyId) {
      return undefined
    }

    const memory =
      await this.database
        .commercialConversationMemory
        .findFirst({
          where: {
            workspaceId:
              this.workspaceId,
            journeyId:
              normalizedJourneyId,
          },
        })

    if (!memory) {
      return undefined
    }

    return CommercialConversationMemoryMapper.toDomain(
      memory,
    )
  }
}