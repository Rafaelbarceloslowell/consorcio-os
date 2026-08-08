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

import type {
  DashboardData,
} from "@/types/dashboard"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  getDashboardData: vi.fn(),
  createCommercialRepositories:
    vi.fn(),
  createCrmRepositories: vi.fn(),
  dashboardShellProps: vi.fn(),
  loadMockMaestroPilotView:
    vi.fn(),
  applyExternalCrmPilotToDashboard:
    vi.fn(),
}))

vi.mock(
  "@/application/dashboard/get-async-dashboard-data",
  () => ({
    getAsyncDashboardData:
      mocks.getDashboardData,
  }),
)

vi.mock(
  "@/application/dashboard/load-mock-maestro-pilot-view",
  () => ({
    loadMockMaestroPilotView:
      mocks.loadMockMaestroPilotView,
  }),
)

vi.mock(
  "@/application/dashboard/apply-external-crm-pilot-to-dashboard",
  () => ({
    applyExternalCrmPilotToDashboard:
      mocks.applyExternalCrmPilotToDashboard,
  }),
)

vi.mock(
  "@/components/dashboard/dashboard-shell",
  () => ({
    DashboardShell: (
      props: DashboardData,
    ) => {
      mocks.dashboardShellProps(
        props,
      )

      return (
        <p>
          {props.summary}
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
    },
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/prisma-commercial-repositories",
  () => ({
    createPrismaCommercialRepositories:
      mocks.createCommercialRepositories,
  }),
)

vi.mock(
  "@/infrastructure/prisma/repositories/prisma-crm-repositories",
  () => ({
    createPrismaCrmRepositories:
      mocks.createCrmRepositories,
  }),
)

import MissionControlPage from "./page"

const dashboardData: DashboardData = {
  workspaceId: "workspace-1",
  user: {
    id: "consultant-1",
    name: "Rafael Ramos",
    positionTitle:
      "Consultor S\u00eanior",
  },
  summary:
    "Dados internos carregados.",
  metrics: {
    newLeads: 1,
    meetingsToday: 2,
    monthlySales: 300000,
    pendingTasks: 4,
  },
  meetings: [],
  tasks: [],
  pipeline: [],
  opportunities: [],
}

describe("MissionControlPage", () => {
  const commercialRepositories = {
    source: "internal-commercial",
  }
  const crmRepositories = {
    source: "internal-crm",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
    mocks.createCommercialRepositories
      .mockReturnValue(
        commercialRepositories,
      )
    mocks.createCrmRepositories
      .mockReturnValue(
        crmRepositories,
      )
    mocks.getDashboardData
      .mockResolvedValue(
        dashboardData,
      )
  })

  it("carrega a home somente com os repositories internos", async () => {
    render(
      await MissionControlPage(),
    )

    expect(
      screen.getByText(
        "Dados internos carregados.",
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
      mocks.createCommercialRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId: "workspace-1",
    })
    expect(
      mocks.createCrmRepositories,
    ).toHaveBeenCalledExactlyOnceWith({
      workspaceId: "workspace-1",
    })
    expect(
      mocks.getDashboardData,
    ).toHaveBeenCalledExactlyOnceWith(
      {
        workspaceId:
          "workspace-1",
        now: expect.any(Date),
      },
      {
        commercialRepository:
          commercialRepositories,
        crmRepository:
          crmRepositories,
      },
    )
    expect(
      mocks.dashboardShellProps,
    ).toHaveBeenCalledExactlyOnceWith(
      dashboardData,
    )
    expect(
      mocks.dashboardShellProps.mock
        .calls[0]?.[0],
    ).not.toHaveProperty(
      "externalCrmPilot",
    )
  })

  it("n\u00e3o aciona o MockMaestro no runtime normal", async () => {
    render(
      await MissionControlPage(),
    )

    expect(
      mocks.loadMockMaestroPilotView,
    ).not.toHaveBeenCalled()
    expect(
      mocks.applyExternalCrmPilotToDashboard,
    ).not.toHaveBeenCalled()
  })

  it("interrompe antes de criar repositories quando o workspace n\u00e3o existe", async () => {
    mocks.findWorkspace.mockResolvedValue(
      null,
    )

    await expect(
      MissionControlPage(),
    ).rejects.toThrow(
      'Workspace "consorcio-os" n\u00e3o encontrado.',
    )
    expect(
      mocks.createCommercialRepositories,
    ).not.toHaveBeenCalled()
    expect(
      mocks.createCrmRepositories,
    ).not.toHaveBeenCalled()
    expect(
      mocks.getDashboardData,
    ).not.toHaveBeenCalled()
  })
})
