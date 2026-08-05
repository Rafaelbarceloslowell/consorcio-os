"use server"

import {
  randomUUID,
} from "node:crypto"

import {
  revalidatePath,
} from "next/cache"
import {
  redirect,
} from "next/navigation"

import {
  CommercialActorType,
  CommercialEventType,
  ConsortiumStatus,
  Prisma,
  ProposalStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  ProposalCreateActionState,
  ProposalCreateFieldErrors,
  ProposalCreateValues,
} from "@/types/proposal-operational"

const WORKSPACE_SLUG =
  "consorcio-os"

class ProposalCreateError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?:
      ProposalCreateFieldErrors,
  ) {
    super(message)
    this.name =
      "ProposalCreateError"
  }
}

type ParsedProposalInput = {
  leadId: string
  consortiumId: string
  creditValue: number
  installmentValue: number
  termMonths: number
  administrationFeePercent: number
  reserveFundPercent: number
  validUntil: Date
  notes: string | null
}

function readValue(
  formData: FormData,
  field: keyof ProposalCreateValues,
): string {
  const value =
    formData.get(field)

  return typeof value === "string"
    ? value
    : ""
}

function readValues(
  formData: FormData,
): ProposalCreateValues {
  return {
    leadId:
      readValue(
        formData,
        "leadId",
      ),
    consortiumId:
      readValue(
        formData,
        "consortiumId",
      ),
    creditValue:
      readValue(
        formData,
        "creditValue",
      ),
    installmentValue:
      readValue(
        formData,
        "installmentValue",
      ),
    termMonths:
      readValue(
        formData,
        "termMonths",
      ),
    administrationFeePercent:
      readValue(
        formData,
        "administrationFeePercent",
      ),
    reserveFundPercent:
      readValue(
        formData,
        "reserveFundPercent",
      ),
    validUntil:
      readValue(
        formData,
        "validUntil",
      ),
    notes:
      readValue(
        formData,
        "notes",
      ),
  }
}

