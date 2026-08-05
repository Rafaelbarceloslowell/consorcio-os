"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  CommercialActorType,
  CommercialEventType,
  Prisma,
  ProposalStatus,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

const WORKSPACE_SLUG =
  "consorcio-os"

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
      select: {
        id: true,
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

      if (proposal.clientId) {
        throw new Error(
          "O aceite deste módulo não pode operar sobre proposta já vinculada a cliente.",
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
          clientId: null,
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
            "proposal_accepted_without_sale",
          proposalId:
            proposal.id,
          code:
            proposal.code,
          acceptedAt:
            now.toISOString(),
          leadRemainsLead:
            true,
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
