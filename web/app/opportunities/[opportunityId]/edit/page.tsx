import {
  notFound,
} from "next/navigation"

import {
  GetOpportunityDetailsAsync,
} from "@/application/opportunity/get-opportunity-details-async"

import {
  OpportunityUpdateForm,
} from "@/components/opportunity/opportunity-update-form"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  OpportunityUpdateFormView,
} from "@/types/opportunity-update"

import {
  updateOpportunityAction,
} from "./actions"

type OpportunityEditPageProps = {
  params: Promise<{
    opportunityId: string
  }>
}

export default async function OpportunityEditPage({
  params,
}: OpportunityEditPageProps) {
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
      'Workspace "consorcio-os" nÃ£o encontrado.',
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
    const [
      {
        opportunity,
      },
      consultants,
    ] = await Promise.all([
      new GetOpportunityDetailsAsync({
        journeys:
          commercialRepository.journeys,
        events:
          commercialRepository.events,
        leads: crmRepository.leads,
        clients:
          crmRepository.clients,
        consultants:
          crmRepository.consultants,
        phases:
          commercialRepository.phases,
        states:
          commercialRepository.states,
      }).execute({
        workspaceId:
          workspace.id,
        opportunityId,
      }),
      crmRepository.consultants.findAll(),
    ])

    const view:
      OpportunityUpdateFormView = {
      id: opportunity.id,
      title: opportunity.title,
      consultantId:
        opportunity.consultantId,
      priority:
        opportunity.priority,
      score: opportunity.score,
      consultants:
        consultants.map(
          (consultant) => ({
            id: consultant.id,
            name: consultant.name,
          }),
        ),
    }

    return (
      <OpportunityUpdateForm
        opportunity={view}
        action={updateOpportunityAction.bind(
          null,
          opportunity.id,
        )}
      />
    )
  } catch (error) {
    const normalizedOpportunityId =
      opportunityId.trim()

    if (
      error instanceof Error &&
      error.message ===
        `Oportunidade comercial nÃ£o encontrada para o ID "${normalizedOpportunityId}".`
    ) {
      notFound()
    }

    throw error
  }
}
