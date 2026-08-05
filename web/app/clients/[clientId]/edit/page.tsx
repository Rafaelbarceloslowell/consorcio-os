import {
  notFound,
} from "next/navigation"

import {
  GetClientDetailsAsync,
} from "@/application/client/get-client-details-async"

import {
  ClientUpdateForm,
} from "@/components/client/client-update-form"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  ClientUpdateFormView,
} from "@/types/client-update"

import {
  updateClientAction,
} from "./actions"

type Props = {
  params: Promise<{
    clientId: string
  }>
}

export default async function ClientEditPage({
  params,
}: Props) {
  const { clientId } =
    await params
  const workspace =
    await prisma.workspace.findUnique({
      where: {
        slug: "consorcio-os",
      },
      select: { id: true },
    })

  if (!workspace) {
    throw new Error(
      'Workspace "consorcio-os" não encontrado.',
    )
  }

  const repositories =
    createPrismaCrmRepositories({
      workspaceId: workspace.id,
    })

  try {
    const [
      { client },
      consultants,
    ] = await Promise.all([
      new GetClientDetailsAsync({
        workspaceId:
          workspace.id,
        clients:
          repositories.clients,
        consultants:
          repositories.consultants,
      }).execute({
        workspaceId:
          workspace.id,
        clientId,
      }),
      repositories.consultants
        .findAll(),
    ])

    const view:
      ClientUpdateFormView = {
      id: client.id,
      type: client.type,
      name: client.name,
      companyName:
        client.companyName ?? "",
      email: client.email,
      phone: client.phone,
      phoneCountryCode: "55",
      document: client.document,
      consultantId:
        client.consultantId,
      addressStreet:
        client.address.street,
      addressNumber:
        client.address.number,
      addressComplement:
        client.address
          .complement ?? "",
      addressNeighborhood:
        client.address
          .neighborhood,
      addressCity:
        client.address.city,
      addressState:
        client.address.state,
      addressZipCode:
        client.address.zipCode,
      consultants:
        consultants.map(
          (consultant) => ({
            id: consultant.id,
            name: consultant.name,
          }),
        ),
    }

    return (
      <ClientUpdateForm
        client={view}
        action={updateClientAction.bind(
          null,
          client.id,
        )}
      />
    )
  } catch (error) {
    const normalizedId =
      clientId.trim()

    if (
      error instanceof Error &&
      error.message ===
        `Cliente não encontrado para o ID "${normalizedId}".`
    ) {
      notFound()
    }

    throw error
  }
}
