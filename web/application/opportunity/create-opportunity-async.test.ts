import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  Client,
  CommercialEvent,
  CommercialJourney,
  Consultant,
  JourneyPhase,
  JourneyState,
} from "@/types/domain"

import {
  CreateOpportunityAsync,
} from "./create-opportunity-async"

import type {
  CreateOpportunityAsyncDependencies,
  CreateOpportunityInput,
} from "./create-opportunity-async"

const workspaceId =
  "workspace-1"

const client: Client = {
  id: "client-1",
  type: "individual",
  name: "  Cliente Exemplo  ",
  email: "cliente@example.com",
  phone: "+5541999990000",
  document: "529.982.247-25",
  address: {
    street: "Rua Exemplo",
    number: "100",
    neighborhood: "Centro",
    city: "Curitiba",
    state: "PR",
    zipCode: "80000-000",
  },
  consultantId: "consultant-1",
  status: "active",
  tags: [],
  createdAt:
    "2026-07-01T00:00:00.000Z",
  updatedAt:
    "2026-07-01T00:00:00.000Z",
}

const consultants: Consultant[] = [
  {
    id: "consultant-1",
    name: "Consultora Original",
    email: "original@example.com",
    phone: "+5541999990001",
    document: "12345678901",
    role: "consultant",
    team: "Sul",
    region: "PR",
    status: "active",
    monthlySalesTarget: 10,
    monthlyLeadsTarget: 20,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
  },
  {
    id: "consultant-2",
    name: "Consultor Informado",
    email: "informado@example.com",
    phone: "+5541999990002",
    document: "10987654321",
    role: "consultant",
    team: "Sul",
    region: "PR",
    status: "active",
    monthlySalesTarget: 10,
    monthlyLeadsTarget: 20,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
  },
]

const phases: JourneyPhase[] = [
  {
    id: "phase-initial",
    workspaceId,
    code: "INITIAL",
    name: "Inicial",
    order: 1,
    isActive: true,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
  },
]

const states: JourneyState[] = [
  {
    id: "state-later",
    workspaceId,
    phaseId: "phase-initial",
    code: "LATER",
    name: "Posterior",
    order: 2,
    isInitial: true,
    isFinal: false,
    isWon: false,
    isLost: false,
    allowReopen: false,
    isActive: true,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
  },
  {
    id: "state-initial",
    workspaceId,
    phaseId: "phase-initial",
    code: "INITIAL",
    name: "Inicial",
    order: 1,
    isInitial: true,
    isFinal: false,
    isWon: false,
    isLost: false,
    allowReopen: false,
    isActive: true,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
  },
]

function createInput():
  CreateOpportunityInput {
  return {
    workspaceId,
    clientId: client.id,
    consortiumType:
      "real_estate",
  }
}

type RepositoryErrors = Partial<
  Record<
    | "clients"
    | "consultants"
    | "phases"
    | "states"
    | "journeys",
    Error
  >
>

