import {
  buildLeadListPresentation,
} from "@/application/lead/build-lead-list-presentation"
import {
  LeadList,
} from "@/components/lead/lead-list"
import {
  prisma,
} from "@/infrastructure/prisma/client"

export const dynamic = "force-dynamic"

export default async function LeadsPage() {
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

  const leads =
    await prisma.lead.findMany({
      where: {
        workspaceId: workspace.id,
        convertedClientId: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        source: true,
        status: true,
        consortiumType: true,
        desiredCreditValue: true,
        desiredTermMonths: true,
        score: true,
        notes: true,
        createdAt: true,
        consultant: {
          select: {
            name: true,
          },
        },
        pipelineStage: {
          select: {
            name: true,
          },
        },
        commercialJourneys: {
          where: {
            closedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

  return (
    <LeadList
      view={
        buildLeadListPresentation(
          leads,
        )
      }
    />
  )
}
