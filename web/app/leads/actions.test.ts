import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  transaction: vi.fn(),
  findLead: vi.fn(),
  findInitialState: vi.fn(),
  findActiveStage: vi.fn(),
  updateLead: vi.fn(),
  createJourney: vi.fn(),
  createEvents: vi.fn(),
  ensureExecution: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT") }),
}))

vi.mock("@/infrastructure/prisma/client", () => ({
  prisma: { $transaction: mocks.transaction },
}))

vi.mock("@/lib/auth/get-authenticated-commercial-context", () => ({
  getAuthenticatedCommercialContext: mocks.getContext,
}))

vi.mock("@/application/execution/r2-execution-service", () => ({
  ensureOpportunityExecutionState: mocks.ensureExecution,
}))

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))

import { triageDataCrazyLeadAction } from "./actions"

function transactionClient() {
  return {
    lead: {
      findFirst: mocks.findLead,
      updateMany: mocks.updateLead,
    },
    journeyState: { findFirst: mocks.findInitialState },
    pipelineStage: { findFirst: mocks.findActiveStage },
    commercialJourney: { create: mocks.createJourney },
    commercialEvent: { createMany: mocks.createEvents },
  }
}

function formData(approachType: "NEW" | "REACTIVATION") {
  const data = new FormData()
  data.set("approachType", approachType)
  return data
}

describe("triageDataCrazyLeadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getContext.mockResolvedValue({
      userId: "user-1",
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      role: "CONSULTANT",
    })
    mocks.findLead.mockResolvedValue({
      id: "lead-1",
      name: "Contato Data Crazy",
      notes: "[IMPORTAÇÃO DATA CRAZY — TRIAGEM PENDENTE]\nData Crazy ID: dc-1",
      approachType: null,
      consortiumType: "REAL_ESTATE",
      pipelineStage: { name: "Backlog Data Crazy" },
      commercialJourneys: [],
    })
    mocks.findInitialState.mockResolvedValue({ id: "state-1", phaseId: "phase-1" })
    mocks.findActiveStage.mockResolvedValue({ id: "stage-1" })
    mocks.updateLead.mockResolvedValue({ count: 1 })
    mocks.createJourney.mockResolvedValue({ id: "journey-1" })
    mocks.createEvents.mockResolvedValue({ count: 2 })
    mocks.transaction.mockImplementation(async (operation) => operation(transactionClient()))
  })

  it("classifica no workspace autenticado e só então cria a oportunidade", async () => {
    await expect(
      triageDataCrazyLeadAction("lead-1", formData("NEW")),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(mocks.findLead).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "lead-1",
        workspaceId: "workspace-1",
        consultantId: "consultant-1",
      }),
    }))
    expect(mocks.updateLead).toHaveBeenCalledWith(expect.objectContaining({
      data: { approachType: "NEW", pipelineStageId: "stage-1" },
    }))
    expect(mocks.createJourney).toHaveBeenCalledTimes(1)
    expect(mocks.createEvents).toHaveBeenCalledTimes(1)
    expect(mocks.ensureExecution).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      opportunityId: "journey-1",
    })
  })

  it("preserva o gate de reativação ao iniciar a execução", async () => {
    await expect(
      triageDataCrazyLeadAction("lead-1", formData("REACTIVATION")),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(mocks.updateLead).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ approachType: "REACTIVATION" }),
    }))
    expect(mocks.ensureExecution).toHaveBeenCalledTimes(1)
  })

  it("não permite triagem de lead fora da origem Data Crazy", async () => {
    mocks.findLead.mockResolvedValue({
      id: "lead-1",
      name: "Outro lead",
      notes: null,
      approachType: null,
      consortiumType: "OTHER",
      pipelineStage: { name: "Prospecção" },
      commercialJourneys: [],
    })

    await expect(
      triageDataCrazyLeadAction("lead-1", formData("NEW")),
    ).rejects.toThrow("Lead Data Crazy não encontrado")
    expect(mocks.updateLead).not.toHaveBeenCalled()
    expect(mocks.createJourney).not.toHaveBeenCalled()
  })

  it("não duplica oportunidade ao repetir a mesma classificação", async () => {
    mocks.findLead.mockResolvedValue({
      id: "lead-1",
      name: "Contato Data Crazy",
      notes: "[IMPORTAÇÃO DATA CRAZY — TRIAGEM PENDENTE]\nData Crazy ID: dc-1",
      approachType: "NEW",
      consortiumType: "REAL_ESTATE",
      pipelineStage: { name: "Prospecção" },
      commercialJourneys: [{ id: "journey-existing" }],
    })

    await expect(
      triageDataCrazyLeadAction("lead-1", formData("NEW")),
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(mocks.updateLead).not.toHaveBeenCalled()
    expect(mocks.createJourney).not.toHaveBeenCalled()
    expect(mocks.ensureExecution).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      opportunityId: "journey-existing",
    })
  })
})
