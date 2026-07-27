import {
  notFound,
} from "next/navigation"

import {
  GetClientDetailsAsync,
} from "@/application/client/get-client-details-async"

import {
  ClientDetails,
} from "@/components/client/client-details"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

type ClientDetailsPageProps = {
  params: Promise<{
    clientId: string
  }>
}

export default async function ClientDetailsPage({
  params,
}: ClientDetailsPageProps) {
  const { clientId } =
    await params

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

  try {
    const { client } =
      await new GetClientDetailsAsync({
        workspaceId:
          workspace.id,
        clients:
          crmRepositories.clients,
        consultants:
          crmRepositories
            .consultants,
      }).execute({
        workspaceId: workspace.id,
        clientId,
      })

    return (
      <ClientDetails
        client={client}
      />
    )
  } catch (error) {
    const normalizedClientId =
      clientId.trim()

    if (
      error instanceof Error &&
      error.message ===
        `Cliente não encontrado para o ID "${normalizedClientId}".`
    ) {
      notFound()
    }

    throw error
  }
}
