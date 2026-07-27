import {
  ListClientsAsync,
} from "@/application/client/list-clients-async"

import {
  ClientList,
} from "@/components/client/client-list"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  ClientStatus,
  PersonType,
} from "@/types/domain"

import type {
  ClientListView,
} from "@/types/client-list"

const PERSON_TYPE_LABELS:
  Record<PersonType, string> = {
    individual: "Pessoa física",
    company: "Pessoa jurídica",
  }

const CLIENT_STATUS_LABELS:
  Record<ClientStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
    blocked: "Bloqueado",
  }

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
          PERSON_TYPE_LABELS[
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
