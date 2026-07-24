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
    UnblockClient,
  } from "./unblock-client"
  
  const transitionDate =
    new Date(
      "2026-07-23T16:10:00.000Z",
    )
  
  function createClientFixture(
    consultantId: string,
    overrides: Partial<Client> = {},
  ): Client {
    return {
      id:
        "client-unblock-test",
  
      type:
        "individual",
  
      name:
        "Cliente Desbloqueio",
  
      email:
        "client.unblock.test@example.com",
  
      phone:
        "+5541999997102",
  
      document:
        "202.202.202-02",
  
      address: {
        street:
          "Rua Teste",
  
        number:
          "200",
  
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
        "blocked",
  
      tags: [],
  
      createdAt:
        "2026-01-01T10:00:00.000Z",
  
      updatedAt:
        "2026-01-01T10:00:00.000Z",
  
      ...overrides,
    }
  }
  
  describe(
    "UnblockClient",
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
        "deve desbloquear um cliente bloqueado",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new UnblockClient(
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
        "deve persistir o desbloqueio",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          new UnblockClient(
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
              new UnblockClient(
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
              new UnblockClient(
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
              new UnblockClient(
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
        "deve rejeitar o desbloqueio de um cliente inativo",
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
              new UnblockClient(
                repository,
              ).execute({
                clientId:
                  client.id,
              }),
          ).toThrow(
            "Somente clientes bloqueados podem ser desbloqueados.",
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
                  "Bloqueio removido",
  
                tags: [
                  "recuperado",
                ],
              },
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new UnblockClient(
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