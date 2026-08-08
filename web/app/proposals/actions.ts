"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  ClientStatus,
  CommercialActorType,
  CommercialEventType,
  CommercialJourneyOutcome,
  LeadStatus,
  PersonType,
  PipelineStageType,
  Prisma,
  ProposalStatus,
  TaskStatus,
} from "@/lib/generated/prisma/client"

import {
  closeSale as closeSaleDomain,
} from "@/application/sale/close-sale"

import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  getWorkspaceSlug,
} from "@/lib/workspace/workspace-slug"

import {
  ClientMapper,
} from "@/infrastructure/prisma/mappers/client-mapper"
import {
  CommercialJourneyMapper,
} from "@/infrastructure/prisma/mappers/commercial-journey-mapper"
import {
  ConsortiumMapper,
} from "@/infrastructure/prisma/mappers/consortium-mapper"
import {
  ConsultantMapper,
} from "@/infrastructure/prisma/mappers/consultant-mapper"
import {
  JourneyPhaseMapper,
} from "@/infrastructure/prisma/mappers/journey-phase-mapper"
import {
  JourneyStateMapper,
} from "@/infrastructure/prisma/mappers/journey-state-mapper"
import {
  ProposalMapper,
} from "@/infrastructure/prisma/mappers/proposal-mapper"
import {
  SaleMapper,
} from "@/infrastructure/prisma/mappers/sale-mapper"

import type {
  PaymentMethod as DomainPaymentMethod,
} from "@/types/domain"

const WORKSPACE_SLUG =
  getWorkspaceSlug()

type Transaction =
  Prisma.TransactionClient

function requiredValue(
  formData: FormData,
  field: string,
): string {
  const value =
    formData.get(field)

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${field} é obrigatório.`,
    )
  }

  return value.trim()
}

async function resolveWorkspaceId(): Promise<string> {
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
    throw new Error(
      `Workspace "${WORKSPACE_SLUG}" não encontrado.`,
    )
  }

  return workspace.id
}

async function findJourney({
  transaction,
  workspaceId,
  leadId,
  clientId,
}: {
  transaction: Transaction
  workspaceId: string
  leadId: string | null
  clientId: string | null
}) {
  if (!leadId && !clientId) {
    return null
  }

  return transaction
    .commercialJourney
    .findFirst({
      where: {
        workspaceId,
        closedAt: null,
        OR: [
          ...(leadId
            ? [
                {
                  leadId,
                },
              ]
            : []),
          ...(clientId
            ? [
                {
                  clientId,
                },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    })
}

async function registerProposalEvent({
  transaction,
  workspaceId,
  journeyId,
  type,
  actorId,
  payload,
  occurredAt,
}: {
  transaction: Transaction
  workspaceId: string
  journeyId: string | null
  type: CommercialEventType
  actorId: string
  payload: Prisma.InputJsonObject
  occurredAt: Date
}): Promise<void> {
  if (!journeyId) {
    return
  }

  await transaction
    .commercialEvent
    .create({
      data: {
        workspaceId,
        journeyId,
        type,
        actorType:
          CommercialActorType.CONSULTANT,
        actorId,
        payload,
        occurredAt,
      },
    })
}

export async function sendProposalAction(
  formData: FormData,
): Promise<void> {
  const proposalId =
    requiredValue(
      formData,
      "proposalId",
    )
  const workspaceId =
    await resolveWorkspaceId()
  const now = new Date()

  await prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const proposal =
        await transaction
          .proposal
          .findFirst({
            where: {
              id: proposalId,
              workspaceId,
              status:
                ProposalStatus.DRAFT,
            },
            select: {
              id: true,
              code: true,
              consultantId: true,
              leadId: true,
              clientId: true,
            },
          })

      if (!proposal) {
        throw new Error(
          "A proposta não está disponível para envio.",
        )
      }

      await transaction
        .proposal
        .update({
          where: {
            id: proposal.id,
          },
          data: {
            status:
              ProposalStatus.SENT,
            sentAt: now,
            acceptedAt: null,
            rejectedAt: null,
            rejectionReason: null,
          },
        })

      const journey =
        await findJourney({
          transaction,
          workspaceId,
          leadId:
            proposal.leadId,
          clientId:
            proposal.clientId,
        })

      await registerProposalEvent({
        transaction,
        workspaceId,
        journeyId:
          journey?.id ?? null,
        type:
          CommercialEventType.PROPOSAL_SENT,
        actorId:
          proposal.consultantId,
        payload: {
          category:
            "proposal_sent_from_operational_module",
          proposalId:
            proposal.id,
          code:
            proposal.code,
          sentAt:
            now.toISOString(),
          clientCreated:
            false,
        },
        occurredAt: now,
      })
    },
  )

  revalidatePath("/proposals")
  revalidatePath("/")
}

export async function acceptProposalAction(
  formData: FormData,
): Promise<void> {
  const proposalId =
    requiredValue(
      formData,
      "proposalId",
    )
  const workspaceId =
    await resolveWorkspaceId()
  const now = new Date()

  await prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const proposal =
        await transaction
          .proposal
          .findFirst({
            where: {
              id: proposalId,
              workspaceId,
              status:
                ProposalStatus.SENT,
            },
            select: {
              id: true,
              code: true,
              consultantId: true,
              leadId: true,
              clientId: true,
            },
          })

      if (!proposal) {
        throw new Error(
          "A proposta não está disponível para aceite.",
        )
      }

      await transaction
        .proposal
        .update({
          where: {
            id: proposal.id,
          },
          data: {
            status:
              ProposalStatus.ACCEPTED,
            acceptedAt: now,
            rejectedAt: null,
            rejectionReason: null,
          },
        })

      const journey =
        await findJourney({
          transaction,
          workspaceId,
          leadId:
            proposal.leadId,
          clientId:
            proposal.clientId,
        })

      await registerProposalEvent({
        transaction,
        workspaceId,
        journeyId:
          journey?.id ?? null,
        type:
          CommercialEventType.PROPOSAL_ACCEPTED,
        actorId:
          proposal.consultantId,
        payload: {
          category:
            "proposal_accepted",
          proposalId:
            proposal.id,
          code:
            proposal.code,
          acceptedAt:
            now.toISOString(),
          leadRemainsLead:
            Boolean(
              proposal.leadId &&
              !proposal.clientId,
            ),
          existingClient:
            Boolean(
              proposal.clientId,
            ),
          clientCreated:
            false,
          saleCreated:
            false,
        },
        occurredAt: now,
      })
    },
  )

  revalidatePath("/proposals")
  revalidatePath("/leads")
  revalidatePath("/")
}

function parsePositiveInteger(
  formData: FormData,
  field: string,
  label: string,
): number {
  const value = Number(
    requiredValue(
      formData,
      field,
    ),
  )

  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${label} deve ser um número inteiro maior que zero.`,
    )
  }

  return value
}

