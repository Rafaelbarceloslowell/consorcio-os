import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import type {
    PrismaClient,
  } from "@/lib/generated/prisma/client"
  
  import type {
    CommitJourneyTransitionInput,
  } from "@/repositories/commercial/commercial-repository"
  
  vi.mock(
    "@/infrastructure/prisma/client",
    () => ({
      prisma: {},
    }),
  )
  
  vi.mock(
    "@/infrastructure/prisma/mappers/commercial-journey-mapper",
    () => ({
      CommercialJourneyMapper: {
        toPersistence: vi.fn(
          ({
            workspaceId,
            journey,
          }: {
            workspaceId: string
            journey: CommitJourneyTransitionInput["journey"]
          }) => ({
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
              journey.consortiumType,
  
            currentPhaseId:
              journey.currentPhaseId,
  
            currentStateId:
              journey.currentStateId,
  
            priority:
              journey.priority,
  
            score:
              journey.score,
  
            outcome:
              journey.outcome,
  
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
          }),
        ),
  
        toDomain: vi.fn(
          (journey) =>
            journey,
        ),
      },
    }),
  )
  
  vi.mock(
    "@/infrastructure/prisma/mappers/commercial-event-mapper",
    () => ({
      CommercialEventMapper: {
        toPersistence: vi.fn(
          ({
            workspaceId,
            event,
          }: {
            workspaceId: string
            event: CommitJourneyTransitionInput["event"]
          }) => ({
            ...event,
  
            workspaceId,
  
            occurredAt:
              new Date(
                event.occurredAt,
              ),
  
            createdAt:
              new Date(
                event.createdAt,
              ),
  
            updatedAt:
              new Date(
                event.updatedAt,
              ),
          }),
        ),
  
        toDomain: vi.fn(
          (event) =>
            event,
        ),
      },
    }),
  )
  
  vi.mock(
    "@/infrastructure/prisma/mappers/next-best-action-mapper",
    () => ({
      NextBestActionMapper: {
        toPersistence: vi.fn(),
        toDomain: vi.fn(),
      },
    }),
  )
  
  import {
    CommercialJourneyConcurrencyError,
  } from "@/infrastructure/prisma/errors/commercial-journey-concurrency-error"
  
  import {
    PrismaCommercialTransactionRepository,
  } from "./prisma-commercial-transaction-repository"
  
  type CommercialJourneyDelegateMock = {
    findUnique: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  
  type CommercialEventDelegateMock = {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  
  type NextBestActionDelegateMock = {
    findMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  
  type TransactionMock = {
    commercialJourney:
      CommercialJourneyDelegateMock
  
    commercialEvent:
      CommercialEventDelegateMock
  
    nextBestAction:
      NextBestActionDelegateMock
  }
  
  type DatabaseMock = {
    $transaction:
      ReturnType<typeof vi.fn>
  }
  
  const workspaceId =
    "workspace-1"
  
  const journey: CommitJourneyTransitionInput["journey"] = {
    id:
      "journey-1",
  
    workspaceId,
  
    leadId:
      "lead-1",
  
    clientId:
      null,
  
    consultantId:
      "consultant-1",
  
    title:
      "Consórcio de imóvel",
  
    consortiumType:
      "real_estate",
  
    currentPhaseId:
      "phase-2",
  
    currentStateId:
      "state-2",
  
    priority:
      "HIGH",
  
    score:
      90,
  
    outcome:
      null,
  
    stateEnteredAt:
      "2026-07-24T15:00:00.000Z",
  
    lastInteractionAt:
      "2026-07-24T15:00:00.000Z",
  
    closedAt:
      null,
  
    version:
      2,
  
    createdAt:
      "2026-07-24T14:00:00.000Z",
  
    updatedAt:
      "2026-07-24T15:00:00.000Z",
  }
  
  const event: CommitJourneyTransitionInput["event"] = {
    id:
      "event-1",
  
    workspaceId,
  
    journeyId:
      journey.id,
  
    type:
      "STATE_CHANGED",
  
    actorType:
      "SYSTEM",
  
    actorId:
      null,
  
    payload: {
      previousStateId:
        "state-1",
  
      targetStateId:
        "state-2",
    },
  
    occurredAt:
      "2026-07-24T15:00:00.000Z",
  
    createdAt:
      "2026-07-24T15:00:00.000Z",
  
    updatedAt:
      "2026-07-24T15:00:00.000Z",
  }
  
  function createTransactionMock(): TransactionMock {
    return {
      commercialJourney: {
        findUnique:
          vi.fn(),
  
        updateMany:
          vi.fn(),
      },
  
      commercialEvent: {
        findUnique:
          vi.fn(),
  
        create:
          vi.fn(),
      },
  
      nextBestAction: {
        findMany:
          vi.fn(),
  
        deleteMany:
          vi.fn(),
  
        create:
          vi.fn(),
      },
    }
  }
  
  function createDatabaseMock(): {
    database:
      PrismaClient
  
    databaseMock:
      DatabaseMock
  
    transactionMock:
      TransactionMock
  } {
    const transactionMock =
      createTransactionMock()
  
    const databaseMock: DatabaseMock = {
      $transaction:
        vi.fn(
          async (
            operation: (
              transaction: TransactionMock,
            ) => unknown,
          ) =>
            operation(
              transactionMock,
            ),
        ),
    }
  
    return {
      database:
        databaseMock as unknown as PrismaClient,
  
      databaseMock,
  
      transactionMock,
    }
  }
  
  describe(
    "PrismaCommercialTransactionRepository",
    () => {
      let database:
        PrismaClient
  
      let databaseMock:
        DatabaseMock
  
      let transactionMock:
        TransactionMock
  
      let repository:
        PrismaCommercialTransactionRepository
  
      beforeEach(() => {
        vi.clearAllMocks()
  
        const mocks =
          createDatabaseMock()
  
        database =
          mocks.database
  
        databaseMock =
          mocks.databaseMock
  
        transactionMock =
          mocks.transactionMock
  
        repository =
          new PrismaCommercialTransactionRepository(
            workspaceId,
            database,
          )
      })
  
      it(
        "deve rejeitar um workspaceId vazio",
        () => {
          expect(
            () =>
              new PrismaCommercialTransactionRepository(
                "   ",
                database,
              ),
          ).toThrowError(
            "O workspaceId do repositório de transações comerciais não pode estar vazio.",
          )
        },
      )
  
      it(
        "deve rejeitar uma jornada de outro workspace antes de abrir a transação",
        async () => {
          await expect(
            repository
              .commitJourneyTransition({
                journey: {
                  ...journey,
  
                  workspaceId:
                    "workspace-2",
                },
  
                event,
              }),
          ).rejects.toThrowError(
            `A jornada comercial "${journey.id}" pertence a outro workspace.`,
          )
  
          expect(
            databaseMock.$transaction,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar um evento vinculado a outra jornada antes de abrir a transação",
        async () => {
          await expect(
            repository
              .commitJourneyTransition({
                journey,
  
                event: {
                  ...event,
  
                  journeyId:
                    "journey-2",
                },
              }),
          ).rejects.toThrowError(
            `O evento comercial "${event.id}" não pertence à jornada "${journey.id}".`,
          )
  
          expect(
            databaseMock.$transaction,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar um evento de outro workspace antes de abrir a transação",
        async () => {
          await expect(
            repository
              .commitJourneyTransition({
                journey,
  
                event: {
                  ...event,
  
                  workspaceId:
                    "workspace-2",
                },
              }),
          ).rejects.toThrowError(
            `O evento comercial "${event.id}" não pertence ao mesmo workspace da jornada "${journey.id}".`,
          )
  
          expect(
            databaseMock.$transaction,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma versão inválida antes de abrir a transação",
        async () => {
          await expect(
            repository
              .commitJourneyTransition({
                journey: {
                  ...journey,
  
                  version:
                    1,
                },
  
                event,
              }),
          ).rejects.toThrowError(
            `A versão da jornada comercial "${journey.id}" é inválida: 1.`,
          )
  
          expect(
            databaseMock.$transaction,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve persistir a jornada com compare-and-swap e criar o evento",
        async () => {
          const updatedJourneyRecord = {
            ...journey,
          }
  
          const createdEventRecord = {
            ...event,
          }
  
          transactionMock
            .commercialJourney
            .findUnique
            .mockResolvedValueOnce({
              id:
                journey.id,
  
              workspaceId,
  
              version:
                1,
            })
            .mockResolvedValueOnce(
              updatedJourneyRecord,
            )
  
          transactionMock
            .commercialEvent
            .findUnique
            .mockResolvedValue(
              null,
            )
  
          transactionMock
            .commercialJourney
            .updateMany
            .mockResolvedValue({
              count:
                1,
            })
  
          transactionMock
            .commercialEvent
            .create
            .mockResolvedValue(
              createdEventRecord,
            )
  
          const result =
            await repository
              .commitJourneyTransition({
                journey,
  
                event,
              })
  
          expect(
            transactionMock
              .commercialJourney
              .updateMany,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              where: {
                id:
                  journey.id,
  
                workspaceId,
  
                version:
                  1,
              },
  
              data:
                expect.objectContaining({
                  version:
                    2,
  
                  currentStateId:
                    journey.currentStateId,
                }),
            }),
          )
  
          expect(
            transactionMock
              .commercialEvent
              .create,
          ).toHaveBeenCalledTimes(
            1,
          )
  
          expect(result).toEqual({
            journey:
              updatedJourneyRecord,
  
            event:
              createdEventRecord,
          })
        },
      )
  
      it(
        "deve rejeitar um evento duplicado sem atualizar a jornada",
        async () => {
          transactionMock
            .commercialJourney
            .findUnique
            .mockResolvedValue({
              id:
                journey.id,
  
              workspaceId,
  
              version:
                1,
            })
  
          transactionMock
            .commercialEvent
            .findUnique
            .mockResolvedValue({
              id:
                event.id,
            })
  
          await expect(
            repository
              .commitJourneyTransition({
                journey,
  
                event,
              }),
          ).rejects.toThrowError(
            `Já existe um evento comercial com o ID "${event.id}".`,
          )
  
          expect(
            transactionMock
              .commercialJourney
              .updateMany,
          ).not.toHaveBeenCalled()
  
          expect(
            transactionMock
              .commercialEvent
              .create,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve lançar CommercialJourneyConcurrencyError quando o CAS não atualizar nenhum registro",
        async () => {
          transactionMock
            .commercialJourney
            .findUnique
            .mockResolvedValueOnce({
              id:
                journey.id,
  
              workspaceId,
  
              version:
                1,
            })
            .mockResolvedValueOnce({
              workspaceId,
  
              version:
                3,
            })
  
          transactionMock
            .commercialEvent
            .findUnique
            .mockResolvedValue(
              null,
            )
  
          transactionMock
            .commercialJourney
            .updateMany
            .mockResolvedValue({
              count:
                0,
            })
  
          const operation =
            repository
              .commitJourneyTransition({
                journey,
  
                event,
              })
  
          await expect(
            operation,
          ).rejects.toMatchObject({
            name:
              "CommercialJourneyConcurrencyError",
  
            workspaceId,
  
            journeyId:
              journey.id,
  
            expectedVersion:
              1,
  
            currentVersion:
              3,
          })
  
          await expect(
            operation,
          ).rejects.toBeInstanceOf(
            CommercialJourneyConcurrencyError,
          )
  
          expect(
            transactionMock
              .commercialEvent
              .create,
          ).not.toHaveBeenCalled()
        },
      )
    },
  )