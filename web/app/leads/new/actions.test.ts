import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  LeadCreateActionState,
} from "@/types/lead-create"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  transaction: vi.fn(),
  findConsultant: vi.fn(),
  findLeads: vi.fn(),
  findClients: vi.fn(),
  findPipelineStage: vi.fn(),
  findLastPipelineStage: vi.fn(),
  createPipelineStage: vi.fn(),
  findInitialState: vi.fn(),
  findInitialPhase: vi.fn(),
  createLead: vi.fn(),
  createJourney: vi.fn(),
  createEvent: vi.fn(),
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
  createLeadAction,
} from "./actions"

const initialState:
  LeadCreateActionState = {
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
    name: " Maria Oliveira ",
    email:
      " MARIA@EXAMPLE.COM ",
    phoneCountryCode: "55",
    phone: "(41) 99999-9999",
    document: "123.456.789-01",
    companyName: "",
    source: "social_media",
    consortiumType:
      "real_estate",
    desiredCreditValue:
      "500.000,00",
    desiredTermMonths: "200",
    consultantId:
      "consultant-1",
    notes:
      " Primeiro imóvel. ",
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
    consultant: {
      findFirst:
        mocks.findConsultant,
    },
    lead: {
      findMany: mocks.findLeads,
      create: mocks.createLead,
    },
    client: {
      findMany: mocks.findClients,
    },
    pipelineStage: {
      findFirst: vi
        .fn()
        .mockImplementationOnce(
          mocks.findPipelineStage,
        )
        .mockImplementationOnce(
          mocks.findLastPipelineStage,
        ),
      create:
        mocks.createPipelineStage,
    },
    journeyState: {
      findFirst:
        mocks.findInitialState,
    },
    journeyPhase: {
      findFirst:
        mocks.findInitialPhase,
    },
    commercialJourney: {
      create: mocks.createJourney,
    },
    commercialEvent: {
      create: mocks.createEvent,
    },
  }
}

describe("createLeadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.findConsultant.mockResolvedValue({
      id: "consultant-1",
    })
    mocks.findLeads.mockResolvedValue([])
    mocks.findClients.mockResolvedValue([])
    mocks.findPipelineStage.mockResolvedValue({
      id: "stage-1",
    })
    mocks.findLastPipelineStage.mockResolvedValue(
      null,
    )
    mocks.createPipelineStage.mockResolvedValue({
      id: "stage-created",
    })
    mocks.findInitialState.mockResolvedValue({
      id: "state-1",
      phaseId: "phase-1",
    })
    mocks.findInitialPhase.mockResolvedValue({
      id: "phase-1",
    })
    mocks.createLead.mockResolvedValue({
      id: "lead-created",
    })
    mocks.createJourney.mockResolvedValue({
      id: "journey-created",
    })
    mocks.createEvent.mockResolvedValue({
      id: "event-created",
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

  it("cria lead e oportunidade sem criar cliente", async () => {
    const formData = createFormData()
    formData.set(
      "clientId",
      "client-forged",
    )
    formData.set(
      "workspaceId",
      "workspace-forged",
    )

    await expect(
      createLeadAction(
        initialState,
        formData,
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.createLead,
    ).toHaveBeenCalledExactlyOnceWith({
      data:
        expect.objectContaining({
          workspaceId:
            "workspace-1",
          name: "Maria Oliveira",
          email:
            "maria@example.com",
          phone: "5541999999999",
          document:
            "12345678901",
          companyName: null,
          source: "SOCIAL_MEDIA",
          status: "NEW",
          consortiumType:
            "REAL_ESTATE",
          desiredTermMonths: 200,
          consultantId:
            "consultant-1",
          pipelineStageId:
            "stage-1",
          convertedClientId: null,
        }),
      select: {
        id: true,
      },
    })

    expect(
      mocks.createJourney,
    ).toHaveBeenCalledExactlyOnceWith({
      data:
        expect.objectContaining({
          workspaceId:
            "workspace-1",
          leadId: "lead-created",
          clientId: null,
          title:
            "Oportunidade - Maria Oliveira",
          consultantId:
            "consultant-1",
          currentPhaseId:
            "phase-1",
          currentStateId:
            "state-1",
        }),
      select: {
        id: true,
      },
    })

    expect(
      mocks.createEvent,
    ).toHaveBeenCalledTimes(2)
    expect(
      mocks.revalidatePath,
    ).toHaveBeenCalledWith("/leads")
    expect(
      mocks.redirect,
    ).toHaveBeenCalledExactlyOnceWith(
      "/leads",
    )
  })

  it("bloqueia telefone duplicado de outro lead", async () => {
    mocks.findLeads.mockResolvedValue([
      {
        email:
          "outro@example.com",
        phone:
          "+55 (41) 99999-9999",
      },
    ])

    const result =
      await createLeadAction(
        initialState,
        createFormData(),
      )

    expect(result).toMatchObject({
      status: "error",
      message:
        "Já existe um lead cadastrado com o telefone informado.",
      fieldErrors: {
        phone:
          "Este telefone já pertence a outro lead.",
      },
    })
    expect(
      mocks.createLead,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createJourney,
    ).not.toHaveBeenCalled()
  })

  it("bloqueia contato que já pertence a cliente", async () => {
    mocks.findClients.mockResolvedValue([
      {
        email:
          "maria@example.com",
        phone: "5511000000000",
      },
    ])

    const result =
      await createLeadAction(
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
      mocks.createLead,
    ).not.toHaveBeenCalled()
  })

  it("permite lead sem e-mail usando endereço interno não exibido ao usuário", async () => {
    await expect(
      createLeadAction(
        initialState,
        createFormData({
          email: "",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.createLead,
    ).toHaveBeenCalledWith({
      data:
        expect.objectContaining({
          email:
            "lead-5541999999999@sem-email.gorila.local",
          phone:
            "5541999999999",
          convertedClientId: null,
        }),
      select: {
        id: true,
      },
    })
  })

  it("cria a etapa Em atendimento quando não existe etapa aberta", async () => {
    mocks.findPipelineStage.mockResolvedValue(
      null,
    )
    mocks.findLastPipelineStage.mockResolvedValue({
      order: 3,
    })

    await expect(
      createLeadAction(
        initialState,
        createFormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(
      mocks.createPipelineStage,
    ).toHaveBeenCalledWith({
      data:
        expect.objectContaining({
          workspaceId:
            "workspace-1",
          name: "Em atendimento",
          order: 4,
          type: "LEAD",
          isClosedStage: false,
          isWonStage: false,
        }),
      select: {
        id: true,
      },
    })
  })

  it("valida os dados antes de consultar o workspace", async () => {
    const result =
      await createLeadAction(
        initialState,
        createFormData({
          desiredCreditValue: "0",
          desiredTermMonths: "0",
          email: "inválido",
        }),
      )

    expect(result).toMatchObject({
      status: "error",
      fieldErrors: {
        email:
          "Informe um e-mail válido.",
        desiredCreditValue:
          "Informe um valor de crédito maior que zero.",
        desiredTermMonths:
          "Informe um prazo inteiro maior que zero.",
      },
    })
    expect(
      mocks.findWorkspace,
    ).not.toHaveBeenCalled()
    expect(
      mocks.transaction,
    ).not.toHaveBeenCalled()
  })
})
