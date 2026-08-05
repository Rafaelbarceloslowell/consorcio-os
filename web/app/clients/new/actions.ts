"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { CreateClientAsync } from "@/application/client/create-client-async"
import { prisma } from "@/infrastructure/prisma/client"
import { createPrismaCrmRepositories } from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  ClientCreateActionState,
  ClientCreateActionValues,
} from "@/types/client-create"
import type { PersonType } from "@/types/domain"

function readValue(
  formData: FormData,
  field: keyof ClientCreateActionValues,
): string | undefined {
  if (!formData.has(field)) {
    return undefined
  }

  const value = formData.get(field)
  return typeof value === "string"
    ? value
    : ""
}

type ReadClientCreateValues = {
  [Field in keyof ClientCreateActionValues]:
    string | undefined
}

function readValues(
  formData: FormData,
): ReadClientCreateValues {
  return {
    type: readValue(formData, "type"),
    name: readValue(formData, "name"),
    companyName: readValue(
      formData,
      "companyName",
    ),
    email: readValue(formData, "email"),
    phone: readValue(formData, "phone"),
    phoneCountryCode: readValue(
      formData,
      "phoneCountryCode",
    ),
    document: readValue(
      formData,
      "document",
    ),
    consultantId: readValue(
      formData,
      "consultantId",
    ),
    addressStreet: readValue(
      formData,
      "addressStreet",
    ),
    addressNumber: readValue(
      formData,
      "addressNumber",
    ),
    addressComplement: readValue(
      formData,
      "addressComplement",
    ),
    addressNeighborhood: readValue(
      formData,
      "addressNeighborhood",
    ),
    addressCity: readValue(
      formData,
      "addressCity",
    ),
    addressState: readValue(
      formData,
      "addressState",
    ),
    addressZipCode: readValue(
      formData,
      "addressZipCode",
    ),
  }
}

function toActionValues(
  values: ReadClientCreateValues,
): ClientCreateActionValues {

  return {
    type: values.type ?? "",
    name: values.name ?? "",
    companyName:
      values.companyName ?? "",
    email: values.email ?? "",
    phone: values.phone ?? "",
    phoneCountryCode:
      values.phoneCountryCode ?? "",
    document: values.document ?? "",
    consultantId:
      values.consultantId ?? "",
    addressStreet:
      values.addressStreet ?? "",
    addressNumber:
      values.addressNumber ?? "",
    addressComplement:
      values.addressComplement ?? "",
    addressNeighborhood:
      values.addressNeighborhood ?? "",
    addressCity:
      values.addressCity ?? "",
    addressState:
      values.addressState ?? "",
    addressZipCode:
      values.addressZipCode ?? "",
  }
}

function parsePersonType(
  value: string,
): PersonType | undefined {
  switch (value) {
    case "individual":
    case "company":
      return value
    default:
      return undefined
  }
}

export async function createClientAction(
  _previousState: ClientCreateActionState,
  formData: FormData,
): Promise<ClientCreateActionState> {
  const readValuesResult =
    readValues(formData)
  const typeValue =
    readValuesResult.type

  if (typeValue === undefined) {
    return {
      status: "error",
      message:
        "O tipo do cliente não foi informado.",
      values: toActionValues(
        readValuesResult,
      ),
      fieldErrors: {
        type:
          "Selecione um tipo de pessoa.",
      },
    }
  }

  if (typeValue === "") {
    return {
      status: "error",
      message:
        "O tipo do cliente não pode estar vazio.",
      values: toActionValues(
        readValuesResult,
      ),
      fieldErrors: {
        type:
          "Selecione um tipo de pessoa.",
      },
    }
  }

  const type = parsePersonType(
    typeValue,
  )

  if (!type) {
    return {
      status: "error",
      message:
        "O tipo do cliente informado é inválido.",
      values: toActionValues(
        readValuesResult,
      ),
      fieldErrors: {
        type:
          "Selecione um tipo de pessoa válido.",
      },
    }
  }

  const values = toActionValues(
    readValuesResult,
  )

  try {
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

    await new CreateClientAsync({
      clients: crmRepository.clients,
      consultants:
        crmRepository.consultants,
    }).execute({
      type,
      name:
        type === "individual"
          ? values.name
          : "",
      email: values.email,
      phone: values.phone,
      ...(values.phoneCountryCode
        ? {
            phoneCountryCode:
              values.phoneCountryCode,
          }
        : {}),
      document: values.document,
      consultantId: values.consultantId,
      ...(type === "company"
        ? {
            companyName:
              values.companyName,
          }
        : {}),
      address: {
        street: values.addressStreet,
        number: values.addressNumber,
        ...(values.addressComplement
          ? {
              complement:
                values.addressComplement,
            }
          : {}),
        neighborhood:
          values.addressNeighborhood,
        city: values.addressCity,
        state: values.addressState,
        zipCode: values.addressZipCode,
      },
    })
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível criar o cliente.",
      values,
    }
  }

  revalidatePath("/")
  redirect("/")
}
