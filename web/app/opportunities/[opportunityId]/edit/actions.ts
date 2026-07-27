"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  UpdateOpportunityAsync,
} from "@/application/opportunity/update-opportunity-async"

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
} from "@/types/domain"

import type {
  OpportunityUpdateActionState,
  OpportunityUpdateActionValues,
} from "@/types/opportunity-update"

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

function readValue(
  formData: FormData,
  field: keyof OpportunityUpdateActionValues,
): string | undefined {
  if (!formData.has(field)) {
    return undefined
  }

  const value = formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function errorState(
  message: string,
  values: OpportunityUpdateActionValues,
  fieldErrors?: Extract<
    OpportunityUpdateActionState,
    { status: "error" }
  >["fieldErrors"],
): OpportunityUpdateActionState {
  return {
    status: "error",
    message,
    values,
    fieldErrors,
  }
}

export async function updateOpportunityAction(
  opportunityId: string,
  _previousState: OpportunityUpdateActionState,
  formData: FormData,
): Promise<OpportunityUpdateActionState> {
  const title = readValue(
    formData,
    "title",
  )
  const consultantId = readValue(
    formData,
    "consultantId",
  )
  const priorityValue = readValue(
    formData,
    "priority",
  )
  const scoreValue = readValue(
    formData,
    "score",
  )

  const values: OpportunityUpdateActionValues = {
    title: title ?? "",
    consultantId:
      consultantId ?? "",
    priority:
      priorityValue ?? "",
    score: scoreValue ?? "",
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

    await new UpdateOpportunityAsync({
      journeys:
        commercialRepository.journeys,
      consultants:
        crmRepository.consultants,
    }).execute({
      workspaceId: workspace.id,
      opportunityId,
      ...(title !== undefined
        ? { title }
        : {}),
      ...(consultantId !== undefined
        ? { consultantId }
        : {}),
      ...(priority !== undefined
        ? { priority }
        : {}),
      ...(score !== undefined
        ? { score }
        : {}),
    })
  } catch (error) {
    return errorState(
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar a oportunidade.",
      values,
    )
  }

  const detailsPath =
    `/opportunities/${encodeURIComponent(opportunityId)}`

  revalidatePath(detailsPath)
  redirect(detailsPath)
}
