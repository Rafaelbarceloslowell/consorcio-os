import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    WorkflowRule,
  } from "@/types/domain"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    WorkflowRuleMapper,
  } from "@/infrastructure/prisma/mappers/workflow-rule-mapper"
  
  export class PrismaWorkflowRuleRepository {
    constructor(
      private readonly workspaceId: string,
      private readonly database: PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositorio de regras de workflow nao pode estar vazio.",
        )
      }
    }
  
    async findAll(): Promise<WorkflowRule[]> {
      const rules =
        await this.database.workflowRule.findMany({
          where: {
            OR: [
              {
                workspaceId:
                  this.workspaceId,
              },
              {
                workspaceId: null,
              },
            ],
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return rules.map((rule) =>
        WorkflowRuleMapper.toDomain(
          rule,
        ),
      )
    }
  
    async findActive(): Promise<WorkflowRule[]> {
      const rules =
        await this.database.workflowRule.findMany({
          where: {
            isActive: true,
  
            OR: [
              {
                workspaceId:
                  this.workspaceId,
              },
              {
                workspaceId: null,
              },
            ],
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        })
  
      return rules.map((rule) =>
        WorkflowRuleMapper.toDomain(
          rule,
        ),
      )
    }
  
    async findById(
      ruleId: string,
    ): Promise<WorkflowRule | undefined> {
      if (!ruleId.trim()) {
        return undefined
      }
  
      const rule =
        await this.database.workflowRule.findFirst({
          where: {
            id: ruleId,
  
            OR: [
              {
                workspaceId:
                  this.workspaceId,
              },
              {
                workspaceId: null,
              },
            ],
          },
        })
  
      if (!rule) {
        return undefined
      }
  
      return WorkflowRuleMapper.toDomain(
        rule,
      )
    }
  
    async create(
      rule: WorkflowRule,
    ): Promise<WorkflowRule> {
      this.validateRuleWorkspace(
        rule,
      )
  
      const createdRule =
        await this.database.workflowRule.create({
          data: WorkflowRuleMapper.toPersistence({
            rule,
          }),
        })
  
      return WorkflowRuleMapper.toDomain(
        createdRule,
      )
    }
  
    async update(
      rule: WorkflowRule,
    ): Promise<WorkflowRule | undefined> {
      this.validateRuleWorkspace(
        rule,
      )
  
      return this.database.$transaction(
        async (transaction) => {
          const existingRule =
            await transaction.workflowRule.findFirst({
              where: {
                id: rule.id,
  
                workspaceId:
                  rule.workspaceId,
              },
              select: {
                id: true,
              },
            })
  
          if (!existingRule) {
            return undefined
          }
  
          const updatedRule =
            await transaction.workflowRule.update({
              where: {
                id: existingRule.id,
              },
              data: WorkflowRuleMapper.toPersistence({
                rule,
              }),
            })
  
          return WorkflowRuleMapper.toDomain(
            updatedRule,
          )
        },
      )
    }
  
    async delete(
      ruleId: string,
    ): Promise<boolean> {
      if (!ruleId.trim()) {
        return false
      }
  
      const result =
        await this.database.workflowRule.deleteMany({
          where: {
            id: ruleId,
            workspaceId:
              this.workspaceId,
          },
        })
  
      return result.count > 0
    }
  
    private validateRuleWorkspace(
      rule: WorkflowRule,
    ): void {
      if (
        rule.workspaceId !== null &&
        rule.workspaceId !== this.workspaceId
      ) {
        throw new Error(
          "A regra de workflow pertence a outro workspace.",
        )
      }
    }
  }