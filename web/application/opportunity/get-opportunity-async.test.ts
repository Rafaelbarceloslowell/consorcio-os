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
  GetOpportunityAsync,
} from "./get-opportunity-async"

import type {
  GetOpportunityAsyncDependencies,
} from "./get-opportunity-async"

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
    title: "Oportunidade",
    consortiumType:
      "real_estate",
    currentPhaseId: "phase-1",
    currentStateId: "state-1",
    priority: "NORMAL",
    score: 0,
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
  findById:
    GetOpportunityAsyncDependencies[
      "journeys"
    ]["findById"],
) {
  return {
    journeys: {
      findAll:
        vi.fn(async () => []),
      findById,
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
        vi.fn(async () =>
          undefined,
        ),
      delete:
        vi.fn(async () =>
          false,
        ),
    },
  } satisfies
    GetOpportunityAsyncDependencies
}

describe(
  "GetOpportunityAsync",
  () => {
    it(
      "normaliza IDs e retorna exatamente o objeto do repository",
      async () => {
        const opportunity =
          createOpportunity()

        const findById =
          vi.fn(
            async () =>
              opportunity,
          )

        const result =
          await new GetOpportunityAsync(
            createDependencies(
              findById,
            ),
          ).execute({
            workspaceId:
              "  workspace-1  ",
            opportunityId:
              "  journey-1  ",
          })

        expect(
          findById,
        ).toHaveBeenCalledExactlyOnceWith(
          "journey-1",
        )
        expect(
          result.opportunity,
        ).toBe(opportunity)
      },
    )

    it.each([
      {
        workspaceId: " ",
        opportunityId:
          "journey-1",
        message:
          "O workspace é obrigatório para consultar a oportunidade.",
      },
      {
        workspaceId:
          "workspace-1",
        opportunityId: " ",
        message:
          "O ID da oportunidade é obrigatório.",
      },
    ])(
      "rejeita entrada inválida",
      async ({
        workspaceId,
        opportunityId,
        message,
      }) => {
        const findById =
          vi.fn(
            async () =>
              createOpportunity(),
          )

        await expect(
          new GetOpportunityAsync(
            createDependencies(
              findById,
            ),
          ).execute({
            workspaceId,
            opportunityId,
          }),
        ).rejects.toThrow(message)

        expect(
          findById,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      undefined,
      createOpportunity({
        workspaceId:
          "workspace-2",
      }),
    ])(
      "trata oportunidade ausente ou de outro workspace como inexistente",
      async (opportunity) => {
        const findById =
          vi.fn(
            async () =>
              opportunity,
          )

        await expect(
          new GetOpportunityAsync(
            createDependencies(
              findById,
            ),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          }),
        ).rejects.toThrow(
          'Oportunidade comercial não encontrada para o ID "journey-1".',
        )
      },
    )

    it(
      "propaga erro do repository por identidade",
      async () => {
        const repositoryError =
          new Error(
            "Falha na consulta.",
          )

        await expect(
          new GetOpportunityAsync(
            createDependencies(
              vi.fn(async () => {
                throw repositoryError
              }),
            ),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          }),
        ).rejects.toBe(
          repositoryError,
        )
      },
    )

    it(
      "aguarda findById antes de concluir",
      async () => {
        const opportunity =
          createOpportunity()

        let resolveFind:
          (
            value:
              CommercialJourney |
              undefined,
          ) => void =
          () => {}

        const execution =
          new GetOpportunityAsync(
            createDependencies(
              vi.fn(
                () =>
                  new Promise<
                    CommercialJourney |
                    undefined
                  >(
                    (resolve) => {
                      resolveFind =
                        resolve
                    },
                  ),
              ),
            ),
          ).execute({
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
          })

        let settled = false

        execution.finally(() => {
          settled = true
        })

        await Promise.resolve()
        expect(settled).toBe(false)

        resolveFind(opportunity)

        await expect(
          execution,
        ).resolves.toEqual({
          opportunity,
        })
      },
    )
  },
)
