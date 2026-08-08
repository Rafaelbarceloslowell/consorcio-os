import {
  ProposalStatus,
} from "@/lib/generated/prisma/client"

import {
  ProposalList,
} from "@/components/proposal/proposal-list"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  ProposalListView,
} from "@/types/proposal-operational"

import {
  acceptProposalAction,
  closeProposalSaleAction,
  rejectProposalAction,
  sendProposalAction,
} from "./actions"

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

const dateFormatter =
  new Intl.DateTimeFormat("pt-BR")

function getStatusLabel(
  status: ProposalStatus,
): string {
  switch (status) {
    case ProposalStatus.DRAFT:
      return "Rascunho"
    case ProposalStatus.SENT:
      return "Enviada"
    case ProposalStatus.ACCEPTED:
      return "Aceita"
    case ProposalStatus.REJECTED:
      return "Rejeitada"
    case ProposalStatus.EXPIRED:
      return "Expirada"
    default:
      return "Desconhecida"
  }
}

export const dynamic = "force-dynamic"

export default async function ProposalsPage() {
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

  const proposals =
    await prisma.proposal.findMany({
      where: {
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        code: true,
        status: true,
        creditValue: true,
        installmentValue: true,
        termMonths: true,
        validUntil: true,
        createdAt: true,
        rejectionReason: true,
        clientId: true,
        sale: {
          select: {
            id: true,
          },
        },
        lead: {
          select: {
            name: true,
            document: true,
            companyName: true,
            convertedClientId:
              true,
            commercialJourneys: {
              where: {
                closedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                id: true,
              },
            },
          },
        },
        client: {
          select: {
            name: true,
            commercialJourneys: {
              where: {
                closedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                id: true,
              },
            },
          },
        },
        consultant: {
          select: {
            name: true,
          },
        },
        consortium: {
          select: {
            name: true,
            administrator: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

  const view: ProposalListView = {
    proposals: proposals.map(
      (proposal) => {
        const relation =
          proposal.lead ??
          proposal.client
        const journey =
          proposal.lead
            ?.commercialJourneys[0] ??
          proposal.client
            ?.commercialJourneys[0]

        return {
          id: proposal.id,
          code: proposal.code,
          contactName:
            relation?.name ??
            "Contato não informado",
          consultantName:
            proposal.consultant.name,
          administratorName:
            proposal.consortium
              .administrator,
          consortiumName:
            proposal.consortium.name,
          creditValueLabel:
            currencyFormatter.format(
              Number(
                proposal.creditValue,
              ),
            ),
          installmentValueLabel:
            currencyFormatter.format(
              Number(
                proposal.installmentValue,
              ),
            ),
          termMonths:
            proposal.termMonths,
          status:
            proposal.status,
          statusLabel:
            getStatusLabel(
              proposal.status,
            ),
          validUntilLabel:
            dateFormatter.format(
              proposal.validUntil,
            ),
          createdAtLabel:
            dateFormatter.format(
              proposal.createdAt,
            ),
          rejectionReason:
            proposal.rejectionReason,
          opportunityHref:
            journey
              ? `/opportunities/${encodeURIComponent(
                  journey.id,
                )}`
              : null,
          clientId:
            proposal.clientId,
          convertedClientId:
            proposal.lead
              ?.convertedClientId ??
            null,
          leadDocument:
            proposal.lead
              ?.document ?? null,
          leadCompanyName:
            proposal.lead
              ?.companyName ?? null,
          saleId:
            proposal.sale?.id ??
            null,
        }
      },
    ),
  }

  return (
    <ProposalList
      view={view}
      sendAction={
        sendProposalAction
      }
      acceptAction={
        acceptProposalAction
      }
      rejectAction={
        rejectProposalAction
      }
      closeSaleAction={
        closeProposalSaleAction
      }
    />
  )
}
