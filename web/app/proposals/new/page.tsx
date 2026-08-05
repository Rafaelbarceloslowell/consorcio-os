import {
  ConsortiumStatus,
} from "@/lib/generated/prisma/client"

import {
  ProposalCreateForm,
} from "@/components/proposal/proposal-create-form"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  ProposalCreateFormView,
} from "@/types/proposal-operational"

import {
  createProposalAction,
} from "./actions"

export default async function ProposalCreatePage() {
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

  const [leads, consortiums] =
    await Promise.all([
      prisma.lead.findMany({
        where: {
          workspaceId:
            workspace.id,
          convertedClientId:
            null,
        },
        select: {
          id: true,
          name: true,
          desiredCreditValue:
            true,
          desiredTermMonths:
            true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.consortium.findMany({
        where: {
          workspaceId:
            workspace.id,
          status:
            ConsortiumStatus.ACTIVE,
        },
        select: {
          id: true,
          name: true,
          administrator: true,
          groupNumber: true,
          defaultTermMonths:
            true,
          administrationFeePercent:
            true,
          reserveFundPercent:
            true,
          minCreditValue:
            true,
          maxCreditValue:
            true,
        },
        orderBy: [
          {
            administrator:
              "asc",
          },
          {
            name: "asc",
          },
        ],
      }),
    ])

  const view: ProposalCreateFormView = {
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      desiredCreditValue:
        Number(
          lead.desiredCreditValue,
        ).toString(),
      desiredTermMonths:
        lead.desiredTermMonths,
    })),
    consortiums:
      consortiums.map(
        (consortium) => ({
          id: consortium.id,
          label:
            `${consortium.administrator} · ${consortium.name} · Grupo ${consortium.groupNumber}`,
          defaultTermMonths:
            consortium.defaultTermMonths,
          administrationFeePercent:
            Number(
              consortium.administrationFeePercent,
            ).toString(),
          reserveFundPercent:
            Number(
              consortium.reserveFundPercent,
            ).toString(),
          minCreditValue:
            Number(
              consortium.minCreditValue,
            ).toString(),
          maxCreditValue:
            Number(
              consortium.maxCreditValue,
            ).toString(),
        }),
      ),
  }

  return (
    <ProposalCreateForm
      view={view}
      action={
        createProposalAction
      }
    />
  )
}
