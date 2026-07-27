"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  CreateOpportunityAsync,
} from "@/application/opportunity/create-opportunity-async"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  createPrismaCommercialRepositories,
} from "@/infrastructure/prisma/repositories/prisma-commercial-repositories"

import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  CommercialJourneyPriority,
  ConsortiumType,
} from "@/types/domain"

import type {
  OpportunityCreateActionState,
  OpportunityCreateActionValues,
} from "@/types/opportunity-create"

function readValue(
  formData: FormData,
  field: keyof OpportunityCreateActionValues,
): string | undefined {
  if (!formData.has(field)) {
    return undefined
  }

  const value = formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function parseConsortiumType(
  value: string,
): ConsortiumType | undefined {
  switch (value) {
    case "real_estate":
    case "vehicle":
    case "heavy_vehicle":
    case "services":
    case "other":
      return value
    default:
      return undefined
  }
}

function parsePriority(
  value: string,
): CommercialJourneyPriority | undefined {
  switch (value) {
    case "LOW":
    case "NORMAL":
    case "HIGH":
    case "URGENT":
      return value
    default:
      return undefined
  }
}

function errorState(
  message: string,
  values: OpportunityCreateActionValues,
  fieldErrors?: Extract<
    OpportunityCreateActionState,
    { status: "error" }
  >["fieldErrors"],
): OpportunityCreateActionState {
  return {
    status: "error",
    message,
    values,
    fieldErrors,
  }
}

export async function createOpportunityAction(
  _previousState: OpportunityCreateActionState,
  formData: FormData,
): Promise<OpportunityCreateActionState> {
  const clientId = readValue(
    formData,
    "clientId",
  )
  const title = readValue(
    formData,
    "title",
  )
  const consortiumTypeValue =
    readValue(
      formData,
      "consortiumType",
    )
  const priorityValue = readValue(
    formData,
    "priority",
  )
  const scoreValue = readValue(
    formData,
    "score",
  )

  const values:
    OpportunityCreateActionValues = {
    clientId: clientId ?? "",
    title: title ?? "",
    consortiumType:
      consortiumTypeValue ?? "",
    priority:
      priorityValue ?? "",
    score: scoreValue ?? "",
  }

  if (clientId === undefined) {
    return errorState(
      "O cliente é obrigatório para criar a oportunidade.",
      values,
      {
        clientId:
          "Selecione um cliente.",
      },
    )
  }

  if (
    consortiumTypeValue ===
    undefined
  ) {
    return errorState(
      "O tipo de consórcio informado é inválido.",
      values,
      {
        consortiumType:
          "Selecione um tipo de consórcio.",
      },
    )
  }

  const consortiumType =
    parseConsortiumType(
      consortiumTypeValue,
    )

  if (!consortiumType) {
    return errorState(
      "O tipo de consórcio informado é inválido.",
      values,
      {
        consortiumType:
          "Selecione um tipo de consórcio válido.",
      },
    )
  }

  let priority:
    CommercialJourneyPriority | undefined

  if (priorityValue !== undefined) {
    priority =
      parsePriority(priorityValue)

    if (!priority) {
      return errorState(
        "A prioridade da oportunidade é inválida.",
        values,
        {
          priority:
            "Selecione uma prioridade válida.",
        },
      )
    }
  }

  let score: number | undefined

  if (scoreValue !== undefined) {
    if (
      !/^(0|[1-9]\d*)$/.test(
        scoreValue,
      )
    ) {
      return errorState(
        "O score da oportunidade deve ser um número inteiro entre 0 e 100.",
        values,
        {
          score:
            "Informe um número inteiro entre 0 e 100.",
        },
      )
    }

    score = Number(scoreValue)
  }

  let createdOpportunityId: string

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

    const commercialRepository =
      createPrismaCommercialRepositories({
        workspaceId: workspace.id,
      })

    const crmRepository =
      createPrismaCrmRepositories({
        workspaceId: workspace.id,
      })

    const {
      opportunity,
    } = await new CreateOpportunityAsync({
      clients: crmRepository.clients,
      consultants:
        crmRepository.consultants,
      journeys:
        commercialRepository.journeys,
      phases:
        commercialRepository.phases,
      states:
        commercialRepository.states,
    }).execute({
      workspaceId: workspace.id,
      clientId,
      consortiumType,
      ...(title !== undefined
        ? { title }
        : {}),
      ...(priority !== undefined
        ? { priority }
        : {}),
      ...(score !== undefined
        ? { score }
        : {}),
    })

    createdOpportunityId =
      opportunity.id
  } catch (error) {
    return errorState(
      error instanceof Error
        ? error.message
        : "Não foi possível criar a oportunidade.",
      values,
    )
  }

  revalidatePath("/")
  redirect(
    `/opportunities/${encodeURIComponent(createdOpportunityId)}`,
  )
}
