"use server"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  CommercialActorType,
  CommercialEventType,
  CommercialJourneyPriority,
  ConsortiumType,
  ConsultantStatus,
  LeadSource,
  LeadStatus,
  PipelineStageType,
  Prisma,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  getWorkspaceSlug,
} from "@/lib/workspace/workspace-slug"

import type {
  LeadCreateActionFieldErrors,
  LeadCreateActionState,
  LeadCreateActionValues,
} from "@/types/lead-create"

const WORKSPACE_SLUG =
  getWorkspaceSlug()

class LeadIntakeError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?:
      LeadCreateActionFieldErrors,
  ) {
    super(message)
    this.name = "LeadIntakeError"
  }
}

type ParsedLeadCreateInput = Readonly<{
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
}>

function readValue(
  formData: FormData,
  field: keyof LeadCreateActionValues,
): string {
  const value = formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function readValues(
  formData: FormData,
): LeadCreateActionValues {
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
  return value.replace(/\D/g, "")
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
    .replace(/\s/g, "")

  const normalized =
    compact.includes(",")
      ? compact
          .replace(/\./g, "")
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
  values: LeadCreateActionValues,
): ParsedLeadCreateInput {
  const fieldErrors:
    LeadCreateActionFieldErrors = {}

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
    !/^\S+@\S+\.\S+$/.test(email)
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
    throw new LeadIntakeError(
      "Revise os campos destacados antes de criar o lead.",
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
  }
}

function hasDuplicateContact(
  records: ReadonlyArray<{
    email: string
    phone: string
  }>,
  input: Pick<
    ParsedLeadCreateInput,
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

export async function createLeadAction(
  _previousState: LeadCreateActionState,
  formData: FormData,
): Promise<LeadCreateActionState> {
  const values = readValues(formData)

  let input: ParsedLeadCreateInput

  try {
    input = parseInput(values)
  }
  catch (error) {
    if (error instanceof LeadIntakeError) {
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
      throw new LeadIntakeError(
        'Workspace "consorcio-os" não encontrado.',
      )
    }

    await prisma.$transaction(
      async (transaction) => {
        const consultant =
          await transaction
            .consultant
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
          throw new LeadIntakeError(
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
          throw new LeadIntakeError(
            "Já existe um lead cadastrado com este e-mail.",
            {
              email:
                "Este e-mail já pertence a outro lead.",
            },
          )
        }

        if (duplicateLead === "phone") {
          throw new LeadIntakeError(
            "Já existe um lead cadastrado com o telefone informado.",
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
          throw new LeadIntakeError(
            "Este contato já pertence a um cliente cadastrado.",
            {
              [duplicateClient]:
                duplicateClient === "email"
                  ? "Este e-mail já pertence a um cliente."
                  : "Este telefone já pertence a um cliente.",
            },
          )
        }

        let pipelineStage =
          await transaction
            .pipelineStage
            .findFirst({
              where: {
                workspaceId:
                  workspace.id,
                type:
                  PipelineStageType.LEAD,
                isClosedStage:
                  false,
              },
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
              },
            })

        if (!pipelineStage) {
          const lastLeadStage =
            await transaction
              .pipelineStage
              .findFirst({
                where: {
                  workspaceId:
                    workspace.id,
                  type:
                    PipelineStageType.LEAD,
                },
                orderBy: {
                  order: "desc",
                },
                select: {
                  order: true,
                },
              })

          pipelineStage =
            await transaction
              .pipelineStage
              .create({
                data: {
                  workspaceId:
                    workspace.id,
                  name:
                    "Em atendimento",
                  order:
                    (lastLeadStage
                      ?.order ?? 0) + 1,
                  type:
                    PipelineStageType.LEAD,
                  color: "#2F8F5B",
                  description:
                    "Leads ativos em atendimento antes do fechamento da cota.",
                  winProbability:
                    new Prisma.Decimal(
                      "25.00",
                    ),
                  isClosedStage:
                    false,
                  isWonStage:
                    false,
                },
                select: {
                  id: true,
                },
              })
        }

        const initialState =
          await transaction
            .journeyState
            .findFirst({
              where: {
                workspaceId:
                  workspace.id,
                isInitial: true,
                isActive: true,
                isFinal: false,
              },
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                phaseId: true,
              },
            })

        if (!initialState) {
          throw new LeadIntakeError(
            "Nenhum estado comercial inicial está configurado para criar a oportunidade.",
          )
        }

        const initialPhase =
          await transaction
            .journeyPhase
            .findFirst({
              where: {
                id: initialState.phaseId,
                workspaceId:
                  workspace.id,
                isActive: true,
              },
              select: {
                id: true,
              },
            })

        if (!initialPhase) {
          throw new LeadIntakeError(
            "A fase comercial inicial não está ativa neste workspace.",
          )
        }

        const now = new Date()
        const persistedEmail =
          input.email ??
          `lead-${input.phone}@sem-email.gorila.local`

        const lead =
          await transaction
            .lead
            .create({
              data: {
                workspaceId:
                  workspace.id,
                name: input.name,
                email: persistedEmail,
                phone: input.phone,
                document:
                  input.document,
                companyName:
                  input.companyName,
                source: input.source,
                status:
                  LeadStatus.NEW,
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
                pipelineStageId:
                  pipelineStage.id,
                score: 0,
                notes: input.notes,
                convertedClientId:
                  null,
              },
              select: {
                id: true,
              },
            })

        const journey =
          await transaction
            .commercialJourney
            .create({
              data: {
                workspaceId:
                  workspace.id,
                leadId: lead.id,
                clientId: null,
                consultantId:
                  consultant.id,
                title:
                  `Oportunidade - ${input.name}`,
                consortiumType:
                  input.consortiumType,
                currentPhaseId:
                  initialPhase.id,
                currentStateId:
                  initialState.id,
                priority:
                  CommercialJourneyPriority.NORMAL,
                score: 0,
                outcome: null,
                stateEnteredAt: now,
                lastInteractionAt:
                  null,
                closedAt: null,
                version: 1,
              },
              select: {
                id: true,
              },
            })

        await transaction
          .commercialEvent
          .create({
            data: {
              workspaceId:
                workspace.id,
              journeyId: journey.id,
              type:
                CommercialEventType.LEAD_CREATED,
              actorType:
                CommercialActorType.CONSULTANT,
              actorId:
                consultant.id,
              payload: {
                category:
                  "real_lead_intake",
                leadId: lead.id,
                source:
                  input.source,
                emailProvided:
                  input.email !== null,
                createdAsClient:
                  false,
              },
              occurredAt: now,
            },
          })

        await transaction
          .commercialEvent
          .create({
            data: {
              workspaceId:
                workspace.id,
              journeyId: journey.id,
              type:
                CommercialEventType.OPPORTUNITY_CREATED,
              actorType:
                CommercialActorType.CONSULTANT,
              actorId:
                consultant.id,
              payload: {
                category:
                  "real_lead_intake",
                leadId: lead.id,
                journeyId:
                  journey.id,
                clientId: null,
              },
              occurredAt: now,
            },
          })
      },
    )
  }
  catch (error) {
    if (error instanceof LeadIntakeError) {
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
          : "Não foi possível criar o lead.",
      values,
    }
  }

  revalidatePath("/")
  revalidatePath("/leads")
  revalidatePath("/opportunities")
  redirect("/leads")
}
