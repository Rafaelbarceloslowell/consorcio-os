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
  getContext: vi.fn(),
  findLeads: vi.fn(),
  countLeads: vi.fn(),
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
      lead: {
        findMany:
          mocks.findLeads,
        count: mocks.countLeads,
      },
    },
  }),
)

vi.mock(
  "@/lib/auth/get-authenticated-commercial-context",
  () => ({
    getAuthenticatedCommercialContext: mocks.getContext,
  }),
)

import LeadsPage from "./page"

const pageProps = {
  searchParams: Promise.resolve({}),
}

describe("LeadsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getContext.mockResolvedValue({
      userId: "user-1",
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      role: "CONSULTANT",
    })
    mocks.countLeads
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
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
        approachType: "NEW",
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
    render(await LeadsPage(pageProps))

    expect(
      screen.getByText(
        "Rosecleia Ramos",
      ),
    ).toBeInTheDocument()
    expect(
      mocks.findLeads,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: {
          workspaceId:
            "workspace-1",
          consultantId:
            "consultant-1",
          convertedClientId: null,
        },
        select:
          expect.objectContaining({
            notes: true,
          }),
        orderBy: {
          createdAt: "desc",
        },
        skip: 0,
        take: 24,
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
        pagination: {
          page: 1,
          totalPages: 1,
          totalCount: 1,
          previousHref: null,
          nextHref: null,
        },
      },
    })
  })

  it("encaminha lista vazia", async () => {
    mocks.findLeads.mockResolvedValue([])
    mocks.countLeads.mockReset()
    mocks.countLeads.mockResolvedValue(0)

    render(await LeadsPage(pageProps))

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
        pagination: {
          page: 1,
          totalPages: 1,
          totalCount: 0,
          previousHref: null,
          nextHref: null,
        },
      },
    })
  })

  it("não consulta leads sem contexto autenticado", async () => {
    mocks.getContext.mockRejectedValue(new Error("Acesso negado"))

    await expect(
      LeadsPage(pageProps),
    ).rejects.toThrow(
      "Acesso negado",
    )
    expect(
      mocks.findLeads,
    ).not.toHaveBeenCalled()
  })
})
