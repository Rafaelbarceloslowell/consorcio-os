import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  LeadUpdateActionState,
} from "@/types/lead-update"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  transaction: vi.fn(),
  findCurrentLead: vi.fn(),
  findConsultant: vi.fn(),
  findLeads: vi.fn(),
  findClients: vi.fn(),
  updateLead: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
      $transaction:
        mocks.transaction,
    },
  }),
)

vi.mock("next/cache", () => ({
  revalidatePath:
    mocks.revalidatePath,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

import {
  updateLeadAction,
} from "./actions"

const initialState:
  LeadUpdateActionState = {
    status: "idle",
    message: null,
  }

function createFormData(
  overrides: Record<
    string,
    string
  > = {},
): FormData {
  const values = {
    name: " Alex Silva ",
    email: " ALEX@EXAMPLE.COM ",
    phoneCountryCode: "55",
    phone: "(41) 99999-9999",
    document: "123.456.789-01",
    companyName: "",
    source: "referral",
    consortiumType:
      "real_estate",
    desiredCreditValue:
      "500.000,00",
    desiredTermMonths: "200",
    consultantId:
      "consultant-1",
    notes: " Projeto ativo. ",
    returnTo:
      "/opportunities/journey-1",
    ...overrides,
  }

  const formData = new FormData()

  for (const [key, value] of
    Object.entries(values)) {
    formData.set(key, value)
  }

  return formData
}

function createTransactionClient() {
  return {
    lead: {
      findFirst:
        mocks.findCurrentLead,
      findMany:
        mocks.findLeads,
      update: mocks.updateLead,
    },
    consultant: {
      findFirst:
        mocks.findConsultant,
    },
    client: {
      findMany: mocks.findClients,
    },
  }
}

describe("updateLeadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.findCurrentLead.mockResolvedValue({
      id: "lead-1",
    })
    mocks.findConsultant.mockResolvedValue({
      id: "consultant-1",
    })
    mocks.findLeads.mockResolvedValue([])
    mocks.findClients.mockResolvedValue([])
    mocks.updateLead.mockResolvedValue({
      id: "lead-1",
    })
    mocks.transaction.mockImplementation(
      async (
        operation: (
          transaction: ReturnType<
            typeof createTransactionClient
          >,
        ) => unknown,
      ) =>
        operation(
          createTransactionClient(),
        ),
    )
  })

  it("atualiza os dados reais do lead e volta para a oportunidade", async () => {
    await expect(
      updateLeadAction(
        "lead-1",
        initialState,
        createFormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.updateLead,
    ).toHaveBeenCalledTimes(1)

    const updateInput =
      mocks.updateLead.mock.calls[0]?.[0]

    expect(updateInput).toMatchObject({
      where: {
        id: "lead-1",
      },
      data: {
        name: "Alex Silva",
        email: "alex@example.com",
        phone: "5541999999999",
        document: "12345678901",
        companyName: null,
        source: "REFERRAL",
        consortiumType:
          "REAL_ESTATE",
        desiredTermMonths: 200,
        consultantId:
          "consultant-1",
        notes: "Projeto ativo.",
      },
      select: {
        id: true,
      },
    })

    expect(
      updateInput.data,
    ).not.toHaveProperty("status")
    expect(
      updateInput.data,
    ).not.toHaveProperty(
      "pipelineStageId",
    )
    expect(
      updateInput.data,
    ).not.toHaveProperty("score")

    expect(
      mocks.revalidatePath,
    ).toHaveBeenCalledWith("/leads")
    expect(
      mocks.revalidatePath,
    ).toHaveBeenCalledWith(
      "/opportunities/journey-1",
    )
    expect(
      mocks.redirect,
    ).toHaveBeenCalledExactlyOnceWith(
      "/opportunities/journey-1",
    )
  })

  it("permite remover o e-mail exibido usando endereço interno", async () => {
    await expect(
      updateLeadAction(
        "lead-1",
        initialState,
        createFormData({
          email: "",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.updateLead,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data:
          expect.objectContaining({
            email:
              "lead-5541999999999@sem-email.gorila.local",
          }),
      }),
    )
  })

  it("bloqueia contato já pertencente a cliente", async () => {
    mocks.findClients.mockResolvedValue([
      {
        email: "alex@example.com",
        phone: "5511000000000",
      },
    ])

    const result =
      await updateLeadAction(
        "lead-1",
        initialState,
        createFormData(),
      )

    expect(result).toMatchObject({
      status: "error",
      message:
        "Este contato já pertence a um cliente cadastrado.",
      fieldErrors: {
        email:
          "Este e-mail já pertence a um cliente.",
      },
    })
    expect(
      mocks.updateLead,
    ).not.toHaveBeenCalled()
  })

  it("valida os campos antes de acessar o banco", async () => {
    const result =
      await updateLeadAction(
        "lead-1",
        initialState,
        createFormData({
          name: "",
          email: "inválido",
          phone: "",
          desiredCreditValue: "0",
          desiredTermMonths: "0",
        }),
      )

    expect(result).toMatchObject({
      status: "error",
      fieldErrors: {
        name:
          "Informe o nome do lead.",
        email:
          "Informe um e-mail válido.",
        phone:
          "Informe um telefone válido com DDD.",
        desiredCreditValue:
          "Informe um valor de crédito maior que zero.",
        desiredTermMonths:
          "Informe um prazo inteiro maior que zero.",
      },
    })
    expect(
      mocks.findWorkspace,
    ).not.toHaveBeenCalled()
  })

  it("rejeita retorno externo e usa a lista de leads", async () => {
    await expect(
      updateLeadAction(
        "lead-1",
        initialState,
        createFormData({
          returnTo:
            "https://example.com",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.redirect,
    ).toHaveBeenCalledWith("/leads")
  })
})
