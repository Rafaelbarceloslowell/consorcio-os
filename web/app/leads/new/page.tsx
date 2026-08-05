import {
  LeadCreateForm,
} from "@/components/lead/lead-create-form"
import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  LeadCreateFormView,
} from "@/types/lead-create"

import {
  createLeadAction,
} from "./actions"

export default async function LeadCreatePage() {
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

  const crmRepositories =
    createPrismaCrmRepositories({
      workspaceId: workspace.id,
    })

  const consultants =
    await crmRepositories
      .consultants
      .findAll()

  const view: LeadCreateFormView = {
    consultants: consultants
      .filter(
        (consultant) =>
          consultant.status ===
          "active",
      )
      .map((consultant) => ({
        id: consultant.id,
        name: consultant.name,
      })),
  }

  return (
    <LeadCreateForm
      view={view}
      action={createLeadAction}
    />
  )
}
