"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  normalizeContactReturnPath,
} from "@/application/contact/normalize-contact-return-path"
import {
  ConsortiumType,
  ConsultantStatus,
  LeadSource,
  Prisma,
} from "@/lib/generated/prisma/client"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  LeadUpdateActionFieldErrors,
  LeadUpdateActionState,
  LeadUpdateActionValues,
} from "@/types/lead-update"

const WORKSPACE_SLUG = "consorcio-os"

class LeadUpdateError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?:
      LeadUpdateActionFieldErrors,
  ) {
    super(message)
    this.name = "LeadUpdateError"
  }
}

type ParsedLeadUpdateInput = Readonly<{
  name: string
  email: string | null
  phone: string
  document: string | null
  companyName: string | null
  source: LeadSource
  consortiumType: ConsortiumType
  desiredCreditValue: number
  desiredTermMonths: number
  consultantId: string
  notes: string | null
  returnTo: string
}>

function readValue(
  formData: FormData,
  field: keyof LeadUpdateActionValues,
): string {
  const value = formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function readValues(
  formData: FormData,
): LeadUpdateActionValues {
  return {
    name: readValue(formData, "name"),
    email: readValue(formData, "email"),
    phoneCountryCode: readValue(
      formData,
      "phoneCountryCode",
    ),
    phone: readValue(formData, "phone"),
    document: readValue(
      formData,
      "document",
    ),
    companyName: readValue(
      formData,
      "companyName",
    ),
    source: readValue(formData, "source"),
    consortiumType: readValue(
      formData,
      "consortiumType",
    ),
    desiredCreditValue: readValue(
      formData,
      "desiredCreditValue",
    ),
    desiredTermMonths: readValue(
      formData,
      "desiredTermMonths",
    ),
    consultantId: readValue(
      formData,
      "consultantId",
    ),
    notes: readValue(formData, "notes"),
    returnTo: readValue(
      formData,
      "returnTo",
    ),
  }
}

function normalizeEmail(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
}

function normalizeDigits(
  value: string,
): string {
  return value.replace(/\D/gu, "")
}

function normalizePhone({
  countryCode,
  phone,
}: {
  countryCode: string
  phone: string
}): string {
  const phoneDigits =
    normalizeDigits(phone)
  const countryDigits =
    normalizeDigits(countryCode)

  if (!phoneDigits) {
    return ""
  }

  if (
    phone.trim().startsWith("+") ||
    !countryDigits ||
    phoneDigits.startsWith(
      countryDigits,
    )
  ) {
    return phoneDigits
  }

  return `${countryDigits}${phoneDigits}`
}

function normalizeComparablePhone(
  value: string,
): string {
  const digits = normalizeDigits(value)

  if (
    digits.length > 11 &&
    digits.startsWith("55")
  ) {
    return digits.slice(2)
  }

  return digits
}

function parseMoney(
  value: string,
): number {
  const compact = value
    .trim()
    .replace(/\s/gu, "")

  const normalized =
    compact.includes(",")
      ? compact
          .replace(/\./gu, "")
          .replace(",", ".")
      : compact

  return Number(normalized)
}

function parseLeadSource(
  value: string,
): LeadSource | null {
  const sources: Record<
    string,
    LeadSource
  > = {
    referral: LeadSource.REFERRAL,
    website: LeadSource.WEBSITE,
    social_media:
      LeadSource.SOCIAL_MEDIA,
    cold_call: LeadSource.COLD_CALL,
    event: LeadSource.EVENT,
    partner: LeadSource.PARTNER,
    walk_in: LeadSource.WALK_IN,
    other: LeadSource.OTHER,
  }

  return sources[value] ?? null
}

function parseConsortiumType(
  value: string,
): ConsortiumType | null {
  const types: Record<
    string,
    ConsortiumType
  > = {
    real_estate:
      ConsortiumType.REAL_ESTATE,
    vehicle:
      ConsortiumType.VEHICLE,
    heavy_vehicle:
      ConsortiumType.HEAVY_VEHICLE,
    services:
      ConsortiumType.SERVICES,
    other:
      ConsortiumType.OTHER,
  }

  return types[value] ?? null
}

function parseInput(
  values: LeadUpdateActionValues,
): ParsedLeadUpdateInput {
  const fieldErrors:
    LeadUpdateActionFieldErrors = {}

  const name = values.name.trim()
  const email = normalizeEmail(
    values.email,
  )
  const phone = normalizePhone({
    countryCode:
      values.phoneCountryCode,
    phone: values.phone,
  })
  const source = parseLeadSource(
    values.source,
  )
  const consortiumType =
    parseConsortiumType(
      values.consortiumType,
    )
  const desiredCreditValue =
    parseMoney(
      values.desiredCreditValue,
    )
  const desiredTermMonths =
    Number(
      values.desiredTermMonths,
    )
  const consultantId =
    values.consultantId.trim()

  if (!name) {
    fieldErrors.name =
      "Informe o nome do lead."
  }

  if (
    email &&
    !/^\S+@\S+\.\S+$/u.test(email)
  ) {
    fieldErrors.email =
      "Informe um e-mail válido."
  }

  if (phone.length < 10) {
    fieldErrors.phone =
      "Informe um telefone válido com DDD."
  }

  if (!source) {
    fieldErrors.source =
      "Selecione a origem do lead."
  }

  if (!consortiumType) {
    fieldErrors.consortiumType =
      "Selecione o tipo de consórcio."
  }

  if (
    !Number.isFinite(
      desiredCreditValue,
    ) ||
    desiredCreditValue <= 0
  ) {
    fieldErrors.desiredCreditValue =
      "Informe um valor de crédito maior que zero."
  }

  if (
    !Number.isInteger(
      desiredTermMonths,
    ) ||
    desiredTermMonths <= 0
  ) {
    fieldErrors.desiredTermMonths =
      "Informe um prazo inteiro maior que zero."
  }

  if (!consultantId) {
    fieldErrors.consultantId =
      "Selecione o consultor responsável."
  }

  if (values.notes.trim().length > 2000) {
    fieldErrors.notes =
      "A observação deve ter no máximo 2000 caracteres."
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !source ||
    !consortiumType
  ) {
    throw new LeadUpdateError(
      "Revise os campos destacados antes de salvar o lead.",
      fieldErrors,
    )
  }

  return {
    name,
    email: email || null,
    phone,
    document:
      normalizeDigits(
        values.document,
      ) || null,
    companyName:
      values.companyName.trim() ||
      null,
    source,
    consortiumType,
    desiredCreditValue,
    desiredTermMonths,
    consultantId,
    notes:
      values.notes.trim() || null,
    returnTo:
      normalizeContactReturnPath(
        values.returnTo,
        "/leads",
      ),
  }
}

function hasDuplicateContact(
  records: ReadonlyArray<{
    email: string
    phone: string
  }>,
  input: Pick<
    ParsedLeadUpdateInput,
    "email" | "phone"
  >,
): "email" | "phone" | null {
  const comparableInputPhone =
    normalizeComparablePhone(
      input.phone,
    )

  for (const record of records) {
    if (
      input.email &&
      normalizeEmail(record.email) ===
        input.email
    ) {
      return "email"
    }

    if (
      normalizeComparablePhone(
        record.phone,
      ) === comparableInputPhone
    ) {
      return "phone"
    }
  }

  return null
}

export async function updateLeadAction(
  leadId: string,
  _previousState:
    LeadUpdateActionState,
  formData: FormData,
): Promise<LeadUpdateActionState> {
  const values = readValues(formData)

  let input: ParsedLeadUpdateInput

  try {
    input = parseInput(values)
  }
  catch (error) {
    if (error instanceof LeadUpdateError) {
      return {
        status: "error",
        message: error.message,
        values,
        fieldErrors:
          error.fieldErrors,
      }
    }

    return {
      status: "error",
      message:
        "Não foi possível validar os dados do lead.",
      values,
    }
  }

  try {
    const workspace =
      await prisma.workspace.findUnique({
        where: {
          slug: WORKSPACE_SLUG,
        },
        select: {
          id: true,
        },
      })

    if (!workspace) {
      throw new LeadUpdateError(
        'Workspace "consorcio-os" não encontrado.',
      )
    }

    await prisma.$transaction(
      async (transaction) => {
        const currentLead =
          await transaction.lead.findFirst({
            where: {
              id: leadId,
              workspaceId:
                workspace.id,
            },
            select: {
              id: true,
            },
          })

        if (!currentLead) {
          throw new LeadUpdateError(
            `Lead não encontrado para o ID "${leadId.trim()}".`,
          )
        }

        const consultant =
          await transaction.consultant
            .findFirst({
              where: {
                id: input.consultantId,
                workspaceId:
                  workspace.id,
                status:
                  ConsultantStatus.ACTIVE,
              },
              select: {
                id: true,
              },
            })

        if (!consultant) {
          throw new LeadUpdateError(
            "O consultor selecionado não está ativo neste workspace.",
            {
              consultantId:
                "Selecione um consultor ativo.",
            },
          )
        }

        const [
          existingLeads,
          existingClients,
        ] = await Promise.all([
          transaction.lead.findMany({
            where: {
              workspaceId:
                workspace.id,
              id: {
                not: currentLead.id,
              },
            },
            select: {
              email: true,
              phone: true,
            },
          }),
          transaction.client.findMany({
            where: {
              workspaceId:
                workspace.id,
            },
            select: {
              email: true,
              phone: true,
            },
          }),
        ])

        const duplicateLead =
          hasDuplicateContact(
            existingLeads,
            input,
          )

        if (duplicateLead === "email") {
          throw new LeadUpdateError(
            "Já existe outro lead cadastrado com este e-mail.",
            {
              email:
                "Este e-mail já pertence a outro lead.",
            },
          )
        }

        if (duplicateLead === "phone") {
          throw new LeadUpdateError(
            "Já existe outro lead cadastrado com o telefone informado.",
            {
              phone:
                "Este telefone já pertence a outro lead.",
            },
          )
        }

        const duplicateClient =
          hasDuplicateContact(
            existingClients,
            input,
          )

        if (duplicateClient) {
          throw new LeadUpdateError(
            "Este contato já pertence a um cliente cadastrado.",
            {
              [duplicateClient]:
                duplicateClient === "email"
                  ? "Este e-mail já pertence a um cliente."
                  : "Este telefone já pertence a um cliente.",
            },
          )
        }

        const persistedEmail =
          input.email ??
          `lead-${input.phone}@sem-email.gorila.local`

        await transaction.lead.update({
          where: {
            id: currentLead.id,
          },
          data: {
            name: input.name,
            email: persistedEmail,
            phone: input.phone,
            document:
              input.document,
            companyName:
              input.companyName,
            source: input.source,
            consortiumType:
              input.consortiumType,
            desiredCreditValue:
              new Prisma.Decimal(
                input.desiredCreditValue,
              ),
            desiredTermMonths:
              input.desiredTermMonths,
            consultantId:
              consultant.id,
            notes: input.notes,
          },
          select: {
            id: true,
          },
        })
      },
    )
  }
  catch (error) {
    if (error instanceof LeadUpdateError) {
      return {
        status: "error",
        message: error.message,
        values,
        fieldErrors:
          error.fieldErrors,
      }
    }

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o lead.",
      values,
    }
  }

  revalidatePath("/leads")
  revalidatePath(input.returnTo)
  redirect(input.returnTo)
}
