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
  UpdateClientAsync,
} from "./update-client-async"

function client(
  overrides:
    Partial<Client> = {},
): Client {
  return {
    id: "client-1",
    type: "individual",
    name: "Ana",
    email: "ana@example.com",
    phone: "5511999999999",
    document: "12345678901",
    address: {
      street: "Rua A",
      number: "1",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000000",
    },
    consultantId: "consultant-1",
    leadId: "lead-1",
    status: "blocked",
    tags: ["vip"],
    notes: "Preservar",
    createdAt:
      "2026-01-01T00:00:00.000Z",
    updatedAt:
      "2026-01-02T00:00:00.000Z",
    ...overrides,
  }
}

function consultant():
  Consultant {
  return {
    id: "consultant-1",
    name: "Marina",
    email: "m@example.com",
    phone: "1",
    document: "1",
    role: "consultant",
    team: "Sul",
    region: "SP",
    status: "active",
    monthlySalesTarget: 1,
    monthlyLeadsTarget: 1,
    createdAt:
      "2026-01-01T00:00:00.000Z",
    updatedAt:
      "2026-01-01T00:00:00.000Z",
  }
}

const input = {
  workspaceId: "workspace-1",
  clientId: "client-1",
  type: "individual" as const,
  name: " Ana Atualizada ",
  email: " ANA.NOVA@EXAMPLE.COM ",
  phone: "(11) 98888-7777",
  phoneCountryCode: "55",
  document: "123.456.789-01",
  consultantId: "consultant-1",
  address: {
    street: " Rua B ",
    number: " 2 ",
    neighborhood: " Bairro ",
    city: " Campinas ",
    state: " sp ",
    zipCode: "13000000",
  },
}

function setup(
  current:
    Client | undefined =
      client(),
) {
  const findById =
    vi.fn().mockResolvedValue(
      current,
    )
  const findAll =
    vi.fn().mockResolvedValue(
      current ? [current] : [],
    )
  const update =
    vi.fn(
      async (
        value: Client,
      ) => value,
    )
  const findConsultant =
    vi.fn().mockResolvedValue(
      consultant(),
    )

  return {
    subject:
      new UpdateClientAsync(
        {
          workspaceId:
            "workspace-1",
          clients: {
            findById,
            findAll,
            update,
          },
          consultants: {
            findById:
              findConsultant,
          },
        },
        {
          now: new Date(
            "2026-07-27T12:00:00.000Z",
          ),
        },
      ),
    findById,
    findAll,
    update,
    findConsultant,
  }
}

describe("UpdateClientAsync", () => {
  it("atualiza campos permitidos e preserva campos protegidos", async () => {
    const original = client()
    const snapshot =
      structuredClone(original)
    const {
      subject,
      update,
    } = setup(original)

    const result =
      await subject.execute(input)
    const persisted =
      update.mock.calls[0]?.[0]

    expect(update)
      .toHaveBeenCalledTimes(1)
    expect(persisted).toMatchObject({
      id: "client-1",
      name: "Ana Atualizada",
      email:
        "ana.nova@example.com",
      phone: "+5511988887777",
      consultantId:
        "consultant-1",
      leadId: "lead-1",
      status: "blocked",
      tags: ["vip"],
      notes: "Preservar",
      createdAt:
        "2026-01-01T00:00:00.000Z",
      updatedAt:
        "2026-07-27T12:00:00.000Z",
    })
    expect(
      persisted?.address,
    ).toEqual({
      street: "Rua B",
      number: "2",
      neighborhood: "Bairro",
      city: "Campinas",
      state: "SP",
      zipCode: "13000000",
    })
    expect(original).toEqual(
      snapshot,
    )
    expect(result.client)
      .not.toBe(persisted)
  })

  it("não acusa duplicidade ao manter os próprios dados", async () => {
    const original = client()
    const { subject, update } =
      setup(original)

    await subject.execute({
      ...input,
      name: original.name,
      email: original.email,
      phone: original.phone,
      phoneCountryCode:
        undefined,
      document:
        original.document,
      address:
        original.address,
    })

    expect(update)
      .toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      "email",
      client({
        id: "client-2",
        email:
          "ana.nova@example.com",
      }),
      'Já existe um cliente cadastrado com o e-mail "ana.nova@example.com".',
    ],
    [
      "telefone",
      client({
        id: "client-2",
        phone:
          "5511988887777",
      }),
      "Já existe um cliente cadastrado com o telefone informado.",
    ],
    [
      "documento",
      client({
        id: "client-2",
        document:
          "12345678901",
      }),
      "Já existe um cliente cadastrado com o documento informado.",
    ],
  ])(
    "rejeita duplicidade de %s",
    async (
      _field,
      duplicate,
      message,
    ) => {
      const context = setup()
      context.findAll
        .mockResolvedValue([
          client(),
          duplicate,
        ])

      await expect(
        context.subject.execute(
          input,
        ),
      ).rejects.toThrow(message)
      expect(context.update)
        .not.toHaveBeenCalled()
    },
  )

  it("rejeita cliente inexistente e outro workspace", async () => {
    const missing =
      setup()

    missing.findById
      .mockResolvedValue(undefined)
    missing.findAll
      .mockResolvedValue([])

    await expect(
      missing.subject.execute(
        input,
      ),
    ).rejects.toThrow(
      'Cliente não encontrado para o ID "client-1".',
    )

    const other = setup()
    await expect(
      other.subject.execute({
        ...input,
        workspaceId:
          "workspace-2",
      }),
    ).rejects.toThrow(
      'Cliente não encontrado para o ID "client-1".',
    )
    expect(other.findById)
      .not.toHaveBeenCalled()
  })

  it("reutiliza validações de criação e não persiste falhas", async () => {
    const context = setup()

    await expect(
      context.subject.execute({
        ...input,
        email: "inválido",
      }),
    ).rejects.toThrow()
    expect(context.findById)
      .not.toHaveBeenCalled()
    expect(context.update)
      .not.toHaveBeenCalled()
  })

  it("rejeita consultor inexistente", async () => {
    const context = setup()
    context.findConsultant
      .mockResolvedValue(undefined)

    await expect(
      context.subject.execute(
        input,
      ),
    ).rejects.toThrow(
      'Consultor não encontrado para o ID "consultant-1".',
    )
    expect(context.update)
      .not.toHaveBeenCalled()
  })

  it("propaga erro do repository por identidade", async () => {
    const error =
      new Error("Falha")
    const context = setup()
    context.update
      .mockRejectedValue(error)

    await expect(
      context.subject.execute(
        input,
      ),
    ).rejects.toBe(error)
  })
})

