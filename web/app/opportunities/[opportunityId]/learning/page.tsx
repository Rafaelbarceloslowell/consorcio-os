import {
  notFound,
} from "next/navigation"

import {
  GetOpportunityDetailsAsync,
} from "@/application/opportunity/get-opportunity-details-async"

import {
  OpportunityR2LearningCycle,
} from "@/components/opportunity/opportunity-r2-learning-cycle"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

type R2LearningPageProps =
  Readonly<{
    params: Promise<{
      opportunityId: string
    }>
  }>

export const dynamic = "force-dynamic"

export default async function R2LearningPage({
  params,
}: R2LearningPageProps) {
  const {
    opportunityId,
  } = await params

  const workspace =
    await prisma
      .workspace
      .findUnique({
        where: {
          slug:
            "consorcio-os",
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
      workspaceId:
        workspace.id,
    })

  const crmRepository =
    createPrismaCrmRepositories({
      workspaceId:
        workspace.id,
    })

  const loadOpportunity =
    async () => {
      try {
        const {
          opportunity,
        } =
          await new GetOpportunityDetailsAsync({
            journeys:
              commercialRepository
                .journeys,
            conversationMemories:
              commercialRepository
                .conversationMemories,
            events:
              commercialRepository
                .events,
            leads:
              crmRepository.leads,
            clients:
              crmRepository.clients,
            consultants:
              crmRepository
                .consultants,
            phases:
              commercialRepository
                .phases,
            states:
              commercialRepository
                .states,
          }).execute({
            workspaceId:
              workspace.id,
            opportunityId,
          })

        return opportunity
      }
      catch (error) {
        if (
          error instanceof Error &&
          error.message
            .toLocaleLowerCase(
              "pt-BR",
            )
            .includes(
              "não encontrada",
            )
        ) {
          notFound()
        }

        throw error
      }
    }

  const opportunity =
    await loadOpportunity()

  return (
    <OpportunityR2LearningCycle
      opportunityId={
        opportunity.id
      }
      consultantId={
        opportunity
          .consultantId
      }
      contactName={
        opportunity
          .originName
      }
      initialSuggestion={
        opportunity
          .conversationMemory
          ?.lastSuggestedReply ??
        opportunity
          .suggestedMessage ??
        null
      }
      sourceIncomingMessage={
        opportunity
          .conversationMemory
          ?.lastIncomingMessage ??
        null
      }
      intent={
        opportunity
          .conversationMemory
          ?.lastIntent ??
        null
      }
      stage={
        opportunity
          .conversationMemory
          ?.stage ??
        null
      }
      goal={
        opportunity
          .conversationMemory
          ?.goal ??
        null
      }
    />
  )
}
