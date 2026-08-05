"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  UpdateClientAsync,
} from "@/application/client/update-client-async"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  PersonType,
} from "@/types/domain"

import type {
  ClientUpdateActionState,
  ClientUpdateActionValues,
} from "@/types/client-update"

function readValue(
  formData: FormData,
  field:
    keyof ClientUpdateActionValues,
): string {
  const value =
    formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function readValues(
  formData: FormData,
): ClientUpdateActionValues {
  return {
    type:
      readValue(formData, "type"),
    name:
      readValue(formData, "name"),
    companyName:
      readValue(
        formData,
        "companyName",
      ),
    email:
      readValue(formData, "email"),
    phone:
      readValue(formData, "phone"),
    phoneCountryCode:
      readValue(
        formData,
        "phoneCountryCode",
      ),
    document:
      readValue(
        formData,
        "document",
      ),
    consultantId:
      readValue(
        formData,
        "consultantId",
      ),
    addressStreet:
      readValue(
        formData,
        "addressStreet",
      ),
    addressNumber:
      readValue(
        formData,
        "addressNumber",
      ),
    addressComplement:
      readValue(
        formData,
        "addressComplement",
      ),
    addressNeighborhood:
      readValue(
        formData,
        "addressNeighborhood",
      ),
    addressCity:
      readValue(
        formData,
        "addressCity",
      ),
    addressState:
      readValue(
        formData,
        "addressState",
      ),
    addressZipCode:
      readValue(
        formData,
        "addressZipCode",
      ),
  }
}

function parsePersonType(
  value: string,
): PersonType | undefined {
  if (
    value === "individual" ||
    value === "company"
  ) {
    return value
  }

  return undefined
}

export async function updateClientAction(
  clientId: string,
  _previousState:
    ClientUpdateActionState,
  formData: FormData,
): Promise<ClientUpdateActionState> {
  const values =
    readValues(formData)
  const type =
    parsePersonType(values.type)

  if (!type) {
    return {
      status: "error",
      message:
        "O tipo do cliente informado é inválido.",
      values,
    }
  }

  try {
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

    await new UpdateClientAsync({
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
      type,
      name:
        type === "individual"
          ? values.name
          : "",
      companyName:
        type === "company"
          ? values.companyName
          : undefined,
      email: values.email,
      phone: values.phone,
      phoneCountryCode:
        values.phoneCountryCode ||
        undefined,
      document: values.document,
      consultantId:
        values.consultantId,
      address: {
        street:
          values.addressStreet,
        number:
          values.addressNumber,
        complement:
          values.addressComplement ||
          undefined,
        neighborhood:
          values
            .addressNeighborhood,
        city: values.addressCity,
        state:
          values.addressState,
        zipCode:
          values.addressZipCode,
      },
    })
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o cliente.",
      values,
    }
  }

  const detailsPath =
    `/clients/${encodeURIComponent(
      clientId,
    )}`

  revalidatePath(detailsPath)
  revalidatePath("/clients")
  redirect(detailsPath)
}
