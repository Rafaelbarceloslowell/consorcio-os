import type {
  Client,
  Consortium,
  Consultant,
  Lead,
  Meeting,
  PipelineStage,
  Proposal,
  Sale,
  Task,
} from "@/types/domain"

export interface AsyncEntityRepository<
  Entity,
> {
  findAll(): Promise<Entity[]>

  findById(
    id: string,
  ): Promise<Entity | undefined>

  create(
    entity: Entity,
  ): Promise<Entity>

  update(
    entity: Entity,
  ): Promise<Entity | undefined>

  delete(
    id: string,
  ): Promise<boolean>
}

export interface AsyncReadOnlyEntityRepository<
  Entity,
> {
  findAll(): Promise<Entity[]>

  findById(
    id: string,
  ): Promise<Entity | undefined>
}

export interface AsyncCrmRepositories {
  leads:
    AsyncEntityRepository<Lead>

  clients:
    AsyncEntityRepository<Client>

  consultants:
    AsyncReadOnlyEntityRepository<Consultant>

  pipelineStages:
    AsyncReadOnlyEntityRepository<PipelineStage>

  meetings:
    AsyncEntityRepository<Meeting>

  consortiums:
    AsyncReadOnlyEntityRepository<Consortium>

  proposals:
    AsyncEntityRepository<Proposal>

  sales:
    AsyncEntityRepository<Sale>

  tasks:
    AsyncEntityRepository<Task>
}