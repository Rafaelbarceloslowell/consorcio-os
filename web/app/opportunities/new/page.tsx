import {
  OpportunityCreateForm,
} from "@/components/opportunity/opportunity-create-form"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  OpportunityCreateFormView,
} from "@/types/opportunity-create"

import {
  createOpportunityAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function OpportunityCreatePage() {
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

  const crmRepository =
    createPrismaCrmRepositories({
      workspaceId: workspace.id,
    })

  const clients =
    await crmRepository.clients.findAll()

  const view:
    OpportunityCreateFormView = {
    clients: clients.map(
      (client) => ({
        id: client.id,
        name: client.name,
      }),
    ),
  }

  return (
    <OpportunityCreateForm
      view={view}
      action={createOpportunityAction}
    />
  )
}
