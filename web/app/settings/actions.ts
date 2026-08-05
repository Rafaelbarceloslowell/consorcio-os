"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  prisma,
} from "@/infrastructure/prisma/client"

const WORKSPACE_SLUG =
  "consorcio-os"

function requiredText(
  formData: FormData,
  name: string,
  label: string,
  maxLength: number,
): string {
  const value =
    formData
      .get(name)
      ?.toString()
      .trim() ?? ""

  if (!value) {
    throw new Error(
      `${label} é obrigatório.`,
    )
  }

  if (
    value.length >
    maxLength
  ) {
    throw new Error(
      `${label} deve ter no máximo ${maxLength} caracteres.`,
    )
  }

  return value
}

function optionalText(
  formData: FormData,
  name: string,
  maxLength: number,
): string {
  const value =
    formData
      .get(name)
      ?.toString()
      .trim() ?? ""

  if (
    value.length >
    maxLength
  ) {
    throw new Error(
      `O campo ${name} deve ter no máximo ${maxLength} caracteres.`,
    )
  }

  return value
}

function requiredEmail(
  formData: FormData,
  name: string,
): string {
  const email =
    requiredText(
      formData,
      name,
      "O e-mail",
      160,
    ).toLocaleLowerCase()

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new Error(
      "O e-mail é inválido.",
    )
  }

  return email
}

function nonNegativeInteger(
  formData: FormData,
  name: string,
  label: string,
): number {
  const raw =
    formData
      .get(name)
      ?.toString()
      .trim() ?? ""

  if (
    !/^\d+$/.test(raw)
  ) {
    throw new Error(
      `${label} deve ser um número inteiro maior ou igual a zero.`,
    )
  }

  return Number(raw)
}

function nonNegativeMoney(
  formData: FormData,
  name: string,
  label: string,
): string {
  const raw =
    formData
      .get(name)
      ?.toString()
      .trim() ?? ""

  const normalized =
    raw
      .replace(/\./g, "")
      .replace(",", ".")

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new Error(
      `${label} deve ser um valor monetário maior ou igual a zero.`,
    )
  }

  return normalized
}

async function requireWorkspace(
  workspaceId: string,
): Promise<void> {
  const workspace =
    await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        slug:
          WORKSPACE_SLUG,
      },
      select: {
        id: true,
      },
    })

  if (!workspace) {
    throw new Error(
      "Workspace não autorizado.",
    )
  }
}

export async function updateWorkspaceSettingsAction(
  formData: FormData,
): Promise<void> {
  const workspaceId =
    requiredText(
      formData,
      "workspaceId",
      "O workspace",
      80,
    )
  const name =
    requiredText(
      formData,
      "name",
      "O nome da empresa",
      120,
    )

  await requireWorkspace(
    workspaceId,
  )

  const result =
    await prisma.workspace.updateMany({
      where: {
        id: workspaceId,
        slug:
          WORKSPACE_SLUG,
      },
      data: {
        name,
      },
    })

  if (result.count !== 1) {
    throw new Error(
      "A empresa não pôde ser atualizada.",
    )
  }

  revalidatePath(
    "/settings",
  )
}

export async function updateConsultantProfileAction(
  formData: FormData,
): Promise<void> {
  const workspaceId =
    requiredText(
      formData,
      "workspaceId",
      "O workspace",
      80,
    )
  const consultantId =
    requiredText(
      formData,
      "consultantId",
      "O consultor",
      80,
    )

  const name =
    requiredText(
      formData,
      "name",
      "O nome",
      120,
    )
  const email =
    requiredEmail(
      formData,
      "email",
    )
  const phone =
    requiredText(
      formData,
      "phone",
      "O telefone",
      30,
    )
  const team =
    optionalText(
      formData,
      "team",
      80,
    )
  const region =
    requiredText(
      formData,
      "region",
      "A região",
      80,
    )

  await requireWorkspace(
    workspaceId,
  )

  const result =
    await prisma.consultant.updateMany({
      where: {
        id: consultantId,
        workspaceId,
      },
      data: {
        name,
        email,
        phone,
        team:
          team ||
          "Sem equipe",
        region,
      },
    })

  if (result.count !== 1) {
    throw new Error(
      "O perfil não pôde ser atualizado.",
    )
  }

  revalidatePath(
    "/settings",
  )
}

export async function updateConsultantGoalsAction(
  formData: FormData,
): Promise<void> {
  const workspaceId =
    requiredText(
      formData,
      "workspaceId",
      "O workspace",
      80,
    )
  const consultantId =
    requiredText(
      formData,
      "consultantId",
      "O consultor",
      80,
    )

  const monthlySalesTarget =
    nonNegativeMoney(
      formData,
      "monthlySalesTarget",
      "A meta mensal de vendas",
    )
  const monthlyLeadsTarget =
    nonNegativeInteger(
      formData,
      "monthlyLeadsTarget",
      "A meta mensal de leads",
    )

  await requireWorkspace(
    workspaceId,
  )

  const result =
    await prisma.consultant.updateMany({
      where: {
        id: consultantId,
        workspaceId,
      },
      data: {
        monthlySalesTarget,
        monthlyLeadsTarget,
      },
    })

  if (result.count !== 1) {
    throw new Error(
      "As metas não puderam ser atualizadas.",
    )
  }

  revalidatePath(
    "/settings",
  )
}
