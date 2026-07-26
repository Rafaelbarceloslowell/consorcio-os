import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  Client,
  Consultant,
} from "@/types/domain"

import type {
  CreateClientInput,
} from "./create-client"

import type {
  CreateClientAsyncDependencies,
} from "./create-client-async"

import {
  CreateClientAsync,
} from "./create-client-async"

const consultant: Consultant = {
  id: "consultant-1",
  name: "Consultora CRM",
  email: "consultora@example.com",
  phone: "+5541999990000",
  document: "12345678901",
  role: "consultant",
  team: "Sul",
  region: "PR",
  status: "active",
  monthlySalesTarget: 10,
  monthlyLeadsTarget: 20,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
}

function createValidInput(): CreateClientInput {
  return {
    type: "individual",
    name: "  Rafael Barcelos  ",
    email: "  RAFAEL.NOVO@EXAMPLE.COM  ",
    phone: "(41) 99999-8877",
    document: "529.982.247-25",
    birthDate: "1996-01-10",
    consultantId: consultant.id,
    address: {
      street: "  Rua das Flores  ",
      number: "  100  ",
      complement: "  Apartamento 10  ",
      neighborhood: "  Centro  ",
      city: "  Curitiba  ",
      state: "  pr  ",
      zipCode: "80000-000",
    },
    tags: [
      "  Alto potencial  ",
      "Investidor",
      "alto potencial",
      "  ",
    ],
    notes:
      "  Cliente cadastrado diretamente no CRM.  ",
  }
}

function createStoredClient(
  overrides: Partial<Client> = {},
): Client {
  return {
    id: "client-existing",
    type: "individual",
    name: "Cliente Existente",
    email: "cliente.existente@example.com",
    phone: "+5541988887777",
    document: "111.444.777-35",
    address: {
      street: "Rua Existente",
      number: "10",
      neighborhood: "Centro",
      city: "Curitiba",
      state: "PR",
      zipCode: "80000000",
    },
    consultantId: consultant.id,
    status: "active",
    tags: [],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  }
}

