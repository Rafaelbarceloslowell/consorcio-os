import {
  applyExternalCrmPilotToDashboard,
} from "@/application/dashboard/apply-external-crm-pilot-to-dashboard"

import {
  getAsyncDashboardData,
} from "@/application/dashboard/get-async-dashboard-data"

import {
  loadMockMaestroPilotView,
} from "@/application/dashboard/load-mock-maestro-pilot-view"

import {
  DashboardShell,
} from "@/components/dashboard/dashboard-shell"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

type MissionControlPageProps = {
  searchParams?: Promise<{
    crmMock?:
      | string
      | string[]
  }>
}

export default async function MissionControlPage({
  searchParams,
}: MissionControlPageProps) {
  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {}

  const externalCrmPilotPromise =
    loadMockMaestroPilotView({
      scenario:
        resolvedSearchParams.crmMock,
      nodeEnvironment:
        process.env.NODE_ENV,
    })

  const workspace =
    await prisma.workspace.findUnique({
      where: {
        slug: "consorcio-os",
      },
      select: {
        id: true,
      },
    })

  if (!workspace) {
    throw new Error(
      'Workspace "consorcio-os" não encontrado.',
    )
  }

  const [
    dashboardData,
    externalCrmPilot,
  ] = await Promise.all([
    getAsyncDashboardData(
      {
        workspaceId:
          workspace.id,
        now: new Date(),
      },
      {
        commercialRepository:
          createPrismaCommercialRepositories({
            workspaceId:
              workspace.id,
          }),

        crmRepository:
          createPrismaCrmRepositories({
            workspaceId:
              workspace.id,
          }),
      },
    ),
    externalCrmPilotPromise,
  ])

  const synchronizedDashboardData =
    applyExternalCrmPilotToDashboard({
      dashboardData,
      externalCrmPilot,
    })

  return (
    <DashboardShell
      {...synchronizedDashboardData}
      externalCrmPilot={
        externalCrmPilot
      }
    />
  )
}
