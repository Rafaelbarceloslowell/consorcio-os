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
    DeactivateClient,
  } from "./deactivate-client"
  
  const transitionDate =
    new Date(
      "2026-07-23T16:20:00.000Z",
    )
  
  function createClientFixture(
    consultantId: string,
    overrides: Partial<Client> = {},
  ): Client {
    return {
      id:
        "client-deactivate-test",
  
      type:
        "individual",
  
      name:
        "Cliente Inativação",
  
      email:
        "client.deactivate.test@example.com",
  
      phone:
        "+5541999997103",
  
      document:
        "303.303.303-03",
  
      address: {
        street:
          "Rua Teste",
  
        number:
          "300",
  
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
        "active",
  
      tags: [],
  
      createdAt:
        "2026-01-01T10:00:00.000Z",
  
      updatedAt:
        "2026-01-01T10:00:00.000Z",
  
      ...overrides,
    }
  }
  
  describe(
    "DeactivateClient",
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
        "deve inativar um cliente ativo",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new DeactivateClient(
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
            "inactive",
          )
  
          expect(
            result.client.updatedAt,
          ).toBe(
            transitionDate.toISOString(),
          )
        },
      )
  
      it(
        "deve inativar um cliente bloqueado",
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
  
          const result =
            new DeactivateClient(
              repository,
            ).execute({
              clientId:
                client.id,
            })
  
          expect(
            result.client.status,
          ).toBe(
            "inactive",
          )
        },
      )
  
      it(
        "deve persistir a inativação",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          new DeactivateClient(
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
            "inactive",
          )
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          expect(
            () =>
              new DeactivateClient(
                repository,
              ).execute({
                clientId:
                  "   ",
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
              new DeactivateClient(
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
        "deve rejeitar um cliente já inativo",
        () => {
          const client =
            createClientFixture(
              consultantId,
              {
                status:
                  "inactive",
              },
            )
  
          repository.createClient(
            client,
          )
  
          expect(
            () =>
              new DeactivateClient(
                repository,
              ).execute({
                clientId:
                  client.id,
              }),
          ).toThrow(
            "O cliente já está inativo.",
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
                  "Contrato encerrado",
  
                tags: [
                  "encerrado",
                ],
              },
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new DeactivateClient(
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
              "inactive",
  
            updatedAt:
              transitionDate.toISOString(),
          })
        },
      )
    },
  )