function createDependencies({
  foundClient = client,
  foundConsultants =
    consultants,
  foundPhases = phases,
  foundStates = states,
  errors = {},
}: {
  foundClient?: Client | null
  foundConsultants?: Consultant[]
  foundPhases?: JourneyPhase[]
  foundStates?: JourneyState[]
  errors?: RepositoryErrors
} = {}) {
  const findClient =
    vi.fn(async () => {
      if (errors.clients) {
        throw errors.clients
      }

      return foundClient ??
        undefined
    })

  const findConsultant =
    vi.fn(
      async (consultantId: string) => {
        if (errors.consultants) {
          throw errors.consultants
        }

        return foundConsultants.find(
          (consultant) =>
            consultant.id ===
            consultantId,
        )
      },
    )

  const findPhases =
    vi.fn(async () => {
      if (errors.phases) {
        throw errors.phases
      }

      return [...foundPhases]
    })

  const findStates =
    vi.fn(async () => {
      if (errors.states) {
        throw errors.states
      }

      return [...foundStates]
    })

  const createJourney =
    vi.fn(
      async (
        journey:
          CommercialJourney,
      ) => {
        if (errors.journeys) {
          throw errors.journeys
        }

        return journey
      },
    )

  let dependencies:
    CreateOpportunityAsyncDependencies

  const commitJourneyCreation =
    vi.fn(
      async ({
        journey,
        event,
      }: {
        journey: CommercialJourney
        event: CommercialEvent
      }) => ({
        journey:
          await dependencies
            .journeys
            .create(journey),
        event,
      }),
    )

  dependencies = {
      clients: {
        findAll:
          vi.fn(async () => []),
        findById: findClient,
        create:
          vi.fn(async (value) =>
            value,
          ),
        update:
          vi.fn(async () =>
            undefined,
          ),
        delete:
          vi.fn(async () =>
            false,
          ),
      },
      consultants: {
        findAll:
          vi.fn(async () => [
            ...foundConsultants,
          ]),
        findById:
          findConsultant,
      },
      journeys: {
        findAll:
          vi.fn(async () => []),
        findById:
          vi.fn(async () =>
            undefined,
          ),
        findByLeadId:
          vi.fn(async () => []),
        findByClientId:
          vi.fn(async () => []),
        findByConsultantId:
          vi.fn(async () => []),
        create:
          createJourney,
        update:
          vi.fn(async () =>
            undefined,
          ),
        delete:
          vi.fn(async () =>
            false,
          ),
      },
      phases: {
        findAll: findPhases,
        findById:
          vi.fn(async () =>
            undefined,
          ),
        create:
          vi.fn(async (value) =>
            value,
          ),
        update:
          vi.fn(async () =>
            undefined,
          ),
        delete:
          vi.fn(async () =>
            false,
          ),
      },
      states: {
        findAll: findStates,
        findById:
          vi.fn(async () =>
            undefined,
          ),
        create:
          vi.fn(async (value) =>
            value,
          ),
        update:
          vi.fn(async () =>
            undefined,
          ),
        delete:
          vi.fn(async () =>
            false,
          ),
      },
      transactions: {
        commitJourneyCreation,
        commitJourneyTransition:
          vi.fn(async () => {
            throw new Error(
              "commitJourneyTransition não deveria ser chamado.",
            )
          }),
        replaceOpenNextBestActions:
          vi.fn(async () => {
            throw new Error(
              "replaceOpenNextBestActions não deveria ser chamado.",
            )
          }),
      },
    }

  return {
    dependencies,
    findClient,
    findConsultant,
    findPhases,
    findStates,
    createJourney,
    commitJourneyCreation,
  }
}