function parseCommissionPercent(
  formData: FormData,
): number {
  const value = Number(
    requiredValue(
      formData,
      "commissionPercent",
    ).replace(",", "."),
  )

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      "A comissão deve estar entre 0 e 100 por cento.",
    )
  }

  return value
}

function parsePaymentMethod(
  formData: FormData,
): DomainPaymentMethod {
  const value = requiredValue(
    formData,
    "paymentMethod",
  )

  if (
    value === "bank_slip" ||
    value === "direct_debit" ||
    value === "credit_card" ||
    value === "pix"
  ) {
    return value
  }

  throw new Error(
    "Selecione uma forma de pagamento válida.",
  )
}

function optionalValue(
  formData: FormData,
  field: string,
): string | null {
  const value = formData.get(field)

  if (typeof value !== "string") {
    return null
  }

  return value.trim() || null
}

function normalizeDocument(
  value: string,
): string {
  return value.replace(/\D/gu, "")
}

function hasErrorCode(
  error: unknown,
  code: string,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  )
}

export async function closeProposalSaleAction(
  formData: FormData,
): Promise<void> {
  const proposalId = requiredValue(
    formData,
    "proposalId",
  )
  const contractNumber = requiredValue(
    formData,
    "contractNumber",
  ).toUpperCase()
  const quotaNumber =
    parsePositiveInteger(
      formData,
      "quotaNumber",
      "O número da cota",
    )
  const paymentMethod =
    parsePaymentMethod(formData)
  const firstInstallmentDate =
    requiredValue(
      formData,
      "firstInstallmentDate",
    )
  const parsedFirstInstallmentDate =
    new Date(firstInstallmentDate)
  const commissionPercent =
    parseCommissionPercent(formData)
  const saleNotes = optionalValue(
    formData,
    "saleNotes",
  )

  if (
    Number.isNaN(
      parsedFirstInstallmentDate.getTime(),
    )
  ) {
    throw new Error(
      "A data da primeira parcela é inválida.",
    )
  }

  const workspaceId =
    await resolveWorkspaceId()
  const now = new Date()

  try {
    await prisma.$transaction(
      async (transaction: Transaction) => {
        const proposal =
          await transaction.proposal.findFirst({
            where: {
              id: proposalId,
              workspaceId,
            },
            include: {
              sale: {
                select: {
                  id: true,
                },
              },
            },
          })

        if (!proposal) {
          throw new Error(
            "A proposta informada não foi encontrada.",
          )
        }

        if (proposal.sale) {
          return
        }

        if (
          proposal.status !==
          ProposalStatus.ACCEPTED
        ) {
          throw new Error(
            "A proposta precisa estar aceita antes do fechamento da venda.",
          )
        }

        const journey = await findJourney({
          transaction,
          workspaceId,
          leadId: proposal.leadId,
          clientId: proposal.clientId,
        })

        if (!journey) {
          throw new Error(
            "A oportunidade ativa desta proposta não foi encontrada.",
          )
        }

        const lead = proposal.leadId
          ? await transaction.lead.findFirst({
              where: {
                id: proposal.leadId,
                workspaceId,
              },
            })
          : null

        if (proposal.leadId && !lead) {
          throw new Error(
            "O lead de origem da proposta não foi encontrado.",
          )
        }

        let clientId =
          proposal.clientId ??
          lead?.convertedClientId ??
          null
        let convertedLeadId:
          | string
          | null = null

        if (!clientId && lead) {
          const personTypeValue =
            requiredValue(
              formData,
              "personType",
            )
          const personType =
            personTypeValue ===
            "individual"
              ? PersonType.INDIVIDUAL
              : personTypeValue ===
                  "company"
                ? PersonType.COMPANY
                : null
          const document =
            normalizeDocument(
              requiredValue(
                formData,
                "document",
              ),
            )
          const companyName =
            optionalValue(
              formData,
              "companyName",
            )

          if (!personType) {
            throw new Error(
              "Selecione um tipo de pessoa válido.",
            )
          }

          if (!document) {
            throw new Error(
              "Informe o CPF ou CNPJ do cliente.",
            )
          }

          if (
            personType ===
              PersonType.COMPANY &&
            !companyName
          ) {
            throw new Error(
              "Informe a razão social do cliente.",
            )
          }

          const duplicatedClient =
            await transaction.client.findFirst({
              where: {
                workspaceId,
                OR: [
                  { document },
                  {
                    email:
                      lead.email,
                  },
                ],
              },
              select: {
                id: true,
              },
            })

          if (duplicatedClient) {
            throw new Error(
              "Já existe um cliente com o documento ou e-mail deste lead. Revise o cadastro antes de fechar a venda.",
            )
          }

          const wonPipelineStage =
            await transaction.pipelineStage
              .findFirst({
                where: {
                  workspaceId,
                  type:
                    PipelineStageType.DEAL,
                  isClosedStage: true,
                  isWonStage: true,
                },
                orderBy: {
                  order: "asc",
                },
                select: {
                  id: true,
                },
              })

          if (!wonPipelineStage) {
            throw new Error(
              "O estágio ganho do pipeline não está configurado.",
            )
          }

          const createdClient =
            await transaction.client.create({
              data: {
                workspaceId,
                type: personType,
                name:
                  personType ===
                  PersonType.COMPANY
                    ? companyName!
                    : lead.name,
                email: lead.email,
                phone: lead.phone,
                document,
                companyName:
                  companyName ??
                  lead.companyName,
                addressStreet:
                  requiredValue(
                    formData,
                    "addressStreet",
                  ),
                addressNumber:
                  requiredValue(
                    formData,
                    "addressNumber",
                  ),
                addressComplement:
                  optionalValue(
                    formData,
                    "addressComplement",
                  ),
                addressNeighborhood:
                  requiredValue(
                    formData,
                    "addressNeighborhood",
                  ),
                addressCity:
                  requiredValue(
                    formData,
                    "addressCity",
                  ),
                addressState:
                  requiredValue(
                    formData,
                    "addressState",
                  ).toUpperCase(),
                addressZipCode:
                  normalizeDocument(
                    requiredValue(
                      formData,
                      "addressZipCode",
                    ),
                  ),
                consultantId:
                  lead.consultantId,
                status:
                  ClientStatus.ACTIVE,
                tags: [],
                notes: lead.notes,
              },
              select: {
                id: true,
              },
            })

          clientId = createdClient.id
          convertedLeadId = lead.id

          await transaction.lead.update({
            where: {
              id: lead.id,
            },
            data: {
              status:
                LeadStatus.CONVERTED,
              convertedClientId:
                clientId,
              pipelineStageId:
                wonPipelineStage.id,
              lastContactAt: now,
            },
          })
        }

        if (!clientId) {
          throw new Error(
            "A proposta não possui lead ou cliente válido para concluir a venda.",
          )
        }

        if (
          proposal.clientId !== clientId
        ) {
          await transaction.proposal.update({
            where: {
              id: proposal.id,
            },
            data: {
              clientId,
            },
          })
        }

        const [
          client,
          consultant,
          consortium,
          wonState,
          existingSales,
        ] = await Promise.all([
          transaction.client.findFirst({
            where: {
              id: clientId,
              workspaceId,
            },
            include: {
              convertedFromLead: {
                select: {
                  id: true,
                },
              },
            },
          }),
          transaction.consultant.findFirst({
            where: {
              id:
                proposal.consultantId,
              workspaceId,
            },
          }),
          transaction.consortium.findFirst({
            where: {
              id:
                proposal.consortiumId,
              workspaceId,
            },
          }),
          transaction.journeyState.findFirst({
            where: {
              workspaceId,
              code: "WON",
              isWon: true,
              isFinal: true,
              isActive: true,
            },
          }),
          transaction.sale.findMany({
            where: {
              workspaceId,
            },
          }),
        ])

        if (!client) {
          throw new Error(
            "O cliente da venda não foi encontrado.",
          )
        }

        if (!consultant) {
          throw new Error(
            "O consultor responsável pela venda não foi encontrado.",
          )
        }

        if (!consortium) {
          throw new Error(
            "O grupo de consórcio da proposta não foi encontrado.",
          )
        }

        if (!wonState) {
          throw new Error(
            'O estado final de jornada com código "WON" não foi encontrado.',
          )
        }

        const wonPhase =
          await transaction.journeyPhase.findFirst({
            where: {
              id: wonState.phaseId,
              workspaceId,
              isActive: true,
            },
          })

        if (!wonPhase) {
          throw new Error(
            "A fase de encerramento da jornada não está ativa.",
          )
        }

        const proposalDomain = {
          ...ProposalMapper.toDomain(
            proposal,
          ),
          clientId,
        }
        const journeyDomain = {
          ...CommercialJourneyMapper.toDomain(
            journey,
          ),
          clientId,
        }
        const clientDomain =
          ClientMapper.toDomain(client)
        const consultantDomain =
          ConsultantMapper.toDomain(
            consultant,
          )
        const consortiumDomain =
          ConsortiumMapper.toDomain(
            consortium,
          )
        const wonStateDomain =
          JourneyStateMapper.toDomain(
            wonState,
          )
        const wonPhaseDomain =
          JourneyPhaseMapper.toDomain(
            wonPhase,
          )
        const existingSalesDomain =
          existingSales.map((sale) =>
            SaleMapper.toDomain(sale),
          )

        const sale = closeSaleDomain(
          {
            proposalId:
              proposal.id,
            journeyId:
              journey.id,
            contractNumber,
            quotaNumber,
            paymentMethod,
            firstInstallmentDate,
            commissionPercent,
            status:
              "pending_signature",
            notes:
              saleNotes ??
              undefined,
          },
          {
            now,
            updateJourney: false,
            crmRepository: {
              getProposalById: (id) =>
                id === proposal.id
                  ? proposalDomain
                  : undefined,
              getSales: () =>
                existingSalesDomain,
              getClientById: (id) =>
                id === clientId
                  ? clientDomain
                  : undefined,
              getConsultantById: (id) =>
                id ===
                consultantDomain.id
                  ? consultantDomain
                  : undefined,
              getConsortiumById: (id) =>
                id ===
                consortiumDomain.id
                  ? consortiumDomain
                  : undefined,
              createSale: (createdSale) =>
                createdSale,
            },
            commercialRepository: {
              getJourneyById: (id) =>
                id === journey.id
                  ? journeyDomain
                  : undefined,
              getStates: () => [
                wonStateDomain,
              ],
              getPhaseById: (id) =>
                id === wonPhase.id
                  ? wonPhaseDomain
                  : undefined,
              updateJourney:
                (updatedJourney) =>
                  updatedJourney,
            },
          },
        )

        await transaction.sale.create({
          data: SaleMapper.toPersistence({
            workspaceId,
            sale,
          }),
        })

        const journeyUpdate =
          await transaction.commercialJourney
            .updateMany({
              where: {
                id: journey.id,
                workspaceId,
                closedAt: null,
                version:
                  journey.version,
              },
              data: {
                clientId,
                currentPhaseId:
                  wonPhase.id,
                currentStateId:
                  wonState.id,
                outcome:
                  CommercialJourneyOutcome.WON,
                stateEnteredAt: now,
                lastInteractionAt:
                  now,
                closedAt: now,
                version: {
                  increment: 1,
                },
              },
            })

        if (journeyUpdate.count !== 1) {
          throw new Error(
            "A oportunidade foi alterada por outro processo. Atualize a página antes de tentar novamente.",
          )
        }

        if (convertedLeadId) {
          await registerProposalEvent({
            transaction,
            workspaceId,
            journeyId: journey.id,
            type:
              CommercialEventType.NOTE_ADDED,
            actorId:
              proposal.consultantId,
            payload: {
              category:
                "lead_converted_on_sale",
              leadId:
                convertedLeadId,
              clientId,
              proposalId:
                proposal.id,
            },
            occurredAt: now,
          })
        }

        await registerProposalEvent({
          transaction,
          workspaceId,
          journeyId: journey.id,
          type:
            CommercialEventType.SALE_COMPLETED,
          actorId:
            proposal.consultantId,
          payload: {
            category:
              "sale_closed_from_accepted_proposal",
            saleId: sale.id,
            proposalId:
              proposal.id,
            clientId,
            leadId:
              proposal.leadId,
            contractNumber:
              sale.contractNumber,
            quotaNumber:
              sale.quotaNumber,
            creditValue:
              sale.creditValue,
            commissionValue:
              sale.commissionValue,
            saleDate:
              sale.saleDate,
          },
          occurredAt: now,
        })

        await transaction.task.updateMany({
          where: {
            workspaceId,
            proposalId:
              proposal.id,
            status: {
              in: [
                TaskStatus.PENDING,
                TaskStatus.IN_PROGRESS,
              ],
            },
          },
          data: {
            status:
              TaskStatus.COMPLETED,
            completedAt: now,
          },
        })
      },
    )
  }
  catch (error) {
    if (hasErrorCode(error, "P2002")) {
      const existingSale =
        await prisma.sale.findUnique({
          where: {
            proposalId,
          },
          select: {
            id: true,
          },
        })

      if (!existingSale) {
        throw new Error(
          "Já existe um cadastro usando o contrato, a cota, o documento ou o contato informado.",
        )
      }
    }
    else {
      throw error
    }
  }

  revalidatePath("/")
  revalidatePath("/leads")
  revalidatePath("/clients")
  revalidatePath("/opportunities")
  revalidatePath("/proposals")
  revalidatePath("/finance")
}