function createDependencies({
  clients = [],
  createError,
}: {
  clients?: Client[]
  createError?: Error
} = {}) {
  const findClients =
    vi.fn(async () => [
      ...clients,
    ])

  const createClient =
    vi.fn(
      async (
        client: Client,
      ): Promise<Client> => {
        if (createError) {
          throw createError
        }

        return client
      },
    )

  const findConsultant =
    vi.fn(
      async (
        consultantId: string,
      ): Promise<Consultant | undefined> =>
        consultantId ===
        consultant.id
          ? consultant
          : undefined,
    )

  const dependencies:
    CreateClientAsyncDependencies = {
      clients: {
        findAll: findClients,
        findById:
          vi.fn(async () =>
            undefined,
          ),
        create: createClient,
        update:
          vi.fn(async () =>
            undefined,
          ),
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
    findClients,
    createClient,
    findConsultant,
  }
}

describe(
  "CreateClientAsync",
  () => {
    it(
      "cria pessoa física normalizada usando now e generateId injetados",
      async () => {
        const {
          dependencies,
          createClient,
        } =
          createDependencies()

        const useCase =
          new CreateClientAsync(
            dependencies,
            {
              now:
                new Date(
                  "2026-07-23T14:00:00.000Z",
                ),
              generateId:
                () =>
                  "client-new",
            },
          )

        const result =
          await useCase.execute(
            createValidInput(),
          )

        expect(
          result.client,
        ).toEqual({
          id: "client-new",
          type: "individual",
          name: "Rafael Barcelos",
          email:
            "rafael.novo@example.com",
          phone:
            "+5541999998877",
          document:
            "529.982.247-25",
          birthDate:
            "1996-01-10",
          companyName:
            undefined,
          tradeName:
            undefined,
          stateRegistration:
            undefined,
          address: {
            street:
              "Rua das Flores",
            number: "100",
            complement:
              "Apartamento 10",
            neighborhood:
              "Centro",
            city: "Curitiba",
            state: "PR",
            zipCode:
              "80000-000",
          },
          consultantId:
            consultant.id,
          leadId: undefined,
          status: "active",
          tags: [
            "Alto potencial",
            "Investidor",
          ],
          notes:
            "Cliente cadastrado diretamente no CRM.",
          createdAt:
            "2026-07-23T14:00:00.000Z",
          updatedAt:
            "2026-07-23T14:00:00.000Z",
        })

        expect(
          createClient,
        ).toHaveBeenCalledWith(
          result.client,
        )
      },
    )

    it(
      "cria pessoa jurídica usando a razão social como nome",
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const result =
          await new CreateClientAsync(
            dependencies,
            {
              generateId:
                () =>
                  "client-company",
            },
          ).execute({
            ...createValidInput(),
            type: "company",
            name: "",
            email:
              "empresa@example.com",
            phone:
              "+55 41 3333-2222",
            document:
              "12.345.678/0001-95",
            companyName:
              "  Consórcio Exemplo Ltda.  ",
            tradeName:
              "  Consórcio Exemplo  ",
            stateRegistration:
              "  123456789  ",
          })

        expect(
          result.client,
        ).toMatchObject({
          id: "client-company",
          type: "company",
          name:
            "Consórcio Exemplo Ltda.",
          companyName:
            "Consórcio Exemplo Ltda.",
          tradeName:
            "Consórcio Exemplo",
          stateRegistration:
            "123456789",
          phone:
            "+554133332222",
          status: "active",
        })
      },
    )

    it(
      "exige razão social para pessoa jurídica",
      async () => {
        const {
          dependencies,
          createClient,
        } =
          createDependencies()

        await expect(
          new CreateClientAsync(
            dependencies,
          ).execute({
            ...createValidInput(),
            type: "company",
            name: "",
            companyName: "  ",
            document:
              "12.345.678/0001-95",
          }),
        ).rejects.toThrow(
          "A razão social é obrigatória para clientes do tipo empresa.",
        )

        expect(
          createClient,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita consultor inexistente sem consultar ou criar clientes",
      async () => {
        const {
          dependencies,
          findClients,
          createClient,
        } =
          createDependencies()

        await expect(
          new CreateClientAsync(
            dependencies,
          ).execute({
            ...createValidInput(),
            consultantId:
              "consultant-missing",
          }),
        ).rejects.toThrow(
          'Consultor não encontrado para o ID "consultant-missing".',
        )

        expect(
          findClients,
        ).not.toHaveBeenCalled()
        expect(
          createClient,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita e-mail duplicado ignorando caixa e espaços",
      async () => {
        const {
          dependencies,
          createClient,
        } =
          createDependencies({
            clients: [
              createStoredClient({
                email:
                  "rafael.novo@example.com",
              }),
            ],
          })

        await expect(
          new CreateClientAsync(
            dependencies,
          ).execute(
            createValidInput(),
          ),
        ).rejects.toThrow(
          'Já existe um cliente cadastrado com o e-mail "rafael.novo@example.com".',
        )

        expect(
          createClient,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita telefone duplicado ignorando formatação",
      async () => {
        const {
          dependencies,
          createClient,
        } =
          createDependencies({
            clients: [
              createStoredClient({
                phone:
                  "+55 (41) 99999-8877",
              }),
            ],
          })

        await expect(
          new CreateClientAsync(
            dependencies,
          ).execute(
            createValidInput(),
          ),
        ).rejects.toThrow(
          "Já existe um cliente cadastrado com o telefone informado.",
        )

        expect(
          createClient,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "rejeita documento duplicado ignorando formatação",
      async () => {
        const {
          dependencies,
          createClient,
        } =
          createDependencies({
            clients: [
              createStoredClient({
                document:
                  "52998224725",
              }),
            ],
          })

        await expect(
          new CreateClientAsync(
            dependencies,
          ).execute(
            createValidInput(),
          ),
        ).rejects.toThrow(
          "Já existe um cliente cadastrado com o documento informado.",
        )

        expect(
          createClient,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "propaga erro do repository de criação",
      async () => {
        const repositoryError =
          new Error(
            "Falha ao persistir cliente.",
          )

        const {
          dependencies,
          createClient,
        } =
          createDependencies({
            createError:
              repositoryError,
          })

        await expect(
          new CreateClientAsync(
            dependencies,
          ).execute(
            createValidInput(),
          ),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          createClient,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      "aguarda as dependências assíncronas na ordem do fluxo",
      async () => {
        const {
          dependencies,
          findClients,
          createClient,
        } =
          createDependencies()

        let resolveConsultant:
          (
            value:
              Consultant |
              undefined,
          ) => void =
          () => {}

        dependencies
          .consultants
          .findById =
          vi.fn(
            () =>
              new Promise<
                Consultant |
                undefined
              >(
                (resolve) => {
                  resolveConsultant =
                    resolve
                },
              ),
          )

        const execution =
          new CreateClientAsync(
            dependencies,
          ).execute(
            createValidInput(),
          )

        expect(
          findClients,
        ).not.toHaveBeenCalled()
        expect(
          createClient,
        ).not.toHaveBeenCalled()

        resolveConsultant(
          consultant,
        )

        await execution

        expect(
          findClients,
        ).toHaveBeenCalledTimes(
          1,
        )
        expect(
          createClient,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )
  },
)
