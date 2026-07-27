import {
    CommercialJourneyOutcome as PrismaCommercialJourneyOutcome,
    CommercialJourneyPriority as PrismaCommercialJourneyPriority,
    ConsortiumType as PrismaConsortiumType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialJourney as PrismaCommercialJourney,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommercialJourney,
    CommercialJourneyOutcome,
    CommercialJourneyPriority,
    ConsortiumType,
  } from "@/types/domain"
  
  const consortiumTypeToPrisma: Record<
    ConsortiumType,
    PrismaConsortiumType
  > = {
    real_estate:
      PrismaConsortiumType.REAL_ESTATE,
  
    vehicle:
      PrismaConsortiumType.VEHICLE,
  
    heavy_vehicle:
      PrismaConsortiumType.HEAVY_VEHICLE,
  
    services:
      PrismaConsortiumType.SERVICES,
  
    other:
      PrismaConsortiumType.OTHER,
  }
  
  const consortiumTypeToDomain: Record<
    PrismaConsortiumType,
    ConsortiumType
  > = {
    [PrismaConsortiumType.REAL_ESTATE]:
      "real_estate",
  
    [PrismaConsortiumType.VEHICLE]:
      "vehicle",
  
    [PrismaConsortiumType.HEAVY_VEHICLE]:
      "heavy_vehicle",
  
    [PrismaConsortiumType.SERVICES]:
      "services",
  
    [PrismaConsortiumType.OTHER]:
      "other",
  }
  
  const priorityToPrisma: Record<
    CommercialJourneyPriority,
    PrismaCommercialJourneyPriority
  > = {
    LOW:
      PrismaCommercialJourneyPriority.LOW,
  
    NORMAL:
      PrismaCommercialJourneyPriority.NORMAL,
  
    HIGH:
      PrismaCommercialJourneyPriority.HIGH,
  
    URGENT:
      PrismaCommercialJourneyPriority.URGENT,
  }
  
  const priorityToDomain: Record<
    PrismaCommercialJourneyPriority,
    CommercialJourneyPriority
  > = {
    [PrismaCommercialJourneyPriority.LOW]:
      "LOW",
  
    [PrismaCommercialJourneyPriority.NORMAL]:
      "NORMAL",
  
    [PrismaCommercialJourneyPriority.HIGH]:
      "HIGH",
  
    [PrismaCommercialJourneyPriority.URGENT]:
      "URGENT",
  }
  
  const outcomeToPrisma: Record<
    CommercialJourneyOutcome,
    PrismaCommercialJourneyOutcome
  > = {
    WON:
      PrismaCommercialJourneyOutcome.WON,
  
    LOST_TO_COMPETITOR:
      PrismaCommercialJourneyOutcome.LOST_TO_COMPETITOR,
  
    NO_FINANCIAL_CAPACITY:
      PrismaCommercialJourneyOutcome.NO_FINANCIAL_CAPACITY,
  
    NO_RESPONSE:
      PrismaCommercialJourneyOutcome.NO_RESPONSE,
  
    POSTPONED:
      PrismaCommercialJourneyOutcome.POSTPONED,
  
    PRODUCT_NOT_SUITABLE:
      PrismaCommercialJourneyOutcome.PRODUCT_NOT_SUITABLE,
  
    TRUST_CONCERN:
      PrismaCommercialJourneyOutcome.TRUST_CONCERN,
  
    CLIENT_WITHDREW:
      PrismaCommercialJourneyOutcome.CLIENT_WITHDREW,
  
    CANCELLED_BY_CONSULTANT:
      PrismaCommercialJourneyOutcome.CANCELLED_BY_CONSULTANT,
  
    OTHER:
      PrismaCommercialJourneyOutcome.OTHER,
  }
  
  const outcomeToDomain: Record<
    PrismaCommercialJourneyOutcome,
    CommercialJourneyOutcome
  > = {
    [PrismaCommercialJourneyOutcome.WON]:
      "WON",
  
    [PrismaCommercialJourneyOutcome.LOST_TO_COMPETITOR]:
      "LOST_TO_COMPETITOR",
  
    [PrismaCommercialJourneyOutcome.NO_FINANCIAL_CAPACITY]:
      "NO_FINANCIAL_CAPACITY",
  
    [PrismaCommercialJourneyOutcome.NO_RESPONSE]:
      "NO_RESPONSE",
  
    [PrismaCommercialJourneyOutcome.POSTPONED]:
      "POSTPONED",
  
    [PrismaCommercialJourneyOutcome.PRODUCT_NOT_SUITABLE]:
      "PRODUCT_NOT_SUITABLE",
  
    [PrismaCommercialJourneyOutcome.TRUST_CONCERN]:
      "TRUST_CONCERN",
  
    [PrismaCommercialJourneyOutcome.CLIENT_WITHDREW]:
      "CLIENT_WITHDREW",
  
    [PrismaCommercialJourneyOutcome.CANCELLED_BY_CONSULTANT]:
      "CANCELLED_BY_CONSULTANT",
  
    [PrismaCommercialJourneyOutcome.OTHER]:
      "OTHER",
  }
  
  export type CommercialJourneyPersistenceInput = {
    workspaceId: string
    journey: CommercialJourney
  }

  function validateJourneyOrigin(
    journeyId: string,
    leadId: string | null,
    clientId: string | null,
  ): void {
    if (!leadId && !clientId) {
      throw new Error(
        `A jornada comercial "${journeyId}" deve estar vinculada a um lead ou cliente.`,
      )
    }
  }
  
  export class CommercialJourneyMapper {
    static toDomain(
      raw: PrismaCommercialJourney,
    ): CommercialJourney {
      validateJourneyOrigin(
        raw.id,
        raw.leadId,
        raw.clientId,
      )

      return {
        id:
          raw.id,
  
        workspaceId:
          raw.workspaceId,
  
        leadId:
          raw.leadId,
  
        clientId:
          raw.clientId,
  
        consultantId:
          raw.consultantId,
  
        title:
          raw.title,
  
        consortiumType:
          consortiumTypeToDomain[
            raw.consortiumType
          ],
  
        currentPhaseId:
          raw.currentPhaseId,
  
        currentStateId:
          raw.currentStateId,
  
        priority:
          priorityToDomain[
            raw.priority
          ],
  
        score:
          raw.score,
  
        outcome:
          raw.outcome
            ? outcomeToDomain[
                raw.outcome
              ]
            : null,
  
        stateEnteredAt:
          raw.stateEnteredAt.toISOString(),
  
        lastInteractionAt:
          raw.lastInteractionAt
            ? raw.lastInteractionAt.toISOString()
            : null,
  
        closedAt:
          raw.closedAt
            ? raw.closedAt.toISOString()
            : null,
  
        version:
          raw.version,
  
        createdAt:
          raw.createdAt.toISOString(),
  
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      journey,
    }: CommercialJourneyPersistenceInput): Prisma.CommercialJourneyUncheckedCreateInput {
      validateJourneyOrigin(
        journey.id,
        journey.leadId,
        journey.clientId,
      )

      return {
        id:
          journey.id,
  
        workspaceId,
  
        leadId:
          journey.leadId,
  
        clientId:
          journey.clientId,
  
        consultantId:
          journey.consultantId,
  
        title:
          journey.title,
  
        consortiumType:
          consortiumTypeToPrisma[
            journey.consortiumType
          ],
  
        currentPhaseId:
          journey.currentPhaseId,
  
        currentStateId:
          journey.currentStateId,
  
        priority:
          priorityToPrisma[
            journey.priority
          ],
  
        score:
          journey.score,
  
        outcome:
          journey.outcome
            ? outcomeToPrisma[
                journey.outcome
              ]
            : null,
  
        stateEnteredAt:
          new Date(
            journey.stateEnteredAt,
          ),
  
        lastInteractionAt:
          journey.lastInteractionAt
            ? new Date(
                journey.lastInteractionAt,
              )
            : null,
  
        closedAt:
          journey.closedAt
            ? new Date(
                journey.closedAt,
              )
            : null,
  
        version:
          journey.version,
  
        createdAt:
          new Date(
            journey.createdAt,
          ),
  
        updatedAt:
          new Date(
            journey.updatedAt,
          ),
      }
    }
  }
