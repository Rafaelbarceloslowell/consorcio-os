// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  findLeads: vi.fn(),
  listProps: vi.fn(),
}))

vi.mock(
  "@/components/lead/lead-list",
  () => ({
    LeadList: (props: {
      view: {
        leads: Array<{
          name: string
        }>
      }
    }) => {
      mocks.listProps(props)

      return (
        <p>
          {props.view.leads[0]
            ?.name ?? "Sem leads"}
        </p>
      )
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
      lead: {
        findMany:
          mocks.findLeads,
      },
    },
  }),
)

import LeadsPage from "./page"

describe("LeadsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.findLeads.mockResolvedValue([
      {
        id: "lead-1",
        name: "Rosecleia Ramos",
        email:
          "rosecleia@example.com",
        phone: "5541999999999",
        companyName: null,
        source: "REFERRAL",
        status: "NEGOTIATING",
        consortiumType:
          "REAL_ESTATE",
        desiredCreditValue:
          500000,
        desiredTermMonths: 200,
        score: 100,
        notes: null,
        createdAt:
          new Date(
            "2026-08-03T12:00:00.000Z",
          ),
        consultant: {
          name: "Rafael Ramos",
        },
        pipelineStage: {
          name: "Em atendimento",
        },
        commercialJourneys: [
          {
            id: "journey-1",
          },
        ],
      },
    ])
  })

  it("lista leads do workspace com apresentação operacional", async () => {
    render(await LeadsPage())

    expect(
      screen.getByText(
        "Rosecleia Ramos",
      ),
    ).toBeInTheDocument()
    expect(
      mocks.findWorkspace,
    ).toHaveBeenCalledExactlyOnceWith({
      where: {
        slug: "consorcio-os",
      },
      select: {
        id: true,
      },
    })
    expect(
      mocks.findLeads,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: {
          workspaceId:
            "workspace-1",
          convertedClientId: null,
        },
        select:
          expect.objectContaining({
            notes: true,
          }),
        orderBy: {
          createdAt: "desc",
        },
      }),
    )
    expect(
      mocks.listProps,
    ).toHaveBeenCalledWith({
      view: {
        summaryLabel:
          "1 lead em atendimento",
        leads: [
          expect.objectContaining({
            id: "lead-1",
            name:
              "Rosecleia Ramos",
            statusLabel:
              "Em negociação",
            sourceLabel:
              "Indicação",
            consortiumTypeLabel:
              "Imóvel",
            opportunityHref:
              "/opportunities/journey-1",
          }),
        ],
      },
    })
  })

  it("encaminha lista vazia", async () => {
    mocks.findLeads.mockResolvedValue([])

    render(await LeadsPage())

    expect(
      screen.getByText("Sem leads"),
    ).toBeInTheDocument()
    expect(
      mocks.listProps,
    ).toHaveBeenCalledWith({
      view: {
        summaryLabel:
          "0 leads em atendimento",
        leads: [],
      },
    })
  })

  it("não consulta leads sem workspace", async () => {
    mocks.findWorkspace.mockResolvedValue(
      null,
    )

    await expect(
      LeadsPage(),
    ).rejects.toThrow(
      'Workspace "consorcio-os" não encontrado.',
    )
    expect(
      mocks.findLeads,
    ).not.toHaveBeenCalled()
  })
})
