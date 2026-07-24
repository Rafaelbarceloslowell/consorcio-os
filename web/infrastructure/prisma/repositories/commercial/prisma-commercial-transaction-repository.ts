import type {
    Prisma,
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    AsyncCommercialTransactionRepository,
  } from "@/repositories/commercial/async-commercial-repositories"
  
  import type {
    CommitJourneyTransitionInput,
    CommitJourneyTransitionResult,
    ReplaceOpenNextBestActionsInput,
    ReplaceOpenNextBestActionsResult,
  } from "@/repositories/commercial/commercial-repository"
  
  import {
    prisma,
  } from "@/infrastructure/prisma/client"
  
  import {
    CommercialJourneyConcurrencyError,
  } from "@/infrastructure/prisma/errors/commercial-journey-concurrency-error"
  
  import {
    CommercialEventMapper,
  } from "@/infrastructure/prisma/mappers/commercial-event-mapper"
  
  import {
    CommercialJourneyMapper,
  } from "@/infrastructure/prisma/mappers/commercial-journey-mapper"
  
  import {
    NextBestActionMapper,
  } from "@/infrastructure/prisma/mappers/next-best-action-mapper"
  
  function buildJourneyUpdateData({
    workspaceId,
    journey,
  }: {
    workspaceId: string
    journey: CommitJourneyTransitionInput["journey"]
  }): Prisma.CommercialJourneyUncheckedUpdateManyInput {
    const persistence =
      CommercialJourneyMapper.toPersistence({
        workspaceId,
  
        journey,
      })
  
    const {
      id: _id,
      workspaceId: _workspaceId,
      createdAt: _createdAt,
      ...updateData
    } = persistence
  
    return updateData
  }
  
  export class PrismaCommercialTransactionRepository
    implements AsyncCommercialTransactionRepository
  {
    constructor(
      private readonly workspaceId:
        string,
  
      private readonly database:
        PrismaClient = prisma,
    ) {
      if (!workspaceId.trim()) {
        throw new Error(
          "O workspaceId do repositório de transações comerciais não pode estar vazio.",
        )
      }
    }
  
    async commitJourneyTransition(
      {
        journey,
        event,
      }: CommitJourneyTransitionInput,
    ): Promise<CommitJourneyTransitionResult> {
      if (
        journey.workspaceId !==
        this.workspaceId
      ) {
        throw new Error(
          `A jornada comercial "${journey.id}" pertence a outro workspace.`,
        )
      }
  
      if (
        event.journeyId !==
        journey.id
      ) {
        throw new Error(
          `O evento comercial "${event.id}" não pertence à jornada "${journey.id}".`,
        )
      }
  
      if (
        event.workspaceId !==
        journey.workspaceId
      ) {
        throw new Error(
          `O evento comercial "${event.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
        )
      }
  
      const expectedVersion =
        journey.version - 1
  
      if (
        !Number.isInteger(
          journey.version,
        ) ||
        !Number.isInteger(
          expectedVersion,
        ) ||
        expectedVersion < 1
      ) {
        throw new Error(
          `A versão da jornada comercial "${journey.id}" é inválida: ${journey.version}.`,
        )
      }
  
      return this.database.$transaction(
        async (transaction) => {
          const existingJourney =
            await transaction
              .commercialJourney
              .findUnique({
                where: {
                  id:
                    journey.id,
                },
  
                select: {
                  id:
                    true,
  
                  workspaceId:
                    true,
  
                  version:
                    true,
                },
              })
  
          if (!existingJourney) {
            throw new Error(
              `Jornada comercial não encontrada para o ID "${journey.id}".`,
            )
          }
  
          if (
            existingJourney.workspaceId !==
            this.workspaceId
          ) {
            throw new Error(
              `A jornada comercial "${journey.id}" pertence a outro workspace.`,
            )
          }
  
          const duplicatedEvent =
            await transaction
              .commercialEvent
              .findUnique({
                where: {
                  id:
                    event.id,
                },
  
                select: {
                  id:
                    true,
                },
              })
  
          if (duplicatedEvent) {
            throw new Error(
              `Já existe um evento comercial com o ID "${event.id}".`,
            )
          }
  
          const updateResult =
            await transaction
              .commercialJourney
              .updateMany({
                where: {
                  id:
                    journey.id,
  
                  workspaceId:
                    this.workspaceId,
  
                  version:
                    expectedVersion,
                },
  
                data:
                  buildJourneyUpdateData({
                    workspaceId:
                      this.workspaceId,
  
                    journey,
                  }),
              })
  
          if (
            updateResult.count !==
            1
          ) {
            const currentJourney =
              await transaction
                .commercialJourney
                .findUnique({
                  where: {
                    id:
                      journey.id,
                  },
  
                  select: {
                    workspaceId:
                      true,
  
                    version:
                      true,
                  },
                })
  
            if (!currentJourney) {
              throw new Error(
                `A jornada comercial "${journey.id}" não existe mais.`,
              )
            }
  
            if (
              currentJourney.workspaceId !==
              this.workspaceId
            ) {
              throw new Error(
                `A jornada comercial "${journey.id}" pertence a outro workspace.`,
              )
            }
  
            throw new CommercialJourneyConcurrencyError({
              journeyId:
                journey.id,
  
              workspaceId:
                this.workspaceId,
  
              expectedVersion,
  
              currentVersion:
                currentJourney.version,
            })
          }
  
          const createdEvent =
            await transaction
              .commercialEvent
              .create({
                data:
                  CommercialEventMapper.toPersistence({
                    workspaceId:
                      this.workspaceId,
  
                    event,
                  }),
              })
  
          const updatedJourney =
            await transaction
              .commercialJourney
              .findUnique({
                where: {
                  id:
                    journey.id,
                },
              })
  
          if (!updatedJourney) {
            throw new Error(
              `A jornada comercial "${journey.id}" não foi encontrada após a atualização.`,
            )
          }
  
          return {
            journey:
              CommercialJourneyMapper.toDomain(
                updatedJourney,
              ),
  
            event:
              CommercialEventMapper.toDomain(
                createdEvent,
              ),
          }
        },
      )
    }
  
    async replaceOpenNextBestActions(
      {
        workspaceId,
        journeyId,
        nextBestActions,
      }: ReplaceOpenNextBestActionsInput,
    ): Promise<ReplaceOpenNextBestActionsResult> {
      if (
        workspaceId !==
        this.workspaceId
      ) {
        throw new Error(
          `O workspace "${workspaceId}" não corresponde ao workspace deste repositório.`,
        )
      }
  
      const duplicatedInputIds =
        nextBestActions
          .map(
            (nextBestAction) =>
              nextBestAction.id,
          )
          .filter(
            (
              nextBestActionId,
              index,
              ids,
            ) =>
              ids.indexOf(
                nextBestActionId,
              ) !== index,
          )
  
      if (
        duplicatedInputIds.length >
        0
      ) {
        throw new Error(
          `Existem recomendações duplicadas na substituição: ${[
            ...new Set(
              duplicatedInputIds,
            ),
          ].join(", ")}.`,
        )
      }
  
      for (
        const nextBestAction of
          nextBestActions
      ) {
        if (
          nextBestAction.workspaceId !==
          workspaceId
        ) {
          throw new Error(
            `A recomendação comercial "${nextBestAction.id}" pertence a outro workspace.`,
          )
        }
  
        if (
          nextBestAction.journeyId !==
          journeyId
        ) {
          throw new Error(
            `A recomendação comercial "${nextBestAction.id}" não pertence à jornada "${journeyId}".`,
          )
        }
      }
  
      return this.database.$transaction(
        async (transaction) => {
          const journey =
            await transaction
              .commercialJourney
              .findUnique({
                where: {
                  id:
                    journeyId,
                },
  
                select: {
                  id:
                    true,
  
                  workspaceId:
                    true,
                },
              })
  
          if (!journey) {
            throw new Error(
              `Jornada comercial não encontrada para o ID "${journeyId}".`,
            )
          }
  
          if (
            journey.workspaceId !==
            workspaceId
          ) {
            throw new Error(
              `A jornada comercial "${journey.id}" pertence a outro workspace.`,
            )
          }
  
          const inputIds =
            nextBestActions.map(
              (nextBestAction) =>
                nextBestAction.id,
            )
  
          if (
            inputIds.length >
            0
          ) {
            const duplicatedNextBestActions =
              await transaction
                .nextBestAction
                .findMany({
                  where: {
                    id: {
                      in:
                        inputIds,
                    },
                  },
  
                  select: {
                    id:
                      true,
                  },
                })
  
            if (
              duplicatedNextBestActions.length >
              0
            ) {
              const duplicatedIds =
                new Set(
                  duplicatedNextBestActions.map(
                    (nextBestAction) =>
                      nextBestAction.id,
                  ),
                )
  
              const duplicatedNextBestAction =
                nextBestActions.find(
                  (nextBestAction) =>
                    duplicatedIds.has(
                      nextBestAction.id,
                    ),
                )
  
              if (
                duplicatedNextBestAction
              ) {
                throw new Error(
                  `Já existe uma recomendação comercial com o ID "${duplicatedNextBestAction.id}".`,
                )
              }
            }
          }
  
          const currentJourneyNextBestActions =
            await transaction
              .nextBestAction
              .findMany({
                where: {
                  workspaceId,
  
                  journeyId,
                },
  
                orderBy: {
                  createdAt:
                    "asc",
                },
              })
  
          const preservedRecords =
            currentJourneyNextBestActions.filter(
              (nextBestAction) =>
                nextBestAction.acceptedAt !==
                  null ||
                nextBestAction.rejectedAt !==
                  null ||
                nextBestAction.executedActionId !==
                  null,
            )
  
          const removedRecords =
            currentJourneyNextBestActions.filter(
              (nextBestAction) =>
                nextBestAction.acceptedAt ===
                  null &&
                nextBestAction.rejectedAt ===
                  null &&
                nextBestAction.executedActionId ===
                  null,
            )
  
          await transaction
            .nextBestAction
            .deleteMany({
              where: {
                workspaceId,
  
                journeyId,
  
                acceptedAt:
                  null,
  
                rejectedAt:
                  null,
  
                executedActionId:
                  null,
              },
            })
  
          const createdRecords = []
  
          for (
            const nextBestAction of
              nextBestActions
          ) {
            const createdNextBestAction =
              await transaction
                .nextBestAction
                .create({
                  data:
                    NextBestActionMapper.toPersistence({
                      workspaceId,
  
                      nextBestAction,
                    }),
                })
  
            createdRecords.push(
              createdNextBestAction,
            )
          }
  
          const preservedNextBestActions =
            preservedRecords.map(
              (nextBestAction) =>
                NextBestActionMapper.toDomain(
                  nextBestAction,
                ),
            )
  
          const removedNextBestActions =
            removedRecords.map(
              (nextBestAction) =>
                NextBestActionMapper.toDomain(
                  nextBestAction,
                ),
            )
  
          const createdNextBestActions =
            createdRecords.map(
              (nextBestAction) =>
                NextBestActionMapper.toDomain(
                  nextBestAction,
                ),
            )
  
          return {
            preservedNextBestActions,
  
            removedNextBestActions,
  
            createdNextBestActions,
  
            nextBestActions: [
              ...preservedNextBestActions,
              ...createdNextBestActions,
            ],
          }
        },
      )
    }
  }