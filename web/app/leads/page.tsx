import {
  buildLeadListPresentation,
} from "@/application/lead/build-lead-list-presentation"
import {
  LeadList,
} from "@/components/lead/lead-list"
import {
  prisma,
} from "@/infrastructure/prisma/client"
import { getAuthenticatedCommercialContext } from "@/lib/auth/get-authenticated-commercial-context"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

function parsePage(value: string | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function LeadsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>
}>) {
  const context = await getAuthenticatedCommercialContext()
  const page = parsePage((await searchParams).page)
  const scope = {
    workspaceId: context.workspaceId,
    consultantId: context.consultantId,
    convertedClientId: null,
  }

  const [leads, totalCount, untriagedCount, reactivatedCount] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...scope,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        source: true,
        status: true,
        approachType: true,
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lead.count({ where: scope }),
    prisma.lead.count({ where: { ...scope, approachType: null } }),
    prisma.lead.count({ where: { ...scope, approachType: "REACTIVATION" } }),
  ])

  return (
    <LeadList
      view={
        buildLeadListPresentation(
          leads,
          {
            page,
            pageSize: PAGE_SIZE,
            totalCount,
            untriagedCount,
            reactivatedCount,
          },
        )
      }
    />
  )
}
