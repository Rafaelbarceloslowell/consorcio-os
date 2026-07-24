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
    BlockClient,
  } from "./block-client"
  
  const transitionDate =
    new Date(
      "2026-07-23T16:00:00.000Z",
    )
  
  function createClientFixture(
    consultantId: string,
    overrides: Partial<Client> = {},
  ): Client {
    return {
      id:
        "client-block-test",
  
      type:
        "individual",
  
      name:
        "Cliente Bloqueio",
  
      email:
        "client.block.test@example.com",
  
      phone:
        "+5541999997101",
  
      document:
        "101.101.101-01",
  
      address: {
        street:
          "Rua Teste",
  
        number:
          "100",
  
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
    "BlockClient",
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
        "deve bloquear um cliente ativo",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new BlockClient(
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
            "blocked",
          )
  
          expect(
            result.client.updatedAt,
          ).toBe(
            transitionDate.toISOString(),
          )
        },
      )
  
      it(
        "deve persistir o bloqueio no repositório",
        () => {
          const client =
            createClientFixture(
              consultantId,
            )
  
          repository.createClient(
            client,
          )
  
          new BlockClient(
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
            "blocked",
          )
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          expect(
            () =>
              new BlockClient(
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
              new BlockClient(
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
        "deve rejeitar um cliente já bloqueado",
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
              new BlockClient(
                repository,
              ).execute({
                clientId:
                  client.id,
              }),
          ).toThrow(
            "O cliente já está bloqueado.",
          )
        },
      )
  
      it(
        "deve rejeitar o bloqueio de um cliente inativo",
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
              new BlockClient(
                repository,
              ).execute({
                clientId:
                  client.id,
              }),
          ).toThrow(
            "Somente clientes ativos podem ser bloqueados.",
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
                  "Cliente em análise",
  
                tags: [
                  "premium",
                ],
              },
            )
  
          repository.createClient(
            client,
          )
  
          const result =
            new BlockClient(
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
              "blocked",
  
            updatedAt:
              transitionDate.toISOString(),
          })
        },
      )
    },
  )