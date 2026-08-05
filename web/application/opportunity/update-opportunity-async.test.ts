import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  CommercialJourney,
  Consultant,
} from "@/types/domain"

import {
  UpdateOpportunityAsync,
} from "./update-opportunity-async"

import type {
  UpdateOpportunityAsyncDependencies,
  UpdateOpportunityInput,
} from "./update-opportunity-async"

const NOW =
  new Date(
    "2026-07-26T20:00:00.000Z",
  )

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
    title: "Oportunidade original",
    consortiumType:
      "real_estate",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "NORMAL",
    score: 50,
    outcome: null,
    stateEnteredAt:
      "2026-07-25T18:00:00.000Z",
    lastInteractionAt: null,
    closedAt: null,
    version: 3,
    createdAt:
      "2026-07-24T18:00:00.000Z",
    updatedAt:
      "2026-07-25T18:00:00.000Z",
    ...overrides,
  }
}

function createConsultant(
  overrides:
    Partial<Consultant> = {},
): Consultant {
  return {
    id: "consultant-2",
    name: "Consultora Nova",
    email:
      "consultora@example.com",
    phone: "11999999999",
    document: "12345678901",
    role: "consultant",
    team: "Comercial",
    region: "Sudeste",
    status: "active",
    monthlySalesTarget: 10,
    monthlyLeadsTarget: 30,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
    ...overrides,
  }
}

type DependencyOptions = {
  opportunity?:
    CommercialJourney
  consultant?:
    Consultant
  persistedOpportunity?:
    CommercialJourney
}

function createDependencies(
  options:
    DependencyOptions = {},
) {
  const opportunity =
    options.opportunity ??
    createOpportunity()
  const consultant =
    options.consultant ??
    createConsultant()

  const findJourney =
    vi.fn(async () =>
      opportunity,
    )
  const findConsultant =
    vi.fn(async () =>
      consultant,
    )
  const updateJourney =
    vi.fn(
      async (
        value:
          CommercialJourney,
      ) =>
        options
          .persistedOpportunity ??
        value,
    )

  const dependencies:
    UpdateOpportunityAsyncDependencies = {
      journeys: {
        findAll:
          vi.fn(async () => []),
        findById:
          findJourney,
        findByLeadId:
          vi.fn(async () => []),
        findByClientId:
          vi.fn(async () => []),
        findByConsultantId:
          vi.fn(async () => []),
        create:
          vi.fn(async (value) =>
            value,
          ),
        update:
          updateJourney,
        delete:
          vi.fn(async () =>
            false,
          ),
      },
      consultants: {
        findAll:
          vi.fn(async () => [
            consultant,
          ]),
        findById:
          findConsultant,
      },
    }

  return {
    dependencies,
    opportunity,
    consultant,
    findJourney,
    findConsultant,
    updateJourney,
  }
}

function createInput(
  overrides:
    Partial<UpdateOpportunityInput> = {},
): UpdateOpportunityInput {
  return {
    workspaceId: "workspace-1",
    opportunityId: "journey-1",
    title: "Título atualizado",
    ...overrides,
  }
}

function createUseCase(
  dependencies:
    UpdateOpportunityAsyncDependencies,
) {
  return new UpdateOpportunityAsync(
    dependencies,
    {
      now: NOW,
    },
  )
}

