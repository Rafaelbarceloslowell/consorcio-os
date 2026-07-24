import {
    beforeEach,
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    Client,
  } from "@/types/domain"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    ReactivateClient,
  } from "./reactivate-client"
  
  const transitionDate =
    new Date(
      "2026-07-23T16:30:00.000Z",
    )
  
  function createClientFixture(
    consultantId: string,
    overrides: Partial<Client> = {},
  ): Client {
    return {
      id:
        "client-reactivate-test",
  
      type:
        "individual",
  
      name:
        "Cliente Reativação",
  
      email:
        "client.reactivate.test@example.com",
  
      phone:
        "+5541999997104",
  
      document:
        "404.404.404-04",
  
      address: {
        street:
          "Rua Teste",
  
        number:
          "400",
  
        neighborhood:
          "Centro",
  
        city:
          "Curitiba",
  
        state:
          "PR",
  
        zipCode:
          "80000-000",
      },
  
      consultantId,
  
      status:
        "inactive",
  
      tags: [],
  
      createdAt:
        "2026-01-01T10:00:00.000Z",
  
      updatedAt:
        "2026-01-01T10:00:00.000Z",
  
      ...overrides,
    }
  }
  
  describe(
    "ReactivateClient",
    () => {
      let repository:
        MockCrmRepository
  
      let consultantId:
        string
  
      beforeEach(
        () => {
          repository =
            new MockCrmRepository()
  
          const consultant =
            repository
              .getConsultants()
              .at(0)
  
          if (!consultant) {
            throw new Error(
              "O mock precisa possuir pelo menos um consultor.",
            )
          }
  
          consultantId =
            consultant.id
        },
      )
  
      it(
        "deve reativar um cliente inativo",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new ReactivateClient(
              repository,
              {
                now:
                  transitionDate,
              },
            ).execute({
              clientId:
                client.id,
            })
  
          expect(
            result.client.status,
          ).toBe(
            "active",
          )
  
          expect(
            result.client.updatedAt,
          ).toBe(
            transitionDate.toISOString(),
          )
        },
      )
  
      it(
        "deve persistir a reativação",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          new ReactivateClient(
            repository,
          ).execute({
            clientId:
              client.id,
          })
  
          expect(
            repository
              .getClientById(
                client.id,
              )
              ?.status,
          ).toBe(
            "active",
          )
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          expect(
            () =>
              new ReactivateClient(
                repository,
              ).execute({
                clientId:
                  "",
              }),
          ).toThrow(
            "O ID do cliente é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um cliente inexistente",
        () => {
          expect(
            () =>
              new ReactivateClient(
                repository,
              ).execute({
                clientId:
                  "client-inexistente",
              }),
          ).toThrow(
            'Cliente não encontrado para o ID "client-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar um cliente já ativo",
        () => {
          const client =
            createClientFixture(
              consultantId,
              {
                status:
                  "active",
              },
            )
  
          repository.createClient(
            client,
          )
  
          expect(
            () =>
              new ReactivateClient(
                repository,
              ).execute({
                clientId:
                  client.id,
              }),
          ).toThrow(
            "O cliente já está ativo.",
          )
        },
      )
  
      it(
        "deve rejeitar a reativação de um cliente bloqueado",
        () => {
          const client =
            createClientFixture(
              consultantId,
              {
                status:
                  "blocked",
              },
            )
  
          repository.createClient(
            client,
          )
  
          expect(
            () =>
              new ReactivateClient(
                repository,
              ).execute({
                clientId:
                  client.id,
              }),
          ).toThrow(
            "Somente clientes inativos podem ser reativados.",
          )
        },
      )
  
      it(
        "deve preservar os demais dados do cliente",
        () => {
          const client =
            createClientFixture(
              consultantId,
              {
                notes:
                  "Cliente recuperado",
  
                tags: [
                  "reativado",
                ],
              },
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new ReactivateClient(
              repository,
              {
                now:
                  transitionDate,
              },
            ).execute({
              clientId:
                client.id,
            })
  
          expect(
            result.client,
          ).toEqual({
            ...client,
  
            status:
              "active",
  
            updatedAt:
              transitionDate.toISOString(),
          })
        },
      )
    },
  )