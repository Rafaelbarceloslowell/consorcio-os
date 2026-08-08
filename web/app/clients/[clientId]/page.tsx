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
  ClientLifecycleActions,
} from "@/components/client/client-lifecycle-actions"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import {
  blockClientAction,
  deactivateClientAction,
  reactivateClientAction,
  unblockClientAction,
} from "./actions"

type ClientDetailsPageProps = {
  params: Promise<{
    clientId: string
  }>
}

export const dynamic = "force-dynamic"

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
      <>
        <ClientDetails
          client={client}
        />

        <div className="-mt-8 bg-[var(--gorila-canvas)] px-4 pb-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <ClientLifecycleActions
              status={client.status}
              blockAction={
                blockClientAction.bind(
                  null,
                  client.id,
                )
              }
              unblockAction={
                unblockClientAction.bind(
                  null,
                  client.id,
                )
              }
              deactivateAction={
                deactivateClientAction.bind(
                  null,
                  client.id,
                )
              }
              reactivateAction={
                reactivateClientAction.bind(
                  null,
                  client.id,
                )
              }
            />
          </div>
        </div>
      </>
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
