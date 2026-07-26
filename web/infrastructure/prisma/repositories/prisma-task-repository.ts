import type {
    Prisma,
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Task,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    TaskMapper,
  } from "@/infrastructure/prisma/mappers/task-mapper"
  
  type TaskTransactionClient =
    Prisma.TransactionClient
  
  export class PrismaTaskRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de tarefas não pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<Task[]> {
      const tasks =
        await this.database.task.findMany({
          where: {
            workspaceId: this.workspaceId,
          },
          orderBy: [
            {
              dueAt: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return tasks.map((task) =>
        TaskMapper.toDomain(task),
      )
    }
  
    async findById(
      taskId: string,
    ): Promise<Task | undefined> {
      if (!taskId.trim()) {
        return undefined
      }
  
      const task =
        await this.database.task.findFirst({
          where: {
            id: taskId,
            workspaceId: this.workspaceId,
          },
        })
  
      if (!task) {
        return undefined
      }
  
      return TaskMapper.toDomain(task)
    }
  
    async create(
      task: Task,
    ): Promise<Task> {
      return this.database.$transaction(
        async (transaction) => {
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            task,
          })
  
          const createdTask =
            await transaction.task.create({
              data: TaskMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                task,
              }),
            })
  
          return TaskMapper.toDomain(
            createdTask,
          )
        },
      )
    }
  
    async update(
      task: Task,
    ): Promise<Task | undefined> {
      return this.database.$transaction(
        async (transaction) => {
          const existingTask =
            await transaction.task.findFirst({
              where: {
                id: task.id,
                workspaceId:
                  this.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingTask) {
            return undefined
          }
  
          await this.ensureRelationshipsBelongToWorkspace({
            transaction,
            task,
          })
  
          const updatedTask =
            await transaction.task.update({
              where: {
                id: existingTask.id,
              },
              data: TaskMapper.toPersistence({
                workspaceId:
                  this.workspaceId,
                task,
              }),
            })
  
          return TaskMapper.toDomain(
            updatedTask,
          )
        },
      )
    }
  
    async delete(
      taskId: string,
    ): Promise<boolean> {
      if (!taskId.trim()) {
        return false
      }
  
      const result =
        await this.database.task.deleteMany({
          where: {
            id: taskId,
            workspaceId: this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private async ensureRelationshipsBelongToWorkspace({
      transaction,
      task,
    }: {
      transaction: TaskTransactionClient
      task: Task
    }): Promise<void> {
      await Promise.all([
        this.ensureAssignedConsultantBelongsToWorkspace({
          transaction,
          assignedToId:
            task.assignedToId,
        }),
  
        this.ensureLeadBelongsToWorkspace({
          transaction,
          leadId:
            task.leadId,
        }),
  
        this.ensureClientBelongsToWorkspace({
          transaction,
          clientId:
            task.clientId,
        }),
  
        this.ensureMeetingBelongsToWorkspace({
          transaction,
          meetingId:
            task.meetingId,
        }),
  
        this.ensureProposalBelongsToWorkspace({
          transaction,
          proposalId:
            task.proposalId,
        }),
      ])
    }
  
    private async ensureAssignedConsultantBelongsToWorkspace({
      transaction,
      assignedToId,
    }: {
      transaction: TaskTransactionClient
      assignedToId: string
    }): Promise<void> {
      if (!assignedToId.trim()) {
        throw new Error(
          "O assignedToId da tarefa não pode estar vazio.",
        )
      }
  
      const consultant =
        await transaction.consultant.findFirst({
          where: {
            id: assignedToId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!consultant) {
        throw new Error(
          "O consultor responsável pela tarefa não pertence ao workspace.",
        )
      }
    }
  
    private async ensureLeadBelongsToWorkspace({
      transaction,
      leadId,
    }: {
      transaction: TaskTransactionClient
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
          "O lead informado não pertence ao workspace da tarefa.",
        )
      }
    }
  
    private async ensureClientBelongsToWorkspace({
      transaction,
      clientId,
    }: {
      transaction: TaskTransactionClient
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
          "O cliente informado não pertence ao workspace da tarefa.",
        )
      }
    }
  
    private async ensureMeetingBelongsToWorkspace({
      transaction,
      meetingId,
    }: {
      transaction: TaskTransactionClient
      meetingId: string | undefined
    }): Promise<void> {
      if (!meetingId) {
        return
      }
  
      const meeting =
        await transaction.meeting.findFirst({
          where: {
            id: meetingId,
            workspaceId: this.workspaceId,
          },
          select: {
            id: true,
          },
        })
  
      if (!meeting) {
        throw new Error(
          "A reunião informada não pertence ao workspace da tarefa.",
        )
      }
    }
  
    private async ensureProposalBelongsToWorkspace({
      transaction,
      proposalId,
    }: {
      transaction: TaskTransactionClient
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
          "A proposta informada não pertence ao workspace da tarefa.",
        )
      }
    }
  }