function parseNumber(
  value: string,
): number {
  const compact =
    value
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

function parseInput(
  values: ProposalCreateValues,
): ParsedProposalInput {
  const fieldErrors:
    ProposalCreateFieldErrors = {}

  const leadId =
    values.leadId.trim()
  const consortiumId =
    values.consortiumId.trim()
  const creditValue =
    parseNumber(
      values.creditValue,
    )
  const installmentValue =
    parseNumber(
      values.installmentValue,
    )
  const termMonths =
    Number(values.termMonths)
  const administrationFeePercent =
    parseNumber(
      values.administrationFeePercent,
    )
  const reserveFundPercent =
    parseNumber(
      values.reserveFundPercent,
    )
  const validUntil =
    new Date(
      `${values.validUntil}T23:59:59`,
    )
  const notes =
    values.notes.trim()

  if (!leadId) {
    fieldErrors.leadId =
      "Selecione o lead."
  }

  if (!consortiumId) {
    fieldErrors.consortiumId =
      "Selecione a administradora e o grupo."
  }

  if (
    !Number.isFinite(
      creditValue,
    ) ||
    creditValue <= 0
  ) {
    fieldErrors.creditValue =
      "Informe um crédito maior que zero."
  }

  if (
    !Number.isFinite(
      installmentValue,
    ) ||
    installmentValue <= 0
  ) {
    fieldErrors.installmentValue =
      "Informe uma parcela maior que zero."
  }

  if (
    !Number.isInteger(
      termMonths,
    ) ||
    termMonths <= 0
  ) {
    fieldErrors.termMonths =
      "Informe um prazo inteiro maior que zero."
  }

  if (
    !Number.isFinite(
      administrationFeePercent,
    ) ||
    administrationFeePercent < 0
  ) {
    fieldErrors.administrationFeePercent =
      "Informe uma taxa de administração válida."
  }

  if (
    !Number.isFinite(
      reserveFundPercent,
    ) ||
    reserveFundPercent < 0
  ) {
    fieldErrors.reserveFundPercent =
      "Informe um fundo de reserva válido."
  }

  if (
    Number.isNaN(
      validUntil.getTime(),
    ) ||
    validUntil.getTime() <=
      Date.now()
  ) {
    fieldErrors.validUntil =
      "Informe uma validade futura."
  }

  if (notes.length > 2000) {
    fieldErrors.notes =
      "A observação deve ter no máximo 2000 caracteres."
  }

  if (
    Object.keys(
      fieldErrors,
    ).length > 0
  ) {
    throw new ProposalCreateError(
      "Revise os campos destacados.",
      fieldErrors,
    )
  }

  return {
    leadId,
    consortiumId,
    creditValue,
    installmentValue,
    termMonths,
    administrationFeePercent,
    reserveFundPercent,
    validUntil,
    notes:
      notes || null,
  }
}

function generateProposalCode(
  now: Date,
): string {
  const year =
    now.getFullYear()
  const token =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()

  return `GOS-${year}-${token}`
}

export async function createProposalAction(
  _previousState:
    ProposalCreateActionState,
  formData: FormData,
): Promise<ProposalCreateActionState> {
  const values =
    readValues(formData)

  let input: ParsedProposalInput

  try {
    input =
      parseInput(values)
  }
  catch (error) {
    if (
      error instanceof
      ProposalCreateError
    ) {
      return {
        status: "error",
        message:
          error.message,
        values,
        fieldErrors:
          error.fieldErrors,
      }
    }

    throw error
  }

  try {
    const workspace =
      await prisma.workspace.findUnique({
        where: {
          slug:
            WORKSPACE_SLUG,
        },
        select: {
          id: true,
        },
      })

    if (!workspace) {
      throw new ProposalCreateError(
        `Workspace "${WORKSPACE_SLUG}" não encontrado.`,
      )
    }

    await prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        const [lead, consortium] =
          await Promise.all([
            transaction
              .lead
              .findFirst({
                where: {
                  id:
                    input.leadId,
                  workspaceId:
                    workspace.id,
                  convertedClientId:
                    null,
                },
                select: {
                  id: true,
                  name: true,
                  consultantId: true,
                  commercialJourneys: {
                    where: {
                      closedAt:
                        null,
                    },
                    orderBy: {
                      createdAt:
                        "desc",
                    },
                    take: 1,
                    select: {
                      id: true,
                    },
                  },
                },
              }),
            transaction
              .consortium
              .findFirst({
                where: {
                  id:
                    input.consortiumId,
                  workspaceId:
                    workspace.id,
                  status:
                    ConsortiumStatus.ACTIVE,
                },
                select: {
                  id: true,
                  minCreditValue:
                    true,
                  maxCreditValue:
                    true,
                },
              }),
          ])

        if (!lead) {
          throw new ProposalCreateError(
            "O lead não está disponível para receber proposta.",
            {
              leadId:
                "Selecione um lead ativo.",
            },
          )
        }

        if (!consortium) {
          throw new ProposalCreateError(
            "O grupo selecionado não está ativo.",
            {
              consortiumId:
                "Selecione um grupo ativo.",
            },
          )
        }

        const minCredit =
          Number(
            consortium.minCreditValue,
          )
        const maxCredit =
          Number(
            consortium.maxCreditValue,
          )

        if (
          input.creditValue <
            minCredit ||
          input.creditValue >
            maxCredit
        ) {
          throw new ProposalCreateError(
            "O crédito está fora dos limites do grupo selecionado.",
            {
              creditValue:
                `Use um valor entre ${minCredit} e ${maxCredit}.`,
            },
          )
        }

        const now =
          new Date()
        const proposal =
          await transaction
            .proposal
            .create({
              data: {
                workspaceId:
                  workspace.id,
                code:
                  generateProposalCode(
                    now,
                  ),
                clientId:
                  null,
                leadId:
                  lead.id,
                consultantId:
                  lead.consultantId,
                consortiumId:
                  consortium.id,
                creditValue:
                  new Prisma.Decimal(
                    input.creditValue,
                  ),
                installmentValue:
                  new Prisma.Decimal(
                    input.installmentValue,
                  ),
                termMonths:
                  input.termMonths,
                administrationFeePercent:
                  new Prisma.Decimal(
                    input.administrationFeePercent,
                  ),
                reserveFundPercent:
                  new Prisma.Decimal(
                    input.reserveFundPercent,
                  ),
                status:
                  ProposalStatus.DRAFT,
                sentAt:
                  null,
                validUntil:
                  input.validUntil,
                acceptedAt:
                  null,
                rejectedAt:
                  null,
                rejectionReason:
                  null,
                notes:
                  input.notes,
              },
              select: {
                id: true,
                code: true,
              },
            })

        const task =
          await transaction
            .task
            .create({
              data: {
                workspaceId:
                  workspace.id,
                title:
                  `Revisar proposta ${proposal.code}`,
                description:
                  `Conferir e enviar a proposta criada para ${lead.name}.`,
                type:
                  TaskType.PROPOSAL_REVIEW,
                status:
                  TaskStatus.PENDING,
                priority:
                  TaskPriority.HIGH,
                dueAt:
                  new Date(
                    now.getTime() +
                      24 *
                        60 *
                        60 *
                        1000,
                  ),
                assignedToId:
                  lead.consultantId,
                leadId:
                  lead.id,
                clientId:
                  null,
                proposalId:
                  proposal.id,
              },
              select: {
                id: true,
              },
            })

        const journey =
          lead.commercialJourneys[0]

        if (journey) {
          await transaction
            .commercialEvent
            .create({
              data: {
                workspaceId:
                  workspace.id,
                journeyId:
                  journey.id,
                type:
                  CommercialEventType.NOTE_ADDED,
                actorType:
                  CommercialActorType.CONSULTANT,
                actorId:
                  lead.consultantId,
                payload: {
                  category:
                    "proposal_created",
                  proposalId:
                    proposal.id,
                  code:
                    proposal.code,
                  taskId:
                    task.id,
                  creditValue:
                    input.creditValue,
                  installmentValue:
                    input.installmentValue,
                  clientId:
                    null,
                  clientCreated:
                    false,
                },
                occurredAt:
                  now,
              },
            })
        }
      },
    )
  }
  catch (error) {
    if (
      error instanceof
      ProposalCreateError
    ) {
      return {
        status: "error",
        message:
          error.message,
        values,
        fieldErrors:
          error.fieldErrors,
      }
    }

    throw error
  }

  revalidatePath("/proposals")
  revalidatePath("/agenda")
  revalidatePath("/")
  redirect("/proposals")
}
