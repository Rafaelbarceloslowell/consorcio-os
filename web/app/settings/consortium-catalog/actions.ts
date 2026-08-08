"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  ConsortiumRuleSource,
  ConsortiumRuleStatus,
  ConsortiumStatus,
  ConsortiumType,
} from "@/lib/generated/prisma/client"

import {
  assertConsortiumCatalogManager,
} from "@/application/consortium/assert-consortium-catalog-access"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getAuthenticatedCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

function text(
  formData: FormData,
  name: string,
  required = true,
): string | null {
  const value =
    formData.get(name)
      ?.toString()
      .trim() ?? ""

  if (required && !value) {
    throw new Error(
      `${name} é obrigatório.`,
    )
  }

  return value || null
}

function numberValue(
  formData: FormData,
  name: string,
  options: {
    integer?: boolean
    optional?: boolean
  } = {},
): number | null {
  const raw =
    text(
      formData,
      name,
      !options.optional,
    )

  if (raw === null) {
    return null
  }

  const value = Number(raw)

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    (
      options.integer &&
      !Number.isInteger(value)
    )
  ) {
    throw new Error(
      `${name} possui valor inválido.`,
    )
  }

  return value
}

function dateValue(
  formData: FormData,
  name: string,
): Date | null {
  const raw =
    text(
      formData,
      name,
      false,
    )

  if (!raw) {
    return null
  }

  const date = new Date(raw)

  if (!Number.isFinite(
    date.getTime(),
  )) {
    throw new Error(
      `${name} possui data inválida.`,
    )
  }

  return date
}

function enumValue<
  Value extends string,
>(
  formData: FormData,
  name: string,
  values: readonly Value[],
): Value {
  const value =
    text(formData, name)

  if (
    !value ||
    !values.includes(
      value as Value,
    )
  ) {
    throw new Error(
      `${name} possui opção inválida.`,
    )
  }

  return value as Value
}

export async function saveConsortiumCatalogAction(
  formData: FormData,
): Promise<void> {
  const context =
    await getAuthenticatedCommercialContext()

  assertConsortiumCatalogManager(
    context.role,
  )

  const id =
    text(
      formData,
      "consortiumId",
      false,
    )
  const ruleStatus =
    enumValue(
      formData,
      "ruleStatus",
      Object.values(
        ConsortiumRuleStatus,
      ),
    )
  const rawRuleSource =
    text(
      formData,
      "ruleSource",
      false,
    )
  const ruleSource =
    rawRuleSource
      ? enumValue(
          formData,
          "ruleSource",
          Object.values(
            ConsortiumRuleSource,
          ),
        )
      : null
  const sourceReference =
    text(
      formData,
      "sourceReference",
      false,
    )
  const verifiedAt =
    dateValue(
      formData,
      "verifiedAt",
    )
  const effectiveFrom =
    dateValue(
      formData,
      "effectiveFrom",
    )
  const effectiveUntil =
    dateValue(
      formData,
      "effectiveUntil",
    )

  if (
    ruleStatus ===
      ConsortiumRuleStatus.VERIFIED &&
    (
      !ruleSource ||
      !sourceReference ||
      !verifiedAt ||
      !effectiveFrom
    )
  ) {
    throw new Error(
      "Uma regra verificada exige fonte, referência, data de verificação e início de vigência.",
    )
  }

  if (
    effectiveFrom &&
    effectiveUntil &&
    effectiveUntil <= effectiveFrom
  ) {
    throw new Error(
      "O fim da vigência deve ser posterior ao início.",
    )
  }

  const minCreditValue =
    numberValue(
      formData,
      "minCreditValue",
    ) ?? 0
  const maxCreditValue =
    numberValue(
      formData,
      "maxCreditValue",
    ) ?? 0

  if (
    minCreditValue <= 0 ||
    maxCreditValue <
      minCreditValue
  ) {
    throw new Error(
      "A faixa de crédito é inválida.",
    )
  }

  const defaultTermMonths =
    numberValue(
      formData,
      "defaultTermMonths",
      { integer: true },
    ) ?? 0
  const minInstallmentValue =
    numberValue(
      formData,
      "minInstallmentValue",
      { optional: true },
    )
  const maxInstallmentValue =
    numberValue(
      formData,
      "maxInstallmentValue",
      { optional: true },
    )
  const embeddedBidValue =
    text(
      formData,
      "embeddedBidAllowed",
      false,
    )

  if (defaultTermMonths <= 0) {
    throw new Error(
      "O prazo padrão deve ser maior que zero.",
    )
  }

  if (
    minInstallmentValue !== null &&
    maxInstallmentValue !== null &&
    maxInstallmentValue <
      minInstallmentValue
  ) {
    throw new Error(
      "A faixa de parcela é inválida.",
    )
  }

  const data = {
    name: text(formData, "name")!,
    administrator:
      text(
        formData,
        "administrator",
      )!,
    type: enumValue(
      formData,
      "type",
      Object.values(
        ConsortiumType,
      ),
    ),
    groupNumber:
      text(
        formData,
        "groupNumber",
      )!,
    minCreditValue,
    maxCreditValue,
    defaultTermMonths,
    administrationFeePercent:
      numberValue(
        formData,
        "administrationFeePercent",
      )!,
    reserveFundPercent:
      numberValue(
        formData,
        "reserveFundPercent",
      )!,
    totalQuotas:
      numberValue(
        formData,
        "totalQuotas",
        { integer: true },
      )!,
    availableQuotas:
      numberValue(
        formData,
        "availableQuotas",
        { integer: true },
      )!,
    status: enumValue(
      formData,
      "status",
      Object.values(
        ConsortiumStatus,
      ),
    ),
    description:
      text(
        formData,
        "description",
        false,
      ),
    ruleStatus,
    ruleSource,
    sourceReference,
    verifiedAt,
    effectiveFrom,
    effectiveUntil,
    minInstallmentValue,
    maxInstallmentValue,
    embeddedBidAllowed:
      embeddedBidValue
        ? embeddedBidValue ===
          "true"
        : null,
  }

  if (id) {
    const existing =
      await prisma.consortium.findFirst({
        where: {
          id,
          workspaceId:
            context.workspaceId,
        },
        select: {
          id: true,
          ruleVersion: true,
        },
      })

    if (!existing) {
      throw new Error(
        "Registro de catálogo não encontrado neste workspace.",
      )
    }

    await prisma.consortium.update({
      where: { id: existing.id },
      data: {
        ...data,
        ruleVersion:
          existing.ruleVersion + 1,
      },
    })
  } else {
    await prisma.consortium.create({
      data: {
        workspaceId:
          context.workspaceId,
        ...data,
        ruleVersion: 1,
      },
    })
  }

  revalidatePath(
    "/settings/consortium-catalog",
  )
}