describe(
  "CreateOpportunityAsync",
  () => {
    it(
      "cria oportunidade com consultor herdado e valores padrão",
      async () => {
        const {
          dependencies,
          findConsultant,
          createJourney,
        } =
          createDependencies()

        const result =
          await new CreateOpportunityAsync(
            dependencies,
            {
              now:
                new Date(
                  "2026-07-26T18:00:00.000Z",
                ),
              generateId:
                () =>
                  "journey-new",
              generateEventId:
                () =>
                  "event-opportunity-created",
            },
          ).execute(
            createInput(),
          )

        expect(
          findConsultant,
        ).toHaveBeenCalledExactlyOnceWith(
          client.consultantId,
        )
        expect(
          result.opportunity,
        ).toEqual({
          id: "journey-new",
          workspaceId,
          leadId: null,
          clientId: client.id,
          consultantId:
            client.consultantId,
          title:
            "Oportunidade - Cliente Exemplo",
          consortiumType:
            "real_estate",
          currentPhaseId:
            "phase-initial",
          currentStateId:
            "state-initial",
          priority: "NORMAL",
          score: 0,
          outcome: null,
          stateEnteredAt:
            "2026-07-26T18:00:00.000Z",
          lastInteractionAt:
            null,
          closedAt: null,
          version: 1,
          createdAt:
            "2026-07-26T18:00:00.000Z",
          updatedAt:
            "2026-07-26T18:00:00.000Z",
        })
        expect(
          result.event,
        ).toEqual({
          id:
            "event-opportunity-created",
          workspaceId,
          journeyId:
            "journey-new",
          type:
            "OPPORTUNITY_CREATED",
          actorType:
            "SYSTEM",
          actorId: null,
          payload: {
            opportunityId:
              "journey-new",
            clientId:
              client.id,
            consultantId:
              client.consultantId,
            title:
              "Oportunidade - Cliente Exemplo",
            consortiumType:
              "real_estate",
            priority:
              "NORMAL",
            score: 0,
            phaseId:
              "phase-initial",
            stateId:
              "state-initial",
          },
          occurredAt:
            "2026-07-26T18:00:00.000Z",
          createdAt:
            "2026-07-26T18:00:00.000Z",
          updatedAt:
            "2026-07-26T18:00:00.000Z",
        })
        expect(
          createJourney,
        ).toHaveBeenCalledExactlyOnceWith(
          result.opportunity,
        )
        expect(
          "leads" in dependencies,
        ).toBe(false)
      },
    )

    it.each([
      "",
      "   ",
    ])(
      "exige workspaceId para o valor %j",
      async (invalidWorkspaceId) => {
        const {
          dependencies,
          findClient,
          findConsultant,
          findPhases,
          findStates,
          createJourney,
        } =
          createDependencies()

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute({
            ...createInput(),
            workspaceId:
              invalidWorkspaceId,
          }),
        ).rejects.toThrow(
          "O workspace é obrigatório para criar a oportunidade.",
        )

        expect(
          findClient,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          findPhases,
        ).not.toHaveBeenCalled()
        expect(
          findStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "normaliza workspaceId e clientId antes das consultas e persistência",
      async () => {
        const {
          dependencies,
          findClient,
          createJourney,
        } =
          createDependencies()

        const result =
          await new CreateOpportunityAsync(
            dependencies,
          ).execute({
            ...createInput(),
            workspaceId:
              "  workspace-1  ",
            clientId:
              "  client-1  ",
          })

        expect(
          findClient,
        ).toHaveBeenCalledExactlyOnceWith(
          "client-1",
        )
        expect(
          result.opportunity,
        ).toMatchObject({
          workspaceId:
            "workspace-1",
          clientId: "client-1",
        })
        expect(
          createJourney,
        ).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({
            workspaceId:
              "workspace-1",
            clientId: "client-1",
          }),
        )
      },
    )

    it(
      "usa o título padrão quando o título informado contém somente espaços",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const result =
          await new CreateOpportunityAsync(
            dependencies,
          ).execute({
            ...createInput(),
            title: "   ",
          })

        expect(
          result.opportunity.title,
        ).toBe(
          "Oportunidade - Cliente Exemplo",
        )
      },
    )

    it.each([
      {
        field: "consortiumType",
        value: "invalid-type",
        message:
          "O tipo de consórcio informado é inválido.",
      },
      {
        field: "priority",
        value: "CRITICAL",
        message:
          "A prioridade da oportunidade é inválida.",
      },
    ])(
      "rejeita $field inválido em runtime",
      async ({
        field,
        value,
        message,
      }) => {
        const {
          dependencies,
          findClient,
          findConsultant,
          findPhases,
          findStates,
          createJourney,
        } =
          createDependencies()

        const input =
          createInput()

        Reflect.set(
          input,
          field,
          value,
        )

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute(input),
        ).rejects.toThrow(message)

        expect(
          findClient,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          findPhases,
        ).not.toHaveBeenCalled()
        expect(
          findStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      -1,
      101,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      "rejeita score inválido %s antes de consultar repositories",
      async (score) => {
        const {
          dependencies,
          findClient,
          findConsultant,
          findPhases,
          findStates,
          createJourney,
        } =
          createDependencies()

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute({
            ...createInput(),
            score,
          }),
        ).rejects.toThrow(
          "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
        )

        expect(
          findClient,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          findPhases,
        ).not.toHaveBeenCalled()
        expect(
          findStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "usa consultor, título, prioridade e score informados",
      async () => {
        const {
          dependencies,
          findConsultant,
          createJourney,
        } =
          createDependencies()

        const result =
          await new CreateOpportunityAsync(
            dependencies,
          ).execute({
            ...createInput(),
            consultantId:
              "  consultant-2  ",
            title:
              "  Segunda oportunidade  ",
            priority: "HIGH",
            score: 84,
          })

        expect(
          result.opportunity,
        ).toMatchObject({
          consultantId:
            "consultant-2",
          title:
            "Segunda oportunidade",
          priority: "HIGH",
          score: 84,
        })
        expect(
          findConsultant,
        ).toHaveBeenCalledTimes(1)
        expect(
          findConsultant,
        ).toHaveBeenCalledWith(
          "consultant-2",
        )
        expect(
          createJourney,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            consultantId:
              "consultant-2",
          }),
        )
      },
    )

    it.each([
      "",
      "   ",
    ])(
      "exige clientId para o valor %j",
      async (clientId) => {
        const {
          dependencies,
          findClient,
          findConsultant,
          findPhases,
          findStates,
          createJourney,
        } =
          createDependencies()

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute({
            ...createInput(),
            clientId,
          }),
        ).rejects.toThrow(
          "O cliente é obrigatório para criar a oportunidade.",
        )
        expect(
          findClient,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          findPhases,
        ).not.toHaveBeenCalled()
        expect(
          findStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita cliente inexistente",
      async () => {
        const {
          dependencies,
          findConsultant,
          createJourney,
        } =
          createDependencies({
            foundClient:
              null,
          })

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toThrow(
          'Cliente não encontrado para o ID "client-1".',
        )
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita consultor inexistente",
      async () => {
        const {
          dependencies,
          findPhases,
          createJourney,
        } =
          createDependencies({
            foundConsultants: [],
          })

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toThrow(
          'Consultor não encontrado para o ID "consultant-1".',
        )
        expect(
          findPhases,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "seleciona estado inicial elegível de menor ordem e sua fase",
      async () => {
        const {
          dependencies,
        } =
          createDependencies({
            foundStates: [
              {
                ...states[0]!,
                id: "foreign",
                workspaceId:
                  "workspace-2",
                order: 0,
              },
              {
                ...states[0]!,
                id: "final",
                isFinal: true,
                order: 0,
              },
              {
                ...states[0]!,
                id: "inactive",
                isActive: false,
                order: 0,
              },
              {
                ...states[0]!,
                id: "not-initial",
                isInitial: false,
                order: 0,
              },
              ...states,
            ],
          })

        const result =
          await new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          )

        expect(
          result.opportunity
            .currentStateId,
        ).toBe("state-initial")
        expect(
          result.opportunity
            .currentPhaseId,
        ).toBe("phase-initial")
      },
    )

    it(
      "rejeita ausência de estado inicial sem persistir",
      async () => {
        const {
          dependencies,
          createJourney,
        } =
          createDependencies({
            foundStates: [],
          })

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toThrow(
          `Nenhum estado comercial inicial foi encontrado para o workspace "${workspaceId}".`,
        )
        expect(
          createJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita fase inicial ausente, inativa ou de outro workspace",
      async () => {
        const invalidPhases = [
          [],
          [
            {
              ...phases[0]!,
              isActive: false,
            },
          ],
          [
            {
              ...phases[0]!,
              workspaceId:
                "workspace-2",
            },
          ],
        ]

        for (
          const foundPhases
          of invalidPhases
        ) {
          const {
            dependencies,
            createJourney,
          } =
            createDependencies({
              foundPhases,
            })

          await expect(
            new CreateOpportunityAsync(
              dependencies,
            ).execute(
              createInput(),
            ),
          ).rejects.toThrow(
            'A fase comercial inicial vinculada ao estado "state-initial" não está disponível.',
          )
          expect(
            createJourney,
          ).not.toHaveBeenCalled()
        }
      },
    )

    it.each([
      "clients",
      "consultants",
      "phases",
      "states",
      "journeys",
    ] as const)(
      "propaga erro do repository %s",
      async (repository) => {
        const repositoryError =
          new Error(
            `Falha em ${repository}.`,
          )

        const {
          dependencies,
          createJourney,
        } =
          createDependencies({
            errors: {
              [repository]:
                repositoryError,
            },
          })

        await expect(
          new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          createJourney,
        ).toHaveBeenCalledTimes(
          repository ===
            "journeys"
            ? 1
            : 0,
        )
      },
    )

    it(
      "retorna exatamente a oportunidade devolvida pelo repository",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        let receivedOpportunity:
          CommercialJourney |
          undefined

        let returnedOpportunity:
          CommercialJourney |
          undefined

        dependencies.journeys.create =
          vi.fn(
            async (
              opportunity:
                CommercialJourney,
            ): Promise<CommercialJourney> => {
              receivedOpportunity =
                opportunity

              const persistedOpportunity:
                CommercialJourney = {
                ...opportunity,
                updatedAt:
                  "2026-07-26T19:00:00.000Z",
              }

              returnedOpportunity =
                persistedOpportunity

              return persistedOpportunity
            },
          )

        const result =
          await new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          )

        expect(
          dependencies.journeys
            .create,
        ).toHaveBeenCalledTimes(1)
        expect(
          returnedOpportunity,
        ).toBeDefined()
        expect(
          returnedOpportunity,
        ).not.toBe(
          receivedOpportunity,
        )
        expect(
          result.opportunity,
        ).toBe(
          returnedOpportunity,
        )
        expect(
          result.opportunity
            .updatedAt,
        ).toBe(
          "2026-07-26T19:00:00.000Z",
        )
      },
    )

    it(
      "permite duas oportunidades iguais para o mesmo cliente sem buscar duplicidade",
      async () => {
        const {
          dependencies,
          createJourney,
        } =
          createDependencies()

        const generatedIds = [
          "journey-first",
          "journey-second",
        ]

        const useCase =
          new CreateOpportunityAsync(
            dependencies,
            {
              generateId:
                () =>
                  generatedIds.shift() ??
                  "journey-unexpected",
            },
          )

        const firstResult =
          await useCase.execute({
            ...createInput(),
            title:
              "Oportunidade repetida",
          })

        const secondResult =
          await useCase.execute({
            ...createInput(),
            title:
              "Oportunidade repetida",
          })

        expect(
          createJourney,
        ).toHaveBeenCalledTimes(2)
        expect(
          dependencies.journeys
            .findByClientId,
        ).not.toHaveBeenCalled()
        expect(
          dependencies.journeys
            .findAll,
        ).not.toHaveBeenCalled()
        expect(
          firstResult.opportunity.id,
        ).toBe("journey-first")
        expect(
          secondResult.opportunity.id,
        ).toBe("journey-second")
        expect(
          firstResult.opportunity,
        ).not.toEqual(
          secondResult.opportunity,
        )
      },
    )

    it(
      "aguarda as dependências assíncronas na ordem do fluxo",
      async () => {
        const {
          dependencies,
          createJourney,
        } =
          createDependencies()

        let resolveClient:
          (
            value:
              Client |
              undefined,
          ) => void =
          () => {}

        let resolveConsultant:
          (
            value:
              Consultant |
              undefined,
          ) => void =
          () => {}

        let resolvePhases:
          (
            value:
              JourneyPhase[],
          ) => void =
          () => {}

        let resolveStates:
          (
            value:
              JourneyState[],
          ) => void =
          () => {}

        const controlledFindClient =
          vi.fn(
            () =>
              new Promise<
                Client |
                undefined
              >(
                (resolve) => {
                  resolveClient =
                    resolve
                },
              ),
          )

        const controlledFindConsultant =
          vi.fn(
            () =>
              new Promise<
                Consultant |
                undefined
              >(
                (resolve) => {
                  resolveConsultant =
                    resolve
                },
              ),
          )

        const controlledFindPhases =
          vi.fn(
            () =>
              new Promise<
                JourneyPhase[]
              >(
                (resolve) => {
                  resolvePhases =
                    resolve
                },
              ),
          )

        const controlledFindStates =
          vi.fn(
            () =>
              new Promise<
                JourneyState[]
              >(
                (resolve) => {
                  resolveStates =
                    resolve
                },
              ),
          )

        dependencies.clients
          .findById =
          controlledFindClient

        dependencies.consultants
          .findById =
          controlledFindConsultant

        dependencies.phases
          .findAll =
          controlledFindPhases

        dependencies.states
          .findAll =
          controlledFindStates

        const execution =
          new CreateOpportunityAsync(
            dependencies,
          ).execute(
            createInput(),
          )

        expect(
          controlledFindClient,
        ).toHaveBeenCalledTimes(1)
        expect(
          controlledFindConsultant,
        ).not.toHaveBeenCalled()
        expect(
          controlledFindPhases,
        ).not.toHaveBeenCalled()
        expect(
          controlledFindStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()

        resolveClient(client)
        await vi.waitFor(() =>
          expect(
            controlledFindConsultant,
          ).toHaveBeenCalledTimes(1),
        )

        expect(
          controlledFindPhases,
        ).not.toHaveBeenCalled()
        expect(
          controlledFindStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()

        resolveConsultant(
          consultants[0],
        )
        await vi.waitFor(() =>
          expect(
            controlledFindPhases,
          ).toHaveBeenCalledTimes(1),
        )

        expect(
          controlledFindStates,
        ).not.toHaveBeenCalled()
        expect(
          createJourney,
        ).not.toHaveBeenCalled()

        resolvePhases(phases)
        await vi.waitFor(() =>
          expect(
            controlledFindStates,
          ).toHaveBeenCalledTimes(1),
        )

        expect(
          createJourney,
        ).not.toHaveBeenCalled()

        resolveStates(states)
        await execution

        expect(
          createJourney,
        ).toHaveBeenCalledTimes(1)
      },
    )

    it(
      "publica o evento somente depois da confirmação da transação atômica",
      async () => {
        const {
          dependencies,
          commitJourneyCreation,
        } =
          createDependencies()

        const publishEvent =
          vi.fn()

        const result =
          await new CreateOpportunityAsync(
            dependencies,
            {
              generateId:
                () =>
                  "journey-atomic",
              generateEventId:
                () =>
                  "event-atomic",
              publishEvent,
            },
          ).execute(
            createInput(),
          )

        expect(
          commitJourneyCreation,
        ).toHaveBeenCalledExactlyOnceWith({
          journey:
            result.opportunity,
          event:
            result.event,
        })
        expect(
          publishEvent,
        ).toHaveBeenCalledExactlyOnceWith(
          result.event,
        )
        expect(
          commitJourneyCreation
            .mock
            .invocationCallOrder[0],
        ).toBeLessThan(
          publishEvent
            .mock
            .invocationCallOrder[0]!,
        )
      },
    )

    it(
      "não publica evento quando a transação atômica falha",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const transactionError =
          new Error(
            "Falha transacional.",
          )

        dependencies.transactions
          .commitJourneyCreation =
          vi.fn(async () => {
            throw transactionError
          })

        const publishEvent =
          vi.fn()

        await expect(
          new CreateOpportunityAsync(
            dependencies,
            {
              publishEvent,
            },
          ).execute(
            createInput(),
          ),
        ).rejects.toBe(
          transactionError,
        )

        expect(
          publishEvent,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "não interrompe a criação quando um listener de apresentação falha",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const result =
          await new CreateOpportunityAsync(
            dependencies,
            {
              generateId:
                () =>
                  "journey-listener",
              generateEventId:
                () =>
                  "event-listener",
              publishEvent:
                () => {
                  throw new Error(
                    "Falha de apresentação.",
                  )
                },
            },
          ).execute(
            createInput(),
          )

        expect(
          result.opportunity.id,
        ).toBe(
          "journey-listener",
        )
        expect(
          result.event.id,
        ).toBe(
          "event-listener",
        )
      },
    )
  },
)
