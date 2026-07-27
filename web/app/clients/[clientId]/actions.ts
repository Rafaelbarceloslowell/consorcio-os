"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  BlockClientAsync,
} from "@/application/client/block-client-async"
import {
  DeactivateClientAsync,
} from "@/application/client/deactivate-client-async"
import {
  ReactivateClientAsync,
} from "@/application/client/reactivate-client-async"
import {
  UnblockClientAsync,
} from "@/application/client/unblock-client-async"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

type ClientLifecycleAction =
  | "block"
  | "unblock"
  | "deactivate"
  | "reactivate"

async function executeClientLifecycleAction(
  clientId: string,
  action: ClientLifecycleAction,
): Promise<void> {
  const workspace =
    await prisma.workspace
      .findUnique({
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

  const repositories =
    createPrismaCrmRepositories({
      workspaceId:
        workspace.id,
    })

  const dependencies = {
    workspaceId:
      workspace.id,
    clients:
      repositories.clients,
  }

  const normalizedClientId =
    clientId.trim()

  const input = {
    workspaceId:
      workspace.id,
    clientId:
      normalizedClientId,
  }

  switch (action) {
    case "block":
      await new BlockClientAsync(
        dependencies,
      ).execute(input)
      break

    case "unblock":
      await new UnblockClientAsync(
        dependencies,
      ).execute(input)
      break

    case "deactivate":
      await new DeactivateClientAsync(
        dependencies,
      ).execute(input)
      break

    case "reactivate":
      await new ReactivateClientAsync(
        dependencies,
      ).execute(input)
      break
  }

  const detailsPath =
    `/clients/${encodeURIComponent(
      normalizedClientId,
    )}`

  revalidatePath(detailsPath)
  revalidatePath("/clients")
  redirect(detailsPath)
}

export async function blockClientAction(
  clientId: string,
): Promise<void> {
  await executeClientLifecycleAction(
    clientId,
    "block",
  )
}

export async function unblockClientAction(
  clientId: string,
): Promise<void> {
  await executeClientLifecycleAction(
    clientId,
    "unblock",
  )
}

export async function deactivateClientAction(
  clientId: string,
): Promise<void> {
  await executeClientLifecycleAction(
    clientId,
    "deactivate",
  )
}

export async function reactivateClientAction(
  clientId: string,
): Promise<void> {
  await executeClientLifecycleAction(
    clientId,
    "reactivate",
  )
}