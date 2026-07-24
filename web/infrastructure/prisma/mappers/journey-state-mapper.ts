import type {
    JourneyState as PrismaJourneyState,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    JourneyState,
  } from "@/types/domain"
  
  export type JourneyStatePersistenceInput = {
    workspaceId: string
    state: JourneyState
  }
  
  export class JourneyStateMapper {
    static toDomain(
      raw: PrismaJourneyState,
    ): JourneyState {
      return {
        id: raw.id,
  
        workspaceId: raw.workspaceId,
  
        phaseId: raw.phaseId,
  
        code: raw.code,
  
        name: raw.name,
  
        description:
          raw.description ?? undefined,
  
        order: raw.order,
  
        color:
          raw.color ?? undefined,
  
        icon:
          raw.icon ?? undefined,
  
        isInitial: raw.isInitial,
  
        isFinal: raw.isFinal,
  
        isWon: raw.isWon,
  
        isLost: raw.isLost,
  
        allowReopen:
          raw.allowReopen,
  
        isActive:
          raw.isActive,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      state,
    }: JourneyStatePersistenceInput): Prisma.JourneyStateUncheckedCreateInput {
      return {
        id: state.id,
  
        workspaceId,
  
        phaseId: state.phaseId,
  
        code: state.code,
  
        name: state.name,
  
        description:
          state.description ?? null,
  
        order: state.order,
  
        color:
          state.color ?? null,
  
        icon:
          state.icon ?? null,
  
        isInitial:
          state.isInitial,
  
        isFinal:
          state.isFinal,
  
        isWon:
          state.isWon,
  
        isLost:
          state.isLost,
  
        allowReopen:
          state.allowReopen,
  
        isActive:
          state.isActive,
  
        createdAt:
          new Date(
            state.createdAt,
          ),
  
        updatedAt:
          new Date(
            state.updatedAt,
          ),
      }
    }
  }