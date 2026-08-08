import { ClientCreateForm } from "@/components/client/client-create-form"
import { prisma } from "@/infrastructure/prisma/client"
import { createPrismaCrmRepositories } from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type { ClientCreateFormView } from "@/types/client-create"

import { createClientAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function ClientCreatePage() {
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

  const consultants =
    await crmRepository.consultants.findAll()

  const view: ClientCreateFormView = {
    consultants: consultants.map(
      (consultant) => ({
        id: consultant.id,
        name: consultant.name,
      }),
    ),
  }

  return (
    <ClientCreateForm
      view={view}
      action={createClientAction}
    />
  )
}
