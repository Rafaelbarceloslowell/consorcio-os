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
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import {
  getAuthenticatedCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

import type {
  OpportunityDetailsView,
} from "@/types/opportunity-details"

type OpportunityDetailsPageProps = {
  params: Promise<{
    opportunityId: string
  }>
}

export const dynamic = "force-dynamic"

export default async function OpportunityDetailsPage({
  params,
}: OpportunityDetailsPageProps) {
  const {
    opportunityId,
  } = await params

  const authenticated =
    await getAuthenticatedCommercialContext()

  const commercialRepository =
    createPrismaCommercialRepositories({
      workspaceId:
        authenticated.workspaceId,
    })

  const crmRepository =
    createPrismaCrmRepositories({
      workspaceId:
        authenticated.workspaceId,
    })

  let opportunity:
    OpportunityDetailsView

  try {
    const result =
      await new GetOpportunityDetailsAsync({
      journeys:
        commercialRepository.journeys,
      conversationMemories:
        commercialRepository.conversationMemories,
      events:
        commercialRepository.events,
      leads: crmRepository.leads,
      clients: crmRepository.clients,
      consultants:
        crmRepository.consultants,
      phases:
        commercialRepository.phases,
      states:
        commercialRepository.states,
      }).execute({
        workspaceId:
          authenticated.workspaceId,
        opportunityId,
      })

    opportunity = result.opportunity
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

  return (
    <OpportunityDetails
      opportunity={opportunity}
    />
  )
}
