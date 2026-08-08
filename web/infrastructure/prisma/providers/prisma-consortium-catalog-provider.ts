import type {
  ConsortiumCatalogProvider,
  ListConsortiumCatalogInput,
} from "@/application/consortium/consortium-catalog-provider"

import type {
  Consortium,
} from "@/types/domain"

import {
  PrismaConsortiumRepository,
} from "@/infrastructure/prisma/repositories/prisma-consortium-repository"

export class PrismaConsortiumCatalogProvider
implements ConsortiumCatalogProvider {
  private readonly repository:
    PrismaConsortiumRepository

  constructor(
    workspaceId: string,
  ) {
    this.repository =
      new PrismaConsortiumRepository(
        workspaceId,
      )
  }

  async listCandidates(
    input: ListConsortiumCatalogInput = {},
  ): Promise<readonly Consortium[]> {
    const candidates =
      await this.repository.findAll()

    return input.assetCategory
      ? candidates.filter(
          (candidate) =>
            candidate.type ===
            input.assetCategory,
        )
      : candidates
  }
}
