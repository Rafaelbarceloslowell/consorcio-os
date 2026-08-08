import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getApiCommercialContext,
} from "@/lib/auth/get-authenticated-commercial-context"

const normalizeText = (
  value: string,
): string =>
  value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )

const normalizeDigits = (
  value: string,
): string =>
  value.replace(/\D/g, "")

export async function GET(
  request: NextRequest,
) {
  const context =
    await getApiCommercialContext()

  if (context instanceof Response) {
    return context
  }

  const search =
    request.nextUrl.searchParams
      .get("q")
      ?.trim() ?? ""

  if (!search) {
    return NextResponse.json({
      results: [],
    })
  }

  const leads =
    await prisma.lead.findMany({
      where: {
        workspaceId: context.workspaceId,
        convertedClientId: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        document: true,
        companyName: true,
        status: true,
        lastContactAt: true,
        createdAt: true,
        updatedAt: true,
        consultant: {
          select: {
            name: true,
          },
        },
        pipelineStage: {
          select: {
            name: true,
          },
        },
        commercialJourneys: {
          where: {
            closedAt: null,
          },
          orderBy: [
            {
              lastInteractionAt: "desc",
            },
            {
              updatedAt: "desc",
            },
          ],
          take: 1,
          select: {
            id: true,
            lastInteractionAt: true,
            updatedAt: true,
          },
        },
      },
    })

  const normalizedSearch =
    normalizeText(search)

  const digitSearch =
    normalizeDigits(search)

  const results =
    leads
      .filter((lead) => {
        const textValues = [
          lead.name,
          lead.email,
          lead.companyName ?? "",
          lead.document ?? "",
        ]

        const matchesText =
          textValues.some(
            (value) =>
              normalizeText(value).includes(
                normalizedSearch,
              ),
          )

        const phoneDigits =
          normalizeDigits(lead.phone)

        const documentDigits =
          normalizeDigits(
            lead.document ?? "",
          )

        const matchesDigits =
          digitSearch.length > 0 &&
          (
            phoneDigits.includes(
              digitSearch,
            ) ||
            phoneDigits.endsWith(
              digitSearch,
            ) ||
            documentDigits.includes(
              digitSearch,
            )
          )

        return matchesText || matchesDigits
      })
      .sort((firstLead, secondLead) => {
        const firstDate =
          firstLead
            .commercialJourneys[0]
            ?.lastInteractionAt ??
          firstLead.lastContactAt ??
          firstLead.updatedAt ??
          firstLead.createdAt

        const secondDate =
          secondLead
            .commercialJourneys[0]
            ?.lastInteractionAt ??
          secondLead.lastContactAt ??
          secondLead.updatedAt ??
          secondLead.createdAt

        return (
          secondDate.getTime() -
          firstDate.getTime()
        )
      })
      .slice(0, 20)
      .map((lead) => {
        const journey =
          lead.commercialJourneys[0]

        return {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          companyName:
            lead.companyName,
          status: lead.status,
          stage:
            lead.pipelineStage.name,
          consultant:
            lead.consultant.name,
          lastInteractionAt:
            journey?.lastInteractionAt ??
            lead.lastContactAt ??
            lead.updatedAt,
          opportunityHref: journey
            ? `/opportunities/${journey.id}`
            : null,
        }
      })

  return NextResponse.json({
    results,
  })
}
