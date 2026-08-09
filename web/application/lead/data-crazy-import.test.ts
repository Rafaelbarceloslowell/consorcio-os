import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildDataCrazyImportPlan,
  normalizeDataCrazyEmail,
  normalizeDataCrazyPhone,
  type DataCrazySourceRow,
} from "./data-crazy-import"

function sourceRow(
  overrides: Partial<DataCrazySourceRow> = {},
): DataCrazySourceRow {
  return {
    id: "source-1",
    workspaceId: "local-workspace",
    name: "Contato Real",
    email: "contato@empresa.com.br",
    phone: "+55 (41) 99801-4184",
    document: null,
    companyName: null,
    source: "OTHER",
    status: "CONTACTED",
    consortiumType: "REAL_ESTATE",
    desiredCreditValue: "500000",
    desiredTermMonths: 200,
    score: 0,
    notes: [
      "[IMPORTAÇÃO DATA CRAZY — LEAD REATIVADO]",
      "Data Crazy ID: dc-1",
      "Funil principal: INBOUND",
    ].join("\n"),
    sourceCreatedAt: new Date("2026-08-04T07:41:16.898Z"),
    pipelineStageName: "Reativação Data Crazy",
    ...overrides,
  }
}

describe("Data Crazy controlled import", () => {
  it("normaliza telefone brasileiro sem colapsar números internacionais", () => {
    expect(normalizeDataCrazyPhone("(41) 99801-4184")).toBe("5541998014184")
    expect(normalizeDataCrazyPhone("+351 916 855 779")).toBe("351916855779")
    expect(normalizeDataCrazyPhone("123")).toBeNull()
  })

  it("trata placeholder interno como e-mail ausente", () => {
    expect(normalizeDataCrazyEmail(" CONTATO@EMPRESA.COM.BR ")).toBe("contato@empresa.com.br")
    expect(normalizeDataCrazyEmail("dc-1@sem-email.gorila.local")).toBeNull()
  })

  it("mapeia lead real como triagem pendente sem criar jornada", () => {
    const plan = buildDataCrazyImportPlan({
      sourceRows: [sourceRow()],
      targetWorkspaceId: "target-workspace",
      existingContacts: [],
    })

    expect(plan.wouldCreate).toHaveLength(1)
    expect(plan.untriagedRows).toBe(1)
    expect(plan.wouldCreate[0]).toMatchObject({
      dataCrazyId: "dc-1",
      approachType: null,
      createJourney: false,
      phone: "5541998014184",
    })
    expect(plan.wouldCreate[0]?.notes).toContain("TRIAGEM PENDENTE")
  })

  it("deduplica primeiro por telefone e depois por e-mail sem sobrescrever", () => {
    const plan = buildDataCrazyImportPlan({
      sourceRows: [sourceRow()],
      targetWorkspaceId: "target-workspace",
      existingContacts: [{
        workspaceId: "target-workspace",
        email: "outro@empresa.com.br",
        phone: "5541998014184",
      }],
    })

    expect(plan.wouldCreate).toHaveLength(0)
    expect(plan.wouldRequireReview).toEqual([
      expect.objectContaining({ reason: expect.stringContaining("Telefone") }),
    ])
  })

  it("preserva isolamento entre workspaces", () => {
    const plan = buildDataCrazyImportPlan({
      sourceRows: [sourceRow()],
      targetWorkspaceId: "target-workspace",
      existingContacts: [{
        workspaceId: "other-workspace",
        email: "contato@empresa.com.br",
        phone: "5541998014184",
      }],
    })

    expect(plan.wouldCreate).toHaveLength(1)
  })

  it("é idempotente por Data Crazy ID", () => {
    const plan = buildDataCrazyImportPlan({
      sourceRows: [sourceRow()],
      targetWorkspaceId: "target-workspace",
      existingContacts: [{
        workspaceId: "target-workspace",
        email: "outro@empresa.com.br",
        phone: "5511999999999",
        notes: "Data Crazy ID: dc-1",
      }],
    })

    expect(plan.wouldCreate).toHaveLength(0)
    expect(plan.wouldSkipDuplicate).toHaveLength(1)
  })

  it("rejeita fixture conhecida e linha inválida", () => {
    const plan = buildDataCrazyImportPlan({
      sourceRows: [
        sourceRow({ id: "fixture", name: "Janaina Rodrigues" }),
        sourceRow({ id: "invalid", phone: "123", notes: "Data Crazy ID: dc-2" }),
      ],
      targetWorkspaceId: "target-workspace",
      existingContacts: [],
    })

    expect(plan.invalidRows).toHaveLength(1)
    expect(plan.wouldRequireReview).toHaveLength(1)
    expect(plan.wouldCreate).toHaveLength(0)
  })
})
