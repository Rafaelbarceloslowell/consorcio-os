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
  createRepositories: vi.fn(),
  findLead: vi.fn(),
  findConsultants: vi.fn(),
  formProps: vi.fn(),
  action: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock(
  "@/components/lead/lead-update-form",
  () => ({
    LeadUpdateForm:
      (props: {
        lead: {
          name: string
          email: string
          phoneCountryCode: string
          phone: string
          returnTo: string
        }
        action: unknown
      }) => {
        mocks.formProps(props)
        return (
          <p>{props.lead.name}</p>
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
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/prisma-crm-repositories",
  () => ({
    createPrismaCrmRepositories:
      mocks.createRepositories,
  }),
)

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}))

vi.mock("./actions", () => ({
  updateLeadAction:
    mocks.action,
}))

import LeadEditPage from "./page"

describe("LeadEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.findLead.mockResolvedValue({
      id: "lead-1",
      name: "alex silva",
      email:
        "lead-5541999999999@sem-email.gorila.local",
      phone: "5541999999999",
      document: undefined,
      companyName: undefined,
      source: "referral",
      consortiumType:
        "real_estate",
      desiredCreditValue: 500000,
      desiredTermMonths: 200,
      consultantId:
        "consultant-1",
      notes: undefined,
    })
    mocks.findConsultants.mockResolvedValue([
      {
        id: "consultant-1",
        name: "Rafael",
        status: "active",
      },
      {
        id: "consultant-inactive",
        name: "Inativo",
        status: "inactive",
      },
    ])
    mocks.createRepositories.mockReturnValue({
      leads: {
        findById: mocks.findLead,
      },
      consultants: {
        findAll:
          mocks.findConsultants,
      },
    })
  })

  it("carrega o lead real e prepara retorno para a oportunidade", async () => {
    render(
      await LeadEditPage({
        params: Promise.resolve({
          leadId: "lead-1",
        }),
        searchParams: Promise.resolve({
          returnTo:
            "/opportunities/journey-1",
        }),
      }),
    )

    expect(
      screen.getByText("alex silva"),
    ).toBeDefined()
    expect(
      mocks.formProps,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        lead:
          expect.objectContaining({
            email: "",
            phoneCountryCode: "55",
            phone: "41999999999",
            returnTo:
              "/opportunities/journey-1",
            consultants: [
              {
                id: "consultant-1",
                name: "Rafael",
              },
            ],
          }),
      }),
    )
  })

  it("usa notFound quando o lead não existe", async () => {
    mocks.findLead.mockResolvedValue(
      undefined,
    )

    await expect(
      LeadEditPage({
        params: Promise.resolve({
          leadId: "lead-404",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(
      mocks.notFound,
    ).toHaveBeenCalledTimes(1)
  })

  it("bloqueia composição sem workspace", async () => {
    mocks.findWorkspace.mockResolvedValue(
      null,
    )

    await expect(
      LeadEditPage({
        params: Promise.resolve({
          leadId: "lead-1",
        }),
      }),
    ).rejects.toThrow(
      'Workspace "consorcio-os" não encontrado.',
    )

    expect(
      mocks.createRepositories,
    ).not.toHaveBeenCalled()
  })
})
