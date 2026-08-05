"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  LeadApproachType,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

function parseApproachType(
  value: FormDataEntryValue | null,
): LeadApproachType {
  if (value === "NEW") {
    return LeadApproachType.NEW
  }

  if (value === "REACTIVATION") {
    return LeadApproachType.REACTIVATION
  }

  throw new Error(
    "Selecione Novo atendimento ou Reativação.",
  )
}

export async function updateLeadApproachAction(
  opportunityId: string,
  leadId: string,
  formData: FormData,
): Promise<void> {
  const normalizedOpportunityId =
    opportunityId.trim()

  const normalizedLeadId =
    leadId.trim()

  if (
    !normalizedOpportunityId ||
    !normalizedLeadId
  ) {
    throw new Error(
      "A oportunidade não possui um lead válido.",
    )
  }

  const approachType =
    parseApproachType(
      formData.get("approachType"),
    )

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

  const result =
    await prisma.lead.updateMany({
      where: {
        id: normalizedLeadId,
        workspaceId: workspace.id,
      },
      data: {
        approachType,
      },
    })

  if (result.count !== 1) {
    throw new Error(
      "Não foi possível atualizar o tipo de atendimento desse lead.",
    )
  }

  revalidatePath(
    `/opportunities/${encodeURIComponent(
      normalizedOpportunityId,
    )}`,
  )

  revalidatePath("/leads")
  revalidatePath("/")
}