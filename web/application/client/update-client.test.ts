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
    UpdateClient,
  } from "./update-client"
  
  const updateDate =
    new Date(
      "2026-07-23T15:00:00.000Z",
    )
  
  const individualDocument =
    "909.090.909-09"
  
  const companyDocument =
    "90.909.090/0001-99"
  
  function createClientFixture(
    overrides: Partial<Client> = {},
  ): Client {
    return {
      id:
        "client-update-test",
  
      type:
        "individual",
  
      name:
        "Cliente Original",
  
      email:
        "cliente.original.update@example.com",
  
      phone:
        "+5541999997001",
  
      document:
        individualDocument,
  
      birthDate:
        "1990-01-10",
  
      address: {
        street:
          "Rua Original",
  
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
  
      consultantId:
        "",
  
      status:
        "active",
  
      tags: [
        "Original",
      ],
  
      notes:
        "Observação original",
  
      createdAt:
        "2026-01-01T10:00:00.000Z",
  
      updatedAt:
        "2026-01-01T10:00:00.000Z",
  
      ...overrides,
    }
  }
  
  describe(
    "UpdateClient",
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
        "deve atualizar os dados do cliente",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
              {
                now:
                  updateDate,
              },
            )
  
          const result =
            useCase.execute({
              clientId:
                client.id,
  
              name:
                "  Cliente Atualizado  ",
  
              email:
                "  CLIENTE.ATUALIZADO@example.com  ",
  
              phone:
                "(41) 98888-7766",
  
              document:
                "808.080.808-08",
  
              birthDate:
                "1992-03-15",
  
              address: {
                street:
                  "  Rua Atualizada  ",
  
                number:
                  "  200  ",
  
                complement:
                  "  Sala 10  ",
  
                neighborhood:
                  "  Batel  ",
  
                city:
                  "  Curitiba  ",
  
                state:
                  "  pr  ",
  
                zipCode:
                  "  80420-000  ",
              },
  
              tags: [
                "Premium",
                " premium ",
                "Investidor",
              ],
  
              notes:
                "  Cliente atualizado  ",
            })
  
          expect(
            result.client,
          ).toEqual({
            ...client,
  
            name:
              "Cliente Atualizado",
  
            email:
              "cliente.atualizado@example.com",
  
            phone:
              "+5541988887766",
  
            document:
              "808.080.808-08",
  
            birthDate:
              "1992-03-15",
  
            address: {
              street:
                "Rua Atualizada",
  
              number:
                "200",
  
              complement:
                "Sala 10",
  
              neighborhood:
                "Batel",
  
              city:
                "Curitiba",
  
              state:
                "PR",
  
              zipCode:
                "80420-000",
            },
  
            tags: [
              "Premium",
              "Investidor",
            ],
  
            notes:
              "Cliente atualizado",
  
            updatedAt:
              updateDate.toISOString(),
          })
        },
      )
  
      it(
        "deve atualizar somente os campos informados",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
              {
                now:
                  updateDate,
              },
            )
  
          const result =
            useCase.execute({
              clientId:
                client.id,
  
              address: {
                number:
                  "500",
              },
            })
  
          expect(
            result.client.address,
          ).toEqual({
            ...client.address,
  
            number:
              "500",
          })
  
          expect(
            result.client.name,
          ).toBe(
            client.name,
          )
  
          expect(
            result.client.email,
          ).toBe(
            client.email,
          )
  
          expect(
            result.client.createdAt,
          ).toBe(
            client.createdAt,
          )
  
          expect(
            result.client.status,
          ).toBe(
            client.status,
          )
        },
      )
  
      it(
        "deve atualizar um telefone internacional com sinal de mais",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const result =
            new UpdateClient(
              repository,
            ).execute({
              clientId:
                client.id,
  
              phone:
                "+1 (305) 555-1234",
            })
  
          expect(
            result.client.phone,
          ).toBe(
            "+13055551234",
          )
        },
      )
  
      it(
        "deve atualizar um telefone internacional usando o código do país separado",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const result =
            new UpdateClient(
              repository,
            ).execute({
              clientId:
                client.id,
  
              phone:
                "912345678",
  
              phoneCountryCode:
                "351",
            })
  
          expect(
            result.client.phone,
          ).toBe(
            "+351912345678",
          )
        },
      )
  
      it(
        "deve converter um cliente individual em empresa",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const result =
            new UpdateClient(
              repository,
              {
                now:
                  updateDate,
              },
            ).execute({
              clientId:
                client.id,
  
              type:
                "company",
  
              document:
                companyDocument,
  
              companyName:
                "Empresa Atualizada Ltda",
  
              tradeName:
                "Empresa Atualizada",
  
              stateRegistration:
                "123456789",
            })
  
          expect(
            result.client.type,
          ).toBe(
            "company",
          )
  
          expect(
            result.client.name,
          ).toBe(
            "Empresa Atualizada Ltda",
          )
  
          expect(
            result.client.companyName,
          ).toBe(
            "Empresa Atualizada Ltda",
          )
  
          expect(
            result.client.tradeName,
          ).toBe(
            "Empresa Atualizada",
          )
  
          expect(
            result.client.stateRegistration,
          ).toBe(
            "123456789",
          )
        },
      )
  
      it(
        "deve converter uma empresa em cliente individual",
        () => {
          const client =
            createClientFixture({
              consultantId,
  
              type:
                "company",
  
              name:
                "Empresa Original Ltda",
  
              document:
                companyDocument,
  
              companyName:
                "Empresa Original Ltda",
  
              tradeName:
                "Empresa Original",
  
              stateRegistration:
                "123456789",
            })
  
          repository.createClient(
            client,
          )
  
          const result =
            new UpdateClient(
              repository,
            ).execute({
              clientId:
                client.id,
  
              type:
                "individual",
  
              name:
                "Pessoa Atualizada",
  
              document:
                "707.070.707-07",
            })
  
          expect(
            result.client.type,
          ).toBe(
            "individual",
          )
  
          expect(
            result.client.name,
          ).toBe(
            "Pessoa Atualizada",
          )
  
          expect(
            result.client.companyName,
          ).toBeUndefined()
  
          expect(
            result.client.tradeName,
          ).toBeUndefined()
  
          expect(
            result.client.stateRegistration,
          ).toBeUndefined()
        },
      )
  
      it(
        "deve permitir manter o próprio e-mail, telefone e documento",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  client.id,
  
                email:
                  " CLIENTE.ORIGINAL.UPDATE@example.com ",
  
                phone:
                  "(41) 99999-7001",
  
                document:
                  "90909090909",
              }),
          ).not.toThrow()
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
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
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  "client-inexistente",
              }),
          ).toThrow(
            'Cliente não encontrado para o ID "client-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar um consultor inexistente",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  client.id,
  
                consultantId:
                  "consultant-inexistente",
              }),
          ).toThrow(
            'Consultor não encontrado para o ID "consultant-inexistente".',
          )
        },
      )
  
      it(
        "deve exigir razão social ao converter o cliente em empresa",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  client.id,
  
                type:
                  "company",
  
                document:
                  companyDocument,
              }),
          ).toThrow(
            "A razão social é obrigatória para clientes do tipo empresa.",
          )
        },
      )
  
      it(
        "deve rejeitar um e-mail duplicado de outro cliente",
        () => {
          const firstClient =
            createClientFixture({
              id:
                "client-first",
  
              consultantId,
            })
  
          const secondClient =
            createClientFixture({
              id:
                "client-second",
  
              email:
                "outro.cliente.update@example.com",
  
              phone:
                "+5541999997002",
  
              document:
                "606.060.606-06",
  
              consultantId,
            })
  
          repository.createClient(
            firstClient,
          )
  
          repository.createClient(
            secondClient,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  secondClient.id,
  
                email:
                  " CLIENTE.ORIGINAL.UPDATE@example.com ",
              }),
          ).toThrow(
            'Já existe um cliente cadastrado com o e-mail "cliente.original.update@example.com".',
          )
        },
      )
  
      it(
        "deve rejeitar um telefone duplicado de outro cliente",
        () => {
          const firstClient =
            createClientFixture({
              id:
                "client-first",
  
              consultantId,
            })
  
          const secondClient =
            createClientFixture({
              id:
                "client-second",
  
              email:
                "outro.cliente.update@example.com",
  
              phone:
                "+5541999997002",
  
              document:
                "606.060.606-06",
  
              consultantId,
            })
  
          repository.createClient(
            firstClient,
          )
  
          repository.createClient(
            secondClient,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  secondClient.id,
  
                phone:
                  "(41) 99999-7001",
              }),
          ).toThrow(
            "Já existe um cliente cadastrado com o telefone informado.",
          )
        },
      )
  
      it(
        "deve rejeitar um documento duplicado de outro cliente",
        () => {
          const firstClient =
            createClientFixture({
              id:
                "client-first",
  
              consultantId,
            })
  
          const secondClient =
            createClientFixture({
              id:
                "client-second",
  
              email:
                "outro.cliente.update@example.com",
  
              phone:
                "+5541999997002",
  
              document:
                "606.060.606-06",
  
              consultantId,
            })
  
          repository.createClient(
            firstClient,
          )
  
          repository.createClient(
            secondClient,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  secondClient.id,
  
                document:
                  "90909090909",
              }),
          ).toThrow(
            "Já existe um cliente cadastrado com o documento informado.",
          )
        },
      )
  
      it(
        "deve rejeitar um telefone inválido",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
            )
  
          expect(
            () =>
              useCase.execute({
                clientId:
                  client.id,
  
                phone:
                  "+123",
              }),
          ).toThrow(
            "O telefone internacional do cliente deve possuir entre 8 e 15 dígitos, incluindo o código do país.",
          )
        },
      )
  
      it(
        "deve preservar o status, o lead e a data de criação",
        () => {
          const client =
            createClientFixture({
              consultantId,
  
              status:
                "blocked",
  
              leadId:
                "lead-origin",
  
              createdAt:
                "2025-12-10T10:00:00.000Z",
            })
  
          repository.createClient(
            client,
          )
  
          const result =
            new UpdateClient(
              repository,
              {
                now:
                  updateDate,
              },
            ).execute({
              clientId:
                client.id,
  
              notes:
                "Nova observação",
            })
  
          expect(
            result.client.status,
          ).toBe(
            "blocked",
          )
  
          expect(
            result.client.leadId,
          ).toBe(
            "lead-origin",
          )
  
          expect(
            result.client.createdAt,
          ).toBe(
            "2025-12-10T10:00:00.000Z",
          )
  
          expect(
            result.client.updatedAt,
          ).toBe(
            updateDate.toISOString(),
          )
        },
      )
  
      it(
        "deve persistir o cliente atualizado no repositório",
        () => {
          const client =
            createClientFixture({
              consultantId,
            })
  
          repository.createClient(
            client,
          )
  
          const useCase =
            new UpdateClient(
              repository,
              {
                now:
                  updateDate,
              },
            )
  
          useCase.execute({
            clientId:
              client.id,
  
            name:
              "Cliente Persistido",
          })
  
          const persistedClient =
            repository
              .getClientById(
                client.id,
              )
  
          expect(
            persistedClient?.name,
          ).toBe(
            "Cliente Persistido",
          )
  
          expect(
            persistedClient?.updatedAt,
          ).toBe(
            updateDate.toISOString(),
          )
        },
      )
    },
  )