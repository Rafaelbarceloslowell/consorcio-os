import {
  redirect,
} from "next/navigation"

import {
  assertConsortiumCatalogManager,
} from "@/application/consortium/assert-consortium-catalog-access"

import {
  ConsortiumCatalogPanel,
} from "@/components/settings/consortium-catalog-panel"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getAuthenticatedCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

import {
  saveConsortiumCatalogAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function ConsortiumCatalogPage() {
  const context =
    await getAuthenticatedCommercialContext()

  try {
    assertConsortiumCatalogManager(
      context.role,
    )
  } catch {
    redirect("/acesso-negado")
  }

  const items =
    await prisma.consortium.findMany({
      where: {
        workspaceId:
          context.workspaceId,
      },
      orderBy: [
        { administrator: "asc" },
        { name: "asc" },
      ],
    })

  return (
    <ConsortiumCatalogPanel
      items={items.map(
        (item) => ({
          id: item.id,
          name: item.name,
          administrator:
            item.administrator,
          type: item.type,
          groupNumber:
            item.groupNumber,
          minCreditValue:
            item.minCreditValue.toString(),
          maxCreditValue:
            item.maxCreditValue.toString(),
          defaultTermMonths:
            item.defaultTermMonths,
          administrationFeePercent:
            item.administrationFeePercent.toString(),
          reserveFundPercent:
            item.reserveFundPercent.toString(),
          totalQuotas:
            item.totalQuotas,
          availableQuotas:
            item.availableQuotas,
          status: item.status,
          description:
            item.description ?? "",
          ruleStatus:
            item.ruleStatus,
          ruleSource:
            item.ruleSource ?? "",
          sourceReference:
            item.sourceReference ?? "",
          verifiedAt:
            item.verifiedAt?.toISOString() ??
            "",
          effectiveFrom:
            item.effectiveFrom?.toISOString() ??
            "",
          effectiveUntil:
            item.effectiveUntil?.toISOString() ??
            "",
          ruleVersion:
            item.ruleVersion,
          minInstallmentValue:
            item.minInstallmentValue
              ?.toString() ?? "",
          maxInstallmentValue:
            item.maxInstallmentValue
              ?.toString() ?? "",
          embeddedBidAllowed:
            item.embeddedBidAllowed,
        }),
      )}
      action={
        saveConsortiumCatalogAction
      }
    />
  )
}
