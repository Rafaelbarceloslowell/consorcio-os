import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  CommercialJourney,
} from "@/types/domain"

import {
  ListOpportunitiesAsync,
} from "./list-opportunities-async"

import type {
  ListOpportunitiesAsyncDependencies,
  ListOpportunitiesInput,
} from "./list-opportunities-async"

function createOpportunity(
  overrides:
    Partial<CommercialJourney> = {},
): CommercialJourney {
  return {
    id: "journey-1",
    workspaceId: "workspace-1",
    leadId: null,
    clientId: "client-1",
    consultantId: "consultant-1",
    title:
      "Crédito imobiliário",
    consortiumType:
      "real_estate",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "NORMAL",
    score: 50,
    outcome: null,
    stateEnteredAt:
      "2026-07-26T18:00:00.000Z",
    lastInteractionAt: null,
    closedAt: null,
    version: 1,
    createdAt:
      "2026-07-26T18:00:00.000Z",
    updatedAt:
      "2026-07-26T18:00:00.000Z",
    ...overrides,
  }
}

function createDependencies(
  opportunities:
    CommercialJourney[] = [],
) {
  const findAll =
    vi.fn(async () =>
      opportunities,
    )

  const findByClientId =
    vi.fn(async () =>
      opportunities,
    )

  const findByConsultantId =
    vi.fn(async () =>
      opportunities,
    )

  const dependencies:
    ListOpportunitiesAsyncDependencies = {
      journeys: {
        findAll,
        findById:
          vi.fn(async () =>
            undefined,
          ),
        findByLeadId:
          vi.fn(async () => []),
        findByClientId,
        findByConsultantId,
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
    }

  return {
    dependencies,
    findAll,
    findByClientId,
    findByConsultantId,
  }
}

function createInput(
  overrides:
    Partial<ListOpportunitiesInput> = {},
): ListOpportunitiesInput {
  return {
    workspaceId: "workspace-1",
    ...overrides,
  }
}

describe(
  "ListOpportunitiesAsync",
  () => {
    it(
      "usa findAll e retorna lista nova com total",
      async () => {
        const olderOpportunity =
          createOpportunity({
            id: "older",
            updatedAt:
              "2026-07-25T18:00:00.000Z",
          })
        const newerOpportunity =
          createOpportunity({
            id: "newer",
            updatedAt:
              "2026-07-27T18:00:00.000Z",
          })
        const olderSnapshot =
          structuredClone(
            olderOpportunity,
          )
        const newerSnapshot =
          structuredClone(
            newerOpportunity,
          )
        const source = [
          olderOpportunity,
          newerOpportunity,
        ]
        const originalOrder =
          source.map(({ id }) => id)

        const {
          dependencies,
          findAll,
          findByClientId,
          findByConsultantId,
        } =
          createDependencies(source)

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput(),
          )

        expect(
          findAll,
        ).toHaveBeenCalledTimes(1)
        expect(
          findByClientId,
        ).not.toHaveBeenCalled()
        expect(
          findByConsultantId,
        ).not.toHaveBeenCalled()
        expect(result.total).toBe(2)
        expect(
          result.opportunities,
        ).not.toBe(source)
        expect(
          source.map(({ id }) => id),
        ).toEqual(originalOrder)
        expect(
          olderSnapshot,
        ).not.toBe(olderOpportunity)
        expect(
          newerSnapshot,
        ).not.toBe(newerOpportunity)
        expect(
          olderOpportunity,
        ).toEqual(olderSnapshot)
        expect(
          newerOpportunity,
        ).toEqual(newerSnapshot)
        expect(
          result.opportunities,
        ).toEqual([
          newerOpportunity,
          olderOpportunity,
        ])
        expect(
          result.opportunities[0],
        ).toBe(newerOpportunity)
        expect(
          result.opportunities[1],
        ).toBe(olderOpportunity)
      },
    )

    it(
      "usa findByClientId com ID normalizado e não chama alternativas",
      async () => {
        const {
          dependencies,
          findAll,
          findByClientId,
          findByConsultantId,
        } =
          createDependencies([
            createOpportunity(),
            createOpportunity({
              id: "other-client",
              clientId: "client-2",
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              clientId:
                "  client-1  ",
            }),
          )

        expect(
          findByClientId,
        ).toHaveBeenCalledExactlyOnceWith(
          "client-1",
        )
        expect(
          findAll,
        ).not.toHaveBeenCalled()
        expect(
          findByConsultantId,
        ).not.toHaveBeenCalled()
        expect(
          result.opportunities.map(
            ({ id }) => id,
          ),
        ).toEqual(["journey-1"])
        expect(result.total).toBe(1)
      },
    )

    it(
      "usa findByConsultantId quando cliente não foi informado",
      async () => {
        const {
          dependencies,
          findAll,
          findByClientId,
          findByConsultantId,
        } =
          createDependencies([
            createOpportunity(),
          ])

        await new ListOpportunitiesAsync(
          dependencies,
        ).execute(
          createInput({
            consultantId:
              " consultant-1 ",
          }),
        )

        expect(
          findByConsultantId,
        ).toHaveBeenCalledExactlyOnceWith(
          "consultant-1",
        )
        expect(
          findAll,
        ).not.toHaveBeenCalled()
        expect(
          findByClientId,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "prioriza cliente e aplica consultor como filtro complementar",
      async () => {
        const {
          dependencies,
          findByClientId,
          findByConsultantId,
        } =
          createDependencies([
            createOpportunity(),
            createOpportunity({
              id: "journey-2",
              consultantId:
                "consultant-2",
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              clientId: "client-1",
              consultantId:
                "consultant-1",
            }),
          )

        expect(
          findByClientId,
        ).toHaveBeenCalledTimes(1)
        expect(
          findByConsultantId,
        ).not.toHaveBeenCalled()
        expect(
          result.opportunities.map(
            ({ id }) => id,
          ),
        ).toEqual(["journey-1"])
      },
    )

    it(
      "aplica workspace e filtros complementares",
      async () => {
        const matching =
          createOpportunity({
            id: "matching",
            priority: "HIGH",
            currentPhaseId:
              "phase-2",
            currentStateId:
              "state-2",
          })

        const {
          dependencies,
        } =
          createDependencies([
            matching,
            createOpportunity({
              id: "foreign",
              workspaceId:
                "workspace-2",
            }),
            createOpportunity({
              id: "other-type",
              consortiumType:
                "vehicle",
              priority: "HIGH",
              currentPhaseId:
                "phase-2",
              currentStateId:
                "state-2",
            }),
            createOpportunity({
              id: "other-priority",
              priority: "NORMAL",
              currentPhaseId:
                "phase-2",
              currentStateId:
                "state-2",
            }),
            createOpportunity({
              id: "other-phase",
              priority: "HIGH",
              currentPhaseId:
                "phase-1",
              currentStateId:
                "state-2",
            }),
            createOpportunity({
              id: "other-state",
              priority: "HIGH",
              currentPhaseId:
                "phase-2",
              currentStateId:
                "state-1",
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              consortiumType:
                "real_estate",
              priority: "HIGH",
              currentPhaseId:
                "phase-2",
              currentStateId:
                "state-2",
            }),
          )

        expect(
          result.opportunities,
        ).toEqual([matching])
        expect(result.total).toBe(1)
      },
    )

    it.each([
      {
        status: "open",
        expected: ["open"],
      },
      {
        status: "closed",
        expected: [
          "closed-date",
          "closed-outcome",
        ],
      },
    ] as const)(
      "filtra oportunidades $status",
      async ({
        status,
        expected,
      }) => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id: "open",
            }),
            createOpportunity({
              id: "closed-date",
              closedAt:
                "2026-07-26T19:00:00.000Z",
            }),
            createOpportunity({
              id: "closed-outcome",
              outcome: "WON",
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              status,
            }),
          )

        expect(
          result.opportunities
            .map(({ id }) => id)
            .sort(),
        ).toEqual(
          [...expected].sort(),
        )
      },
    )

    it.each([
      {
        origin: "client",
        expected: ["client"],
      },
      {
        origin: "lead",
        expected: ["lead"],
      },
    ] as const)(
      "filtra origem $origin",
      async ({
        origin,
        expected,
      }) => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id: "client",
            }),
            createOpportunity({
              id: "lead",
              leadId: "lead-1",
              clientId: null,
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              origin,
            }),
          )

        expect(
          result.opportunities.map(
            ({ id }) => id,
          ),
        ).toEqual(expected)
      },
    )

    it(
      "pesquisa título ignorando caixa, acentos e pontuação",
      async () => {
        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id: "matching",
              title:
                "Crédito: Imobiliário",
            }),
            createOpportunity({
              id: "other",
              title:
                "Veículo novo",
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              search:
                " credito imobiliario ",
            }),
          )

        expect(
          result.opportunities.map(
            ({ id }) => id,
          ),
        ).toEqual(["matching"])
      },
    )

    it(
      "não elimina resultados com pesquisa vazia e mantém a ordenação",
      async () => {
        const olderOpportunity =
          createOpportunity({
            id: "older",
            updatedAt:
              "2026-07-25T18:00:00.000Z",
          })
        const newerOpportunity =
          createOpportunity({
            id: "newer",
            updatedAt:
              "2026-07-27T18:00:00.000Z",
          })
        const {
          dependencies,
        } =
          createDependencies([
            olderOpportunity,
            newerOpportunity,
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput({
              search: "   ",
            }),
          )

        expect(
          result.opportunities,
        ).toEqual([
          newerOpportunity,
          olderOpportunity,
        ])
        expect(result.total).toBe(2)
      },
    )

    it(
      "ordena por updatedAt, score, título e ID",
      async () => {
        const timestamp =
          "2026-07-26T18:00:00.000Z"

        const {
          dependencies,
        } =
          createDependencies([
            createOpportunity({
              id: "z",
              title: "Beta",
              score: 90,
              updatedAt: timestamp,
            }),
            createOpportunity({
              id: "c",
              title: "Alpha",
              score: 90,
              updatedAt: timestamp,
            }),
            createOpportunity({
              id: "b",
              title: "alpha",
              score: 90,
              updatedAt: timestamp,
            }),
            createOpportunity({
              id: "a",
              title: "Álpha",
              score: 90,
              updatedAt: timestamp,
            }),
            createOpportunity({
              id: "score",
              score: 50,
              updatedAt: timestamp,
            }),
            createOpportunity({
              id: "newest",
              updatedAt:
                "2026-07-27T18:00:00.000Z",
              score: 0,
            }),
          ])

        const result =
          await new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput(),
          )

        expect(
          result.opportunities.map(
            ({ id }) => id,
          ),
        ).toEqual([
          "newest",
          "a",
          "b",
          "c",
          "z",
          "score",
        ])
      },
    )

    it(
      "retorna lista vazia",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        await expect(
          new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).resolves.toEqual({
          opportunities: [],
          total: 0,
        })
      },
    )

    it(
      "propaga erro do repository por identidade",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const repositoryError =
          new Error(
            "Falha na listagem.",
          )

        dependencies.journeys
          .findAll =
          vi.fn(async () => {
            throw repositoryError
          })

        await expect(
          new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toBe(
          repositoryError,
        )
      },
    )

    it(
      "aguarda o repository antes de concluir",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        let resolveFind:
          (
            value:
              CommercialJourney[],
          ) => void =
          () => {}

        dependencies.journeys
          .findAll =
          vi.fn(
            () =>
              new Promise<
                CommercialJourney[]
              >(
                (resolve) => {
                  resolveFind =
                    resolve
                },
              ),
          )

        const execution =
          new ListOpportunitiesAsync(
            dependencies,
          ).execute(
            createInput(),
          )

        let settled = false

        execution.finally(() => {
          settled = true
        })

        await Promise.resolve()
        expect(settled).toBe(false)

        resolveFind([
          createOpportunity(),
        ])

        await expect(
          execution,
        ).resolves.toMatchObject({
          total: 1,
        })
      },
    )

    it.each([
      {
        field: "workspaceId",
        value: " ",
        message:
          "O workspace é obrigatório para listar oportunidades.",
      },
      {
        field: "clientId",
        value: " ",
        message:
          "O ID do cliente informado para o filtro é inválido.",
      },
      {
        field: "consultantId",
        value: " ",
        message:
          "O ID do consultor informado para o filtro é inválido.",
      },
      {
        field: "currentPhaseId",
        value: " ",
        message:
          "O ID da fase informado para o filtro é inválido.",
      },
      {
        field: "currentStateId",
        value: " ",
        message:
          "O ID do estado informado para o filtro é inválido.",
      },
      {
        field: "consortiumType",
        value: "invalid",
        message:
          "O tipo de consórcio informado é inválido.",
      },
      {
        field: "priority",
        value: "invalid",
        message:
          "A prioridade da oportunidade é inválida.",
      },
      {
        field: "status",
        value: "invalid",
        message:
          "O status informado para oportunidades é inválido.",
      },
      {
        field: "origin",
        value: "invalid",
        message:
          "A origem informada para oportunidades é inválida.",
      },
    ])(
      "rejeita filtro $field inválido sem consultar repository",
      async ({
        field,
        value,
        message,
      }) => {
        const {
          dependencies,
          findAll,
          findByClientId,
          findByConsultantId,
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
          new ListOpportunitiesAsync(
            dependencies,
          ).execute(input),
        ).rejects.toThrow(message)

        expect(
          findAll,
        ).not.toHaveBeenCalled()
        expect(
          findByClientId,
        ).not.toHaveBeenCalled()
        expect(
          findByConsultantId,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
