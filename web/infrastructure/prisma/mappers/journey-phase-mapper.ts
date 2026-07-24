import type {
    JourneyPhase as PrismaJourneyPhase,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    JourneyPhase,
  } from "@/types/domain"
  
  export type JourneyPhasePersistenceInput = {
    workspaceId: string
    phase: JourneyPhase
  }
  
  export class JourneyPhaseMapper {
    static toDomain(
      raw: PrismaJourneyPhase,
    ): JourneyPhase {
      return {
        id: raw.id,
  
        workspaceId: raw.workspaceId,
  
        code: raw.code,
  
        name: raw.name,
  
        description:
          raw.description ?? undefined,
  
        order: raw.order,
  
        isActive: raw.isActive,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      phase,
    }: JourneyPhasePersistenceInput): Prisma.JourneyPhaseUncheckedCreateInput {
      return {
        id: phase.id,
  
        workspaceId,
  
        code: phase.code,
  
        name: phase.name,
  
        description:
          phase.description ?? null,
  
        order: phase.order,
  
        isActive: phase.isActive,
  
        createdAt:
          new Date(phase.createdAt),
  
        updatedAt:
          new Date(phase.updatedAt),
      }
    }
  }