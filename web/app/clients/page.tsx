import {
  ListClientsAsync,
} from "@/application/client/list-clients-async"

import {
  ClientList,
} from "@/components/client/client-list"

import {
  CLIENT_PERSON_TYPE_LABELS,
  CLIENT_STATUS_LABELS,
} from "@/components/client/client-labels"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  ClientListView,
} from "@/types/client-list"

export default async function ClientsPage() {
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

  const { clients } =
    await new ListClientsAsync({
      clients:
        crmRepositories.clients,
    }).execute()

  const view: ClientListView = {
    clients: clients.map(
      (client) => ({
        id: client.id,
        name: client.name,
        typeLabel:
          CLIENT_PERSON_TYPE_LABELS[
            client.type
          ],
        email: client.email,
        phone: client.phone,
        document: client.document,
        statusLabel:
          CLIENT_STATUS_LABELS[
            client.status
          ],
      }),
    ),
  }

  return <ClientList view={view} />
}
