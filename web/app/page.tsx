import {
  getAsyncDashboardData,
} from "@/application/dashboard/get-async-dashboard-data"

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

export default async function MissionControlPage() {
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

  const dashboardData =
    await getAsyncDashboardData(
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
    )

  return (
    <DashboardShell
      {...dashboardData}
    />
  )
}
