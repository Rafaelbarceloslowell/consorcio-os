import {
  notFound,
} from "next/navigation"

import {
  GetOpportunityDetailsAsync,
} from "@/application/opportunity/get-opportunity-details-async"

import {
  OpportunityDetails,
} from "@/components/opportunity/opportunity-details"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

type OpportunityDetailsPageProps = {
  params: Promise<{
    opportunityId: string
  }>
}

export default async function OpportunityDetailsPage({
  params,
}: OpportunityDetailsPageProps) {
  const {
    opportunityId,
  } = await params

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

  const commercialRepository =
    createPrismaCommercialRepositories({
      workspaceId: workspace.id,
    })

  const crmRepository =
    createPrismaCrmRepositories({
      workspaceId: workspace.id,
    })

  try {
    const {
      opportunity,
    } = await new GetOpportunityDetailsAsync({
      journeys:
        commercialRepository.journeys,
      leads: crmRepository.leads,
      clients: crmRepository.clients,
      consultants:
        crmRepository.consultants,
      phases:
        commercialRepository.phases,
      states:
        commercialRepository.states,
    }).execute({
      workspaceId: workspace.id,
      opportunityId,
    })

    return (
      <OpportunityDetails
        opportunity={opportunity}
      />
    )
  } catch (error) {
    const normalizedOpportunityId =
      opportunityId.trim()

    if (
      error instanceof Error &&
      error.message ===
        `Oportunidade comercial não encontrada para o ID "${normalizedOpportunityId}".`
    ) {
      notFound()
    }

    throw error
  }
}
