import type {
    Prisma,
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Meeting,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    MeetingMapper,
  } from "@/infrastructure/prisma/mappers/meeting-mapper"
  
  type MeetingTransactionClient =
    Prisma.TransactionClient
  
  export class PrismaMeetingRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de reuniões não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Meeting[]> {
      const meetings =
        await this.database.meeting.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: {
            startAt: "asc",
          },
        })
  
      return meetings.map((meeting) =>
        MeetingMapper.toDomain(meeting),
      )
    }
  
    async findById(
      meetingId: string,
    ): Promise<Meeting | undefined> {
      if (!meetingId.trim()) {
        return undefined
      }
  
      const meeting =
        await this.database.meeting.findFirst({
          where: {
            id: meetingId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!meeting) {
        return undefined
      }
  
      return MeetingMapper.toDomain(
        meeting,
      )
    }
  
    async create(
      meeting: Meeting,
    ): Promise<Meeting> {
      return this.database.$transaction(
        async (transaction) => {
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            meeting,
          })
  
          const createdMeeting =
            await transaction.meeting.create({
              data: MeetingMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                meeting,
              }),
            })
  
          return MeetingMapper.toDomain(
            createdMeeting,
          )
        },
      )
    }
  
    async update(
      meeting: Meeting,
    ): Promise<Meeting | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingMeeting =
            await transaction.meeting.findFirst({
              where: {
                id: meeting.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingMeeting) {
            return undefined
          }
  
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            meeting,
          })
  
          const updatedMeeting =
            await transaction.meeting.update({
              where: {
                id: existingMeeting.id,
              },
              data: MeetingMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                meeting,
              }),
            })
  
          return MeetingMapper.toDomain(
            updatedMeeting,
          )
        },
      )
    }
  
    async delete(
      meetingId: string,
    ): Promise<boolean> {
      if (!meetingId.trim()) {
        return false
      }
  
      const result =
        await this.database.meeting.deleteMany({
          where: {
            id: meetingId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private async ensureRelationshipsBelongToWorkspace({
      transaction,
      meeting,
    }: {
      transaction: MeetingTransactionClient
      meeting: Meeting
    }): Promise<void> {
      await Promise.all([
        this.ensureConsultantBelongsToWorkspace({
          transaction,
          consultantId:
            meeting.consultantId,
        }),
  
        this.ensureLeadBelongsToWorkspace({
          transaction,
          leadId: meeting.leadId,
        }),
  
        this.ensureClientBelongsToWorkspace({
          transaction,
          clientId: meeting.clientId,
        }),
  
        this.ensureProposalBelongsToWorkspace({
          transaction,
          proposalId:
            meeting.proposalId,
        }),
      ])
    }
  
    private async ensureConsultantBelongsToWorkspace({
      transaction,
      consultantId,
    }: {
      transaction: MeetingTransactionClient
      consultantId: string
    }): Promise<void> {
      if (!consultantId.trim()) {
        throw new Error(
          "O consultantId da reunião não pode estar vazio.",
        )
      }
  
      const consultant =
        await transaction.consultant.findFirst({
          where: {
            id: consultantId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!consultant) {
        throw new Error(
          "O consultor informado não pertence ao workspace da reunião.",
        )
      }
    }
  
    private async ensureLeadBelongsToWorkspace({
      transaction,
      leadId,
    }: {
      transaction: MeetingTransactionClient
      leadId: string | undefined
    }): Promise<void> {
      if (!leadId) {
        return
      }
  
      const lead =
        await transaction.lead.findFirst({
          where: {
            id: leadId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!lead) {
        throw new Error(
          "O lead informado não pertence ao workspace da reunião.",
        )
      }
    }
  
    private async ensureClientBelongsToWorkspace({
      transaction,
      clientId,
    }: {
      transaction: MeetingTransactionClient
      clientId: string | undefined
    }): Promise<void> {
      if (!clientId) {
        return
      }
  
      const client =
        await transaction.client.findFirst({
          where: {
            id: clientId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!client) {
        throw new Error(
          "O cliente informado não pertence ao workspace da reunião.",
        )
      }
    }
  
    private async ensureProposalBelongsToWorkspace({
      transaction,
      proposalId,
    }: {
      transaction: MeetingTransactionClient
      proposalId: string | undefined
    }): Promise<void> {
      if (!proposalId) {
        return
      }
  
      const proposal =
        await transaction.proposal.findFirst({
          where: {
            id: proposalId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!proposal) {
        throw new Error(
          "A proposta informada não pertence ao workspace da reunião.",
        )
      }
    }
  }