import {
  AgendaCreateForm,
} from "@/components/agenda/agenda-create-form"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  AgendaCreateFormView,
} from "@/types/agenda"

import {
  createAgendaCommitmentAction,
} from "./actions"

export default async function AgendaCreatePage() {
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
      },
      orderBy: {
        name: "asc",
      },
    })

  const view: AgendaCreateFormView = {
    leads,
  }

  return (
    <AgendaCreateForm
      view={view}
      action={
        createAgendaCommitmentAction
      }
    />
  )
}