describe(
  "UpdateOpportunityAsync",
  () => {
    it(
      "normaliza IDs e atualiza somente o título",
      async () => {
        const {
          dependencies,
          opportunity,
          findJourney,
          findConsultant,
          updateJourney,
        } =
          createDependencies()

        const result =
          await createUseCase(
            dependencies,
          ).execute({
            workspaceId:
              "  workspace-1  ",
            opportunityId:
              "  journey-1  ",
            title:
              "  Novo título  ",
          })

        expect(
          findJourney,
        ).toHaveBeenCalledExactlyOnceWith(
          "journey-1",
        )
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).toHaveBeenCalledTimes(1)

        const persisted =
          updateJourney.mock.calls[0][0]

        expect(persisted).toEqual({
          ...opportunity,
          title: "Novo título",
          version: 4,
          updatedAt:
            NOW.toISOString(),
        })
        expect(
          result.opportunity,
        ).toBe(persisted)
      },
    )

    it(
      "atualiza e valida o consultor informado",
      async () => {
        const {
          dependencies,
          opportunity,
          findConsultant,
          updateJourney,
        } =
          createDependencies()

        await createUseCase(
          dependencies,
        ).execute({
          workspaceId: "workspace-1",
          opportunityId: "journey-1",
          consultantId:
            "  consultant-2  ",
        })

        expect(
          findConsultant,
        ).toHaveBeenCalledExactlyOnceWith(
          "consultant-2",
        )
        expect(
          updateJourney,
        ).toHaveBeenCalledTimes(1)
        expect(
          updateJourney.mock
            .calls[0][0],
        ).toEqual({
          ...opportunity,
          consultantId:
            "consultant-2",
          version: 4,
          updatedAt:
            NOW.toISOString(),
        })
      },
    )

    it(
      "atualiza somente a prioridade",
      async () => {
        const {
          dependencies,
          opportunity,
          updateJourney,
        } =
          createDependencies()

        await createUseCase(
          dependencies,
        ).execute({
          workspaceId: "workspace-1",
          opportunityId: "journey-1",
          priority: "HIGH",
        })

        expect(
          updateJourney.mock
            .calls[0][0],
        ).toEqual({
          ...opportunity,
          priority: "HIGH",
          version: 4,
          updatedAt:
            NOW.toISOString(),
        })
      },
    )

    it(
      "atualiza somente o score",
      async () => {
        const {
          dependencies,
          opportunity,
          updateJourney,
        } =
          createDependencies()

        await createUseCase(
          dependencies,
        ).execute({
          workspaceId: "workspace-1",
          opportunityId: "journey-1",
          score: 80,
        })

        expect(
          updateJourney.mock
            .calls[0][0],
        ).toEqual({
          ...opportunity,
          score: 80,
          version: 4,
          updatedAt:
            NOW.toISOString(),
        })
      },
    )

    it(
      "combina os quatro campos permitidos e preserva os demais",
      async () => {
        const opportunity =
          createOpportunity({
            leadId: "lead-1",
            clientId: null,
            outcome:
              "LOST_TO_COMPETITOR",
            closedAt:
              "2026-07-25T19:00:00.000Z",
            lastInteractionAt:
              "2026-07-25T18:30:00.000Z",
          })
        const {
          dependencies,
          updateJourney,
        } =
          createDependencies({
            opportunity,
          })

        await createUseCase(
          dependencies,
        ).execute({
          workspaceId: "workspace-1",
          opportunityId: "journey-1",
          title: "Nova oportunidade",
          consultantId:
            "consultant-2",
          priority: "URGENT",
          score: 100,
        })

        expect(
          updateJourney,
        ).toHaveBeenCalledTimes(1)
        expect(
          updateJourney.mock
            .calls[0][0],
        ).toEqual({
          ...opportunity,
          title: "Nova oportunidade",
          consultantId:
            "consultant-2",
          priority: "URGENT",
          score: 100,
          version: 4,
          updatedAt:
            NOW.toISOString(),
        })
      },
    )

    it(
      "retorna no-op sem consultar consultor, persistir ou alterar metadados",
      async () => {
        const {
          dependencies,
          opportunity,
          findConsultant,
          updateJourney,
        } =
          createDependencies()
        const snapshot =
          structuredClone(
            opportunity,
          )

        const result =
          await createUseCase(
            dependencies,
          ).execute({
            workspaceId: "workspace-1",
            opportunityId: "journey-1",
            title:
              " Oportunidade original ",
            consultantId:
              " consultant-1 ",
            priority: "NORMAL",
            score: 50,
          })

        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
        expect(
          result.opportunity,
        ).toBe(opportunity)
        expect(opportunity).toEqual(
          snapshot,
        )
      },
    )

    it.each([
      {
        label:
          "título igual após normalização",
        update: {
          title:
            " Oportunidade original ",
        },
      },
      {
        label:
          "consultor igual após normalização",
        update: {
          consultantId:
            " consultant-1 ",
        },
      },
      {
        label: "prioridade igual",
        update: {
          priority: "NORMAL",
        },
      },
      {
        label: "score igual",
        update: {
          score: 50,
        },
      },
    ] as const)(
      "trata $label como no-op isolado",
      async ({
        update,
      }) => {
        const {
          dependencies,
          opportunity,
          findConsultant,
          updateJourney,
        } =
          createDependencies()
        const snapshot =
          structuredClone(
            opportunity,
          )

        const result =
          await createUseCase(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
            ...update,
          })

        expect(
          result.opportunity,
        ).toBe(opportunity)
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
        expect(
          opportunity.version,
        ).toBe(snapshot.version)
        expect(
          opportunity.updatedAt,
        ).toBe(snapshot.updatedAt)
        expect(opportunity).toEqual(
          snapshot,
        )
      },
    )

    it(
      "rejeita consultantId null em runtime sem consultar repositories",
      async () => {
        const {
          dependencies,
          findJourney,
          findConsultant,
          updateJourney,
        } =
          createDependencies()
        const input =
          createInput()

        Reflect.set(
          input,
          "consultantId",
          null,
        )

        await expect(
          createUseCase(
            dependencies,
          ).execute(input),
        ).rejects.toThrow(
          "O ID do consultor informado é inválido.",
        )

        expect(
          findJourney,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      {
        input: {
          workspaceId: " ",
          opportunityId:
            "journey-1",
          title: "Novo título",
        },
        message:
          "O workspace é obrigatório para atualizar a oportunidade.",
      },
      {
        input: {
          workspaceId:
            "workspace-1",
          opportunityId: " ",
          title: "Novo título",
        },
        message:
          "O ID da oportunidade é obrigatório.",
      },
      {
        input: {
          workspaceId:
            "workspace-1",
          opportunityId:
            "journey-1",
        },
        message:
          "Nenhuma alteração foi informada para a oportunidade.",
      },
    ])(
      "rejeita identificação ou atualização ausente",
      async ({
        input,
        message,
      }) => {
        const {
          dependencies,
          findJourney,
          findConsultant,
          updateJourney,
        } =
          createDependencies()

        await expect(
          createUseCase(
            dependencies,
          ).execute(input),
        ).rejects.toThrow(message)

        expect(
          findJourney,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      {
        field: "title",
        value: " ",
        message:
          "O título da oportunidade não pode estar vazio.",
      },
      {
        field: "consultantId",
        value: " ",
        message:
          "O ID do consultor informado é inválido.",
      },
      {
        field: "priority",
        value: "INVALID",
        message:
          "A prioridade da oportunidade é inválida.",
      },
      {
        field: "score",
        value: -1,
        message:
          "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
      },
      {
        field: "score",
        value: 101,
        message:
          "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
      },
      {
        field: "score",
        value: 1.5,
        message:
          "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
      },
      {
        field: "score",
        value: Number.NaN,
        message:
          "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
      },
      {
        field: "score",
        value:
          Number.POSITIVE_INFINITY,
        message:
          "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
      },
    ])(
      "rejeita valor inválido em runtime para $field",
      async ({
        field,
        value,
        message,
      }) => {
        const {
          dependencies,
          findJourney,
          findConsultant,
          updateJourney,
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
          createUseCase(
            dependencies,
          ).execute(input),
        ).rejects.toThrow(message)

        expect(
          findJourney,
        ).not.toHaveBeenCalled()
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      {
        opportunity: undefined,
      },
      {
        opportunity:
          createOpportunity({
            workspaceId:
              "workspace-2",
          }),
      },
    ])(
      "trata oportunidade ausente ou de outro workspace como inexistente",
      async ({
        opportunity,
      }) => {
        const {
          dependencies,
          findConsultant,
          updateJourney,
        } =
          createDependencies()

        dependencies.journeys
          .findById =
          vi.fn(async () =>
            opportunity,
          )

        await expect(
          createUseCase(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toThrow(
          'Oportunidade comercial não encontrada para o ID "journey-1".',
        )

        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      "inexistente",
      "fora do workspace",
    ])(
      "rejeita consultor $label",
      async () => {
        const {
          dependencies,
          findConsultant,
          updateJourney,
        } =
          createDependencies()

        dependencies.consultants
          .findById =
          vi.fn(async () =>
            undefined,
          )

        await expect(
          createUseCase(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
            consultantId:
              "consultant-missing",
          }),
        ).rejects.toThrow(
          'Consultor não encontrado para o ID "consultant-missing".',
        )

        expect(
          dependencies
            .consultants
            .findById,
        ).toHaveBeenCalledExactlyOnceWith(
          "consultant-missing",
        )
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      "find",
      "consultant",
      "update",
    ])(
      "propaga erro de repository por identidade em $operation",
      async (operation) => {
        const {
          dependencies,
          updateJourney,
        } =
          createDependencies()
        const repositoryError =
          new Error(
            `Falha em ${operation}.`,
          )

        if (operation === "find") {
          dependencies.journeys
            .findById =
            vi.fn(async () => {
              throw repositoryError
            })
        }

        if (
          operation ===
          "consultant"
        ) {
          dependencies.consultants
            .findById =
            vi.fn(async () => {
              throw repositoryError
            })
        }

        if (operation === "update") {
          dependencies.journeys
            .update =
            vi.fn(async () => {
              throw repositoryError
            })
        }

        await expect(
          createUseCase(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
            consultantId:
              operation ===
                "consultant"
                ? "consultant-2"
                : undefined,
            title:
              operation ===
                "consultant"
                ? undefined
                : "Novo título",
          }),
        ).rejects.toBe(
          repositoryError,
        )

        if (operation !== "update") {
          expect(
            updateJourney,
          ).not.toHaveBeenCalled()
        }
      },
    )

    it(
      "trata ausência da oportunidade no update",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        dependencies.journeys
          .update =
          vi.fn(async () =>
            undefined,
          )

        await expect(
          createUseCase(
            dependencies,
          ).execute(
            createInput(),
          ),
        ).rejects.toThrow(
          'A oportunidade comercial "journey-1" não pôde ser atualizada.',
        )
      },
    )

    it(
      "retorna exatamente a entidade devolvida pelo repository",
      async () => {
        const persistedOpportunity =
          createOpportunity({
            title:
              "Título persistido",
            updatedAt:
              "2026-07-26T20:00:01.000Z",
          })
        const persistedSnapshot =
          structuredClone(
            persistedOpportunity,
          )
        const {
          dependencies,
          updateJourney,
        } =
          createDependencies({
            persistedOpportunity,
          })

        const result =
          await createUseCase(
            dependencies,
          ).execute(
            createInput(),
          )

        expect(
          updateJourney,
        ).toHaveBeenCalledTimes(1)
        expect(
          result.opportunity,
        ).toBe(
          persistedOpportunity,
        )
        expect(
          result.opportunity,
        ).not.toBe(
          updateJourney.mock
            .calls[0][0],
        )
        expect(
          persistedOpportunity,
        ).toEqual(
          persistedSnapshot,
        )
      },
    )

    it(
      "aguarda find, consultor e update em ordem",
      async () => {
        const opportunity =
          createOpportunity()
        const consultant =
          createConsultant()
        let resolveFind:
          (
            value:
              CommercialJourney |
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
        let resolveUpdate:
          (
            value:
              CommercialJourney |
              undefined,
          ) => void =
          () => {}

        const findJourney =
          vi.fn(
            () =>
              new Promise<
                CommercialJourney |
                undefined
              >((resolve) => {
                resolveFind = resolve
              }),
          )
        const findConsultant =
          vi.fn(
            () =>
              new Promise<
                Consultant |
                undefined
              >((resolve) => {
                resolveConsultant =
                  resolve
              }),
          )
        const updateJourney =
          vi.fn(
            (
              _value:
                CommercialJourney,
            ) =>
              new Promise<
                CommercialJourney |
                undefined
              >((resolve) => {
                resolveUpdate =
                  resolve
              }),
          )
        const {
          dependencies,
        } =
          createDependencies()

        dependencies.journeys
          .findById =
          findJourney
        dependencies.consultants
          .findById =
          findConsultant
        dependencies.journeys
          .update =
          updateJourney

        const execution =
          createUseCase(
            dependencies,
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
            consultantId:
              "consultant-2",
          })
        let settled = false

        execution.then(
          () => {
            settled = true
          },
          () => {
            settled = true
          },
        )

        expect(
          findJourney,
        ).toHaveBeenCalledTimes(1)
        expect(
          findConsultant,
        ).not.toHaveBeenCalled()
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()

        resolveFind(opportunity)
        await Promise.resolve()

        expect(
          findConsultant,
        ).toHaveBeenCalledTimes(1)
        expect(
          updateJourney,
        ).not.toHaveBeenCalled()

        resolveConsultant(consultant)
        await Promise.resolve()

        expect(
          updateJourney,
        ).toHaveBeenCalledTimes(1)
        await Promise.resolve()
        expect(settled).toBe(false)

        const persistedOpportunity =
          updateJourney.mock
            .calls[0][0]

        resolveUpdate(
          persistedOpportunity,
        )

        const result =
          await execution

        expect(settled).toBe(true)
        expect(
          result.opportunity,
        ).toBe(
          persistedOpportunity,
        )
      },
    )

    it(
      "não muta a oportunidade original",
      async () => {
        const {
          dependencies,
          opportunity,
          updateJourney,
        } =
          createDependencies()
        const snapshot =
          structuredClone(
            opportunity,
          )

        await createUseCase(
          dependencies,
        ).execute(
          createInput(),
        )

        expect(opportunity).toEqual(
          snapshot,
        )
        expect(
          updateJourney.mock
            .calls[0][0],
        ).not.toBe(opportunity)
      },
    )
  },
)
