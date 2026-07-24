import {
    ClientStatus as PrismaClientStatus,
    PersonType as PrismaPersonType,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Client,
    ClientStatus,
    PersonType,
  } from "@/types/domain"
  
  const personTypeToPrisma: Record<
    PersonType,
    PrismaPersonType
  > = {
    individual: PrismaPersonType.INDIVIDUAL,
    company: PrismaPersonType.COMPANY,
  }
  
  const personTypeToDomain: Record<
    PrismaPersonType,
    PersonType
  > = {
    [PrismaPersonType.INDIVIDUAL]:
      "individual",
    [PrismaPersonType.COMPANY]:
      "company",
  }
  
  const clientStatusToPrisma: Record<
    ClientStatus,
    PrismaClientStatus
  > = {
    active: PrismaClientStatus.ACTIVE,
    inactive: PrismaClientStatus.INACTIVE,
    blocked: PrismaClientStatus.BLOCKED,
  }
  
  const clientStatusToDomain: Record<
    PrismaClientStatus,
    ClientStatus
  > = {
    [PrismaClientStatus.ACTIVE]:
      "active",
    [PrismaClientStatus.INACTIVE]:
      "inactive",
    [PrismaClientStatus.BLOCKED]:
      "blocked",
  }
  
  export type PrismaClientWithConvertedLead =
    Prisma.ClientGetPayload<{
      include: {
        convertedFromLead: {
          select: {
            id: true
          }
        }
      }
    }>
  
  export type ClientPersistenceInput = {
    workspaceId: string
    client: Client
  }
  
  export class ClientMapper {
    static toDomain(
      raw: PrismaClientWithConvertedLead,
    ): Client {
      return {
        id: raw.id,
        type:
          personTypeToDomain[raw.type],
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        document: raw.document,
        birthDate:
          raw.birthDate?.toISOString(),
        companyName:
          raw.companyName ?? undefined,
        tradeName:
          raw.tradeName ?? undefined,
        stateRegistration:
          raw.stateRegistration ?? undefined,
        address: {
          street:
            raw.addressStreet,
          number:
            raw.addressNumber,
          complement:
            raw.addressComplement ?? undefined,
          neighborhood:
            raw.addressNeighborhood,
          city:
            raw.addressCity,
          state:
            raw.addressState,
          zipCode:
            raw.addressZipCode,
        },
        consultantId:
          raw.consultantId,
        leadId:
          raw.convertedFromLead?.id,
        status:
          clientStatusToDomain[raw.status],
        tags:
          [...raw.tags],
        notes:
          raw.notes ?? undefined,
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      client,
    }: ClientPersistenceInput): Prisma.ClientUncheckedCreateInput {
      return {
        id: client.id,
        workspaceId,
        type:
          personTypeToPrisma[client.type],
        name: client.name,
        email: client.email,
        phone: client.phone,
        document: client.document,
        birthDate:
          client.birthDate
            ? new Date(client.birthDate)
            : null,
        companyName:
          client.companyName ?? null,
        tradeName:
          client.tradeName ?? null,
        stateRegistration:
          client.stateRegistration ?? null,
        addressStreet:
          client.address.street,
        addressNumber:
          client.address.number,
        addressComplement:
          client.address.complement ?? null,
        addressNeighborhood:
          client.address.neighborhood,
        addressCity:
          client.address.city,
        addressState:
          client.address.state,
        addressZipCode:
          client.address.zipCode,
        consultantId:
          client.consultantId,
        status:
          clientStatusToPrisma[client.status],
        tags:
          [...client.tags],
        notes:
          client.notes ?? null,
        createdAt:
          new Date(client.createdAt),
        updatedAt:
          new Date(client.updatedAt),
        convertedFromLead:
          client.leadId
            ? {
                connect: {
                  id: client.leadId,
                },
              }
            : undefined,
      }
    }
  }