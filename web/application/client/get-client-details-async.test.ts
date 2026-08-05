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

import {
  GetClientDetailsAsync,
} from "./get-client-details-async"

function createClient(
  overrides:
    Partial<Client> = {},
): Client {
  return {
    id: "client-1",
    type: "individual",
    name: "Ana Lima",
    email: "ana@example.com",
    phone: "5511999999999",
    document: "12345678901",
    birthDate:
      "1990-05-10T00:00:00.000Z",
    address: {
      street: "Rua A",
      number: "10",
      complement: "Apto 1",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000000",
    },
    consultantId:
      "consultant-1",
    status: "active",
    tags: ["vip"],
    notes: "Interno",
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-02T00:00:00.000Z",
    ...overrides,
  }
}

function createConsultant():
  Consultant {
  return {
    id: "consultant-1",
    name: "Marina Costa",
    email: "marina@example.com",
    phone: "5511888888888",
    document: "98765432100",
    role: "consultant",
    team: "Sul",
    region: "SP",
    status: "active",
    monthlySalesTarget: 10,
    monthlyLeadsTarget: 20,
    createdAt:
      "2026-07-01T00:00:00.000Z",
    updatedAt:
      "2026-07-01T00:00:00.000Z",
  }
}

function createSubject({
  client = createClient(),
  consultant =
    createConsultant(),
}: {
  client?: Client | null
  consultant?:
    Consultant | null
} = {}) {
  const findClientById =
    vi.fn().mockResolvedValue(
      client ?? undefined,
    )
  const findConsultantById =
    vi.fn().mockResolvedValue(
      consultant ?? undefined,
    )

  return {
    subject:
      new GetClientDetailsAsync({
        workspaceId:
          "workspace-1",
        clients: {
          findById:
            findClientById,
        },
        consultants: {
          findById:
            findConsultantById,
        },
      }),
    findClientById,
    findConsultantById,
  }
}

describe(
  "GetClientDetailsAsync",
  () => {
    it("retorna view model completo sem expor a entidade", async () => {
      const repositoryClient =
        createClient()
      const snapshot =
        structuredClone(
          repositoryClient,
        )
      const { subject } =
        createSubject({
          client:
            repositoryClient,
        })

      const result =
        await subject.execute({
          workspaceId:
            " workspace-1 ",
          clientId:
            " client-1 ",
        })

      expect(result.client)
        .toEqual({
          id: "client-1",
          type: "individual",
          name: "Ana Lima",
          email:
            "ana@example.com",
          phone:
            "5511999999999",
          document:
            "12345678901",
          birthDate:
            "1990-05-10T00:00:00.000Z",
          companyName: null,
          tradeName: null,
          stateRegistration: null,
          address: {
            street: "Rua A",
            number: "10",
            complement:
              "Apto 1",
            neighborhood:
              "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode:
              "01000000",
          },
          consultantId:
            "consultant-1",
          consultantName:
            "Marina Costa",
          status: "active",
          createdAt:
            "2026-07-01T00:00:00.000Z",
          updatedAt:
            "2026-07-02T00:00:00.000Z",
        })
      expect(result.client)
        .not.toBe(repositoryClient)
      expect(result.client.address)
        .not.toBe(
          repositoryClient.address,
        )

      result.client.name =
        "Nome alterado na view"
      result.client.address.city =
        "Outra cidade"

      expect(repositoryClient)
        .toEqual(snapshot)
    })

    it("normaliza IDs e consulta os repositories com argumentos exatos", async () => {
      const {
        subject,
        findClientById,
        findConsultantById,
      } = createSubject()

      await subject.execute({
        workspaceId:
          " workspace-1 ",
        clientId:
          " client-1 ",
      })

      expect(findClientById)
        .toHaveBeenCalledExactlyOnceWith(
          "client-1",
        )
      expect(findConsultantById)
        .toHaveBeenCalledExactlyOnceWith(
          "consultant-1",
        )
    })

    it("trata campos opcionais e consultor ausente", async () => {
      const { subject } =
        createSubject({
          client: createClient({
            birthDate: undefined,
            companyName: undefined,
            tradeName: undefined,
            stateRegistration:
              undefined,
            address: {
              ...createClient()
                .address,
              complement:
                undefined,
            },
          }),
          consultant: null,
        })

      const { client } =
        await subject.execute({
          workspaceId:
            "workspace-1",
          clientId: "client-1",
        })

      expect(client.birthDate)
        .toBeNull()
      expect(client.companyName)
        .toBeNull()
      expect(client.tradeName)
        .toBeNull()
      expect(
        client.stateRegistration,
      ).toBeNull()
      expect(
        client.address.complement,
      ).toBeNull()
      expect(
        client.consultantName,
      ).toBe(
        "Consultor não identificado",
      )
    })

    it("rejeita cliente inexistente", async () => {
      const {
        subject,
        findConsultantById,
      } = createSubject({
        client: null,
      })

      await expect(
        subject.execute({
          workspaceId:
            "workspace-1",
          clientId: "client-404",
        }),
      ).rejects.toThrow(
        'Cliente não encontrado para o ID "client-404".',
      )
      expect(findConsultantById)
        .not.toHaveBeenCalled()
    })

    it("impede consulta com outro workspace", async () => {
      const {
        subject,
        findClientById,
        findConsultantById,
      } = createSubject()

      await expect(
        subject.execute({
          workspaceId:
            "workspace-2",
          clientId: "client-1",
        }),
      ).rejects.toThrow(
        'Cliente não encontrado para o ID "client-1".',
      )
      expect(findClientById)
        .not.toHaveBeenCalled()
      expect(findConsultantById)
        .not.toHaveBeenCalled()
    })

    it("propaga erro do repository por identidade", async () => {
      const error =
        new Error(
          "Falha no repository",
        )
      const { subject, findClientById } =
        createSubject()
      findClientById
        .mockRejectedValue(error)

      await expect(
        subject.execute({
          workspaceId:
            "workspace-1",
          clientId: "client-1",
        }),
      ).rejects.toBe(error)
    })

    it("rejeita workspace e cliente vazios antes da consulta", async () => {
      const {
        subject,
        findClientById,
      } = createSubject()

      await expect(
        subject.execute({
          workspaceId: " ",
          clientId: "client-1",
        }),
      ).rejects.toThrow(
        "O workspace é obrigatório para consultar o cliente.",
      )
      await expect(
        subject.execute({
          workspaceId:
            "workspace-1",
          clientId: " ",
        }),
      ).rejects.toThrow(
        "O ID do cliente é obrigatório.",
      )
      expect(findClientById)
        .not.toHaveBeenCalled()
    })
  },
)
