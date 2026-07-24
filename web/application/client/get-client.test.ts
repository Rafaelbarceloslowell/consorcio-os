import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    mockClients,
  } from "@/data/mock-crm"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    GetClient,
  } from "./get-client"
  
  describe(
    "GetClient",
    () => {
      it(
        "deve buscar um cliente pelo ID",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getClient =
            new GetClient(
              crmRepository,
            )
  
          const client =
            mockClients[0]
  
          const result =
            getClient.execute({
              clientId:
                client.id,
            })
  
          expect(
            result.client,
          ).toEqual(
            client,
          )
        },
      )
  
      it(
        "deve remover espaços do ID antes de buscar o cliente",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getClient =
            new GetClient(
              crmRepository,
            )
  
          const client =
            mockClients[0]
  
          const result =
            getClient.execute({
              clientId:
                `  ${client.id}  `,
            })
  
          expect(
            result.client,
          ).toEqual(
            client,
          )
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getClient =
            new GetClient(
              crmRepository,
            )
  
          expect(
            () =>
              getClient.execute({
                clientId: "",
              }),
          ).toThrowError(
            "O ID do cliente é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um ID contendo somente espaços",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getClient =
            new GetClient(
              crmRepository,
            )
  
          expect(
            () =>
              getClient.execute({
                clientId: "   ",
              }),
          ).toThrowError(
            "O ID do cliente é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um cliente inexistente",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getClient =
            new GetClient(
              crmRepository,
            )
  
          expect(
            () =>
              getClient.execute({
                clientId:
                  "client-inexistente",
              }),
          ).toThrowError(
            'Cliente não encontrado para o ID "client-inexistente".',
          )
        },
      )
    },
  )