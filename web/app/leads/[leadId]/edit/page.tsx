import {
  notFound,
} from "next/navigation"

import {
  normalizeContactReturnPath,
} from "@/application/contact/normalize-contact-return-path"
import {
  LeadUpdateForm,
} from "@/components/lead/lead-update-form"
import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  createPrismaCrmRepositories,
} from "@/infrastructure/prisma/repositories/prisma-crm-repositories"

import type {
  LeadUpdateFormView,
} from "@/types/lead-update"

import {
  updateLeadAction,
} from "./actions"

type Props = {
  params: Promise<{
    leadId: string
  }>
  searchParams?: Promise<{
    returnTo?:
      | string
      | string[]
  }>
}

function splitPhone(
  value: string,
): {
  phoneCountryCode: string
  phone: string
} {
  const digits =
    value.replace(/\D/gu, "")

  if (
    digits.length > 11 &&
    digits.startsWith("55")
  ) {
    return {
      phoneCountryCode: "55",
      phone: digits.slice(2),
    }
  }

  return {
    phoneCountryCode: "",
    phone: digits,
  }
}

function displayEmail(
  value: string,
): string {
  return value.endsWith(
    "@sem-email.gorila.local",
  )
    ? ""
    : value
}

export const dynamic = "force-dynamic"

export default async function LeadEditPage({
  params,
  searchParams,
}: Props) {
  const { leadId } = await params
  const query = searchParams
    ? await searchParams
    : {}
  const returnTo =
    normalizeContactReturnPath(
      query.returnTo,
      "/leads",
    )

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

  const repositories =
    createPrismaCrmRepositories({
      workspaceId: workspace.id,
    })

  const [
    lead,
    consultants,
  ] = await Promise.all([
    repositories.leads.findById(
      leadId,
    ),
    repositories.consultants
      .findAll(),
  ])

  if (!lead) {
    notFound()
  }

  const phone = splitPhone(
    lead.phone,
  )

  const view:
    LeadUpdateFormView = {
    id: lead.id,
    name: lead.name,
    email: displayEmail(
      lead.email,
    ),
    phoneCountryCode:
      phone.phoneCountryCode,
    phone: phone.phone,
    document:
      lead.document ?? "",
    companyName:
      lead.companyName ?? "",
    source: lead.source,
    consortiumType:
      lead.consortiumType,
    desiredCreditValue:
      String(
        lead.desiredCreditValue,
      ),
    desiredTermMonths:
      String(
        lead.desiredTermMonths,
      ),
    consultantId:
      lead.consultantId,
    notes: lead.notes ?? "",
    returnTo,
    consultants: consultants
      .filter(
        (consultant) =>
          consultant.status ===
          "active",
      )
      .map((consultant) => ({
        id: consultant.id,
        name: consultant.name,
      })),
  }

  return (
    <LeadUpdateForm
      lead={view}
      action={updateLeadAction.bind(
        null,
        lead.id,
      )}
    />
  )
}
