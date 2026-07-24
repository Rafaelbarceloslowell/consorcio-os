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
    ListClients,
  } from "./list-clients"
  
  describe(
    "ListClients",
    () => {
      it(
        "deve listar todos os clientes ordenados pelo nome",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const result =
            listClients.execute()
  
          const expectedClients = [
            ...mockClients,
          ].sort(
            (firstClient, secondClient) =>
              firstClient.name.localeCompare(
                secondClient.name,
                "pt-BR",
                {
                  sensitivity: "base",
                },
              ),
          )
  
          expect(
            result.clients,
          ).toEqual(
            expectedClients,
          )
  
          expect(
            result.total,
          ).toBe(
            mockClients.length,
          )
        },
      )
  
      it(
        "deve filtrar os clientes pelo consultor",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const consultantId =
            mockClients[0]
              .consultantId
  
          const result =
            listClients.execute({
              consultantId,
            })
  
          expect(
            result.clients.every(
              (client) =>
                client.consultantId ===
                consultantId,
            ),
          ).toBe(true)
  
          expect(
            result.total,
          ).toBe(
            mockClients.filter(
              (client) =>
                client.consultantId ===
                consultantId,
            ).length,
          )
        },
      )
  
      it(
        "deve remover espaços do ID do consultor antes de filtrar",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const consultantId =
            mockClients[0]
              .consultantId
  
          const result =
            listClients.execute({
              consultantId:
                `  ${consultantId}  `,
            })
  
          expect(
            result.clients.every(
              (client) =>
                client.consultantId ===
                consultantId,
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve filtrar os clientes pelo status",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const status =
            mockClients[0].status
  
          const result =
            listClients.execute({
              status,
            })
  
          expect(
            result.clients.every(
              (client) =>
                client.status ===
                status,
            ),
          ).toBe(true)
  
          expect(
            result.total,
          ).toBe(
            mockClients.filter(
              (client) =>
                client.status ===
                status,
            ).length,
          )
        },
      )
  
      it(
        "deve filtrar os clientes pelo tipo de pessoa",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const type =
            mockClients[0].type
  
          const result =
            listClients.execute({
              type,
            })
  
          expect(
            result.clients.every(
              (client) =>
                client.type ===
                type,
            ),
          ).toBe(true)
  
          expect(
            result.total,
          ).toBe(
            mockClients.filter(
              (client) =>
                client.type ===
                type,
            ).length,
          )
        },
      )
  
      it(
        "deve buscar um cliente pelo nome ignorando maiúsculas e acentos",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const client =
            mockClients[0]
  
          const search =
            client.name
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                "",
              )
              .toUpperCase()
  
          const result =
            listClients.execute({
              search,
            })
  
          expect(
            result.clients,
          ).toContainEqual(
            client,
          )
        },
      )
  
      it(
        "deve buscar um cliente pelo e-mail",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const client =
            mockClients[0]
  
          const result =
            listClients.execute({
              search:
                client.email,
            })
  
          expect(
            result.clients,
          ).toContainEqual(
            client,
          )
        },
      )
  
      it(
        "deve buscar um cliente pelo telefone ignorando formatação",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const client =
            mockClients[0]
  
          const search =
            client.phone.replace(
              /\D/g,
              "",
            )
  
          const result =
            listClients.execute({
              search,
            })
  
          expect(
            result.clients,
          ).toContainEqual(
            client,
          )
        },
      )
  
      it(
        "deve buscar um cliente pelo documento ignorando formatação",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const client =
            mockClients[0]
  
          const search =
            client.document.replace(
              /\D/g,
              "",
            )
  
          const result =
            listClients.execute({
              search,
            })
  
          expect(
            result.clients,
          ).toContainEqual(
            client,
          )
        },
      )
  
      it(
        "deve filtrar os clientes por todas as tags informadas",
        () => {
          const client =
            mockClients.find(
              (currentClient) =>
                currentClient.tags
                  .length > 0,
            )
  
          expect(
            client,
          ).toBeDefined()
  
          if (!client) {
            return
          }
  
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const selectedTags =
            client.tags.slice(
              0,
              Math.min(
                2,
                client.tags.length,
              ),
            )
  
          const result =
            listClients.execute({
              tags:
                selectedTags.map(
                  (tag) =>
                    `  ${tag.toUpperCase()}  `,
                ),
            })
  
          expect(
            result.clients,
          ).toContainEqual(
            client,
          )
  
          expect(
            result.clients.every(
              (currentClient) =>
                selectedTags.every(
                  (tag) =>
                    currentClient.tags.some(
                      (clientTag) =>
                        clientTag.localeCompare(
                          tag,
                          "pt-BR",
                          {
                            sensitivity:
                              "base",
                          },
                        ) === 0,
                    ),
                ),
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve combinar múltiplos filtros",
        () => {
          const client =
            mockClients[0]
  
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const result =
            listClients.execute({
              consultantId:
                client.consultantId,
              status:
                client.status,
              type:
                client.type,
              search:
                client.document,
            })
  
          expect(
            result.clients,
          ).toContainEqual(
            client,
          )
  
          expect(
            result.clients.every(
              (currentClient) =>
                currentClient
                  .consultantId ===
                  client.consultantId &&
                currentClient.status ===
                  client.status &&
                currentClient.type ===
                  client.type,
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve retornar uma lista vazia quando nenhum cliente corresponder aos filtros",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const result =
            listClients.execute({
              search:
                "cliente-totalmente-inexistente",
            })
  
          expect(
            result,
          ).toEqual({
            clients: [],
            total: 0,
          })
        },
      )
  
      it(
        "não deve expor o array interno do repositório",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const listClients =
            new ListClients(
              crmRepository,
            )
  
          const firstResult =
            listClients.execute()
  
          firstResult.clients.length =
            0
  
          const secondResult =
            listClients.execute()
  
          expect(
            secondResult.total,
          ).toBe(
            mockClients.length,
          )
        },
      )
    },
  )