export async function rejectProposalAction(
  formData: FormData,
): Promise<void> {
  const proposalId =
    requiredValue(
      formData,
      "proposalId",
    )
  const rejectionReason =
    requiredValue(
      formData,
      "rejectionReason",
    )

  if (
    rejectionReason.length >
    500
  ) {
    throw new Error(
      "O motivo deve ter no máximo 500 caracteres.",
    )
  }

  const workspaceId =
    await resolveWorkspaceId()
  const now = new Date()

  await prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const proposal =
        await transaction
          .proposal
          .findFirst({
            where: {
              id: proposalId,
              workspaceId,
              status: {
                in: [
                  ProposalStatus.DRAFT,
                  ProposalStatus.SENT,
                ],
              },
            },
            select: {
              id: true,
              code: true,
              consultantId: true,
              leadId: true,
              clientId: true,
            },
          })

      if (!proposal) {
        throw new Error(
          "A proposta não está disponível para rejeição.",
        )
      }

      await transaction
        .proposal
        .update({
          where: {
            id: proposal.id,
          },
          data: {
            status:
              ProposalStatus.REJECTED,
            rejectedAt: now,
            acceptedAt: null,
            rejectionReason,
          },
        })

      const journey =
        await findJourney({
          transaction,
          workspaceId,
          leadId:
            proposal.leadId,
          clientId:
            proposal.clientId,
        })

      await registerProposalEvent({
        transaction,
        workspaceId,
        journeyId:
          journey?.id ?? null,
        type:
          CommercialEventType.NOTE_ADDED,
        actorId:
          proposal.consultantId,
        payload: {
          category:
            "proposal_rejected",
          proposalId:
            proposal.id,
          code:
            proposal.code,
          rejectionReason,
          rejectedAt:
            now.toISOString(),
          clientCreated:
            false,
        },
        occurredAt: now,
      })
    },
  )

  revalidatePath("/proposals")
  revalidatePath("/")
}
